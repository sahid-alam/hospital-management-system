const db = require('../config/db');

// GET /api/wards — occupancy summary via view
exports.getAll = async (req, res, next) => {
  try {
    const result = await db.query(`SELECT * FROM v_ward_occupancy`);
    res.json(result.rows);
  } catch (err) { next(err); }
};

// GET /api/wards/admissions — currently active admissions via view
exports.getActiveAdmissions = async (req, res, next) => {
  try {
    const result = await db.query(`SELECT * FROM v_active_admissions ORDER BY days_admitted DESC`);
    res.json(result.rows);
  } catch (err) { next(err); }
};

// POST /api/wards/admit — trigger auto-decrements available_beds
exports.admit = async (req, res, next) => {
  try {
    const { patient_id, ward_id, attending_doctor, admit_date } = req.body;
    const result = await db.query(
      `INSERT INTO admission (patient_id, ward_id, attending_doctor, admit_date)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [patient_id, ward_id, attending_doctor || null, admit_date || new Date()]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === 'P0001')
      return res.status(400).json({ error: err.message });
    next(err);
  }
};

// PATCH /api/wards/discharge/:id — trigger auto-increments beds; generates discharge bill
exports.discharge = async (req, res, next) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    const { discharge_date } = req.body;
    const admission = await client.query(
      `UPDATE admission SET discharge_date=$1
       WHERE admission_id=$2 AND discharge_date IS NULL RETURNING *`,
      [discharge_date || new Date(), req.params.id]
    );
    if (!admission.rows.length)
      return res.status(404).json({ error: 'Active admission not found' });

    // Auto-generate ward bill using stored function
    const bill = await client.query(
      `SELECT generate_discharge_bill($1) AS bill_id`,
      [req.params.id]
    );

    await client.query('COMMIT');
    res.json({ admission: admission.rows[0], bill_id: bill.rows[0].bill_id });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};
