import os
import pandas as pd


class FeatureEngineer:

    def __init__(
        self, input_filepath: str = "data/processed/cleaned_churn.parquet"
    ):
        self.input_filepath = input_filepath
        self.df = None

    def load_cleaned_data(self) -> pd.DataFrame:
        if not os.path.exists(self.input_filepath):
            raise FileNotFoundError(
                f"Cleaned data file not found at {self.input_filepath}. Run data_pipeline.py first."
            )
        self.df = pd.read_parquet(self.input_filepath)
        return self.df

    def build_features(self, df: pd.DataFrame = None) -> pd.DataFrame:
        data = (
            df.copy()
            if df is not None
            else (
                self.df.copy()
                if self.df is not None
                else self.load_cleaned_data()
            )
        )

        # 1. Financial Ratio: Expected vs. Actual Total Spend ratio
        expected_total = data["MonthlyCharges"] * data["TenureMonths"]
        data["Spend_Discrepancy_Ratio"] = (
            data["TotalCharges"] / (expected_total + 1e-5)
        ).round(4)

        # 2. Support Intensity: Average tickets logged per month of tenure
        data["Support_Tickets_Per_Month"] = (
            data["SupportTickets"] / (data["TenureMonths"] + 1)
        ).round(4)

        # 3. Contract Risk Tier Index
        contract_risk = {"Month-to-month": 3, "One year": 2, "Two year": 1}
        data["Contract_Risk_Tier"] = (
            data["Contract"].map(contract_risk).fillna(2)
        )

        # 4. Service Engagement Score (Number of active add-on services)
        addon_cols = ["OnlineSecurity", "TechSupport", "PaperlessBilling"]
        data["Service_Engagement_Count"] = 0
        for col in addon_cols:
            if col in data.columns:
                data["Service_Engagement_Count"] += (data[col] == "Yes").astype(
                    int
                )

        # 5. Customer Lifetime Value (CLV) Estimate
        data["Estimated_CLV"] = (
            data["MonthlyCharges"] * data["TenureMonths"]
        ).round(2)

        self.df = data
        print(f"Feature engineering complete. Total columns: {self.df.shape[1]}")
        return self.df

    def save_engineered_data(
        self, output_filepath: str = "data/processed/engineered_churn.parquet"
    ):
        if self.df is None:
            self.build_features()

        os.makedirs(os.path.dirname(output_filepath), exist_ok=True)
        self.df.to_parquet(output_filepath, index=False)
        print(f"Engineered dataset saved to '{output_filepath}'.")


if __name__ == "__main__":
    engineer = FeatureEngineer()
    engineer.load_cleaned_data()
    engineer.build_features()
    engineer.save_engineered_data()