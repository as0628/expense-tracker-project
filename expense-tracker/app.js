const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const signupRoutes = require("./routes/signupRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const orderRoutes = require("./routes/orderRoutes");
const premiumexpenseRoutes = require("./routes/premiumexpenseRoutes");
const passwordRoutes = require("./routes/passwordRoutes");
const app = express();

app.use(cors());
app.use(express.json());// parses JSON from requests into JS objects.
app.use(express.urlencoded({ extended: true }));//parses HTML form data into JS objects

// Logging requests to access.log
const accessLogStream = fs.createWriteStream(
  path.join(__dirname, "access.log"),
  { flags: "a" }
);//without these lines we wouldn’t have a saved record of server activity

app.use(morgan("combined", { stream: accessLogStream }));

// Serve static files
app.use(express.static(path.join(__dirname, "public"))); // /public folder accessible at the root url
app.use("/exports", express.static(path.join(__dirname, "exports"))); // /exports folder

//Routes
app.use("/api/auth", signupRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/order", orderRoutes);
app.use("/api/premiumexpenses", premiumexpenseRoutes);
app.use("/password", passwordRoutes);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/home.html"));
});// Serve home.html at root URL

// app.get("/health", (req, res) => {
//   res.send(" Expense Tracker API is running");
// });

app.use((err, req, res, next) => {
  console.error(`[${req.method}] ${req.url} → Error:`, err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});// Handle errors and send JSON response

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
