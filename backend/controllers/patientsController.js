const db = require('../config/db');

// GET /api/patients/stats — aggregate counts for PageHero meta row
exports.getStats = async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT
        COUNT(DISTINCT p.patient_id)                                        AS total,
        COUNT(DISTINCT a.patient_id) FILTER (WHERE a.discharge_date IS NULL) AS admitted,
        COUNT(DISTINCT a.patient_id) FILTER (
          WHERE a.discharge_date IS NULL AND w.ward_type = 'ICU'
        )                                                                    AS critical,
        (
          SELECT COUNT(*) FROM patient p2
          WHERE NOT EXISTS (
            SELECT 1 FROM admission a2
            WHERE a2.patient_id = p2.patient_id AND a2.discharge_date IS NULL
          )
        )                                                                    AS outpatient
      FROM patient p
      LEFT JOIN admission a ON a.patient_id = p.patient_id
      LEFT JOIN ward      w ON w.ward_id    = a.ward_id
    `);
    res.json(result.rows[0]);
  } catch (err) { next(err); }
};

// GET /api/patients?search=&page=1&limit=100
exports.getAll = async (req, res, next) => {
  try {
    const { search = '', page = 1, limit = 100 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const [rows, count] = await Promise.all([
      db.query(
        `SELECT p.patient_id, p.name, p.dob,
                DATE_PART('year', AGE(p.dob))::INT AS age,
                p.gender, p.phone, p.blood_group, p.registered_on, p.address,
                CASE
                  WHEN EXISTS (
                    SELECT 1 FROM admission a
                    WHERE a.patient_id = p.patient_id AND a.discharge_date IS NULL
                  ) THEN 'Active'
                  WHEN EXISTS (
                    SELECT 1 FROM admission a WHERE a.patient_id = p.patient_id
                  ) THEN 'Discharged'
                  ELSE NULL
                END AS admission_status
         FROM patient p
         WHERE p.name ILIKE $1 OR p.phone ILIKE $1
         ORDER BY p.registered_on DESC
         LIMIT $2 OFFSET $3`,
        [`%${search}%`, limit, offset]
      ),
      db.query(
        `SELECT COUNT(*) FROM patient WHERE name ILIKE $1 OR phone ILIKE $1`,
        [`%${search}%`]
      ),
    ]);

    res.json({ data: rows.rows, total: parseInt(count.rows[0].count), page: +page });
  } catch (err) { next(err); }
};

// GET /api/patients/:id — patient + admissions + bills
exports.getById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const patient = await db.query(
      `SELECT *, DATE_PART('year', AGE(dob))::INT AS age FROM patient WHERE patient_id = $1`,
      [id]
    );
    if (!patient.rows.length) return res.status(404).json({ error: 'Patient not found' });

    const [admissions, bills] = await Promise.all([
      db.query(
        `SELECT a.*, w.ward_name, d.name AS doctor_name
         FROM admission a
         JOIN ward w ON w.ward_id = a.ward_id
         LEFT JOIN doctor d ON d.doctor_id = a.attending_doctor
         WHERE a.patient_id = $1 ORDER BY a.admit_date DESC`,
        [id]
      ),
      db.query(
        `SELECT * FROM billing WHERE patient_id = $1 ORDER BY bill_date DESC`,
        [id]
      ),
    ]);

    res.json({ patient: patient.rows[0], admissions: admissions.rows, bills: bills.rows });
  } catch (err) { next(err); }
};

// GET /api/patients/:id/history — uses stored function
exports.getHistory = async (req, res, next) => {
  try {
    const result = await db.query(`SELECT * FROM get_patient_history($1)`, [req.params.id]);
    res.json(result.rows);
  } catch (err) { next(err); }
};

// POST /api/patients
exports.create = async (req, res, next) => {
  try {
    const { name, dob, gender, phone, address, blood_group } = req.body;
    const result = await db.query(
      `INSERT INTO patient (name, dob, gender, phone, address, blood_group)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [name, dob, gender, phone || null, address || null, blood_group || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
};

// PUT /api/patients/:id
exports.update = async (req, res, next) => {
  try {
    const { name, dob, gender, phone, address, blood_group } = req.body;
    const result = await db.query(
      `UPDATE patient
       SET name=$1, dob=$2, gender=$3, phone=$4, address=$5, blood_group=$6
       WHERE patient_id=$7 RETURNING *`,
      [name, dob, gender, phone || null, address || null, blood_group || null, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Patient not found' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
};

// DELETE /api/patients/:id
exports.remove = async (req, res, next) => {
  try {
    const result = await db.query(
      `DELETE FROM patient WHERE patient_id = $1 RETURNING patient_id`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Patient not found' });
    res.json({ message: 'Patient removed' });
  } catch (err) { next(err); }
};
