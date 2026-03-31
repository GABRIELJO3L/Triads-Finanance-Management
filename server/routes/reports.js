const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// GET /api/reports/summary?month=2026-02
router.get('/summary', auth, async (req, res) => {
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

  // Total client revenue
  const revenueRes = await pool.query(
    `SELECT COALESCE(SUM(amount_charged), 0) AS total_revenue,
            COALESCE(SUM(cost_incurred), 0) AS total_client_costs,
            COUNT(DISTINCT client_id) AS client_count
     FROM projects WHERE date BETWEEN $1 AND $2`,
    [startDate, endDate]
  );

  // Salary paid this month (sum of salaries of employees with is_paid = TRUE)
  const salaryRes = await pool.query(
    `SELECT COALESCE(SUM(e.monthly_salary), 0) AS total_salary,
            COUNT(*) AS employees_paid
     FROM employees e
     JOIN salary_payments sp ON sp.employee_id = e.id
     WHERE sp.month = $1 AND sp.is_paid = TRUE AND e.is_active = TRUE`,
    [month]
  );

  // Bonuses paid this month
  const bonusRes = await pool.query(
    `SELECT COALESCE(SUM(amount), 0) AS total_bonus
     FROM employee_bonuses WHERE date BETWEEN $1 AND $2`,
    [startDate, endDate]
  );

  // Misc expenses
  const miscRes = await pool.query(
    `SELECT COALESCE(SUM(amount), 0) AS total_misc
     FROM misc_expenses WHERE month = $1`,
    [month]
  );

  // Salary advances
  const advanceRes = await pool.query(
    `SELECT COALESCE(SUM(amount), 0) AS total_advance
     FROM salary_advances WHERE month = $1`,
    [month]
  );

  // Per-client breakdown for the month
  const clientsRes = await pool.query(
    `SELECT c.id, c.name,
       COALESCE(SUM(p.amount_charged), 0) AS charged,
       COALESCE(SUM(p.cost_incurred), 0) AS spent
     FROM clients c
     JOIN projects p ON p.client_id = c.id
     WHERE p.date BETWEEN $1 AND $2 AND c.is_active = TRUE
     GROUP BY c.id, c.name
     ORDER BY charged DESC`,
    [startDate, endDate]
  );

  res.json({
    total_revenue: parseFloat(revenueRes.rows[0].total_revenue),
    total_client_costs: parseFloat(revenueRes.rows[0].total_client_costs),
    client_count: parseInt(revenueRes.rows[0].client_count),
    total_salary: parseFloat(salaryRes.rows[0].total_salary) + parseFloat(bonusRes.rows[0].total_bonus),
    employees_paid: parseInt(salaryRes.rows[0].employees_paid),
    total_advance: parseFloat(advanceRes.rows[0].total_advance),
    total_misc: parseFloat(miscRes.rows[0].total_misc),
    clients: clientsRes.rows,
  });
});

module.exports = router;
