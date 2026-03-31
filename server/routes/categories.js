const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// GET /api/categories?month=2026-02
router.get('/', auth, async (req, res) => {
  const { month } = req.query;

  // Build date range
  let dateFilter = '';
  const params = [];

  if (month) {
    const [year, mon] = month.split('-');
    const startDate = `${year}-${mon}-01`;
    const endDate = new Date(parseInt(year), parseInt(mon), 0).toISOString().split('T')[0];
    dateFilter = `WHERE p.date BETWEEN $1 AND $2`;
    params.push(startDate, endDate);
  }

  // Get all 4 categories; LEFT JOIN so empty ones still show
  const result = await pool.query(
    `SELECT
       wc.name AS category,
       COALESCE(SUM(p.amount_charged), 0) AS revenue,
       COALESCE(SUM(p.cost_incurred), 0) AS cost,
       COALESCE(SUM(p.amount_charged) - SUM(p.cost_incurred), 0) AS profit,
       COUNT(p.id) AS project_count
     FROM work_categories wc
     LEFT JOIN projects p ON p.category = wc.name ${params.length ? 'AND p.date BETWEEN $1 AND $2' : ''}
     GROUP BY wc.name
     ORDER BY revenue DESC`,
    params
  );

  res.json(result.rows);
});

module.exports = router;
