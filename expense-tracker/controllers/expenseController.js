const db = require("../config/db");

// Helper: update total_expense
async function updateTotalExpense(userId, difference) {
  await db.query(
    "UPDATE signup SET total_expense = total_expense + ? WHERE id = ?",
    [difference, userId]
  );
}

// ✅ Get all expenses (no pagination)
const getExpenses = async (req, res) => {
  const userId = req.user.id;

  try {
    const [rows] = await db.query(
      "SELECT * FROM expenses WHERE user_id = ? ORDER BY created_at DESC",
      [userId]
    );

    res.json(rows); // ✅ return array directly
  } catch (err) {
    console.error("Error fetching expenses:", err);
    res.status(500).json({ error: "Database error while fetching expenses" });
  }
};

// ✅ Add expense
const addExpense = async (req, res) => {
  const { amount, description, category, note } = req.body;
  const userId = req.user.id;

  if (!amount || !description || !category) {
    return res.status(400).json({ error: "Amount, description, and category are required" });
  }
  if (isNaN(amount)) {
    return res.status(400).json({ error: "Amount must be a number" });
  }

  try {
    const [result] = await db.query(
      "INSERT INTO expenses (amount, description, category, note, user_id) VALUES (?, ?, ?, ?, ?)",
      [amount, description, category, note || null, userId]
    );

    await updateTotalExpense(userId, amount);

    res.status(201).json({ message: "Expense added", expenseId: result.insertId });
  } catch (err) {
    console.error("Error adding expense:", err);
    res.status(500).json({ error: "Database error while adding expense" });
  }
};

// ✅ Update expense
const updateExpense = async (req, res) => {
  const { id } = req.params;
  const { amount, description, category, note } = req.body;
  const userId = req.user.id;

  if (isNaN(amount)) {
    return res.status(400).json({ error: "Amount must be a number" });
  }

  try {
    const [rows] = await db.query(
      "SELECT amount FROM expenses WHERE id = ? AND user_id = ?",
      [id, userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Expense not found" });
    }

    const oldAmount = rows[0].amount;
    const difference = amount - oldAmount;

    const [result] = await db.query(
      "UPDATE expenses SET amount = ?, description = ?, category = ?, note = ? WHERE id = ? AND user_id = ?",
      [amount, description, category, note || null, id, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Expense not found" });
    }

    await updateTotalExpense(userId, difference);

    res.json({ message: "Expense updated" });
  } catch (err) {
    console.error("Error updating expense:", err);
    res.status(500).json({ error: "Database error while updating expense" });
  }
};

// ✅ Delete expense
const deleteExpense = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const [rows] = await db.query(
      "SELECT amount FROM expenses WHERE id = ? AND user_id = ?",
      [id, userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Expense not found" });
    }

    const amount = rows[0].amount;

    const [result] = await db.query(
      "DELETE FROM expenses WHERE id = ? AND user_id = ?",
      [id, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Expense not found" });
    }

    await updateTotalExpense(userId, -amount);

    res.json({ message: "Expense deleted" });
  } catch (err) {
    console.error("Error deleting expense:", err);
    res.status(500).json({ error: "Database error while deleting expense" });
  }
};

module.exports = { getExpenses, addExpense, updateExpense, deleteExpense };
