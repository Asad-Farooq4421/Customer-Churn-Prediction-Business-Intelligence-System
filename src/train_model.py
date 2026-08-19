import os
import joblib
import pandas as pd
import numpy as np

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
)


class ModelTrainer:

    def __init__(
        self, input_filepath: str = "data/processed/engineered_churn.parquet"
    ):
        self.input_filepath = input_filepath
        self.df = None
        self.models = {}
        self.results = []
        self.best_model = None
        self.best_model_name = ""
        self.feature_columns = []

    def load_data(self) -> pd.DataFrame:
        if not os.path.exists(self.input_filepath):
            raise FileNotFoundError(
                f"Engineered dataset not found at {self.input_filepath}"
            )
        self.df = pd.read_parquet(self.input_filepath)
        return self.df

    def prepare_data(self):
        if self.df is None:
            self.load_data()

        data = self.df.copy()

        # Drop non-feature identifier columns
        drop_cols = ["CustomerID", "Churn", "Target"]
        feature_df = data.drop(
            columns=[c for c in drop_cols if c in data.columns]
        )
        target = data["Target"]

        # One-Hot Encode categorical features
        feature_df = pd.get_dummies(feature_df, drop_first=True)
        self.feature_columns = feature_df.columns.tolist()

        # Stratified Train/Test Split
        X_train, X_test, y_train, y_test = train_test_split(
            feature_df, target, test_size=0.2, random_state=42, stratify=target
        )

        # Scale features
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)

        return X_train_scaled, X_test_scaled, y_train, y_test, scaler, X_test

    def train_and_evaluate(self):
        X_train, X_test, y_train, y_test, scaler, raw_X_test = (
            self.prepare_data()
        )

        # Calculate imbalance weight ratio for XGBoost
        scale_pos_weight = (len(y_train) - sum(y_train)) / sum(y_train)

        # Candidate Models
        self.models = {
            "Logistic Regression": LogisticRegression(
                max_iter=1000, random_state=42, class_weight="balanced"
            ),
            "Decision Tree": DecisionTreeClassifier(
                max_depth=6, random_state=42, class_weight="balanced"
            ),
            "Random Forest": RandomForestClassifier(
                n_estimators=100,
                max_depth=10,
                random_state=42,
                class_weight="balanced",
            ),
            "XGBoost": XGBClassifier(
                n_estimators=100,
                max_depth=5,
                learning_rate=0.05,
                scale_pos_weight=scale_pos_weight,
                random_state=42,
                eval_metric="logloss",
            ),
        }

        best_score = 0.0

        print(
            "\n=================== MODEL BENCHMARK RESULTS ==================="
        )
        for name, model in self.models.items():
            model.fit(X_train, y_train)
            y_pred = model.predict(X_test)
            y_prob = (
                model.predict_proba(X_test)[:, 1]
                if hasattr(model, "predict_proba")
                else y_pred
            )

            acc = accuracy_score(y_test, y_pred)
            prec = precision_score(y_test, y_pred)
            rec = recall_score(y_test, y_pred)
            f1 = f1_score(y_test, y_pred)
            auc = roc_auc_score(y_test, y_prob)

            self.results.append(
                {
                    "Model": name,
                    "Accuracy": round(acc, 4),
                    "Precision": round(prec, 4),
                    "Recall": round(rec, 4),
                    "F1 Score": round(f1, 4),
                    "ROC-AUC": round(auc, 4),
                }
            )

            print(f"\nModel: {name}")
            print(
                f"  Accuracy:  {acc:.4f} | Precision: {prec:.4f} | Recall: {rec:.4f} | F1: {f1:.4f} | ROC-AUC: {auc:.4f}"
            )

            # Track top model based on ROC-AUC
            if auc > best_score:
                best_score = auc
                self.best_model = model
                self.best_model_name = name

        print(
            "\n============================================================="
        )
        print(
            f"Top Performing Model: {self.best_model_name} (ROC-AUC: {best_score:.4f})"
        )

        # Save model artifacts
        os.makedirs("models", exist_ok=True)
        joblib.dump(self.best_model, "models/best_churn_model.joblib")
        joblib.dump(scaler, "models/scaler.joblib")
        joblib.dump(self.feature_columns, "models/feature_columns.joblib")
        print("Model artifacts successfully saved to 'models/' folder.")


if __name__ == "__main__":
    trainer = ModelTrainer()
    trainer.train_and_evaluate()