const express = require("express");
const router = express.Router();
const { 
  getPremiumExpenses, 
  addPremiumExpense, 
  updatePremiumExpense, 
  deletePremiumExpense,
  getLeaderboard,
  getReport,
  downloadReport,
  getExportHistory
} = require("../controllers/premiumexpenseController");
const auth = require("../middleware/auth"); 

// ✅ Pagination middleware
const validatePagination = (req, res, next) => {
  let { page, limit } = req.query;

  // Default values
  page = parseInt(page, 10) || 1;
  limit = parseInt(limit, 10) || 10;

  // Validation (must be positive integers)
  if (page < 1) page = 1;
  if (limit < 1) limit = 10;

  // Optional: cap maximum limit (avoid huge DB loads)
  if (limit > 100) limit = 100;

  req.query.page = page;
  req.query.limit = limit;

  next();
};

// Premium expenses (with pagination)
router.get("/", auth, validatePagination, getPremiumExpenses);
router.post("/", auth, addPremiumExpense);

// Reports and exports
router.get("/report", auth, getReport);
router.get("/download", auth, downloadReport);
router.get("/leaderboard", auth, validatePagination, getLeaderboard);
router.get("/history", auth, getExportHistory);

// Expense update/delete (dynamic param must come last)
router.put("/:id", auth, updatePremiumExpense);
router.delete("/:id", auth, deletePremiumExpense);

module.exports = router;
