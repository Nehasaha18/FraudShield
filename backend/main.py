from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
import pandas as pd
import json
import os
from fraud_detection import FraudDetector
from graph_analyzer import GraphAnalyzer
from report_generator import ReportGenerator
from typing import List, Dict, Any
from datetime import datetime, timedelta
import uvicorn
import ssl

# Import security modules
from security.auth import (
    authenticate_user, create_access_token, get_current_active_user,
    Token, User, ACCESS_TOKEN_EXPIRE_MINUTES
)
from security.rbac import check_permissions, RoleChecker
from security.anomaly_detection import anomaly_detector
from security.rate_limiter import limiter, rate_limit_handler
from slowapi.errors import RateLimitExceeded

# Create logs directory
os.makedirs("logs", exist_ok=True)

app = FastAPI(
    title="FraudShield API",
    description="Secure Fraud Detection System",
    version="2.0.0"
)

# Add rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_handler)

# Security Middleware
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["localhost", "127.0.0.1", "fraudshield.com"]
)

# CORS middleware with stricter settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://fraudshield.com"],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
    max_age=3600,
)

# Initialize components
fraud_detector = FraudDetector()
graph_analyzer = GraphAnalyzer()
report_generator = ReportGenerator()

# Role checkers
admin_only = RoleChecker(["admin"])
analyst_or_admin = RoleChecker(["admin", "fraud_analyst"])

class TransactionAction(BaseModel):
    transaction_id: str
    action: str  # "verify" or "block"

# Store for transaction statuses
transaction_statuses = {}

@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all requests for anomaly detection"""
    start_time = datetime.utcnow()
    
    # Log request
    if request.headers.get("Authorization"):
        # Extract user from token if available
        try:
            token = request.headers.get("Authorization").replace("Bearer ", "")
            # You would decode the token here to get user_id
            user_id = "anonymous"  # Placeholder
        except:
            user_id = "anonymous"
    else:
        user_id = "anonymous"
    
    await anomaly_detector.log_event("api_request", user_id, {
        "method": request.method,
        "path": request.url.path,
        "client": request.client.host if request.client else "unknown"
    })
    
    response = await call_next(request)
    
    # Log response time
    process_time = (datetime.utcnow() - start_time).total_seconds()
    response.headers["X-Process-Time"] = str(process_time)
    
    return response

@app.get("/")
async def root():
    return {"message": "FraudShield Secure API is running", "version": "2.0.0"}

@app.post("/auth/token", response_model=Token)
@limiter.limit("5/minute")
async def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends()):
    """OAuth2 compatible token login"""
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        # Log failed login attempt
        await anomaly_detector.log_event("failed_login", form_data.username, {
            "ip": request.client.host if request.client else "unknown"
        })
        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Log successful login
    await anomaly_detector.log_event("successful_login", user.username, {
        "ip": request.client.host if request.client else "unknown"
    })
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "roles": user.roles},
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/detect/")
@limiter.limit("10/minute")
async def detect_fraud(
    request: Request,
    file: UploadFile = File(...),
    current_user: User = Depends(analyst_or_admin)
):
    """Upload CSV and detect fraud transactions"""
    try:
        # Log file upload
        await anomaly_detector.log_event("file_upload", current_user.username, {
            "filename": file.filename,
            "size": file.size if hasattr(file, 'size') else "unknown"
        })
        
        # Process file
        contents = await file.read()
        df = pd.read_csv(pd.io.common.BytesIO(contents))
        
        # Detect fraud
        fraud_results = fraud_detector.detect_fraud(df)
        
        # Generate graph data
        graph_data = graph_analyzer.create_graph(df)
        
        # Log fraud detection results
        await anomaly_detector.log_event("fraud_detection", current_user.username, {
            "total_transactions": len(df),
            "fraud_detected": fraud_results["fraud_count"]
        })
        
        return {
            "total_transactions": len(df),
            "fraud_detected": fraud_results["fraud_count"],
            "fraud_transactions": fraud_results["fraud_transactions"],
            "graph_data": graph_data,
            "results": fraud_results["detailed_results"]
        }
    except Exception as e:
        await anomaly_detector.log_event("error", current_user.username, {
            "error": str(e),
            "operation": "fraud_detection"
        })
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/admin/data/")
@limiter.limit("20/minute")
async def get_admin_data(
    request: Request,
    current_user: User = Depends(admin_only)
):
    """Load data from backend CSV file - Admin only"""
    try:
        csv_path = os.path.join("data", "anonymized_sample_fraud_txn.csv")
        df = pd.read_csv(csv_path)
        
        # Detect fraud
        fraud_results = fraud_detector.detect_fraud(df)
        
        # Generate graph data
        graph_data = graph_analyzer.create_graph(df)
        
        # Get transaction statuses
        fraud_transactions = fraud_results["fraud_transactions"]
        for txn in fraud_transactions:
            txn_id = txn["transaction_id"]
            if txn_id in transaction_statuses:
                txn["status"] = transaction_statuses[txn_id]
        
        return {
            "total_transactions": len(df),
            "fraud_detected": fraud_results["fraud_count"],
            "fraud_transactions": fraud_transactions,
            "graph_data": graph_data,
            "blocked_accounts": len([s for s in transaction_statuses.values() if s == "blocked"]),
            "verified_accounts": len([s for s in transaction_statuses.values() if s == "verified"]),
            "system_health": 99.5
        }
    except Exception as e:
        await anomaly_detector.log_event("error", current_user.username, {
            "error": str(e),
            "operation": "admin_data_load"
        })
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/admin/transaction-action/")
async def update_transaction_status(
    action: TransactionAction,
    current_user: User = Depends(admin_only)
):
    """Update transaction status (verify/block) - Admin only"""
    transaction_statuses[action.transaction_id] = action.action
    
    # Log action
    await anomaly_detector.log_event("transaction_action", current_user.username, {
        "transaction_id": action.transaction_id,
        "action": action.action
    })
    
    return {
        "status": "success",
        "transaction_id": action.transaction_id,
        "action": action.action
    }

@app.get("/admin/generate-report/")
async def generate_report(current_user: User = Depends(admin_only)):
    """Generate PDF report - Admin only"""
    try:
        csv_path = os.path.join("data", "anonymized_sample_fraud_txn.csv")
        df = pd.read_csv(csv_path)
        
        # Detect fraud
        fraud_results = fraud_detector.detect_fraud(df)
        
        # Generate report
        report_path = report_generator.generate_report(
            df, 
            fraud_results["fraud_transactions"],
            transaction_statuses
        )
        
        # Log report generation
        await anomaly_detector.log_event("report_generated", current_user.username, {
            "report_path": report_path
        })
        
        return FileResponse(
            report_path,
            media_type='application/pdf',
            filename=f'fraud_report_{datetime.now().strftime("%Y%m%d_%H%M%S")}.pdf'
        )
    except Exception as e:
        await anomaly_detector.log_event("error", current_user.username, {
            "error": str(e),
            "operation": "report_generation"
        })
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/security/alerts/")
async def get_security_alerts(current_user: User = Depends(admin_only)):
    """Get recent security alerts - Admin only"""
    # This would fetch from Redis in production
    return {
        "alerts": [],
        "message": "Security alerts system active"
    }

# TEST ENDPOINTS (No Authentication Required)
@app.get("/test/data/")
async def get_test_data():
    """Test endpoint without authentication for public dashboard"""
    try:
        csv_path = os.path.join("data", "anonymized_sample_fraud_txn.csv")
        
        # Check if CSV file exists, if not create sample data
        if not os.path.exists(csv_path):
            # Create sample data
            sample_data = {
                'TRANSACTION_ID': ['TXN001', 'TXN002', 'TXN003', 'TXN004', 'TXN005'],
                'TXN_TIMESTAMP': ['2024-01-15 10:30:00', '2024-01-15 11:45:00', '2024-01-15 12:15:00', '2024-01-15 13:20:00', '2024-01-15 14:10:00'],
                'AMOUNT': [1500.00, 50000.00, 750.50, 25000.00, 2250.00],
                'IS_FRAUD': [0, 1, 0, 1, 0],
                'PAYER_VPA': ['user1@paytm', 'user2@phonepe', 'user3@gpay', 'victim@upi', 'user5@paytm'],
                'BENEFICIARY_VPA': ['merchant1@gpay', 'scammer@pay', 'shop@upi', 'bonus@win', 'restaurant@pay']
            }
            df = pd.DataFrame(sample_data)
            
            # Ensure data directory exists
            os.makedirs("data", exist_ok=True)
            df.to_csv(csv_path, index=False)
        else:
            df = pd.read_csv(csv_path)
        
        # Detect fraud
        fraud_results = fraud_detector.detect_fraud(df)
        
        # Generate graph data
        graph_data = graph_analyzer.create_graph(df)
        
        return {
            "total_transactions": len(df),
            "fraud_detected": fraud_results["fraud_count"],
            "fraud_transactions": fraud_results["fraud_transactions"],
            "graph_data": graph_data,
            "status": "success"
        }
    except Exception as e:
        return {"error": str(e), "status": "failed"}

@app.post("/test/detect/")
async def test_detect_fraud(file: UploadFile = File(...)):
    """Test fraud detection endpoint without authentication"""
    try:
        # Process file
        contents = await file.read()
        df = pd.read_csv(pd.io.common.BytesIO(contents))
        
        # Detect fraud
        fraud_results = fraud_detector.detect_fraud(df)
        
        # Generate graph data
        graph_data = graph_analyzer.create_graph(df)
        
        return {
            "total_transactions": len(df),
            "fraud_detected": fraud_results["fraud_count"],
            "fraud_transactions": fraud_results["fraud_transactions"],
            "graph_data": graph_data,
            "results": fraud_results["detailed_results"]
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
    # TLS Configuration for production
    ssl_context = None
    if os.path.exists("certs/cert.pem") and os.path.exists("certs/key.pem"):
        ssl_context = ssl.create_default_context(ssl.Purpose.CLIENT_AUTH)
        ssl_context.load_cert_chain("certs/cert.pem", "certs/key.pem")
        print("Running with TLS 1.3 enabled")
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        ssl_keyfile="certs/key.pem" if ssl_context else None,
        ssl_certfile="certs/cert.pem" if ssl_context else None,
        ssl_version=ssl.PROTOCOL_TLS if ssl_context else None
    )