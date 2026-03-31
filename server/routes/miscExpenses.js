const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// GET /api/misc-expenses?month=2026-02
router.get('/', auth, async (req, res) => {
  const { month } = req.query;
  if (!month) return res.status(400).json({ message: 'month is required' });
  const result = await pool.query(
    `SELECT * FROM misc_expenses WHERE month = $1 ORDER BY date DESC, created_at DESC`,
    [month]
  );
  res.json(result.rows);
});

// POST /api/misc-expenses
router.post('/', auth, async (req, res) => {
  const { month, description, amount, date } = req.body;
  if (!month || !description || !amount) {
    return res.status(400).json({ message: 'month, description, and amount are required' });
  }
  const result = await pool.query(
    `INSERT INTO misc_expenses (month, description, amount, date)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [month, description, parseFloat(amount), date || new Date().toISOString().split('T')[0]]
  );
  res.status(201).json(result.rows[0]);
});

// DELETE /api/misc-expenses/:id
router.delete('/:id', auth, async (req, res) => {
  await pool.query('DELETE FROM misc_expenses WHERE id = $1', [req.params.id]);
  res.json({ message: 'Expense deleted' });
});

module.exports = router;
