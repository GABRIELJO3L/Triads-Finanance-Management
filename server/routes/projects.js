const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// DELETE /api/projects/:id
router.delete('/:id', auth, async (req, res) => {
  const { id } = req.params;
  await pool.query('DELETE FROM projects WHERE id = $1', [id]);
  res.json({ message: 'Project deleted' });
});

// PUT /api/projects/:id
router.put('/:id', auth, async (req, res) => {
  const { id } = req.params;
  const { project_name, category, amount_charged, cost_incurred, date, notes } = req.body;
  const result = await pool.query(
    `UPDATE projects SET project_name=$1, category=$2, amount_charged=$3,
     cost_incurred=$4, date=$5, notes=$6 WHERE id=$7 RETURNING *`,
    [project_name, category, parseFloat(amount_charged) || 0, parseFloat(cost_incurred) || 0, date, notes || null, id]
  );
  if (result.rows.length === 0) return res.status(404).json({ message: 'Project not found' });
  res.json(result.rows[0]);
});

module.exports = router;
