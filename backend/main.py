import os
import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Customer Churn Prediction API")

# Explicit CORS configuration for Vercel integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Resolve absolute path to models directory relative to backend/main.py
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, "models", "best_churn_model.joblib")
SCALER_PATH = os.path.join(BASE_DIR, "models", "scaler.joblib")
COLS_PATH = os.path.join(BASE_DIR, "models", "feature_columns.joblib")

# Load model artifacts safely
try:
    if (
        os.path.exists(MODEL_PATH)
        and os.path.exists(SCALER_PATH)
        and os.path.exists(COLS_PATH)
    ):
        model = joblib.load(MODEL_PATH)
        scaler = joblib.load(SCALER_PATH)
        feature_columns = joblib.load(COLS_PATH)
    else:
        model, scaler, feature_columns = None, None, []
except Exception as e:
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
        raise HTTPException(
            status_code=500, detail="Model artifacts not loaded on server."
        )

    try:
        input_dict = customer.dict()

        # On-the-fly Feature Engineering
        expected_total = input_dict["MonthlyCharges"] * input_dict["TenureMonths"]
        input_dict["Spend_Discrepancy_Ratio"] = round(
            input_dict["TotalCharges"] / (expected_total + 1e-5), 4
        )
        input_dict["Support_Tickets_Per_Month"] = round(
            input_dict["SupportTickets"] / (input_dict["TenureMonths"] + 1), 4
        )

        contract_risk = {"Month-to-month": 3, "One year": 2, "Two year": 1}
        input_dict["Contract_Risk_Tier"] = contract_risk.get(
            input_dict["Contract"], 2
        )

        addon_count = (
            (1 if input_dict["OnlineSecurity"] == "Yes" else 0)
            + (1 if input_dict["TechSupport"] == "Yes" else 0)
            + (1 if input_dict["PaperlessBilling"] == "Yes" else 0)
        )
        input_dict["Service_Engagement_Count"] = addon_count
        input_dict["Estimated_CLV"] = round(
            input_dict["MonthlyCharges"] * input_dict["TenureMonths"], 2
        )

        # One-hot Encoding & Column Alignment
        df_raw = pd.DataFrame([input_dict])
        df_encoded = pd.get_dummies(df_raw).reindex(
            columns=feature_columns, fill_value=0
        )

        # Scaling & ML Inference
        scaled_features = scaler.transform(df_encoded)
        churn_prob = float(model.predict_proba(scaled_features)[0][1])
        churn_percentage = round(churn_prob * 100, 2)

        risk_level = (
            "HIGH"
            if churn_prob >= 0.60
            else ("MEDIUM" if churn_prob >= 0.35 else "LOW")
        )

        return {
            "churn_probability": churn_percentage,
            "risk_level": risk_level,
            "recommendations": [
                (
                    "Assign priority account manager"
                    if risk_level == "HIGH"
                    else "Send quarterly engagement newsletter"
                ),
                (
                    "Offer 15% discount for 12-month contract commitment"
                    if input_dict["Contract"] == "Month-to-month"
                    else "Standard renewal timeline"
                ),
                (
                    "Provide free 3-month TechSupport trial"
                    if input_dict["TechSupport"] == "No"
                    else "Account in good standing"
                ),
            ],
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Inference error: {str(e)}")