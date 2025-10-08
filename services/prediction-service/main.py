"""
RedCube XHS - Prediction Service
FastAPI-based microservice for ML predictions and analytics
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uvicorn
import logging
from datetime import datetime

# Local imports
from database import get_training_data, get_db_connection
from models import InterviewSuccessPredictor, SkillGapAnalyzer

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="RedCube XHS Prediction Service",
    description="ML-powered predictions for interview success and skill gap analysis",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global ML models (loaded on startup)
success_predictor: Optional[InterviewSuccessPredictor] = None
skill_analyzer: Optional[SkillGapAnalyzer] = None

# Pydantic models for request/response
class InterviewPredictionRequest(BaseModel):
    """Request model for interview success prediction"""
    company: Optional[str] = None
    role: Optional[str] = None
    experience_level: Optional[str] = Field(None, description="junior, mid, senior")
    interview_topics: List[str] = Field(default_factory=list)
    preparation_time_weeks: Optional[int] = None

class InterviewPredictionResponse(BaseModel):
    """Response model for interview success prediction"""
    success_probability: float = Field(..., ge=0.0, le=1.0)
    confidence: float = Field(..., ge=0.0, le=1.0)
    factors: Dict[str, Any]
    recommendations: List[str]

class SkillGapRequest(BaseModel):
    """Request model for skill gap analysis"""
    user_skills: List[str]
    target_role: str
    target_companies: Optional[List[str]] = None

class SkillGapResponse(BaseModel):
    """Response model for skill gap analysis"""
    missing_skills: List[Dict[str, Any]]
    priority_skills: List[str]
    learning_path: List[Dict[str, Any]]
    estimated_time_weeks: int

class ModelStatsResponse(BaseModel):
    """Model training statistics"""
    model_type: str
    training_samples: int
    last_trained: Optional[str]
    accuracy: Optional[float]
    features_used: List[str]


# Startup event - Load and train models
@app.on_event("startup")
async def startup_event():
    """Initialize ML models on service startup"""
    global success_predictor, skill_analyzer

    logger.info("🚀 Starting Prediction Service...")

    try:
        # Test database connection
        conn = get_db_connection()
        conn.close()
        logger.info("✅ Database connection successful")

        # Load training data
        logger.info("📊 Loading training data from database...")
        training_data = get_training_data()

        if training_data is not None and len(training_data) > 0:
            logger.info(f"📈 Loaded {len(training_data)} training samples")

            # Initialize and train success predictor
            logger.info("🤖 Training Interview Success Predictor...")
            success_predictor = InterviewSuccessPredictor()
            success_predictor.train(training_data)
            logger.info("✅ Success Predictor trained")

            # Initialize skill gap analyzer
            logger.info("🎯 Initializing Skill Gap Analyzer...")
            skill_analyzer = SkillGapAnalyzer()
            skill_analyzer.fit(training_data)
            logger.info("✅ Skill Gap Analyzer ready")

        else:
            logger.warning("⚠️  No training data available. Models will use fallback logic.")
            success_predictor = InterviewSuccessPredictor()
            skill_analyzer = SkillGapAnalyzer()

    except Exception as e:
        logger.error(f"❌ Error during startup: {str(e)}")
        # Don't fail startup - use fallback models
        success_predictor = InterviewSuccessPredictor()
        skill_analyzer = SkillGapAnalyzer()
        logger.info("⚠️  Using fallback prediction models")


@app.get("/")
async def root():
    """Root endpoint - service info"""
    return {
        "service": "RedCube XHS Prediction Service",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "health": "/health",
            "predict": "/api/predict/interview-success",
            "skill_gap": "/api/analyze/skill-gap",
            "stats": "/api/models/stats"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "models": {
            "success_predictor": "loaded" if success_predictor and success_predictor.is_trained else "not_trained",
            "skill_analyzer": "loaded" if skill_analyzer else "not_loaded"
        }
    }


@app.post("/api/predict/interview-success", response_model=InterviewPredictionResponse)
async def predict_interview_success(request: InterviewPredictionRequest):
    """
    Predict interview success probability

    Uses trained ML model to predict the likelihood of interview success
    based on interview characteristics.
    """
    if not success_predictor:
        raise HTTPException(status_code=503, detail="Prediction model not available")

    try:
        logger.info(f"🔮 Predicting success for: company={request.company}, role={request.role}")

        # Make prediction
        result = success_predictor.predict(
            company=request.company,
            role=request.role,
            experience_level=request.experience_level,
            interview_topics=request.interview_topics,
            preparation_time_weeks=request.preparation_time_weeks
        )

        logger.info(f"✅ Prediction: {result['success_probability']:.2f} probability")

        return InterviewPredictionResponse(**result)

    except Exception as e:
        logger.error(f"❌ Prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@app.post("/api/analyze/skill-gap", response_model=SkillGapResponse)
async def analyze_skill_gap(request: SkillGapRequest):
    """
    Analyze skill gaps for target role

    Compares user's current skills with requirements for target role
    and provides personalized learning recommendations.
    """
    if not skill_analyzer:
        raise HTTPException(status_code=503, detail="Skill analyzer not available")

    try:
        logger.info(f"🎯 Analyzing skill gap for role: {request.target_role}")

        # Perform analysis
        result = skill_analyzer.analyze(
            user_skills=request.user_skills,
            target_role=request.target_role,
            target_companies=request.target_companies
        )

        logger.info(f"✅ Found {len(result['missing_skills'])} skill gaps")

        return SkillGapResponse(**result)

    except Exception as e:
        logger.error(f"❌ Skill gap analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@app.get("/api/models/stats", response_model=List[ModelStatsResponse])
async def get_model_stats():
    """Get statistics about trained models"""
    stats = []

    if success_predictor:
        stats.append(ModelStatsResponse(
            model_type="InterviewSuccessPredictor",
            training_samples=success_predictor.training_samples,
            last_trained=success_predictor.last_trained,
            accuracy=success_predictor.accuracy,
            features_used=success_predictor.feature_names
        ))

    if skill_analyzer:
        stats.append(ModelStatsResponse(
            model_type="SkillGapAnalyzer",
            training_samples=skill_analyzer.training_samples,
            last_trained=skill_analyzer.last_trained,
            accuracy=None,  # Not applicable for skill analyzer
            features_used=skill_analyzer.feature_names
        ))

    return stats


@app.post("/api/models/retrain")
async def retrain_models():
    """
    Retrain models with latest data

    Useful when new training data has been collected.
    """
    global success_predictor, skill_analyzer

    try:
        logger.info("🔄 Retraining models with latest data...")

        # Reload training data
        training_data = get_training_data()

        if training_data is None or len(training_data) == 0:
            raise HTTPException(status_code=400, detail="No training data available")

        # Retrain success predictor
        if success_predictor:
            success_predictor.train(training_data)
            logger.info("✅ Success Predictor retrained")

        # Refit skill analyzer
        if skill_analyzer:
            skill_analyzer.fit(training_data)
            logger.info("✅ Skill Analyzer refitted")

        return {
            "success": True,
            "message": "Models retrained successfully",
            "training_samples": len(training_data),
            "timestamp": datetime.utcnow().isoformat()
        }

    except Exception as e:
        logger.error(f"❌ Retraining error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Retraining failed: {str(e)}")


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
