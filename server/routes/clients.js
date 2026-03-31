const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// GET /api/clients?month=2026-02
router.get('/', auth, async (req, res) => {
  const { month } = req.query;

  if (month) {
    // Billing period: 16th of the given month to 15th of the next month
    const [year, mon] = month.split('-');
    const y = parseInt(year), m = parseInt(mon);
    const startDate = `${year}-${mon.padStart(2,'0')}-16`;
    const nextMonth = new Date(y, m, 1);
    const nextY = nextMonth.getFullYear();
    const nextM = String(nextMonth.getMonth() + 1).padStart(2, '0');
    const endDate = `${nextY}-${nextM}-15`;

    const result = await pool.query(
      `SELECT c.id, c.name, c.contact_person, c.email, c.phone,
         COALESCE(SUM(p.amount_charged), 0) AS total_charged,
         COALESCE(SUM(p.cost_incurred), 0) AS total_spent
       FROM clients c
       LEFT JOIN projects p ON p.client_id = c.id AND p.date BETWEEN $1 AND $2
       WHERE c.is_active = TRUE
       GROUP BY c.id, c.name, c.contact_person, c.email, c.phone
       ORDER BY c.name`,
      [startDate, endDate]
    );
    return res.json(result.rows);
  }

  // No month filter — return all clients (for Settings)
  const result = await pool.query(
    `SELECT * FROM clients WHERE is_active = TRUE ORDER BY name`
  );
  res.json(result.rows);
});

// GET /api/clients/:id
router.get('/:id', auth, async (req, res) => {
  const { id } = req.params;
  const result = await pool.query('SELECT * FROM clients WHERE id = $1', [id]);
  if (result.rows.length === 0) return res.status(404).json({ message: 'Client not found' });
  res.json(result.rows[0]);
});

// POST /api/clients
router.post('/', auth, async (req, res) => {
  const { name, contact_person, email, phone } = req.body;
  if (!name) return res.status(400).json({ message: 'Client name is required' });
  const result = await pool.query(
    `INSERT INTO clients (name, contact_person, email, phone) VALUES ($1,$2,$3,$4) RETURNING *`,
    [name, contact_person || null, email || null, phone || null]
  );
  res.status(201).json(result.rows[0]);
});

// PUT /api/clients/:id
router.put('/:id', auth, async (req, res) => {
  const { id } = req.params;
  const { name, contact_person, email, phone } = req.body;
  const result = await pool.query(
    `UPDATE clients SET name=$1, contact_person=$2, email=$3, phone=$4
     WHERE id=$5 RETURNING *`,
    [name, contact_person || null, email || null, phone || null, id]
  );
  if (result.rows.length === 0) return res.status(404).json({ message: 'Client not found' });
  res.json(result.rows[0]);
});

// DELETE /api/clients/:id
router.delete('/:id', auth, async (req, res) => {
  const { id } = req.params;
  await pool.query(`UPDATE clients SET is_active = FALSE WHERE id = $1`, [id]);
  res.json({ message: 'Client removed' });
});

// GET /api/clients/:id/projects?month=2026-02
router.get('/:id/projects', auth, async (req, res) => {
  const { id } = req.params;
  const { month } = req.query;

  let query = `SELECT * FROM projects WHERE client_id = $1`;
  const params = [id];

  if (month) {
    // Billing period: 16th of the given month to 15th of the next month
    const [year, mon] = month.split('-');
    const y = parseInt(year), m = parseInt(mon);
    const startDate = `${year}-${mon.padStart(2,'0')}-16`;
    const nextMonth = new Date(y, m, 1);
    const nextY = nextMonth.getFullYear();
    const nextM = String(nextMonth.getMonth() + 1).padStart(2, '0');
    const endDate = `${nextY}-${nextM}-15`;
    query += ` AND date BETWEEN $2 AND $3`;
    params.push(startDate, endDate);
  }

  query += ` ORDER BY date DESC, created_at DESC`;
  const result = await pool.query(query, params);
  res.json(result.rows);
});

// POST /api/clients/:id/projects
router.post('/:id/projects', auth, async (req, res) => {
  const { id } = req.params;
  const { project_name, category, amount_charged, cost_incurred, date, notes } = req.body;
  if (!project_name || !date) return res.status(400).json({ message: 'Project name and date are required' });

  const result = await pool.query(
    `INSERT INTO projects (client_id, project_name, category, amount_charged, cost_incurred, date, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [id, project_name, category || 'Other', parseFloat(amount_charged) || 0, parseFloat(cost_incurred) || 0, date, notes || null]
  );
  res.status(201).json(result.rows[0]);
});

module.exports = router;
