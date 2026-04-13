import pool from "../shared/db/pg.client.js";
import { v4 as uuidv4 } from "uuid";

export async function insertEmployeesBulk(rows) {
  const inserted = [];

  for (const row of rows) {
    const euid = String(row.euid || "").trim();
    const first_name = String(row.first_name || "").trim();
    const last_name = String(row.last_name || "").trim();
    const email = String(row.email || "").trim();
    const department = String(row.department || "").trim();
    const designation = String(row.designation || "").trim();

    // ✅ STRICT VALIDATION
    if (!euid || !first_name || !email) {
      console.warn("Skipping invalid row:", row);
      continue;
    }

    const { rows: result } = await pool.query(
      `
      INSERT INTO employees (
        id,
        euid,
        first_name,
        last_name,
        email,
        department,
        designation
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (euid) DO NOTHING
      RETURNING *
      `,
      [
        uuidv4(),
        euid,
        first_name,
        last_name || null,
        email,
        department || null,
        designation || null,
      ]
    );

    if (result.length > 0) {
      inserted.push(result[0]);
    }
  }

  return inserted;
}