import sys
import json
import joblib
import pandas as pd
import os

BASE_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "../../../../")
)

MODEL_PATH = os.path.join(BASE_DIR, "AI", "best_model.pkl")

bundle = joblib.load(MODEL_PATH)

model = bundle["model"]
features = bundle["features"]
label_encoder = bundle.get("label_encoder", None)

payload = json.loads(sys.stdin.read())

row = pd.DataFrame([payload])

for col in features:
    if col not in row.columns:
        row[col] = 0

row = row[features]

# predict
pred = model.predict(row)[0]

if label_encoder:
    pred = label_encoder.inverse_transform([pred])[0]

print(pred)