const express = require('express');
const router = express.Router();
const { getExpenses, addExpense, updateExpense, deleteExpense,getReport } = require('../controllers/expenseController');
const auth = require('../middleware/auth'); 

router.get('/', auth, getExpenses);
router.post('/', auth, addExpense);
//router.put('/:id', auth, updateExpense);
router.delete('/:id', auth, deleteExpense);
router.get("/report", auth, getReport);


module.exports = router;
