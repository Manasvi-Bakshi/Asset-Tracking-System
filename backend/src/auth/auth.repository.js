import pool from "../shared/db/pg.client.js"

export async function getActiveEmployeeByEuid(euid) {
  const { rows } = await pool.query(
    `
    SELECT id, euid, first_name, last_name
    FROM employees
    WHERE euid = $1
      AND is_active = true
    LIMIT 1
    `,
    [euid]
  )

  return rows[0] || null
}
