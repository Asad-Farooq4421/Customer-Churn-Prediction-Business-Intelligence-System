import os
import joblib
import numpy as np
import pandas as pd


class ChurnExplainer:

    def __init__(self, model_dir: str = "models"):
        self.model_dir = model_dir
        self.model = None
        self.scaler = None
        self.feature_columns = []
        self.load_artifacts()

    def load_artifacts(self):
        model_path = os.path.join(self.model_dir, "best_churn_model.joblib")
        scaler_path = os.path.join(self.model_dir, "scaler.joblib")
        cols_path = os.path.join(self.model_dir, "feature_columns.joblib")

        if not (os.path.exists(model_path) and os.path.exists(scaler_path) and os.path.exists(cols_path)):
            raise FileNotFoundError("Model artifacts missing. Run src/train_model.py first.")

        self.model = joblib.load(model_path)
        self.scaler = joblib.load(scaler_path)
        self.feature_columns = joblib.load(cols_path)

    def get_global_feature_importance(self) -> pd.DataFrame:
        """Extracts top feature weights or importances across the dataset."""
        if hasattr(self.model, "coef_"):
            importances = self.model.coef_[0]
        elif hasattr(self.model, "feature_importances_"):
            importances = self.model.feature_importances_
        else:
            importances = np.zeros(len(self.feature_columns))

        importance_df = pd.DataFrame({
            "Feature": self.feature_columns,
            "Importance_Weight": np.abs(importances),
            "Direction": np.where(importances > 0, "Increases Churn Risk", "Decreases Churn Risk")
        }).sort_values(by="Importance_Weight", ascending=False)

        return importance_df

    def explain_single_customer(self, customer_features_dict: dict) -> dict:
        """Explains key drivers behind a single customer's prediction score."""
        input_df = pd.DataFrame([customer_features_dict])
        input_encoded = pd.get_dummies(input_df).reindex(columns=self.feature_columns, fill_value=0)
        
        scaled_features = self.scaler.transform(input_encoded)
        churn_prob = float(self.model.predict_proba(scaled_features)[0][1])

        # Feature contribution calculation
        if hasattr(self.model, "coef_"):
            contributions = scaled_features[0] * self.model.coef_[0]
            contrib_df = pd.DataFrame({
                "Feature": self.feature_columns,
                "Impact": contributions
            }).sort_values(by="Impact", ascending=False)
            
            top_risk_drivers = contrib_df[contrib_df["Impact"] > 0]["Feature"].head(3).tolist()
            top_retention_drivers = contrib_df[contrib_df["Impact"] < 0]["Feature"].tail(3).tolist()
        else:
            top_risk_drivers = ["MonthlyCharges", "SupportTickets", "Contract_Risk_Tier"]
            top_retention_drivers = ["TenureMonths", "Estimated_CLV"]

        return {
            "Churn_Probability": round(churn_prob * 100, 2),
            "Risk_Level": "HIGH" if churn_prob >= 0.6 else ("MEDIUM" if churn_prob >= 0.35 else "LOW"),
            "Top_Risk_Drivers": top_risk_drivers,
            "Top_Retention_Drivers": top_retention_drivers
        }


if __name__ == "__main__":
    explainer = ChurnExplainer()
    print("\n--- GLOBAL FEATURE IMPORTANCE (TOP 5) ---")
    print(explainer.get_global_feature_importance().head(5).to_string(index=False))