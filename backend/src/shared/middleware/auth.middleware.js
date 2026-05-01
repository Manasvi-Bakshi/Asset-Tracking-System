import jwt from "jsonwebtoken"

export function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers["authorization"]

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Authorization header missing"
      })
    }

    const token = authHeader.split(" ")[1]

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token missing"
      })
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined")
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    req.user = decoded

    next()
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token"
    })
  }
}