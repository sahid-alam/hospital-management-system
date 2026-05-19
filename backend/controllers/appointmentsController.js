const db = require('../config/db');

// GET /api/appointments/stats
exports.getStats = async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT
        COUNT(*) FILTER (WHERE appt_date = CURRENT_DATE)                    AS today,
        COUNT(*) FILTER (WHERE appt_date = CURRENT_DATE + INTERVAL '1 day') AS tomorrow,
        COUNT(*) FILTER (WHERE status = 'Scheduled')                        AS confirmed,
        COUNT(*) FILTER (WHERE status = 'Cancelled')                        AS cancelled
      FROM appointment
    `);
    res.json(result.rows[0]);
  } catch (err) { next(err); }
};

// GET /api/appointments?date=&doctor_id=&status=
exports.getAll = async (req, res, next) => {
  try {
    const { date, doctor_id, status } = req.query;
    const params = [];
    let query = `
      SELECT a.appt_id, a.appt_date, a.appt_time, a.status, a.notes, a.created_at,
             p.patient_id, p.name AS patient_name, p.phone AS patient_phone,
             d.doctor_id, d.name AS doctor_name, d.speciality
      FROM appointment a
      JOIN patient p ON p.patient_id = a.patient_id
      JOIN doctor  d ON d.doctor_id  = a.doctor_id
      WHERE 1=1
    `;
    if (date)      { params.push(date);      query += ` AND a.appt_date = $${params.length}`; }
    if (doctor_id) { params.push(doctor_id); query += ` AND a.doctor_id = $${params.length}`; }
    if (status)    { params.push(status);    query += ` AND a.status = $${params.length}`; }
    query += ` ORDER BY a.appt_date DESC, a.appt_time`;

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) { next(err); }
};

// GET /api/appointments/today — uses v_doctor_schedule_today view
exports.getToday = async (req, res, next) => {
  try {
    const result = await db.query(`SELECT * FROM v_doctor_schedule_today`);
    res.json(result.rows);
  } catch (err) { next(err); }
};

// POST /api/appointments — book; trigger guards against double-booking
exports.create = async (req, res, next) => {
  try {
    const { patient_id, doctor_id, appt_date, appt_time, notes } = req.body;
    const result = await db.query(
      `INSERT INTO appointment (patient_id, doctor_id, appt_date, appt_time, notes)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [patient_id, doctor_id, appt_date, appt_time, notes || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505')
      return res.status(409).json({ error: 'Doctor already has an appointment at this time.' });
    if (err.code === 'P0001')
      return res.status(409).json({ error: err.message });
    next(err);
  }
};

// PATCH /api/appointments/:id — update status / notes
exports.updateStatus = async (req, res, next) => {
  try {
    const { status, notes } = req.body;
    const result = await db.query(
      `UPDATE appointment
       SET status = COALESCE($1, status),
           notes  = COALESCE($2, notes)
       WHERE appt_id = $3 RETURNING *`,
      [status || null, notes || null, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Appointment not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
};

// DELETE /api/appointments/:id — soft-cancel
exports.cancel = async (req, res, next) => {
  try {
    const result = await db.query(
      `UPDATE appointment SET status='Cancelled' WHERE appt_id=$1 RETURNING appt_id`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Appointment not found' });
    res.json({ message: 'Appointment cancelled' });
  } catch (err) { next(err); }
};
