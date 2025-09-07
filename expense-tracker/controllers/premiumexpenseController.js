const ExcelJS = require("exceljs");
const db = require("../config/db");
const { uploadToS3 } = require("../utils/s3");
const fs = require("fs");
const path = require("path");

// ================= Get All Expenses (with pagination) =================
const getPremiumExpenses = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // total count
    const [[{ total }]] = await db.query(
      "SELECT COUNT(*) AS total FROM expenses WHERE user_id = ?",
      [userId]
    );

    // paginated results
    const [results] = await db.query(
      `SELECT id, amount, description, category, type, note, created_at 
       FROM expenses 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );

    res.json({
      expenses: results,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("Error fetching expenses:", err);
    res.status(500).json({ error: "Database error" });
  }
};

// ================= Add Expense =================
const addPremiumExpense = async (req, res) => {
  try {
    const { amount, description, category, type, note } = req.body;
    const userId = req.user.id;

    if (!amount || !description || !category || !type) {
      return res.status(400).json({ error: "All fields are required" });
    }
    if (type !== "income" && type !== "expense") {
      return res.status(400).json({ error: "Invalid type (must be income or expense)" });
    }

    const [result] = await db.query(
      "INSERT INTO expenses (amount, description, category, type, note, user_id) VALUES (?, ?, ?, ?, ?, ?)",
      [amount, description, category, type, note || null, userId]
    );

    if (type === "expense") {
      await db.query(
        "UPDATE signup SET total_expense = total_expense + ? WHERE id = ?",
        [amount, userId]
      );
    }

    res.status(201).json({ message: `${type} added`, expenseId: result.insertId });
  } catch (err) {
    console.error("Error adding expense:", err);
    res.status(500).json({ error: "Database error" });
  }
};

// ================= Update Expense =================
const updatePremiumExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, description, category, type, note } = req.body;
    const userId = req.user.id;

    const [rows] = await db.query(
      "SELECT amount FROM expenses WHERE id = ? AND user_id = ?",
      [id, userId]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Expense not found" });

    const oldAmount = rows[0].amount;

    const [result] = await db.query(
      "UPDATE expenses SET amount = ?, description = ?, category = ?, type = ?, note = ? WHERE id = ? AND user_id = ?",
      [amount, description, category, type, note || null, id, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Expense not found" });
    }

    const diff = amount - oldAmount;
    await db.query(
      "UPDATE signup SET total_expense = total_expense + ? WHERE id = ?",
      [diff, userId]
    );

    res.json({ message: "Expense updated" });
  } catch (err) {
    console.error("Error updating expense:", err);
    res.status(500).json({ error: "Database error" });
  }
};

// ================= Delete Expense =================
const deletePremiumExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const [rows] = await db.query(
      "SELECT amount FROM expenses WHERE id = ? AND user_id = ?",
      [id, userId]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Expense not found" });

    const expenseAmount = rows[0].amount;

    const [result] = await db.query(
      "DELETE FROM expenses WHERE id = ? AND user_id = ?",
      [id, userId]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: "Expense not found" });

    await db.query(
      "UPDATE signup SET total_expense = total_expense - ? WHERE id = ?",
      [expenseAmount, userId]
    );

    res.json({ message: "Expense deleted" });
  } catch (err) {
    console.error("Error deleting expense:", err);
    res.status(500).json({ error: "Database error" });
  }
};

// ================= Leaderboard =================
const getLeaderboard = async (req, res) => {
  try {
    let { page = 1, limit = 10 } = req.query;
    page = parseInt(page, 10);
    limit = parseInt(limit, 10);

    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1) limit = 10;

    const offset = (page - 1) * limit;

    const [[{ count }]] = await db.query(
      `SELECT COUNT(*) as count FROM signup WHERE isPremium = 1`
    );

    const [results] = await db.query(
      `SELECT id, name, total_expense
       FROM signup
       WHERE isPremium = 1
       ORDER BY total_expense DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    res.json({
      leaderboard: results,
      pagination: {
        page,
        limit,
        totalUsers: count,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (err) {
    console.error("Leaderboard query error:", err);
    res.status(500).json({ error: "Database error" });
  }
};

// ================= Reports =================
const getReport = async (req, res) => {
  try {
    const { period } = req.query;
    const userId = req.user.id;

    let query = "";
    if (period === "daily") {
      query = `
        SELECT 
          'Today' AS period,
          SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS total_income,
          SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS total_expense
        FROM expenses
        WHERE user_id = ? AND DATE(created_at) = CURDATE();
      `;
    } else if (period === "weekly") {
      query = `
        SELECT 
          'This Week' AS period,
          SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS total_income,
          SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS total_expense
        FROM expenses
        WHERE user_id = ? AND YEARWEEK(created_at, 1) = YEARWEEK(CURDATE(), 1);
      `;
    } else if (period === "monthly") {
      query = `
        SELECT 
          'This Month' AS period,
          SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS total_income,
          SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS total_expense
        FROM expenses
        WHERE user_id = ? AND MONTH(created_at) = MONTH(CURDATE()) 
          AND YEAR(created_at) = YEAR(CURDATE());
      `;
    } else {
      return res.status(400).json({ error: "Invalid period" });
    }

    const [rows] = await db.query(query, [userId]);

    res.json(rows.length > 0 ? rows : [{ period, total_income: 0, total_expense: 0 }]);
  } catch (err) {
    console.error("Report query error:", err);
    res.status(500).json({ error: "Failed to generate report" });
  }
};

// ================= Download Report (Excel) =================
const downloadReport = async (req, res) => {
  try {
    if (!req.user.isPremium) {
      return res.status(401).json({ error: "Unauthorized - Premium users only" });
    }

    const { period } = req.query;
    const userId = req.user.id;

    console.log("Generating Excel Report for user:", userId, "period:", period);

    const [rows] = await db.query(
      `SELECT 
         id, amount, description, category, type, note, created_at AS date
       FROM expenses
       WHERE user_id = ?
       ORDER BY created_at ASC`,
      [userId]
    );

    const [yearly] = await db.query(
      `SELECT 
         DATE_FORMAT(created_at, '%M %Y') AS month,
         SUM(CASE WHEN type='income' THEN amount ELSE 0 END) AS income,
         SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) AS expense
       FROM expenses
       WHERE user_id = ?
       GROUP BY DATE_FORMAT(created_at, '%M %Y')
       ORDER BY MIN(created_at)`,
      [userId]
    );

    const [notes] = await db.query(
      `SELECT created_at AS date, note
       FROM expenses
       WHERE user_id = ? AND note IS NOT NULL AND note <> ''
       ORDER BY created_at ASC`,
      [userId]
    );

    const workbook = new ExcelJS.Workbook();

    const sheet1 = workbook.addWorksheet("Detailed Expenses");
    sheet1.columns = [
      { header: "Date", key: "date", width: 15 },
      { header: "Description", key: "description", width: 25 },
      { header: "Category", key: "category", width: 15 },
      { header: "Income", key: "income", width: 15 },
      { header: "Expense", key: "expense", width: 15 },
      { header: "Savings", key: "savings", width: 15 },
      { header: "Note", key: "note", width: 40 },
    ];
    rows.forEach((row) => {
      sheet1.addRow({
        date: new Date(row.date).toLocaleDateString(),
        description: row.description,
        category: row.category,
        income: row.type === "income" ? Number(row.amount) : null,
        expense: row.type === "expense" ? Number(row.amount) : null,
        savings: null,
        note: row.note || "",
      });
    });
    const totalIncome = rows.filter(r => r.type === "income").reduce((a, r) => a + Number(r.amount), 0);
    const totalExpense = rows.filter(r => r.type === "expense").reduce((a, r) => a + Number(r.amount), 0);
    sheet1.addRow({});
    sheet1.addRow({
      description: "TOTAL",
      income: totalIncome,
      expense: totalExpense,
      savings: totalIncome - totalExpense,
    });

    const sheet2 = workbook.addWorksheet("Yearly Summary");
    sheet2.columns = [
      { header: "Month", key: "month", width: 20 },
      { header: "Income", key: "income", width: 15 },
      { header: "Expense", key: "expense", width: 15 },
      { header: "Savings", key: "savings", width: 15 },
    ];
    yearly.forEach((row) => {
      sheet2.addRow({
        month: row.month,
        income: Number(row.income),
        expense: Number(row.expense),
        savings: Number(row.income) - Number(row.expense),
      });
    });
    const yearlyIncome = yearly.reduce((a, r) => a + Number(r.income), 0);
    const yearlyExpense = yearly.reduce((a, r) => a + Number(r.expense), 0);
    sheet2.addRow({});
    sheet2.addRow({
      month: "TOTAL",
      income: yearlyIncome,
      expense: yearlyExpense,
      savings: yearlyIncome - yearlyExpense,
    });

    const sheet3 = workbook.addWorksheet("Yearly Notes");
    sheet3.columns = [
      { header: "Date", key: "date", width: 20 },
      { header: "Note", key: "note", width: 50 },
    ];
    if (notes.length > 0) {
      notes.forEach((row) => {
        sheet3.addRow({
          date: new Date(row.date).toLocaleDateString(),
          note: row.note,
        });
      });
    } else {
      sheet3.addRow({ date: "—", note: "No notes found" });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const fileKey = `reports/user-${userId}-${Date.now()}.xlsx`;
    const url = await uploadToS3(
      buffer,
      fileKey,
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    await db.query(
      "INSERT INTO export_history (user_id, s3_key, url) VALUES (?, ?, ?)",
      [userId, fileKey, url]
    );

    res.json({ fileUrl: url });
  } catch (err) {
    console.error("Unexpected error in downloadReport:", err);
    res.status(500).json({ error: "Unexpected error" });
  }
};

// ================= Export History =================
const getExportHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    let page = parseInt(req.query.page, 10) || 1;
    let limit = parseInt(req.query.limit, 10) || 5;

    if (limit < 3) limit = 3;
    if (limit > 10) limit = 10;

    const offset = (page - 1) * limit;

    const [countResult] = await db.query(
      "SELECT COUNT(*) as total FROM export_history WHERE user_id = ?",
      [userId]
    );
    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    const [rows] = await db.query(
      "SELECT id, s3_key, url, created_at FROM export_history WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?",
      [userId, limit, offset]
    );

    res.json({
      rows,
      pagination: {
        page,
        totalPages,
        total,
      },
    });
  } catch (err) {
    console.error("Error fetching export history:", err);
    res.status(500).json({ error: "Failed to fetch export history" });
  }
};

module.exports = {
  getPremiumExpenses,
  addPremiumExpense,
  updatePremiumExpense,
  deletePremiumExpense,
  getLeaderboard,
  getReport,
  downloadReport,
  getExportHistory,
};
