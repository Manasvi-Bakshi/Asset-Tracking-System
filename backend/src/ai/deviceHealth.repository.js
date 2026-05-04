import pool from "../shared/db/pg.client.js";

export async function upsertDeviceHealth(data) {
  const query = `
    INSERT INTO device_health (
      asset_id,
      predicted_label,
      status,
      cpu_label,
      battery
    )
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (asset_id)
    DO UPDATE SET
      predicted_label = EXCLUDED.predicted_label,
      status = EXCLUDED.status,
      cpu_label = EXCLUDED.cpu_label,
      battery = EXCLUDED.battery,
      last_updated = now()
    RETURNING *;
  `;

  const values = [
    data.asset_id,
    data.predictedLabel,
    data.status,
    data.cpuLabel,
    data.battery,
  ];

  const { rows } = await pool.query(query, values);
  return rows[0];
}