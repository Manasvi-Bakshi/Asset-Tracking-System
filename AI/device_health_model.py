import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score

# LOAD DATASET
df = pd.read_csv("Laptop_Motherboard_Health_Monitoring_Dataset.csv")

# Encode target
le = LabelEncoder()
df["ProblemDetected"] = le.fit_transform(df["ProblemDetected"])

X = df.drop("ProblemDetected", axis=1)
y = df["ProblemDetected"]

# Scaling
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# Train Test Split
X_train, X_test, y_train, y_test = train_test_split(
    X_scaled, y, test_size=0.2, random_state=42, stratify=y
)

# Model
model = RandomForestClassifier(n_estimators=600, random_state=42)
model.fit(X_train, y_train)

accuracy = accuracy_score(y_test, model.predict(X_test))
print("🔥 Final Accuracy:", accuracy)

# Save files
joblib.dump(model, "device_health_model.pkl")
joblib.dump(scaler, "scaler.pkl")
joblib.dump(le, "label_encoder.pkl")

print("✅ Model + Scaler + Encoder Saved Successfully!")