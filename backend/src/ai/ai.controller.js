import { predictWithModel } from "./model/predictor.js";

import {
  upsertDeviceHealth,
  getAllDeviceHealth
} from "./deviceHealth.repository.js";

import pool from "../shared/db/pg.client.js";

import {
  getOrCreateState,
  evolveState
} from "./simulation/deviceState.js";

function mapToUI(label) {

  switch (label) {

    case "Normal":
      return {
        status: "HEALTHY",
        cpuLabel: "Good"
      };

    case "Memory_Leak":
      return {
        status: "WARNING",
        cpuLabel: "Moderate"
      };

    case "Overheating":
    case "Disk_Failure":
    case "Power_Issue":
      return {
        status: "CRITICAL",
        cpuLabel: "Critical"
      };

    default:
      return {
        status: "HEALTHY",
        cpuLabel: "Good"
      };
  }
}

/*
  EMPLOYEE DEVICE HEALTH
*/

export const getEmployeeDeviceHealth = async (req, res) => {

  try {

    const { euid } = req.params;

    const assetQuery = `
      SELECT a.id
      FROM asset_assignments aa
      JOIN assets a ON a.id = aa.asset_id
      JOIN employees e ON e.id = aa.employee_id
      WHERE e.euid = $1
      ORDER BY aa.assignment_date DESC
      LIMIT 1
    `;

    const assetResult =
      await pool.query(assetQuery, [euid]);

    if (assetResult.rows.length === 0) {

      return res.status(404).json({
        message: "No asset assigned"
      });
    }

    const asset_id =
      assetResult.rows[0].id;

    /*
      STATEFUL SIMULATION
    */

    const state =
      getOrCreateState(asset_id);

    const telemetry =
      evolveState(state);

    /*
      ML PREDICTION
    */

    let predictedLabel = "Normal";

    try {

      predictedLabel =
        await predictWithModel(telemetry);

    } catch (err) {

      console.error(
        "ML prediction fallback:",
        err
      );
    }

    /*
      UI MAPPING
    */

    const mapped =
      mapToUI(predictedLabel);

    const result = {

      asset_id,

      battery: Math.round(
        telemetry.Battery_Health_Pct
      ),

      cpuLabel: mapped.cpuLabel,

      status: mapped.status,

      predictedLabel
    };

    /*
      PERSIST HEALTH STATE
    */

    await upsertDeviceHealth(result);

    /*
      RESPONSE
    */

    res.json({

      id: asset_id,

      battery: result.battery,

      cpuLabel: result.cpuLabel,

      status: result.status,

      predictedLabel,

      telemetry,

      lastCheckIn: "Just now"
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: "Prediction failed"
    });
  }
};

/*
  ADMIN FLEET HEALTH
*/

export const getAllDevicesHealth = async (req, res) => {

  try {

    /*
      GET ALL ASSETS
    */

    const assetQuery = `
      SELECT id
      FROM assets
    `;

    const assetResult =
      await pool.query(assetQuery);

    /*
      ENSURE EVERY DEVICE
      HAS TELEMETRY + ML STATE
    */

    for (const asset of assetResult.rows) {

      const asset_id =
        asset.id;

      const existingHealth =
        await pool.query(
          `
            SELECT asset_id
            FROM device_health
            WHERE asset_id = $1
          `,
          [asset_id]
        );

      /*
        CREATE INITIAL HEALTH
        IF MISSING
      */

      if (existingHealth.rows.length === 0) {

        const state =
          getOrCreateState(asset_id);

        const telemetry =
          evolveState(state);

        let predictedLabel = "Normal";

        try {

          predictedLabel =
            await predictWithModel(
              telemetry
            );

        } catch (err) {

          console.error(
            "Fleet ML fallback:",
            err
          );
        }

        const mapped =
          mapToUI(predictedLabel);

        await upsertDeviceHealth({

          asset_id,

          battery: Math.round(
            telemetry.Battery_Health_Pct
          ),

          cpuLabel:
            mapped.cpuLabel,

          status:
            mapped.status,

          predictedLabel
        });
      }
    }

    /*
      RETURN COMPLETE
      FLEET HEALTH
    */

    const devices =
      await getAllDeviceHealth();

    res.json(devices);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message:
        "Failed to fetch fleet device health"
    });
  }
};