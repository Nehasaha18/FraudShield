from fastapi import FastAPI, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import io

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- GAN Score Simulation ---
def gan_score_from_data(row):
    amount = float(row.get("amount", 0))
    vpa = str(row.get("beneficiary_vpa", "")).lower()
    if "loan" in vpa or "pay" in vpa or "rzp" in vpa:
        return round(min(1.0, amount / 100000 + 0.4), 2)
    return round(min(1.0, amount / 100000 + 0.2), 2)

# --- Classifier Logic (basic + keyword-based) ---
def classify2(score, is_fraud_flag, vpa):
    suspicious_keywords = ["loan", "cashback", "bonus", "gift", "pay", "rzp", "credit", "click", "win"]
    if (
        score > 0.8
        or is_fraud_flag == 1
        or any(k in vpa for k in suspicious_keywords)
    ):
        return "Fraud"
    return "Legit"

# --- Explainability ---
def explain(score, vpa, is_fraud_flag):
    reasons = []
    vpa = str(vpa).lower()

    # 1. Keyword-based reasoning
    if any(k in vpa for k in ["pay", "rzp", "bonus", "gift", "win", "click"]):
        reasons.append("Suspicious VPA pattern (Fake Payment Link)")

    if any(k in vpa for k in ["loan", "cashback", "credit"]):  # ✅ FIXED this line
        reasons.append("Loan or cashback-related VPA")

    # 2. GAN score
    if score > 0.8:
        reasons.append("High GAN score (Anomaly detected)")

    # 3. Dataset label
    if is_fraud_flag == 1:
        reasons.append("Labeled as fraud in dataset")

    return " + ".join(reasons) if reasons else "No fraud signal detected"

# --- Auth Route ---
@app.post("/login")
async def login(email: str = Form(...), password: str = Form(...)):
    if email == "admin@example.com" and password == "admin123":
        return {"status": "success"}
    return {"status": "error", "message": "Invalid credentials"}

# --- Upload Route ---
@app.post("/upload")
async def upload_csv(file: UploadFile):
    content = await file.read()
    df = pd.read_csv(io.StringIO(content.decode('utf-8')))
    df.columns = [col.lower() for col in df.columns]
    return {"results": process_df(df)}

# --- Auto-fetch for Admin ---
@app.get("/fetch-transactions")
async def fetch_transactions():
    df = pd.read_csv("anonymized_sample_fraud_txn.csv")
    df.columns = [col.lower() for col in df.columns]
    return {"results": process_df(df)}

# --- Process Each Transaction ---
def process_df(df):
    results = []
    for _, row in df.iterrows():
        vpa = str(row.get("beneficiary_vpa", "")).lower()
        payer = str(row.get("payer_vpa", row.get("payer_account", ""))).lower()
        amount = float(row.get("amount", 0))
        is_fraud = int(row.get("is_fraud", 0))

        gan_score = gan_score_from_data(row)
        prediction = classify2(gan_score, is_fraud, vpa)
        reason = explain(gan_score, vpa, is_fraud)

        results.append({
            "payer": payer,
            "vpa": vpa,
            "amount": amount,
            "gan_score": gan_score,
            "prediction": prediction,
            "explanation": reason
        })
    return results
