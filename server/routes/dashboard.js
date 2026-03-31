const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// GET /api/dashboard/summary?month=2026-02
router.get('/summary', auth, async (req, res) => {
  const { month } = req.query;
  if (!month) return res.status(400).json({ message: 'month is required' });

  // Billing period: 16th of the given month to 15th of the next month
  const [year, mon] = month.split('-');
  const y = parseInt(year), m = parseInt(mon);
  const startDate = `${year}-${mon.padStart(2,'0')}-16`;
  const nextMonth = new Date(y, m, 1); // 1st of next calendar month
  const nextY = nextMonth.getFullYear();
  const nextM = String(nextMonth.getMonth() + 1).padStart(2, '0');
  const endDate = `${nextY}-${nextM}-15`;

  // Total client revenue for month
  const revenueResult = await pool.query(
    `SELECT COALESCE(SUM(amount_charged), 0) AS total_revenue
     FROM projects WHERE date BETWEEN $1 AND $2`,
    [startDate, endDate]
  );

  // Total client costs for month
  const costResult = await pool.query(
    `SELECT COALESCE(SUM(cost_incurred), 0) AS total_client_costs
     FROM projects WHERE date BETWEEN $1 AND $2`,
    [startDate, endDate]
  );

  // Total salaries for month (all active employees)
  const salaryResult = await pool.query(
    `SELECT COALESCE(SUM(e.monthly_salary), 0) AS total_salary
     FROM employees e WHERE e.is_active = TRUE`
  );

  // Total bonuses for month
  const bonusResult = await pool.query(
    `SELECT COALESCE(SUM(amount), 0) AS total_bonus
     FROM employee_bonuses WHERE date BETWEEN $1 AND $2`,
    [startDate, endDate]
  );

  // Misc expenses for month
  const miscResult = await pool.query(
    `SELECT COALESCE(SUM(amount), 0) AS total_misc
     FROM misc_expenses WHERE month = $1`,
    [month]
  );

  // Salary advances for month
  const advanceResult = await pool.query(
    `SELECT COALESCE(SUM(amount), 0) AS total_advance
     FROM salary_advances WHERE month = $1`,
    [month]
  );

  const totalRevenue = parseFloat(revenueResult.rows[0].total_revenue);
  const totalClientCosts = parseFloat(costResult.rows[0].total_client_costs);
  const totalSalary = parseFloat(salaryResult.rows[0].total_salary);
  const totalBonus = parseFloat(bonusResult.rows[0].total_bonus);
  const totalMisc = parseFloat(miscResult.rows[0].total_misc);
  const totalAdvance = parseFloat(advanceResult.rows[0].total_advance);
  const totalExpenses = totalClientCosts + totalSalary + totalBonus + totalMisc;

  res.json({
    total_revenue: totalRevenue,
    total_expenses: totalExpenses,
    total_client_costs: totalClientCosts,
    total_salary: totalSalary + totalBonus,
    total_advance: totalAdvance,
    total_misc: totalMisc,
  });
});

// GET /api/dashboard/clients?month=2026-02
router.get('/clients', auth, async (req, res) => {
  const { month } = req.query;
  if (!month) return res.status(400).json({ message: 'month is required' });

  // Billing period: 16th of the given month to 15th of the next month
  const [year, mon] = month.split('-');
  const y = parseInt(year), m = parseInt(mon);
  const startDate = `${year}-${mon.padStart(2,'0')}-16`;
  const nextMonth = new Date(y, m, 1);
  const nextY = nextMonth.getFullYear();
  const nextM = String(nextMonth.getMonth() + 1).padStart(2, '0');
  const endDate = `${nextY}-${nextM}-15`;

  const result = await pool.query(
    `SELECT c.id, c.name,
       COALESCE(SUM(p.amount_charged), 0) AS charged,
       COALESCE(SUM(p.cost_incurred), 0) AS spent
     FROM clients c
     LEFT JOIN projects p ON p.client_id = c.id AND p.date BETWEEN $1 AND $2
     WHERE c.is_active = TRUE
     GROUP BY c.id, c.name
     ORDER BY charged DESC`,
    [startDate, endDate]
  );

  res.json(result.rows);
});

// GET /api/dashboard/categories?month=2026-02
router.get('/categories', auth, async (req, res) => {
  const { month } = req.query;
  if (!month) return res.status(400).json({ message: 'month is required' });

  // Billing period: 16th of the given month to 15th of the next month
  const [year, mon] = month.split('-');
  const y = parseInt(year), m = parseInt(mon);
  const startDate = `${year}-${mon.padStart(2,'0')}-16`;
  const nextMonth = new Date(y, m, 1);
  const nextY = nextMonth.getFullYear();
  const nextM = String(nextMonth.getMonth() + 1).padStart(2, '0');
  const endDate = `${nextY}-${nextM}-15`;

  const result = await pool.query(
    `SELECT category,
       COALESCE(SUM(amount_charged), 0) AS revenue,
       COALESCE(SUM(cost_incurred), 0) AS cost,
       COALESCE(SUM(amount_charged) - SUM(cost_incurred), 0) AS profit,
       COUNT(*) AS project_count
     FROM projects
     WHERE date BETWEEN $1 AND $2
     GROUP BY category
     ORDER BY revenue DESC`,
    [startDate, endDate]
  );

  res.json(result.rows);
});

module.exports = router;
