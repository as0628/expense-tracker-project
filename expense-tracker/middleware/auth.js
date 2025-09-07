const jwt = require("jsonwebtoken");
require("dotenv").config();

const SECRET_KEY = process.env.SECRET_KEY || "defaultsecret";

module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided."
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, SECRET_KEY);

    req.user = decoded; // { id, email, isPremium }
    next();
  } catch (err) {
    console.error("JWT error:", err.message);
    return res.status(403).json({
      success: false,
      message: "Invalid or expired token"
    });
  }
};
