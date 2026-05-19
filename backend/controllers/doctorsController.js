const db = require('../config/db');

// GET /api/doctors?dept_id=
exports.getAll = async (req, res, next) => {
  try {
    const { dept_id } = req.query;
    const params = [];
    let query = `
      SELECT d.doctor_id, d.name, d.speciality, d.phone, d.email,
             d.dept_id, d.salary, d.join_date,
             dep.dept_name,
             COUNT(a.appt_id) FILTER (WHERE a.appt_date = CURRENT_DATE) AS todays_appointments
      FROM doctor d
      LEFT JOIN department dep ON dep.dept_id = d.dept_id
      LEFT JOIN appointment a  ON a.doctor_id  = d.doctor_id
      WHERE 1=1
    `;
    if (dept_id) { params.push(dept_id); query += ` AND d.dept_id = $${params.length}`; }
    query += ` GROUP BY d.doctor_id, dep.dept_name ORDER BY d.name`;

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) { next(err); }
};

// GET /api/doctors/departments
exports.getDepartments = async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT dep.dept_id, dep.dept_name, dep.location,
             COUNT(DISTINCT d.doctor_id)::INT AS doctor_count,
             COUNT(DISTINCT a.appt_id) FILTER (
               WHERE DATE_TRUNC('month', a.appt_date) = DATE_TRUNC('month', CURRENT_DATE)
             )::INT AS appointments_this_month
      FROM department dep
      LEFT JOIN doctor      d ON d.dept_id   = dep.dept_id
      LEFT JOIN appointment a ON a.doctor_id = d.doctor_id
      GROUP BY dep.dept_id, dep.dept_name, dep.location
      ORDER BY dep.dept_name
    `);
    res.json(result.rows);
  } catch (err) { next(err); }
};

// GET /api/doctors/:id/schedule — today's schedule
exports.getSchedule = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT * FROM v_doctor_schedule_today WHERE doctor_id = $1`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
};

// POST /api/doctors
exports.create = async (req, res, next) => {
  try {
    const { name, speciality, phone, email, dept_id, salary } = req.body;
    const result = await db.query(
      `INSERT INTO doctor (name, speciality, phone, email, dept_id, salary)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [name, speciality, phone || null, email || null, dept_id || null, salary]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
};

// PUT /api/doctors/:id
exports.update = async (req, res, next) => {
  try {
    const { name, speciality, phone, email, dept_id, salary } = req.body;
    const result = await db.query(
      `UPDATE doctor
       SET name=$1, speciality=$2, phone=$3, email=$4, dept_id=$5, salary=$6
       WHERE doctor_id=$7 RETURNING *`,
      [name, speciality, phone || null, email || null, dept_id || null, salary, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Doctor not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
};
