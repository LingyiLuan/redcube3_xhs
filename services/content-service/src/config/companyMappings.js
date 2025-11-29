/**
 * Shared Company Mappings
 *
 * Comprehensive list of tech companies and their variations/aliases
 * Used for:
 * - Filtering relevant interview posts
 * - NER entity recognition
 * - Deduplication (Meta + Facebook = one company)
 *
 * Synced with NER service (services/ner-service/main.py)
 */

const logger = require('../utils/logger');

/**
 * Company mappings: Canonical Name → [variations]
 *
 * Structure: Each company has a canonical name and list of variations
 * All variations should be lowercase for case-insensitive matching
 */
const COMPANY_MAPPINGS = {
  // FAANG / Big Tech
  'Google': ['google', 'alphabet', 'goog', 'youtube', 'waymo', 'deepmind', 'verily'],
  'Meta': ['meta', 'facebook', 'fb', 'instagram', 'whatsapp', 'oculus'],
  'Amazon': ['amazon', 'amzn', 'aws', 'amazon web services', 'whole foods', 'twitch', 'audible'],
  'Apple': ['apple', 'aapl', 'cupertino'],
  'Microsoft': ['microsoft', 'msft', 'ms', 'azure', 'github'],
  'Netflix': ['netflix', 'nflx'],

  // Other Big Tech
  'Tesla': ['tesla', 'tsla'],
  'Nvidia': ['nvidia', 'nvda'],
  'Intel': ['intel', 'intc'],
  'AMD': ['amd', 'advanced micro devices'],
  'IBM': ['ibm', 'international business machines'],
  'Oracle': ['oracle', 'orcl'],
  'Salesforce': ['salesforce', 'crm'],

  // Startups / Unicorns
  'Uber': ['uber'],
  'Lyft': ['lyft'],
  'Airbnb': ['airbnb'],
  'Stripe': ['stripe'],
  'Snowflake': ['snowflake', 'snow'],
  'Databricks': ['databricks'],
  'Palantir': ['palantir', 'pltr'],
  'Coinbase': ['coinbase'],
  'DoorDash': ['doordash', 'door dash'],
  'Instacart': ['instacart'],
  'Reddit': ['reddit'],
  'Discord': ['discord'],
  'Roblox': ['roblox'],
  'Pinterest': ['pinterest'],
  'Snap': ['snap', 'snapchat'],
  'Twitter': ['twitter', 'x corp', 'x.com'],
  'LinkedIn': ['linkedin'],
  'TikTok': ['tiktok', 'tik tok'],
  'ByteDance': ['bytedance', 'byte dance'],

  // Finance / Banks (Major IT departments)
  'JPMorgan Chase': ['jpmorgan', 'jp morgan', 'jpm', 'chase', 'jpmorgan chase'],
  'Goldman Sachs': ['goldman sachs', 'goldman', 'gs'],
  'Morgan Stanley': ['morgan stanley', 'ms'],
  'Bank of America': ['bank of america', 'bofa', 'boa', 'bac'],
  'Citigroup': ['citigroup', 'citi', 'citibank'],
  'Wells Fargo': ['wells fargo', 'wfc'],
  'Barclays': ['barclays'],
  'Credit Suisse': ['credit suisse'],
  'UBS': ['ubs'],
  'Deutsche Bank': ['deutsche bank', 'db'],
  'HSBC': ['hsbc'],

  // Financial Services / FinTech
  'Visa': ['visa'],
  'Mastercard': ['mastercard', 'ma'],
  'PayPal': ['paypal'],
  'Block': ['block', 'square', 'sq', 'cash app'],
  'Robinhood': ['robinhood', 'hood'],
  'Capital One': ['capital one', 'cof'],
  'Discover': ['discover', 'dfs'],
  'American Express': ['american express', 'amex', 'axp'],
  'Fidelity': ['fidelity'],
  'Charles Schwab': ['charles schwab', 'schwab', 'schw'],
  'Vanguard': ['vanguard'],
  'BlackRock': ['blackrock', 'blk'],

  // Hedge Funds / Trading Firms (Heavy tech users)
  'Two Sigma': ['two sigma'],
  'Jane Street': ['jane street'],
  'Citadel': ['citadel'],
  'D. E. Shaw': ['de shaw', 'd.e. shaw', 'd e shaw'],
  'Hudson River Trading': ['hudson river trading', 'hrt'],
  'Jump Trading': ['jump trading'],
  'Optiver': ['optiver'],
  'Akuna Capital': ['akuna capital', 'akuna'],
  'Virtu Financial': ['virtu', 'virtu financial'],

  // Additional Tech Companies (not in NER service yet)
  'Cisco': ['cisco', 'csco'],
  'VMware': ['vmware', 'vmw'],
  'Atlassian': ['atlassian', 'team'],
  'Datadog': ['datadog', 'ddog'],
  'Twilio': ['twilio', 'twlo'],
  'MongoDB': ['mongodb', 'mdb'],
  'Elastic': ['elastic', 'elasticsearch'],
  'HashiCorp': ['hashicorp', 'terraform', 'vault'],
  'GitLab': ['gitlab'],
  'Docker': ['docker'],
  'Redis': ['redis'],
  'Shopify': ['shopify', 'shop'],
  'Dropbox': ['dropbox', 'dbx'],
  'Box': ['box'],
  'Zoom': ['zoom', 'zm'],
  'Slack': ['slack'],
  'Asana': ['asana', 'asan'],
  'Cloudflare': ['cloudflare', 'net'],
  'Splunk': ['splunk', 'splk'],
  'ServiceNow': ['servicenow', 'now'],
  'Workday': ['workday', 'wday'],
  'Okta': ['okta'],
  'Auth0': ['auth0'],

  // E-commerce & Marketplaces
  'Etsy': ['etsy'],
  'Wayfair': ['wayfair', 'w'],
  'Chewy': ['chewy', 'chwy'],
  'Poshmark': ['poshmark'],
  'Mercari': ['mercari'],

  // Gaming
  'Riot Games': ['riot games', 'riot'],
  'Epic Games': ['epic games', 'epic'],
  'Blizzard': ['blizzard', 'activision blizzard', 'activision'],
  'Unity': ['unity', 'u'],
  'Valve': ['valve', 'steam'],

  // Other Notable Companies
  'SpaceX': ['spacex', 'space x'],
  'OpenAI': ['openai', 'open ai', 'chatgpt'],
  'Anthropic': ['anthropic', 'claude'],
  'Figma': ['figma'],
  'Notion': ['notion'],
  'Canva': ['canva']
};

/**
 * Generate reverse lookup: variation → Canonical Name
 * Example: 'alphabet' → 'Google', 'fb' → 'Meta'
 */
const VARIANT_TO_CANONICAL = {};
for (const [canonical, variants] of Object.entries(COMPANY_MAPPINGS)) {
  for (const variant of variants) {
    VARIANT_TO_CANONICAL[variant.toLowerCase()] = canonical;
  }
}

/**
 * Get all unique company variations (flat list for pattern matching)
 */
const ALL_COMPANY_VARIANTS = Object.values(COMPANY_MAPPINGS).flat();

/**
 * Find companies mentioned in text
 * Returns array of unique canonical company names
 *
 * @param {string} text - Text to search
 * @param {boolean} useWordBoundaries - Use word boundaries for more precise matching (default: true)
 * @returns {string[]} Array of canonical company names found
 *
 * @example
 * findCompanyInText("Got offer from Alphabet!") // ['Google']
 * findCompanyInText("Meta and Facebook interview") // ['Meta'] (deduplicated!)
 * findCompanyInText("AWS vs Azure") // ['Amazon', 'Microsoft']
 */
function findCompanyInText(text, useWordBoundaries = true) {
  if (!text) return [];

  const textLower = text.toLowerCase();
  const foundCompanies = new Set();  // Use Set to avoid duplicates

  for (const variant of ALL_COMPANY_VARIANTS) {
    let found = false;

    if (useWordBoundaries) {
      // More precise: use word boundaries to avoid false positives
      // Example: "chase" won't match "purchase"
      const regex = new RegExp(`\\b${escapeRegExp(variant)}\\b`, 'i');
      found = regex.test(text);
    } else {
      // Faster but less precise: simple substring matching
      found = textLower.includes(variant.toLowerCase());
    }

    if (found) {
      const canonical = VARIANT_TO_CANONICAL[variant.toLowerCase()];
      if (canonical) {
        foundCompanies.add(canonical);
      }
    }
  }

  return Array.from(foundCompanies);
}

/**
 * Get canonical name for a company variation
 *
 * @param {string} variation - Company variation
 * @returns {string|null} Canonical name or null if not found
 *
 * @example
 * getCanonicalName('alphabet') // 'Google'
 * getCanonicalName('fb') // 'Meta'
 */
function getCanonicalName(variation) {
  if (!variation) return null;
  return VARIANT_TO_CANONICAL[variation.toLowerCase()] || null;
}

/**
 * Check if text mentions any company
 *
 * @param {string} text - Text to check
 * @returns {boolean} True if any company found
 */
function hasCompanyMention(text) {
  return findCompanyInText(text).length > 0;
}

/**
 * Get all variations for a canonical company name
 *
 * @param {string} canonicalName - Canonical company name
 * @returns {string[]} Array of variations
 *
 * @example
 * getCompanyVariations('Google') // ['google', 'alphabet', 'goog', ...]
 */
function getCompanyVariations(canonicalName) {
  return COMPANY_MAPPINGS[canonicalName] || [];
}

/**
 * Escape special regex characters
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Get statistics about company mappings
 */
function getStats() {
  const totalCanonical = Object.keys(COMPANY_MAPPINGS).length;
  const totalVariations = ALL_COMPANY_VARIANTS.length;
  const avgVariationsPerCompany = (totalVariations / totalCanonical).toFixed(1);

  return {
    totalCanonicalCompanies: totalCanonical,
    totalVariations,
    avgVariationsPerCompany,
    companiesWithMostVariations: Object.entries(COMPANY_MAPPINGS)
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 5)
      .map(([name, vars]) => ({ name, variationCount: vars.length }))
  };
}

// Log stats on module load
const stats = getStats();
logger.info(`[CompanyMappings] Loaded ${stats.totalCanonicalCompanies} companies with ${stats.totalVariations} total variations (avg: ${stats.avgVariationsPerCompany} per company)`);

module.exports = {
  COMPANY_MAPPINGS,
  VARIANT_TO_CANONICAL,
  ALL_COMPANY_VARIANTS,
  findCompanyInText,
  getCanonicalName,
  hasCompanyMention,
  getCompanyVariations,
  getStats
};
