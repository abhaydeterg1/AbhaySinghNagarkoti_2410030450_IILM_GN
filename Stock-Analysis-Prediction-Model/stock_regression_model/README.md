# Stock Analysis Regression Module (Part 1)

This folder is the first module of a larger stock-analysis project. It focuses on a practical, **regression-based prediction pipeline** that can be trained on historical OHLCV market data (e.g., from Kaggle datasets).

> Goal for Part 1: establish a clean baseline pipeline that can be reused and extended by future modules.

---

## What is included

- `src/train_model.py` – loads CSV data, creates time-based features, trains a regression model, and saves artifacts.
- `src/predict.py` – loads the saved model + scaler and produces predictions on new data.
- `requirements.txt` – Python dependencies for this module.
- `data/.gitkeep` – placeholder for local datasets.

---

## Expected dataset format

The scripts expect a CSV with these columns:

- `Date` (or `date`)
- `Open`
- `High`
- `Low`
- `Close`
- `Volume`

You can use many stock datasets from Kaggle as long as the columns map to this structure.

---

## Quick start

### 1) Create environment and install dependencies

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r stock_regression_model/requirements.txt
```

### 2) Put your dataset in the module data folder

Example path:

```text
stock_regression_model/data/stock_prices.csv
```

### 3) Train baseline model

```bash
python stock_regression_model/src/train_model.py \
  --input stock_regression_model/data/stock_prices.csv \
  --target-next-day-close \
  --model-out stock_regression_model/model.joblib \
  --scaler-out stock_regression_model/scaler.joblib
```

### 4) Predict with trained model

```bash
python stock_regression_model/src/predict.py \
  --input stock_regression_model/data/stock_prices.csv \
  --model stock_regression_model/model.joblib \
  --scaler stock_regression_model/scaler.joblib \
  --output stock_regression_model/predictions.csv
```

---

## How this module works

1. Parses and sorts historical rows by date.
2. Builds engineered features:
   - daily return (`(Close - Open) / Open`)
   - intraday spread (`(High - Low) / Open`)
   - rolling means for close and volume
   - lagged close features (`close_lag_1`, `close_lag_2`, ...)
3. Creates regression target:
   - same-day close (default), or
   - next-day close with `--target-next-day-close`
4. Splits data in time order (`shuffle=False`) to reduce leakage.
5. Scales features with `StandardScaler`.
6. Trains `Ridge` regression.
7. Reports MAE/RMSE/R² and saves model artifacts.

---

## Connecting this part with future parts

This module is intentionally standalone and easy to integrate:

- **For a dashboard/backend service**: call `predict.py` from an API endpoint and return the generated predictions.
- **For a data pipeline**: schedule `train_model.py` weekly/monthly and version model artifacts.
- **For a larger ML stack**: replace the `Ridge` model with XGBoost/LightGBM while keeping feature logic reusable.

Suggested contracts for other modules:

- Input contract: standardized OHLCV CSV schema.
- Output contract: `predictions.csv` with `date` + `predicted_close`.
- Artifact contract: serialized model (`model.joblib`) and scaler (`scaler.joblib`).

---

## How to improve from here

- Add technical indicators (RSI, MACD, Bollinger bands).
- Add walk-forward validation instead of one static split.
- Tune hyperparameters with `GridSearchCV`.
- Add experiment tracking (MLflow, Weights & Biases).
- Add model drift checks and retraining triggers.
- Expand to multi-stock training with ticker embeddings/features.

---

## Notes for contributors

- Keep file and function names simple and explicit.
- Prefer pure functions for data transformation steps.
- Add tests for feature engineering before changing model logic.
- Document any new input/output columns in this README.
