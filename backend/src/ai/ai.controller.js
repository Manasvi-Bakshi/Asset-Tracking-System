import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { predictWithModel } from "./model/predictor.js";
import { upsertDeviceHealth } from "./deviceHealth.repository.js";
import pool from "../shared/db/pg.client.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const datasetPath = path.join(__dirname, "data", "dataset.json");
const dataset = JSON.parse(fs.readFileSync(datasetPath, "utf-8"));

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
      return { status: "HEALTHY", cpuLabel: "Good" };
  }
}

export const getEmployeeDeviceHealth = async (req, res) => {
  try {
    const { euid } = req.params;

    // get asset assigned to employee
    const assetQuery = `
        SELECT a.id
        FROM asset_assignments aa
        JOIN assets a ON a.id = aa.asset_id
        JOIN employees e ON e.id = aa.employee_id
        WHERE e.euid = $1
        LIMIT 1
    `;

    const assetResult = await pool.query(assetQuery, [euid]);

    if (assetResult.rows.length === 0) {
      return res.status(404).json({ message: "No asset assigned" });
    }

    const asset_id = assetResult.rows[0].id;

    const sample =
      dataset[Math.floor(Math.random() * dataset.length)];

    let predictedLabel = "Normal";

    try {
      predictedLabel = await predictWithModel(sample);
    } catch (err) {
      console.error("ML fallback:", err);
    }

    const mapped = mapToUI(predictedLabel);

    const result = {
      asset_id,
      battery: Math.min(100, Math.round(sample.Battery_Health_Pct)),
      cpuLabel: mapped.cpuLabel,
      status: mapped.status,
      predictedLabel
    };

    await upsertDeviceHealth(result);

    res.json({
      id: asset_id,
      battery: result.battery,
      cpuLabel: result.cpuLabel,
      status: result.status,
      predictedLabel,
      lastCheckIn: "Just now"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Prediction failed" });
  }
};