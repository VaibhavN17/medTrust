"""
FastAPI ML Microservice for MedTrust Fraud Detection
Handles fraud analysis for campaigns, documents, and user patterns
"""

from fastapi import FastAPI, HTTPException, File, UploadFile, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import os
from dotenv import load_dotenv
import logging
from utils.fraud_detector import FraudDetector
from datetime import datetime

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="MedTrust Fraud Detection Service",
    description="ML-powered fraud detection for medical fundraising campaigns",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:5000,http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== PYDANTIC MODELS ====================

class CampaignAnalysisRequest(BaseModel):
    """Request body for campaign fraud analysis"""
    title: str
    description: str
    requested_amount: float
    medical_condition: str
    campaign_id: Optional[int] = None


class DocumentVerificationRequest(BaseModel):
    """Request body for document verification"""
    file_name: str
    document_type: str = "medical_report"
    campaign_id: Optional[int] = None


class UserData(BaseModel):
    """User data for duplicate detection"""
    id: int
    email: str
    phone: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: Optional[str] = None


class DuplicateDetectionRequest(BaseModel):
    """Request body for duplicate account detection"""
    users: List[UserData]


class DonationData(BaseModel):
    """Donation data for pattern detection"""
    id: int
    campaign_id: int
    donor_id: int
    amount: float
    timestamp: datetime


class DonationPatternRequest(BaseModel):
    """Request body for donation pattern analysis"""
    campaign_id: int
    donations: List[DonationData]


# ==================== API ENDPOINTS ====================

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "ok",
        "service": "MedTrust Fraud Detection",
        "timestamp": datetime.utcnow().isoformat()
    }


@app.post("/analyze-campaign")
async def analyze_campaign(request: CampaignAnalysisRequest):
    """
    Analyze a campaign for fraud indicators
    
    Returns:
        - fraud_risk_score: 0-1 score (1 = highest fraud risk)
        - flagged: boolean indicating if should be manually reviewed
        - factors: breakdown of each fraud detection factor
        - description: human-readable summary
    """
    try:
        logger.info(f"Analyzing campaign: {request.campaign_id}")
        
        analysis = FraudDetector.analyze_campaign_text(
            title=request.title,
            description=request.description,
            amount=request.requested_amount,
            condition=request.medical_condition
        )
        
        logger.info(f"Campaign {request.campaign_id} analysis complete. Score: {analysis['fraud_risk_score']}")
        
        return {
            "campaign_id": request.campaign_id,
            "fraud_risk_score": analysis['fraud_risk_score'],
            "flagged": analysis['flagged'],
            "factors": analysis['factors'],
            "description": analysis['description'],
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error analyzing campaign: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/verify-document")
async def verify_document(
    file: UploadFile = File(...),
    document_type: str = "medical_report",
    campaign_id: Optional[int] = None
):
    """
    Verify authenticity of a medical document (PDF or Image)
    
    Checks:
    - File format and integrity
    - Presence of medical keywords
    - Metadata for tampering signs
    - Image quality and manipulation detection
    
    Returns:
        - is_authentic: boolean (true if document passes checks)
        - confidence: 0-1 confidence score
        - warnings: list of issues detected
        - document_type: detected file type
    """
    try:
        logger.info(f"Verifying document for campaign {campaign_id}")
        
        # Read file contents
        file_contents = await file.read()
        
        # Verify document
        verification = FraudDetector.verify_document(
            file_bytes=file_contents,
            document_type=document_type
        )
        
        logger.info(f"Document verification complete. Authentic: {verification['is_authentic']}")
        
        return {
            "campaign_id": campaign_id,
            "file_name": file.filename,
            "is_authentic": verification['is_authentic'],
            "confidence": verification['confidence'],
            "warnings": verification['warnings'],
            "document_type": verification['document_type'],
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error verifying document: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/detect-duplicates")
async def detect_duplicate_accounts(request: DuplicateDetectionRequest):
    """
    Detect multiple accounts from the same person
    
    Analyzes:
    - Email patterns
    - IP addresses
    - Phone numbers
    - Account creation timing
    
    Returns:
        - has_duplicates: boolean
        - suspicious_clusters: list of suspected duplicate groups
        - total_duplicates: count of suspicious accounts
    """
    try:
        logger.info(f"Checking for duplicate accounts among {len(request.users)} users")
        
        # Convert Pydantic models to dicts
        users_data = [user.dict() for user in request.users]
        
        detection = FraudDetector.detect_duplicate_patterns(users_data)
        
        logger.info(f"Duplicate detection complete. Found {detection['total_duplicates']} suspicious accounts")
        
        return {
            "has_duplicates": detection['has_duplicates'],
            "suspicious_clusters": detection['suspicious_clusters'],
            "total_duplicates": detection['total_duplicates'],
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error detecting duplicates: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/detect-donation-patterns")
async def detect_donation_anomalies(request: DonationPatternRequest):
    """
    Detect suspicious donation patterns
    
    Analyzes:
    - Donation amount anomalies (statistical outliers)
    - Rapid sequential donations (bot-like behavior)
    - Unusual timing patterns
    
    Returns:
        - is_suspicious: boolean
        - anomalies: list of detected suspicious patterns
    """
    try:
        logger.info(f"Analyzing donation patterns for campaign {request.campaign_id}")
        
        # Convert Pydantic models to dicts
        donations_data = [donation.dict() for donation in request.donations]
        
        detection = FraudDetector.detect_donation_patterns(donations_data)
        
        logger.info(f"Donation pattern analysis complete. Suspicious: {detection['is_suspicious']}")
        
        return {
            "campaign_id": request.campaign_id,
            "is_suspicious": detection['is_suspicious'],
            "anomalies": detection['anomalies'],
            "donation_count": len(request.donations),
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error analyzing donations: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ==================== ERROR HANDLERS ====================

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return {
        "error": exc.detail,
        "status_code": exc.status_code,
        "timestamp": datetime.utcnow().isoformat()
    }


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    logger.error(f"Unexpected error: {str(exc)}")
    return {
        "error": "Internal server error",
        "status_code": 500,
        "timestamp": datetime.utcnow().isoformat()
    }


# ==================== ROOT ROUTE ====================

@app.get("/")
async def root():
    """Root endpoint with API documentation"""
    return {
        "service": "MedTrust Fraud Detection ML Service",
        "version": "1.0.0",
        "endpoints": {
            "POST /analyze-campaign": "Analyze campaign for fraud indicators",
            "POST /verify-document": "Verify authenticity of medical documents",
            "POST /detect-duplicates": "Detect multiple accounts from same person",
            "POST /detect-donation-patterns": "Analyze donation patterns for anomalies",
            "GET /health": "Health check",
            "GET /docs": "Interactive API documentation (Swagger UI)",
            "GET /redoc": "Alternative API documentation (ReDoc)"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", 8000)),
        reload=os.getenv("ENV", "development") == "development"
    )
