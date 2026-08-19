import os
import numpy as np
import pandas as pd


def generate_churn_dataset(num_samples: int = 5000, seed: int = 42) -> pd.DataFrame:
    """Generates a realistic synthetic telecom/SaaS customer dataset."""
    np.random.seed(seed)

    customer_ids = [f"CUST-{10000 + i}" for i in range(num_samples)]
    gender = np.random.choice(["Male", "Female"], size=num_samples)
    senior_citizen = np.random.choice([0, 1], size=num_samples, p=[0.84, 0.16])
    tenure = np.random.randint(1, 73, size=num_samples)

    contract = np.random.choice(
        ["Month-to-month", "One year", "Two year"],
        size=num_samples,
        p=[0.55, 0.25, 0.20],
    )
    paperless_billing = np.random.choice(["Yes", "No"], size=num_samples)
    payment_method = np.random.choice(
        [
            "Electronic check",
            "Mailed check",
            "Bank transfer (automatic)",
            "Credit card (automatic)",
        ],
        size=num_samples,
    )

    internet_service = np.random.choice(
        ["DSL", "Fiber optic", "No"], size=num_samples, p=[0.34, 0.44, 0.22]
    )
    online_security = np.random.choice(["Yes", "No"], size=num_samples)
    tech_support = np.random.choice(["Yes", "No"], size=num_samples)

    monthly_charges = np.round(
        np.random.uniform(18.25, 118.75, size=num_samples), 2
    )
    total_charges = np.round(
        monthly_charges * tenure + np.random.normal(0, 50, size=num_samples), 2
    )
    total_charges = np.maximum(total_charges, monthly_charges)

    support_tickets = np.random.poisson(lam=1.5, size=num_samples)
    payment_delays = np.random.poisson(lam=0.8, size=num_samples)

    # Calculate churn probability based on risk factors
    log_odds = (
        -1.2
        - (tenure * 0.04)
        + (monthly_charges * 0.015)
        + (support_tickets * 0.35)
        + (payment_delays * 0.4)
        + np.where(contract == "Month-to-month", 0.8, -0.6)
        + np.where(internet_service == "Fiber optic", 0.4, -0.2)
    )

    churn_prob = 1 / (1 + np.exp(-log_odds))
    churn = np.where(np.random.rand(num_samples) < churn_prob, "Yes", "No")

    df = pd.DataFrame(
        {
            "CustomerID": customer_ids,
            "Gender": gender,
            "SeniorCitizen": senior_citizen,
            "TenureMonths": tenure,
            "Contract": contract,
            "PaperlessBilling": paperless_billing,
            "PaymentMethod": payment_method,
            "InternetService": internet_service,
            "OnlineSecurity": online_security,
            "TechSupport": tech_support,
            "MonthlyCharges": monthly_charges,
            "TotalCharges": total_charges,
            "SupportTickets": support_tickets,
            "PaymentDelays": payment_delays,
            "Churn": churn,
        }
    )

    # Introduce ~2% missing values to test ETL pipeline resilience
    nan_mask = np.random.rand(*df.shape) < 0.02
    nan_cols = ["TotalCharges", "PaymentMethod", "InternetService"]
    for col in nan_cols:
        col_idx = df.columns.get_loc(col)
        df.iloc[nan_mask[:, col_idx], col_idx] = np.nan

    return df


if __name__ == "__main__":
    output_dir = "data/raw"
    os.makedirs(output_dir, exist_ok=True)
    file_path = os.path.join(output_dir, "raw_customer_churn.csv")

    dataset = generate_churn_dataset()
    dataset.to_csv(file_path, index=False)
    print(
        f"Synthetic dataset generated successfully at '{file_path}' with shape {dataset.shape}."
    )