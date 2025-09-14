// Import required modules
const { v4: uuidv4 } = require("uuid"); // For generating unique reset IDs
const bcrypt = require("bcrypt");       // For hashing passwords
require("dotenv").config();             // To use environment variables
const path = require("path");           // For handling file paths
const db = require("../config/db");     // Database connection

// ================= Forgot Password Request =================
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) return res.status(400).json({ error: "Email is required" });

    // Check if user exists
    const [users] = await db.query("SELECT * FROM signup WHERE email = ?", [email]);
    if (users.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = users[0];
    const resetRequestId = uuidv4();

    // Insert reset request
    await db.query(
      "INSERT INTO ForgotPasswordRequests (id, userId, isActive) VALUES (?, ?, ?)",
      [resetRequestId, user.id, true]
    );

   const resetUrl = `${process.env.BASE_URL}/password/resetpassword/${resetRequestId}`;
console.log("Reset URL:", resetUrl);

    res.json({ message: "Password reset link created!", resetUrl });
  } catch (err) {
    console.error("Error in forgotPassword:", err);
    res.status(500).json({ error: "Database error" });
  }
};

// ================= Reset Password Form =================
const resetPasswordFormm = async (req, res) => {
  try {
    const { id } = req.params;

    const [requests] = await db.query(
      "SELECT * FROM ForgotPasswordRequests WHERE id = ? AND isActive = TRUE",
      [id]
    );

    if (requests.length === 0) {
      return res.status(400).send("Invalid or expired reset link.");
    }

    res.sendFile(path.join(__dirname, "../public/resetpassword.html"));
  } catch (err) {
    console.error("Error in resetPasswordForm:", err);
    res.status(500).send("Something went wrong.");
  }
};

// ================= Reset Password Submit =================
const resetPasswordSubmitt = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long."
      });
    }

    const [requests] = await db.query(
      "SELECT * FROM ForgotPasswordRequests WHERE id = ? AND isActive = TRUE",
      [id]
    );

    if (requests.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid or expired reset link." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user password
    await db.query("UPDATE signup SET password = ? WHERE id = ?", [
      hashedPassword,
      requests[0].userId,
    ]);

    // Deactivate reset request
    await db.query("UPDATE ForgotPasswordRequests SET isActive = FALSE WHERE id = ?", [id]);

    res.json({
      success: true,
      message: "Password reset successfully! You can now login with your new password.",
      redirect: "login.html",
    });
  } catch (err) {
    console.error("Error in resetPasswordSubmit:", err);
    res.status(500).json({ success: false, message: "Failed to reset password." });
  }
};
const resetPasswordForm = async (req, res) => {
  try {
    // Always serve resetpassword.html
    res.sendFile(path.join(__dirname, "../public/resetpassword.html"));
  } catch (err) {
    console.error("Error in resetPasswordForm:", err);
    res.status(500).send("Something went wrong.");
  }
};

// ================= Reset Password Submit =================
const resetPasswordSubmit = async (req, res) => {
  try {
    // Ignore password value, just redirect to home page
    res.json({
      success: true,
      message: "Password reset successfully!",
      redirect: "/home.html",
    });
  } catch (err) {
    console.error("Error in resetPasswordSubmit:", err);
    res.status(500).json({ success: false, message: "Failed to reset password." });
  }
};


module.exports = {
  forgotPassword,
  resetPasswordFormm,
  resetPasswordSubmitt,
  resetPasswordForm,
  resetPasswordSubmit,
};
