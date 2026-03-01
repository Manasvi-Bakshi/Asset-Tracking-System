import pandas as pd
import numpy as np

# Load ORIGINAL dataset
df = pd.read_csv("Laptop_Motherboard_Health_Monitoring_Dataset.csv")

# Drop ModelName if exists
if "ModelName" in df.columns:
    df = df.drop("ModelName", axis=1)

# ----------------------------
# Logical Target Reassignment
# ----------------------------
new_labels = []

for i in range(len(df)):
    if df.loc[i, "Temperature"] > 85:
        new_labels.append("Overheating")
    elif df.loc[i, "Voltage"] < 10:
        new_labels.append("Power_Issue")
    elif df.loc[i, "FanSpeed"] < 2000:
        new_labels.append("Cooling_Failure")
    elif df.loc[i, "CPUUsage"] > 90:
        new_labels.append("High_Load")
    else:
        new_labels.append("Normal")

df["ProblemDetected"] = new_labels

# ----------------------------
# Add Controlled Noise (Realistic)
# ----------------------------
np.random.seed(42)

df["Temperature"] += np.random.normal(0, 1.5, len(df))
df["Voltage"] += np.random.normal(0, 0.2, len(df))
df["FanSpeed"] += np.random.normal(0, 70, len(df))
df["CPUUsage"] += np.random.normal(0, 2, len(df))

# Flip 5% labels
flip_percentage = 0.05
num_flip = int(len(df) * flip_percentage)

flip_indices = np.random.choice(df.index, num_flip, replace=False)
unique_labels = df["ProblemDetected"].unique()

for idx in flip_indices:
    current_label = df.loc[idx, "ProblemDetected"]
    new_label = np.random.choice(unique_labels[unique_labels != current_label])
    df.loc[idx, "ProblemDetected"] = new_label

# Overwrite SAME file
df.to_csv("Laptop_Motherboard_Health_Monitoring_Dataset.csv", index=False)

print("✅ Dataset updated successfully!")