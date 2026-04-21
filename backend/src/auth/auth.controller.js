import { loginWithEuid } from "./auth.service.js"

export async function login(req, res) {
  try {
    const { euid } = req.body

    if (!euid) {
      return res.status(400).json({
        success: false,
        message: "euid is required"
      })
    }

    const authResult = await loginWithEuid(euid)

    if (!authResult) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      })
    }

    return res.json({
      success: true,
      token: authResult.token,
      user: authResult.user
    })
  } catch (error) {
    console.error("Login error:", error.message)

    return res.status(500).json({
      success: false,
      message: "Internal server error"
    })
  }
}