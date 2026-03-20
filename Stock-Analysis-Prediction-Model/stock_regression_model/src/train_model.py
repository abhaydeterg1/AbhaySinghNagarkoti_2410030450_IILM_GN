"""Train a baseline stock-price regression model."""

from __future__ import annotations

import argparse
from dataclasses import dataclass

import joblib
import numpy as np
import pandas as pd
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler


REQUIRED_COLUMNS = ["Open", "High", "Low", "Close", "Volume"]


@dataclass
class TrainArtifacts:
    model_path: str
    scaler_path: str


def normalize_date_column(df: pd.DataFrame) -> pd.DataFrame:
    """Normalize date column naming and ordering."""
    date_column = "Date" if "Date" in df.columns else "date"
    if date_column not in df.columns:
        raise ValueError("Input CSV must contain a 'Date' or 'date' column.")

    df = df.rename(columns={date_column: "date"})
    df["date"] = pd.to_datetime(df["date"])
    return df.sort_values("date").reset_index(drop=True)


def validate_columns(df: pd.DataFrame) -> None:
    missing = [col for col in REQUIRED_COLUMNS if col not in df.columns]
    if missing:
        raise ValueError(f"Missing required columns: {missing}")


def build_features(df: pd.DataFrame, target_next_day_close: bool) -> tuple[pd.DataFrame, pd.Series]:
    """Create engineered features and target vector."""
    work_df = df.copy()

    work_df["daily_return"] = (work_df["Close"] - work_df["Open"]) / work_df["Open"].replace(0, np.nan)
    work_df["intraday_spread"] = (work_df["High"] - work_df["Low"]) / work_df["Open"].replace(0, np.nan)

    work_df["close_ma_3"] = work_df["Close"].rolling(window=3).mean()
    work_df["close_ma_7"] = work_df["Close"].rolling(window=7).mean()
    work_df["volume_ma_3"] = work_df["Volume"].rolling(window=3).mean()

    work_df["close_lag_1"] = work_df["Close"].shift(1)
    work_df["close_lag_2"] = work_df["Close"].shift(2)
    work_df["close_lag_3"] = work_df["Close"].shift(3)

    if target_next_day_close:
        work_df["target"] = work_df["Close"].shift(-1)
    else:
        work_df["target"] = work_df["Close"]

    work_df = work_df.dropna().reset_index(drop=True)

    feature_columns = [
        "Open",
        "High",
        "Low",
        "Volume",
        "daily_return",
        "intraday_spread",
        "close_ma_3",
        "close_ma_7",
        "volume_ma_3",
        "close_lag_1",
        "close_lag_2",
        "close_lag_3",
    ]

    return work_df[feature_columns], work_df["target"]


def train_and_save(
    x: pd.DataFrame,
    y: pd.Series,
    artifacts: TrainArtifacts,
    test_size: float,
    random_state: int,
) -> None:
    """Train model, print metrics, and persist artifacts."""
    x_train, x_test, y_train, y_test = train_test_split(
        x,
        y,
        test_size=test_size,
        shuffle=False,
        random_state=random_state,
    )

    scaler = StandardScaler()
    x_train_scaled = scaler.fit_transform(x_train)
    x_test_scaled = scaler.transform(x_test)

    model = Ridge(alpha=1.0)
    model.fit(x_train_scaled, y_train)

    predictions = model.predict(x_test_scaled)

    mae = mean_absolute_error(y_test, predictions)
    rmse = mean_squared_error(y_test, predictions, squared=False)
    r2 = r2_score(y_test, predictions)

    print("Training complete.")
    print(f"MAE:  {mae:.6f}")
    print(f"RMSE: {rmse:.6f}")
    print(f"R2:   {r2:.6f}")

    joblib.dump(model, artifacts.model_path)
    joblib.dump(scaler, artifacts.scaler_path)
    print(f"Saved model to: {artifacts.model_path}")
    print(f"Saved scaler to: {artifacts.scaler_path}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Train stock regression model")
    parser.add_argument("--input", required=True, help="Path to stock CSV input")
    parser.add_argument(
        "--target-next-day-close",
        action="store_true",
        help="Train to predict next day's close instead of same-day close",
    )
    parser.add_argument("--model-out", required=True, help="Path to save model artifact")
    parser.add_argument("--scaler-out", required=True, help="Path to save scaler artifact")
    parser.add_argument("--test-size", type=float, default=0.2, help="Test split ratio")
    parser.add_argument("--random-state", type=int, default=42, help="Random seed")
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    df = pd.read_csv(args.input)
    df = normalize_date_column(df)
    validate_columns(df)

    x, y = build_features(df, target_next_day_close=args.target_next_day_close)

    artifacts = TrainArtifacts(model_path=args.model_out, scaler_path=args.scaler_out)
    train_and_save(x, y, artifacts, test_size=args.test_size, random_state=args.random_state)


if __name__ == "__main__":
    main()
