const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require("dotenv").config();
const SECRET_KEY = process.env.SECRET_KEY || "defaultsecret";  // fallback

// SIGNUP
const signup = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }
try {
    // Check if user exists
    const [existing] = await db.query(
      "SELECT * FROM signup WHERE email = ?", [email]
    );
    if (existing.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashed = await bcrypt.hash(password, 10);//salt is random data added to the password before hashing.

    // Insert user
    const [result] = await db.query(
      "INSERT INTO signup (name, email, password, isPremium) VALUES (?, ?, ?, ?)",
      [name, email, hashed, 0]
    );

    res.status(201).json({ message: "User created successfully", userId: result.insertId });

  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Server error during signup" });
  }
};

// LOGIN
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    // Check user
    const [rows] = await db.query(
      "SELECT * FROM signup WHERE email = ?", [email]
    );
    if (rows.length === 0) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const user = rows[0];

    // Compare password
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, isPremium: user.isPremium },
      SECRET_KEY,
      { expiresIn: "1h" }
    );

    res.json({
      message: "Login successful",
      token,
      userId: user.id,
      isPremium: !!user.isPremium
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error during login" });
  }
};

module.exports = { signup, login };
