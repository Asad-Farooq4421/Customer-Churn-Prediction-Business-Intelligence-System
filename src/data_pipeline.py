import os
import numpy as np
import pandas as pd


class DataPipeline:

    def __init__(self, raw_filepath: str = None):
        self.raw_filepath = raw_filepath
        self.raw_df = None
        self.cleaned_df = None

    def load_data(self, filepath: str = None) -> pd.DataFrame:
        """Loads raw dataset from CSV file."""
        target_path = filepath if filepath is not None else self.raw_filepath
        if not target_path or not os.path.exists(target_path):
            raise FileNotFoundError(
                f"Data file not found at path: {target_path}"
            )

        self.raw_df = pd.read_csv(target_path)
        print(
            f"Dataset loaded successfully. Initial shape: {self.raw_df.shape}"
        )
        return self.raw_df

    def clean_data(self, df: pd.DataFrame = None) -> pd.DataFrame:
        """Standardizes column names, imputes missing values, and casts data types."""
        data = (
            df.copy()
            if df is not None
            else (
                self.raw_df.copy()
                if self.raw_df is not None
                else self.load_data()
            )
        )

        # Standardize column name aliases
        col_aliases = {
            "customer_id": "CustomerID",
            "tenure": "TenureMonths",
            "Monthly_Charges": "MonthlyCharges",
            "Total_Charges": "TotalCharges",
        }
        data = data.rename(columns=col_aliases)

        # Drop duplicate records
        initial_len = len(data)
        data = data.drop_duplicates(subset=["CustomerID"])
        if len(data) < initial_len:
            print(f"Removed {initial_len - len(data)} duplicate records.")

        # Handle numeric types and missing values via median imputation
        numeric_cols = [
            "TenureMonths",
            "MonthlyCharges",
            "TotalCharges",
            "SupportTickets",
            "PaymentDelays",
        ]
        for col in numeric_cols:
            if col in data.columns:
                data[col] = pd.to_numeric(data[col], errors="coerce")
                median_val = data[col].median()
                data[col] = data[col].fillna(median_val)

        # Handle categorical missing values via mode imputation
        categorical_cols = [
            col
            for col in data.columns
            if col not in numeric_cols and col != "CustomerID"
        ]
        for col in categorical_cols:
            if data[col].isnull().sum() > 0:
                mode_val = data[col].mode()[0]
                data[col] = data[col].fillna(mode_val)

        # Safely convert target column to binary integer (1/0)
        if "Churn" in data.columns:
            churn_str = data["Churn"].astype(str).str.strip().str.lower()
            data["Target"] = np.where(churn_str.isin(["yes", "1", "true"]), 1, 0)

        self.cleaned_df = data
        print(f"Data cleaning complete. Final shape: {self.cleaned_df.shape}")
        return self.cleaned_df

    def save_processed_data(
        self, output_filepath: str = "data/processed/cleaned_churn.parquet"
    ):
        """Saves processed dataframe to Parquet format for fast I/O."""
        if self.cleaned_df is None:
            self.clean_data()

        os.makedirs(os.path.dirname(output_filepath), exist_ok=True)
        self.cleaned_df.to_parquet(output_filepath, index=False)
        print(f"Cleaned dataset saved to '{output_filepath}'.")


if __name__ == "__main__":
    pipeline = DataPipeline("data/raw/raw_customer_churn.csv")
    cleaned = pipeline.clean_data()
    pipeline.save_processed_data()