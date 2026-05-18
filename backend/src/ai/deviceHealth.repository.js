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

  const { rows } =
    await pool.query(query, values);

  return rows[0];
}

export async function getAllDeviceHealth() {

  const query = `
    SELECT

      a.id,
      a.asset_code,
      a.company,
      a.model,

      CONCAT(
        e.first_name,
        ' ',
        e.last_name
      ) AS employee_name,

      e.euid,

      dh.battery,
      dh.cpu_label,
      dh.status,
      dh.predicted_label,
      dh.last_updated

    FROM assets a

    LEFT JOIN device_health dh
      ON dh.asset_id = a.id

    LEFT JOIN asset_assignments aa
      ON aa.asset_id = a.id
      AND aa.status = 'ACTIVE'

    LEFT JOIN employees e
      ON e.id = aa.employee_id

    ORDER BY
      dh.last_updated DESC NULLS LAST
  `;

  const { rows } =
    await pool.query(query);

  return rows;
}