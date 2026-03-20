"""Generate stock-price predictions from a trained regression model."""

from __future__ import annotations

import argparse

import joblib
import pandas as pd

from train_model import build_features, normalize_date_column, validate_columns


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Predict stock prices")
    parser.add_argument("--input", required=True, help="Input CSV path")
    parser.add_argument("--model", required=True, help="Trained model path")
    parser.add_argument("--scaler", required=True, help="Trained scaler path")
    parser.add_argument("--output", required=True, help="Output CSV path")
    parser.add_argument(
        "--target-next-day-close",
        action="store_true",
        help="Match feature setup used for next-day-close training",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    df = pd.read_csv(args.input)
    df = normalize_date_column(df)
    validate_columns(df)

    features, _ = build_features(df, target_next_day_close=args.target_next_day_close)

    model = joblib.load(args.model)
    scaler = joblib.load(args.scaler)

    predictions = model.predict(scaler.transform(features))

    output = pd.DataFrame(
        {
            "date": df.loc[df.index[-len(predictions) :], "date"].reset_index(drop=True),
            "predicted_close": predictions,
        }
    )
    output.to_csv(args.output, index=False)
    print(f"Wrote predictions to: {args.output}")


if __name__ == "__main__":
    main()
