export async function insertPresenceEvent(client, data) {
  const { asset_id, location_id, event_type, source } = data;

  const { rows } = await client.query(
    `
    INSERT INTO asset_presence_events (
      asset_id,
      location_id,
      event_type,
      source
    )
    VALUES ($1, $2, $3, $4)
    RETURNING *
    `,
    [asset_id, location_id, event_type, source]
  );

  return rows[0];
}

export async function getOfficeLocation(client, location_id) {
  const { rows } = await client.query(
    `
    SELECT *
    FROM locations
    WHERE id = $1
      AND is_office = true
    `,
    [location_id]
  );

  return rows[0] || null;
}

export async function getActiveAssignment(client, asset_id) {
  const { rows } = await client.query(
    `
    SELECT aa.*, e.id AS employee_id
    FROM asset_assignments aa
    JOIN employees e ON e.id = aa.employee_id
    WHERE aa.asset_id = $1
      AND aa.status = 'ACTIVE'
    `,
    [asset_id]
  );

  return rows[0] || null;
}

export async function getAttendanceForDate(client, employee_id, date) {
  const { rows } = await client.query(
    `
    SELECT *
    FROM attendance_daily
    WHERE employee_id = $1
      AND attendance_date = $2
    `,
    [employee_id, date]
  );

  return rows[0] || null;
}

export async function createAttendance(client, employee_id, date, entry_time) {
  const { rows } = await client.query(
    `
    INSERT INTO attendance_daily (
      employee_id,
      attendance_date,
      first_entry_time,
      last_entry_time,
      total_duration_minutes,
      status
    )
    VALUES ($1, $2, $3, $3, 0, 'PRESENT')
    RETURNING *
    `,
    [employee_id, date, entry_time]
  );

  return rows[0];
}

export async function updateAttendanceEntry(client, record_id, entry_time) {
  const { rows } = await client.query(
    `
    UPDATE attendance_daily
    SET
      last_entry_time = $1,
      status = 'PRESENT'
    WHERE id = $2
    RETURNING *
    `,
    [entry_time, record_id]
  );

  return rows[0];
}

export async function updateAttendanceExit(client, record_id, exit_time) {
  const { rows } = await client.query(
    `
    UPDATE attendance_daily
    SET 
      last_exit_time = $1,
      total_duration_minutes =
        COALESCE(total_duration_minutes, 0) +  
        EXTRACT(EPOCH FROM ($1 - first_entry_time)) / 60,
      last_entry_time = NULL
    WHERE id = $2
      AND last_entry_time IS NOT NULL
    RETURNING *
    `,
    [exit_time, record_id]
  );

  return rows[0];
}

export async function getEventDateIST(client, timestamp) {
  const { rows } = await client.query(
    `
    SELECT ($1 AT TIME ZONE 'Asia/Kolkata')::date AS attendance_date
    `,
    [timestamp]
  );

  return rows[0].attendance_date;
}

// 🔵 keep this using pool (outside transaction)
import pool from "../shared/db/pg.client.js";

export async function upsertOfficeLocation({ latitude, longitude }) {
  const updateResult = await pool.query(
    `
    UPDATE locations
    SET latitude = $1,
        longitude = $2
    WHERE is_office = true
    RETURNING *
    `,
    [latitude, longitude]
  );

  if (updateResult.rows.length > 0) {
    return updateResult.rows[0];
  }

  const insertResult = await pool.query(
    `
    INSERT INTO locations (latitude, longitude, is_office, location_name)
    VALUES ($1, $2, true, 'Main Office')
    RETURNING *
    `,
    [latitude, longitude]
  );

  return insertResult.rows[0];
}