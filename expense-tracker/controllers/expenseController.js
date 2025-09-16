const db = require("../config/db");

// helper: update total_expense (only for expense type)
async function updateTotalExpense(userId, difference) {
  await db.query(
    "UPDATE signup SET total_expense = total_expense + ? WHERE id = ?",
    [difference, userId]
  );
}

//  Get all expenses
const getExpenses = async (req, res) => {
  const userId = req.user.id;
  try {
    const [rows] = await db.query(
      "SELECT * FROM expenses WHERE user_id = ? ORDER BY created_at DESC",
      [userId]
    );
    res.json(rows);
  } catch (err) {
    console.error("Error fetching expenses:", err);
    res.status(500).json({ error: "Database error while fetching expenses" });
  }
};

//  Add expense (now includes type)
const addExpense = async (req, res) => {
  const { amount, description, category, type, note } = req.body;
  const userId = req.user.id;
  if (!amount || !description || !category || !type) {
    return res.status(400).json({ error: "Amount, description, category and type are required" });
  }
  if (isNaN(amount)) {
    return res.status(400).json({ error: "Amount must be a number" });
  }
  if (type !== "income" && type !== "expense") {
    return res.status(400).json({ error: "Type must be income or expense" });
  }
  try {
    const [result] = await db.query(
      "INSERT INTO expenses (amount, description, category, type, note, user_id) VALUES (?, ?, ?, ?, ?, ?)",
      [amount, description, category, type, note || null, userId]
    );
  if (type === "expense") {
      await updateTotalExpense(userId, amount);
    }
  res.status(201).json({ message: `${type} added`, expenseId: result.insertId });
  } catch (err) {
    console.error("Error adding expense:", err);
    res.status(500).json({ error: "Database error while adding expense" });
  }
};

// //  Update expense
// const updateExpense = async (req, res) => {
//   const { id } = req.params;
//   const { amount, description, category,type, note } = req.body;
//   const userId = req.user.id;

//   if (isNaN(amount)) {
//     return res.status(400).json({ error: "Amount must be a number" });
//   }

//   try {
//     const [rows] = await db.query(
//       "SELECT amount FROM expenses WHERE id = ? AND user_id = ?",
//       [id, userId]
//     );

//     if (rows.length === 0) {
//       return res.status(404).json({ error: "Expense not found" });
//     }

//     const oldAmount = rows[0].amount;
//     const difference = amount - oldAmount;

//     const [result] = await db.query(
//       "UPDATE expenses SET amount = ?, description = ?, category = ?,type = ?, note = ? WHERE id = ? AND user_id = ?",
//       [amount, description, category,type, note || null, id, userId]
//     );

//     if (result.affectedRows === 0) {
//       return res.status(404).json({ error: "Expense not found" });
//     }
//     await updateTotalExpense(userId, difference);
//     res.json({ message: "Expense updated" });
//   } catch (err) {
//     console.error("Error updating expense:", err);
//     res.status(500).json({ error: "Database error while updating expense" });
//   }
// };

// ✅ Delete expense
const deleteExpense = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  try {
    const [rows] = await db.query(
      "SELECT amount, type FROM expenses WHERE id = ? AND user_id = ?",
      [id, userId]
    );
  if (rows.length === 0) {
      return res.status(404).json({ error: "Expense not found" });
    }
    const { amount, type } = rows[0];
    const [result] = await db.query(
      "DELETE FROM expenses WHERE id = ? AND user_id = ?",
      [id, userId]
    );
  if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Expense not found" });
    }

  if (type === "expense") {
      await updateTotalExpense(userId, -amount);
    }
  res.json({ message: "Expense deleted" });
  } catch (err) {
    console.error("Error deleting expense:", err);
    res.status(500).json({ error: "Database error while deleting expense" });
  }
};

// Get report for daily / monthly / yearly
const getReport = async (req, res) => {
  try {
    const { period } = req.query;
    const userId = req.user.id;
    let query = "";
    if (period === "daily") {
      query = `
        SELECT 
          SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS total_income,
          SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS total_expense
        FROM expenses
        WHERE user_id = ? AND DATE(created_at) = CURDATE();
      `;
    } else if (period === "monthly") {
      query = `
        SELECT 
          SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS total_income,
          SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS total_expense
        FROM expenses
        WHERE user_id = ? 
          AND MONTH(created_at) = MONTH(CURDATE())
          AND YEAR(created_at) = YEAR(CURDATE());
      `;
    } else if (period === "yearly") {
      query = `
        SELECT 
          SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS total_income,
          SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS total_expense
        FROM expenses
        WHERE user_id = ? 
          AND YEAR(created_at) = YEAR(CURDATE());
      `;
    } else {
      return res.status(400).json({ error: "Invalid period" });
    }
    const [rows] = await db.query(query, [userId]);
    const data = rows[0] || { total_income: 0, total_expense: 0 };
    const balance = (data.total_income || 0) - (data.total_expense || 0);
    res.json({ ...data, balance });
  } catch (err) {
    console.error("Report query error:", err);
    res.status(500).json({ error: "Failed to generate report" });
  }
};

module.exports = {
  getExpenses,
  addExpense,
  //updateExpense,
  deleteExpense,
  getReport
};
