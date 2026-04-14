import pool from "../shared/db/pg.client.js";
import { v4 as uuidv4 } from "uuid";

export async function insertEmployeesBulk(rows) {
  const inserted = [];
  const duplicates = [];

  for (const row of rows) {
    const euid = String(row.euid || "").trim();
    const first_name = String(row.first_name || "").trim();
    const last_name = String(row.last_name || "").trim();
    const email = String(row.email || "").trim();
    const department = String(row.department || "").trim();
    const designation = String(row.designation || "").trim();

    // ✅ VALIDATION
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
    } else {
      duplicates.push({ euid });
    }
  }

  return { inserted, duplicates };
}

export async function insertAssetsBulk(rows) {
  const inserted = [];
  const duplicates = [];

  for (const row of rows) {
    const asset_code = String(row.asset_code || "").trim();
    const asset_type = String(row.asset_type || "").trim();
    const company = String(row.company || "").trim();
    const model = String(row.model || "").trim();
    const serial_number = String(row.serial_number || "").trim();
    const status = String(row.status || "AVAILABLE").trim();

    try {
      const { rows: result } = await pool.query(
        `
        INSERT INTO assets (
          id,
          asset_code,
          asset_type,
          company,
          model,
          serial_number,
          status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (asset_code) DO NOTHING
        RETURNING *
        `,
        [
          uuidv4(),
          asset_code,
          asset_type || null,
          company || null,
          model || null,
          serial_number || null,
          status || "AVAILABLE",
        ]
      );

      if (result.length > 0) {
        inserted.push(result[0]);
      } else {
        duplicates.push({ asset_code });
      }
    } catch (err) {
      // 🔥 Handle serial_number duplicate
      if (err.code === "23505") {
        duplicates.push({
          asset_code,
          serial_number,
          reason: "duplicate serial_number",
        });
        continue;
      }

      console.error("Asset insert error:", err);
    }
  }

  return { inserted, duplicates };
}