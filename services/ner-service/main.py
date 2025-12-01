"""
NER Service for RedCube XHS
Extracts structured metadata from Reddit interview posts using Hugging Face transformers
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from transformers import pipeline
from typing import Optional, Tuple
import re
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="RedCube NER Service",
    description="Extract company, role, level, location, and outcome from interview posts",
    version="1.0.0"
)

# Load NER model - try local directory first, fallback to HuggingFace
import os
model_path = os.getenv('NER_MODEL_PATH', '/app/models/bert-base-NER')
if os.path.exists(model_path):
    logger.info(f"Loading NER model from local directory: {model_path}...")
    ner_pipeline = pipeline("ner", model=model_path, aggregation_strategy="simple")
    logger.info("✅ NER model loaded successfully from local directory")
else:
    logger.info("Local model not found, loading from HuggingFace: dslim/bert-base-NER...")
    ner_pipeline = pipeline("ner", model="dslim/bert-base-NER", aggregation_strategy="simple")
    logger.info("✅ NER model loaded successfully from HuggingFace")

# Request/Response models
class ExtractRequest(BaseModel):
    text: str

class ExtractResponse(BaseModel):
    company: Optional[str] = None
    role_type: Optional[str] = None
    level: Optional[str] = None
    location: Optional[str] = None
    outcome: Optional[str] = None
    confidence: dict = {}


# Company name mappings (common variations)
COMPANY_MAPPINGS = {
    # FAANG / Big Tech
    'amazon': 'Amazon',
    'amzn': 'Amazon',
    'aws': 'Amazon',
    'google': 'Google',
    'alphabet': 'Google',
    'meta': 'Meta',
    'facebook': 'Meta',
    'fb': 'Meta',
    'microsoft': 'Microsoft',
    'msft': 'Microsoft',
    'apple': 'Apple',
    'aapl': 'Apple',
    'netflix': 'Netflix',
    'tesla': 'Tesla',
    'nvidia': 'Nvidia',
    'intel': 'Intel',
    'amd': 'AMD',
    'ibm': 'IBM',
    'oracle': 'Oracle',
    'salesforce': 'Salesforce',

    # Startups / Unicorns
    'uber': 'Uber',
    'lyft': 'Lyft',
    'airbnb': 'Airbnb',
    'stripe': 'Stripe',
    'snowflake': 'Snowflake',
    'databricks': 'Databricks',
    'palantir': 'Palantir',
    'coinbase': 'Coinbase',
    'doordash': 'DoorDash',
    'instacart': 'Instacart',
    'reddit': 'Reddit',
    'discord': 'Discord',
    'roblox': 'Roblox',
    'pinterest': 'Pinterest',
    'snap': 'Snap',
    'snapchat': 'Snap',
    'twitter': 'Twitter',
    'x corp': 'Twitter',
    'linkedin': 'LinkedIn',
    'tiktok': 'TikTok',
    'bytedance': 'ByteDance',

    # Finance / Banks (Major IT departments)
    'jpmorgan': 'JPMorgan Chase',
    'jp morgan': 'JPMorgan Chase',
    'jpm': 'JPMorgan Chase',
    'chase': 'JPMorgan Chase',
    'goldman sachs': 'Goldman Sachs',
    'goldman': 'Goldman Sachs',
    'gs': 'Goldman Sachs',
    'morgan stanley': 'Morgan Stanley',
    'bank of america': 'Bank of America',
    'bofa': 'Bank of America',
    'boa': 'Bank of America',
    'citigroup': 'Citigroup',
    'citi': 'Citigroup',
    'wells fargo': 'Wells Fargo',
    'barclays': 'Barclays',
    'credit suisse': 'Credit Suisse',
    'ubs': 'UBS',
    'deutsche bank': 'Deutsche Bank',
    'hsbc': 'HSBC',

    # Financial Services / FinTech
    'visa': 'Visa',
    'mastercard': 'Mastercard',
    'paypal': 'PayPal',
    'square': 'Block',
    'block': 'Block',
    'robinhood': 'Robinhood',
    'capital one': 'Capital One',
    'discover': 'Discover',
    'american express': 'American Express',
    'amex': 'American Express',
    'fidelity': 'Fidelity',
    'charles schwab': 'Charles Schwab',
    'schwab': 'Charles Schwab',
    'vanguard': 'Vanguard',
    'blackrock': 'BlackRock',

    # Hedge Funds / Trading Firms (Heavy tech users)
    'two sigma': 'Two Sigma',
    'jane street': 'Jane Street',
    'citadel': 'Citadel',
    'de shaw': 'D. E. Shaw',
    'd.e. shaw': 'D. E. Shaw',
    'hudson river trading': 'Hudson River Trading',
    'hrt': 'Hudson River Trading',
    'jump trading': 'Jump Trading',
    'optiver': 'Optiver',
    'akuna capital': 'Akuna Capital',
    'virtu': 'Virtu Financial'
}

# Role type patterns
ROLE_PATTERNS = {
    'SWE': [
        r'\bsoftware engineer\b', r'\bswe\b', r'\bengineering\b',
        r'\bbackend\b', r'\bfrontend\b', r'\bfull[- ]?stack\b',
        r'\bfullstack\b', r'\bweb developer\b', r'\bdeveloper\b'
    ],
    'DevOps': [
        r'\bdevops\b', r'\bsre\b', r'\bsite reliability\b',
        r'\binfrastructure\b', r'\bplatform engineer\b'
    ],
    'Data': [
        r'\bdata scientist\b', r'\bdata engineer\b', r'\bml engineer\b',
        r'\bmachine learning\b', r'\bai engineer\b', r'\bdata analyst\b'
    ],
    'PM': [
        r'\bproduct manager\b', r'\bpm\b', r'\bproduct\b'
    ],
    'QA': [
        r'\bqa\b', r'\bquality assurance\b', r'\btester\b', r'\btest engineer\b'
    ],
    'Security': [
        r'\bsecurity engineer\b', r'\bappsec\b', r'\binfosec\b', r'\bcybersecurity\b'
    ]
}

# Level extraction patterns
LEVEL_PATTERNS = [
    (r'\b(L[2-9]|E[2-9]|IC[2-9])\b', lambda m: m.group(1).upper()),  # L3, E4, IC5
    (r'\b([Ss]enior|Sr\.?)\b', lambda m: 'Senior'),
    (r'\b([Jj]unior|Jr\.?)\b', lambda m: 'Junior'),
    (r'\b([Mm]id[-\s]?level)\b', lambda m: 'Mid-level'),
    (r'\b([Ee]ntry[-\s]?level)\b', lambda m: 'Entry'),
    (r'\b([Ll]ead)\b', lambda m: 'Lead'),
    (r'\b([Pp]rincipal)\b', lambda m: 'Principal'),
    (r'\b([Ss]taff)\b', lambda m: 'Staff')
]

# Outcome keywords
OUTCOME_KEYWORDS = {
    'offer': ['offer', 'accepted', 'got the job', 'hired', 'joining'],
    'reject': ['rejected', 'didn\'t get', 'failed', 'rejection', 'turned down', 'no offer'],
    'pending': ['waiting', 'in process', 'pending', 'under review', 'interviewing']
}


def extract_companies(text: str, ner_entities: list) -> Tuple[Optional[str], float]:
    """
    Extract company name using NER ORG entities + keyword matching
    """
    # Extract ORG entities from NER
    org_entities = [e['word'] for e in ner_entities if e['entity_group'] == 'ORG']

    # Also check for common company names in text (case-insensitive)
    text_lower = text.lower()
    found_companies = []

    for variant, canonical in COMPANY_MAPPINGS.items():
        if variant in text_lower:
            found_companies.append(canonical)

    # Combine both sources
    all_companies = org_entities + found_companies

    if all_companies:
        # Return most common company (simple heuristic)
        company = max(set(all_companies), key=all_companies.count)
        confidence = all_companies.count(company) / len(all_companies)
        return company, confidence

    return None, 0.0


def extract_role_type(text: str) -> Tuple[Optional[str], float]:
    """
    Extract role type using pattern matching
    """
    text_lower = text.lower()

    for role, patterns in ROLE_PATTERNS.items():
        for pattern in patterns:
            if re.search(pattern, text_lower):
                return role, 0.8  # Fixed confidence for pattern matching

    return None, 0.0


def extract_level(text: str) -> Tuple[Optional[str], float]:
    """
    Extract level using regex patterns
    """
    for pattern, extractor in LEVEL_PATTERNS:
        match = re.search(pattern, text)
        if match:
            level = extractor(match)
            return level, 0.9  # High confidence for exact matches

    return None, 0.0


def extract_location(text: str, ner_entities: list) -> Tuple[Optional[str], float]:
    """
    Extract location using NER GPE/LOC entities + keywords
    """
    # Extract location entities from NER
    loc_entities = [e['word'] for e in ner_entities if e['entity_group'] in ['LOC', 'GPE']]

    # Check for common location keywords
    text_lower = text.lower()
    location_keywords = {
        'remote': 'Remote',
        'wfh': 'Remote',
        'work from home': 'Remote',
        'seattle': 'Seattle',
        'san francisco': 'San Francisco',
        'sf': 'San Francisco',
        'bay area': 'San Francisco',
        'nyc': 'New York',
        'new york': 'New York',
        'austin': 'Austin',
        'boston': 'Boston',
        'chicago': 'Chicago',
        'los angeles': 'Los Angeles',
        'la': 'Los Angeles'
    }

    for keyword, canonical in location_keywords.items():
        if keyword in text_lower:
            return canonical, 0.8

    if loc_entities:
        return loc_entities[0], 0.7

    return None, 0.0


def extract_outcome(text: str) -> Tuple[Optional[str], float]:
    """
    Extract outcome using keyword matching
    """
    text_lower = text.lower()

    for outcome, keywords in OUTCOME_KEYWORDS.items():
        for keyword in keywords:
            if keyword in text_lower:
                return outcome, 0.7

    return None, 0.0


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "service": "RedCube NER Service",
        "status": "healthy",
        "model": "dslim/bert-base-NER",
        "version": "1.0.0"
    }


@app.get("/health")
async def health():
    """Detailed health check"""
    return {
        "status": "healthy",
        "model_loaded": ner_pipeline is not None,
        "model_name": "dslim/bert-base-NER"
    }


@app.post("/extract-metadata", response_model=ExtractResponse)
async def extract_metadata(request: ExtractRequest):
    """
    Extract all metadata from interview post text

    Returns:
    - company: Company name (Amazon, Google, etc.)
    - role_type: Role category (SWE, PM, DevOps, etc.)
    - level: Seniority level (L3, Senior, etc.)
    - location: Work location (Seattle, Remote, etc.)
    - outcome: Interview outcome (offer, reject, pending)
    - confidence: Confidence scores for each field
    """
    try:
        text = request.text

        if not text or len(text.strip()) == 0:
            raise HTTPException(status_code=400, detail="Text cannot be empty")

        # Run NER pipeline
        logger.info(f"Processing text: {text[:100]}...")
        ner_entities = ner_pipeline(text)

        # Extract each field
        company, company_conf = extract_companies(text, ner_entities)
        role_type, role_conf = extract_role_type(text)
        level, level_conf = extract_level(text)
        location, location_conf = extract_location(text, ner_entities)
        outcome, outcome_conf = extract_outcome(text)

        result = ExtractResponse(
            company=company,
            role_type=role_type,
            level=level,
            location=location,
            outcome=outcome,
            confidence={
                "company": round(company_conf, 2),
                "role_type": round(role_conf, 2),
                "level": round(level_conf, 2),
                "location": round(location_conf, 2),
                "outcome": round(outcome_conf, 2)
            }
        )

        logger.info(f"Extracted: company={company}, role={role_type}, level={level}, location={location}, outcome={outcome}")

        return result

    except Exception as e:
        logger.error(f"Error extracting metadata: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/extract-company")
async def extract_company_only(request: ExtractRequest):
    """Extract only company name (faster endpoint)"""
    try:
        ner_entities = ner_pipeline(request.text)
        company, confidence = extract_companies(request.text, ner_entities)

        return {
            "company": company,
            "confidence": round(confidence, 2)
        }
    except Exception as e:
        logger.error(f"Error extracting company: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
