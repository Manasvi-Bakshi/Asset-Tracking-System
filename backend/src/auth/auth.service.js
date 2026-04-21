import jwt from "jsonwebtoken"
import { getActiveEmployeeByEuid } from "./auth.repository.js"

export async function loginWithEuid(rawEuid) {
  // Normalize input
  const euid = rawEuid?.trim().toUpperCase()

  if (!euid) {
    return null
  }

  const employee = await getActiveEmployeeByEuid(euid)

  if (!employee) {
    return null
  }

  // Ensure JWT secret exists
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined")
  }

  const token = jwt.sign(
    {
      id: employee.id,
      euid: employee.euid
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "8h" // IMPORTANT: token expiry
    }
  )

  return {
    token,
    user: {
      euid: employee.euid,
      first_name: employee.first_name,
      last_name: employee.last_name
    }
  }
}