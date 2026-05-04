import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { predictWithModel } from "./model/predictor.js";

// resolve paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// load dataset
const datasetPath = path.join(__dirname, "data", "dataset.json");
const dataset = JSON.parse(fs.readFileSync(datasetPath, "utf-8"));

// 🔁 Mapping function (LOCKED + SAFE)
function mapToUI(label) {
  switch (label) {
    case "Normal":
      return { status: "HEALTHY", cpuLabel: "Good" };

    case "Memory_Leak":
      return { status: "WARNING", cpuLabel: "Moderate" };

    case "Overheating":
    case "Disk_Failure":
    case "Power_Issue":
      return { status: "CRITICAL", cpuLabel: "Critical" };

    default:
      // 🔥 IMPORTANT: fallback always HEALTHY
      return { status: "HEALTHY", cpuLabel: "Good" };
  }
}

export const getSimulatedDevice = async (req, res) => {
  try {
    // 1. pick telemetry sample
    const sample =
      dataset[Math.floor(Math.random() * dataset.length)];

    // 2. call ML model
    let predictedLabel = "Normal"; // safe default

    try {
      predictedLabel = await predictWithModel(sample);
    } catch (err) {
      console.error("ML failed, using fallback:", err);
    }

    // 3. map to UI-friendly format
    const mapped = mapToUI(predictedLabel);

    // 4. send clean response (frontend-ready)
    res.json({
      id: sample.DeviceID,
      battery: Math.min(100, Math.round(sample.Battery_Health_Pct)),
      cpuLabel: mapped.cpuLabel,
      status: mapped.status,
      predictedLabel,
      groundTruth: sample.ProblemDetected,
      lastCheckIn: "Just now"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Prediction failed" });
  }
};