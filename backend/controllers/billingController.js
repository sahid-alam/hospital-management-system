const db = require('../config/db');

// GET /api/billing?status=&patient_id=
exports.getAll = async (req, res, next) => {
  try {
    const { status, patient_id } = req.query;
    const params = [];
    let query = `
      SELECT b.bill_id, b.patient_id, b.admission_id,
             b.total_amount, b.paid_amount, b.bill_date,
             b.payment_status, b.payment_mode, b.notes,
             p.name AS patient_name
      FROM billing b
      JOIN patient p ON p.patient_id = b.patient_id
      WHERE 1=1
    `;
    if (status)     { params.push(status);     query += ` AND b.payment_status = $${params.length}`; }
    if (patient_id) { params.push(patient_id); query += ` AND b.patient_id = $${params.length}`; }
    query += ` ORDER BY b.bill_date DESC`;

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) { next(err); }
};

// GET /api/billing/revenue — monthly revenue via view
exports.getRevenue = async (req, res, next) => {
  try {
    const result = await db.query(`SELECT * FROM v_monthly_revenue LIMIT 12`);
    res.json(result.rows);
  } catch (err) { next(err); }
};

// POST /api/billing — create bill manually
exports.create = async (req, res, next) => {
  try {
    const { patient_id, admission_id, total_amount, paid_amount, payment_mode, notes } = req.body;
    const result = await db.query(
      `INSERT INTO billing (patient_id, admission_id, total_amount, paid_amount, payment_mode, notes)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [patient_id, admission_id || null, total_amount, paid_amount || 0, payment_mode || null, notes || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
};

// PATCH /api/billing/:id/pay — record payment; trigger auto-updates payment_status
exports.recordPayment = async (req, res, next) => {
  try {
    const { paid_amount, payment_mode } = req.body;
    const result = await db.query(
      `UPDATE billing
       SET paid_amount  = paid_amount + $1,
           payment_mode = $2
       WHERE bill_id = $3 RETURNING *`,
      [paid_amount, payment_mode, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Bill not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
};
