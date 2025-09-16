const jwt = require("jsonwebtoken");
require("dotenv").config();

const SECRET_KEY = process.env.SECRET_KEY || "defaultsecret";

module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];// get the Authorization header from the incoming request
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided."
      });
    }// if no header is provided OR it does not start with bearer

    const token = authHeader.split(" ")[1];// extract the token part from "Bearer <token>"
    const decoded = jwt.verify(token, SECRET_KEY);// If valid, it will return the decoded payload (e.g. { id, email, isPremium })

    req.user = decoded; // { id, email, isPremium }
    // attach the decoded user data to the request object so next middleware/routes can access it
    next();// Call next() to move to the next middleware or route handler
  } catch (err) {
    console.error("JWT error:", err.message);
    return res.status(403).json({
      success: false,
      message: "Invalid or expired token"
    });
  }
};
