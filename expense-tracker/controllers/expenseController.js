const Expense = require('../models/expenseModel');
const Signup = require('../models/signupModel'); // to update total_expense

//  Get all expenses
const getExpenses = async (req, res) => {
  try {
    const userId = req.user.id;
    const expenses = await Expense.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']]
    });
    res.json(expenses);
  } catch (err) {
    console.error("Error fetching expenses:", err);
    res.status(500).json({ error: "Database error while fetching expenses" });
  }
};

// Add expense
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
    const newExpense = await Expense.create({
      amount, description, category, type, note: note || null, user_id: userId
    });

    if (type === "expense") {
      await updateTotalExpense(userId, amount);
    }

    res.status(201).json({ message: `${type} added`, expenseId: newExpense.id });
  } catch (err) {
    console.error("Error adding expense:", err);
    res.status(500).json({ error: "Database error while adding expense" });
  }
};

// Delete expense
const deleteExpense = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const expense = await Expense.findOne({ where: { id, user_id: userId } });
    if (!expense) {
      return res.status(404).json({ error: "Expense not found" });
    }

    const { amount, type } = expense;

    await expense.destroy();

    if (type === "expense") {
      await updateTotalExpense(userId, -amount);
    }

    res.json({ message: "Expense deleted" });
  } catch (err) {
    console.error("Error deleting expense:", err);
    res.status(500).json({ error: "Database error while deleting expense" });
  }
};

//  Get report (daily / monthly / yearly)
const { Op, fn, col, literal } = require('sequelize');

const getReport = async (req, res) => {
  try {
    const { period } = req.query;
    const userId = req.user.id;

    let where = { user_id: userId };
    if (period === 'daily') {
      where.created_at = literal('DATE(created_at) = CURDATE()');
    } else if (period === 'monthly') {
      where[Op.and] = [
        literal('MONTH(created_at) = MONTH(CURDATE())'),
        literal('YEAR(created_at) = YEAR(CURDATE())')
      ];
    } else if (period === 'yearly') {
      where = { user_id: userId, [Op.and]: [literal('YEAR(created_at) = YEAR(CURDATE())')] };
    } else {
      return res.status(400).json({ error: "Invalid period" });
    }

    const result = await Expense.findAll({
      attributes: [
        [fn('SUM', literal("CASE WHEN type='income' THEN amount ELSE 0 END")), 'total_income'],
        [fn('SUM', literal("CASE WHEN type='expense' THEN amount ELSE 0 END")), 'total_expense'],
      ],
      where
    });

    const data = result[0]?.dataValues || { total_income: 0, total_expense: 0 };
    const balance = (data.total_income || 0) - (data.total_expense || 0);

    res.json({ ...data, balance });
  } catch (err) {
    console.error("Report query error:", err);
    res.status(500).json({ error: "Failed to generate report" });
  }
};

// helper
async function updateTotalExpense(userId, difference) {
  await Signup.increment('total_expense', { by: difference, where: { id: userId } });
}

module.exports = {
  getExpenses,
  addExpense,
  deleteExpense,
  getReport
};


// const db = require("../config/db");
// //  Get all expenses
// const getExpenses = async (req, res) => {
//   const userId = req.user.id;
//   try {
//     const [rows] = await db.query(
//       "SELECT * FROM expenses WHERE user_id = ? ORDER BY created_at DESC",
//       [userId]
//     );
//     res.json(rows);
//   } catch (err) {
//     console.error("Error fetching expenses:", err);
//     res.status(500).json({ error: "Database error while fetching expenses" });
//   }
// };
// //  Add expense (now includes type)
// const addExpense = async (req, res) => {
//   const { amount, description, category, type, note } = req.body;
//   const userId = req.user.id;
//   if (!amount || !description || !category || !type) {
//     return res.status(400).json({ error: "Amount, description, category and type are required" });
//   }
//   if (isNaN(amount)) {
//     return res.status(400).json({ error: "Amount must be a number" });
//   }
//   if (type !== "income" && type !== "expense") {
//     return res.status(400).json({ error: "Type must be income or expense" });
//   }
//   try {
//     const [result] = await db.query(
//       "INSERT INTO expenses (amount, description, category, type, note, user_id) VALUES (?, ?, ?, ?, ?, ?)",
//       [amount, description, category, type, note || null, userId]
//     );
//   if (type === "expense") {
//       await updateTotalExpense(userId, amount);
//     }
//   res.status(201).json({ message: `${type} added`, expenseId: result.insertId });
//   } catch (err) {
//     console.error("Error adding expense:", err);
//     res.status(500).json({ error: "Database error while adding expense" });
//   }
// };

// // //  Update expense
// // const updateExpense = async (req, res) => {
// //   const { id } = req.params;
// //   const { amount, description, category,type, note } = req.body;
// //   const userId = req.user.id;

// //   if (isNaN(amount)) {
// //     return res.status(400).json({ error: "Amount must be a number" });
// //   }

// //   try {
// //     const [rows] = await db.query(
// //       "SELECT amount FROM expenses WHERE id = ? AND user_id = ?",
// //       [id, userId]
// //     );

// //     if (rows.length === 0) {
// //       return res.status(404).json({ error: "Expense not found" });
// //     }

// //     const oldAmount = rows[0].amount;
// //     const difference = amount - oldAmount;

// //     const [result] = await db.query(
// //       "UPDATE expenses SET amount = ?, description = ?, category = ?,type = ?, note = ? WHERE id = ? AND user_id = ?",
// //       [amount, description, category,type, note || null, id, userId]
// //     );

// //     if (result.affectedRows === 0) {
// //       return res.status(404).json({ error: "Expense not found" });
// //     }
// //     await updateTotalExpense(userId, difference);
// //     res.json({ message: "Expense updated" });
// //   } catch (err) {
// //     console.error("Error updating expense:", err);
// //     res.status(500).json({ error: "Database error while updating expense" });
// //   }
// // };

// // ✅ Delete expense
// const deleteExpense = async (req, res) => {
//   const { id } = req.params;
//   const userId = req.user.id;
//   try {
//     const [rows] = await db.query(
//       "SELECT amount, type FROM expenses WHERE id = ? AND user_id = ?",
//       [id, userId]
//     );
//   if (rows.length === 0) {
//       return res.status(404).json({ error: "Expense not found" });
//     }
//     const { amount, type } = rows[0];
//     const [result] = await db.query(
//       "DELETE FROM expenses WHERE id = ? AND user_id = ?",
//       [id, userId]
//     );
//   if (result.affectedRows === 0) {
//       return res.status(404).json({ error: "Expense not found" });
//     }

//   if (type === "expense") {
//       await updateTotalExpense(userId, -amount);
//     }
//   res.json({ message: "Expense deleted" });
//   } catch (err) {
//     console.error("Error deleting expense:", err);
//     res.status(500).json({ error: "Database error while deleting expense" });
//   }
// };

// // Get report for daily / monthly / yearly
// const getReport = async (req, res) => {
//   try {
//     const { period } = req.query;
//     const userId = req.user.id;
//     let query = "";
//     if (period === "daily") {
//       query = `
//         SELECT 
//           SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS total_income,
//           SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS total_expense
//         FROM expenses
//         WHERE user_id = ? AND DATE(created_at) = CURDATE();
//       `;
//     } else if (period === "monthly") {
//       query = `
//         SELECT 
//           SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS total_income,
//           SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS total_expense
//         FROM expenses
//         WHERE user_id = ? 
//           AND MONTH(created_at) = MONTH(CURDATE())
//           AND YEAR(created_at) = YEAR(CURDATE());
//       `;
//     } else if (period === "yearly") {
//       query = `
//         SELECT 
//           SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS total_income,
//           SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS total_expense
//         FROM expenses
//         WHERE user_id = ? 
//           AND YEAR(created_at) = YEAR(CURDATE());
//       `;
//     } else {
//       return res.status(400).json({ error: "Invalid period" });
//     }
//     const [rows] = await db.query(query, [userId]);
//     const data = rows[0] || { total_income: 0, total_expense: 0 };
//     const balance = (data.total_income || 0) - (data.total_expense || 0);
//     res.json({ ...data, balance });
//   } catch (err) {
//     console.error("Report query error:", err);
//     res.status(500).json({ error: "Failed to generate report" });
//   }
// };
// // helper: update total_expense (only for expense type)
// async function updateTotalExpense(userId, difference) {
//   await db.query(
//     "UPDATE signup SET total_expense = total_expense + ? WHERE id = ?",
//     [difference, userId]
//   );
// }
// module.exports = {
//   getExpenses,
//   addExpense,
//   //updateExpense,
//   deleteExpense,
//   getReport
// };
