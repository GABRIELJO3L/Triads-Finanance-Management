const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// GET /api/employees?month=2026-02  — with salary status for the month
router.get('/', auth, async (req, res) => {
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
    `SELECT e.*,
       COALESCE(sp.is_paid, FALSE) AS salary_paid,
       COALESCE(
         (SELECT SUM(eb.amount) FROM employee_bonuses eb
          WHERE eb.employee_id = e.id AND eb.date BETWEEN $2 AND $3),
         0
       ) AS bonus_total,
       COALESCE(
         (SELECT SUM(sa.amount) FROM salary_advances sa
          WHERE sa.employee_id = e.id AND sa.month = $1),
         0
       ) AS advance_total
     FROM employees e
     LEFT JOIN salary_payments sp ON sp.employee_id = e.id AND sp.month = $1
     WHERE e.is_active = TRUE
     ORDER BY e.name`,
    [month, startDate, endDate]
  );

  res.json(result.rows);
});

// GET /api/employees/all — for Settings (no month filter)
router.get('/all', auth, async (req, res) => {
  const result = await pool.query(
    `SELECT * FROM employees WHERE is_active = TRUE ORDER BY name`
  );
  res.json(result.rows);
});

// POST /api/employees
router.post('/', auth, async (req, res) => {
  const { name, role, monthly_salary, joining_date } = req.body;
  if (!name) return res.status(400).json({ message: 'Employee name is required' });
  const result = await pool.query(
    `INSERT INTO employees (name, role, monthly_salary, joining_date)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [name, role || null, parseFloat(monthly_salary) || 0, joining_date || null]
  );
  res.status(201).json(result.rows[0]);
});

// PUT /api/employees/:id
router.put('/:id', auth, async (req, res) => {
  const { id } = req.params;
  const { name, role, monthly_salary, joining_date } = req.body;
  const result = await pool.query(
    `UPDATE employees SET name=$1, role=$2, monthly_salary=$3, joining_date=$4
     WHERE id=$5 RETURNING *`,
    [name, role || null, parseFloat(monthly_salary) || 0, joining_date || null, id]
  );
  if (result.rows.length === 0) return res.status(404).json({ message: 'Employee not found' });
  res.json(result.rows[0]);
});

// DELETE /api/employees/:id  (soft delete)
router.delete('/:id', auth, async (req, res) => {
  await pool.query(`UPDATE employees SET is_active = FALSE WHERE id = $1`, [req.params.id]);
  res.json({ message: 'Employee removed' });
});

// PUT /api/employees/:id/salary-status
router.put('/:id/salary-status', auth, async (req, res) => {
  const { id } = req.params;
  const { month, is_paid } = req.body;
  if (!month) return res.status(400).json({ message: 'month is required' });

  await pool.query(
    `INSERT INTO salary_payments (employee_id, month, is_paid, paid_at)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (employee_id, month)
     DO UPDATE SET is_paid = $3, paid_at = $4`,
    [id, month, is_paid, is_paid ? new Date() : null]
  );
  res.json({ message: 'Salary status updated' });
});

// POST /api/employees/:id/bonus
router.post('/:id/bonus', auth, async (req, res) => {
  const { id } = req.params;
  const { amount, description, date } = req.body;
  if (!amount || !date) return res.status(400).json({ message: 'Amount and date required' });
  const result = await pool.query(
    `INSERT INTO employee_bonuses (employee_id, amount, description, date)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [id, parseFloat(amount), description || null, date]
  );
  res.status(201).json(result.rows[0]);
});

// POST /api/employees/:id/advance
router.post('/:id/advance', auth, async (req, res) => {
  const { id } = req.params;
  const { amount, description, date, month } = req.body;
  if (!amount || !date || !month) return res.status(400).json({ message: 'Amount, date, and month are required' });
  const result = await pool.query(
    `INSERT INTO salary_advances (employee_id, amount, description, date, month)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [id, parseFloat(amount), description || null, date, month]
  );
  res.status(201).json(result.rows[0]);
});

// GET /api/employees/:id/advances?month=2026-02
router.get('/:id/advances', auth, async (req, res) => {
  const { id } = req.params;
  const { month } = req.query;
  if (!month) return res.status(400).json({ message: 'month is required' });
  const result = await pool.query(
    `SELECT * FROM salary_advances WHERE employee_id = $1 AND month = $2 ORDER BY date DESC`,
    [id, month]
  );
  res.json(result.rows);
});

// DELETE /api/employees/advance/:id
router.delete('/advance/:advanceId', auth, async (req, res) => {
  const { advanceId } = req.params;
  await pool.query('DELETE FROM salary_advances WHERE id = $1', [advanceId]);
  res.json({ message: 'Advance deleted' });
});

module.exports = router;
