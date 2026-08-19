import os
import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

app = FastAPI(title="Customer Churn Prediction API")

# Explicit CORS configuration for Vercel integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Resolve path to models directory relative to backend/main.py
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, "models", "best_churn_model.joblib")
SCALER_PATH = os.path.join(BASE_DIR, "models", "scaler.joblib")
COLS_PATH = os.path.join(BASE_DIR, "models", "feature_columns.joblib")

# Load trained model artifacts
try:
    if os.path.exists(MODEL_PATH) and os.path.exists(SCALER_PATH) and os.path.exists(COLS_PATH):
        model = joblib.load(MODEL_PATH)
        scaler = joblib.load(SCALER_PATH)
        feature_columns = joblib.load(COLS_PATH)
    else:
        model, scaler, feature_columns = None, None, []
except Exception:
    model, scaler, feature_columns = None, None, []


class CustomerInput(BaseModel):
    TenureMonths: int
    MonthlyCharges: float
    TotalCharges: float
    SupportTickets: int
    PaymentDelays: int
    Contract: str
    PaperlessBilling: str
    OnlineSecurity: str
    TechSupport: str


def run_inference_pipeline(df_raw: pd.DataFrame):
    """Processes DataFrame feature engineering, scaling, and trained model inference."""
    # 1. Feature Engineering
    expected_total = df_raw["MonthlyCharges"] * df_raw["TenureMonths"]
    df_raw["Spend_Discrepancy_Ratio"] = (df_raw["TotalCharges"] / (expected_total + 1e-5)).round(4)
    df_raw["Support_Tickets_Per_Month"] = (df_raw["SupportTickets"] / (df_raw["TenureMonths"] + 1)).round(4)

    contract_risk = {"Month-to-month": 3, "One year": 2, "Two year": 1}
    df_raw["Contract_Risk_Tier"] = df_raw["Contract"].map(contract_risk).fillna(2)

    df_raw["Service_Engagement_Count"] = (
        (df_raw["OnlineSecurity"] == "Yes").astype(int) +
        (df_raw["TechSupport"] == "Yes").astype(int) +
        (df_raw["PaperlessBilling"] == "Yes").astype(int)
    )
    df_raw["Estimated_CLV"] = (df_raw["MonthlyCharges"] * df_raw["TenureMonths"]).round(2)

    # 2. Alignment with Training Feature Columns
    df_encoded = pd.get_dummies(df_raw).reindex(columns=feature_columns, fill_value=0)

    # 3. Model Prediction using Saved Scaler & Saved Model
    scaled_features = scaler.transform(df_encoded)
    churn_probs = model.predict_proba(scaled_features)[:, 1]

    results = []
    for prob in churn_probs:
        churn_percentage = round(float(prob) * 100, 2)
        risk_level = "HIGH" if prob >= 0.60 else ("MEDIUM" if prob >= 0.35 else "LOW")
        results.append({
            "churn_probability": churn_percentage,
            "risk_level": risk_level
        })
    return results


@app.get("/")
def read_root():
    return {
        "status": "online",
        "message": "Customer Churn ML API is running.",
        "artifacts_loaded": model is not None,
    }


@app.post("/predict")
def predict_churn(customer: CustomerInput):
    if model is None or scaler is None or not len(feature_columns):
        raise HTTPException(status_code=500, detail="Model artifacts not loaded on server.")

    try:
        df_raw = pd.DataFrame([customer.dict()])
        inference = run_inference_pipeline(df_raw)[0]

        recommendations = [
            "Assign priority account manager" if inference["risk_level"] == "HIGH" else "Send quarterly engagement newsletter",
            "Offer 15% discount for 12-month contract commitment" if customer.Contract == "Month-to-month" else "Standard renewal timeline",
            "Provide free 3-month TechSupport trial" if customer.TechSupport == "No" else "Account in good standing"
        ]

        return {**inference, "recommendations": recommendations}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Inference error: {str(e)}")


@app.post("/predict-batch")
def predict_churn_batch(customers: List[CustomerInput]):
    if model is None or scaler is None or not len(feature_columns):
        raise HTTPException(status_code=500, detail="Model artifacts not loaded on server.")

    try:
        df_raw = pd.DataFrame([c.dict() for c in customers])
        return run_inference_pipeline(df_raw)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Batch inference error: {str(e)}")