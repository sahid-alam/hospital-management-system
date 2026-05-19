const express = require('express');
const router  = express.Router();
const db      = require('../config/db');

// GET /api/dashboard — all stat cards + chart data + enrichments in one call
router.get('/', async (req, res, next) => {
  try {
    const [patients, admissions, todayAppts, pendingBills, occupancy, revenue,
           critical, deptLoad, activityRows] =
      await Promise.all([
        db.query(`SELECT COUNT(*) AS total FROM patient`),
        db.query(`SELECT COUNT(*) AS total FROM admission WHERE discharge_date IS NULL`),
        db.query(
          `SELECT COUNT(*) AS total FROM appointment
           WHERE appt_date = CURRENT_DATE AND status = 'Scheduled'`
        ),
        db.query(`SELECT COUNT(*) AS total FROM billing WHERE payment_status != 'Paid'`),
        db.query(`SELECT * FROM v_ward_occupancy`),
        db.query(`SELECT * FROM v_monthly_revenue LIMIT 6`),

        // Critical: patients currently in ICU wards (no discharge)
        db.query(`
          SELECT p.patient_id, p.name,
                 w.ward_name,
                 w.ward_type,
                 COALESCE(d.name, 'Unassigned') AS attending_doctor,
                 a.admit_date,
                 (CURRENT_DATE - a.admit_date) AS days_admitted
          FROM admission a
          JOIN patient p ON p.patient_id = a.patient_id
          JOIN ward w    ON w.ward_id    = a.ward_id
          LEFT JOIN doctor d ON d.doctor_id = a.attending_doctor
          WHERE a.discharge_date IS NULL
            AND w.ward_type = 'ICU'
          ORDER BY a.admit_date
          LIMIT 5
        `),

        // Department load: appointment count per department today vs total doctors
        db.query(`
          SELECT dep.dept_name,
                 COUNT(DISTINCT a.appt_id)  AS appts_today,
                 COUNT(DISTINCT d.doctor_id) AS total_doctors,
                 ROUND(
                   COUNT(DISTINCT a.appt_id)::NUMERIC /
                   NULLIF(COUNT(DISTINCT d.doctor_id), 0) * 100
                 , 0) AS load_pct
          FROM department dep
          LEFT JOIN doctor d ON d.dept_id = dep.dept_id
          LEFT JOIN appointment a
            ON a.doctor_id = d.doctor_id AND a.appt_date = CURRENT_DATE
          GROUP BY dep.dept_id, dep.dept_name
          ORDER BY load_pct DESC NULLS LAST
          LIMIT 6
        `),

        // Activity log: last 20 events across admissions, discharges, appointments
        db.query(`
          (
            SELECT 'Admitted' AS action,
                   p.name AS subject,
                   w.ward_name AS context,
                   a.admit_date::text AS ts
            FROM admission a
            JOIN patient p ON p.patient_id = a.patient_id
            JOIN ward    w ON w.ward_id    = a.ward_id
            WHERE a.admit_date >= CURRENT_DATE - INTERVAL '7 days'
          )
          UNION ALL
          (
            SELECT 'Discharged' AS action,
                   p.name AS subject,
                   w.ward_name AS context,
                   a.discharge_date::text AS ts
            FROM admission a
            JOIN patient p ON p.patient_id = a.patient_id
            JOIN ward    w ON w.ward_id    = a.ward_id
            WHERE a.discharge_date >= CURRENT_DATE - INTERVAL '7 days'
          )
          UNION ALL
          (
            SELECT CONCAT('Appointment — ', ap.status) AS action,
                   p.name AS subject,
                   d.name AS context,
                   ap.appt_date::text AS ts
            FROM appointment ap
            JOIN patient p ON p.patient_id = ap.patient_id
            JOIN doctor  d ON d.doctor_id  = ap.doctor_id
            WHERE ap.appt_date >= CURRENT_DATE - INTERVAL '3 days'
          )
          ORDER BY ts DESC
          LIMIT 16
        `),
      ]);

    // Build hourly admission buckets for today (0–23)
    const hourlyRes = await db.query(`
      SELECT EXTRACT(HOUR FROM admit_date::timestamp) AS hr,
             COUNT(*) AS cnt
      FROM admission
      WHERE admit_date = CURRENT_DATE
      GROUP BY hr
    `);
    const hourly = Array.from({ length: 24 }, (_, i) => {
      const row = hourlyRes.rows.find(r => parseInt(r.hr) === i);
      return row ? parseInt(row.cnt) : 0;
    });

    res.json({
      stats: {
        totalPatients:     parseInt(patients.rows[0].total),
        activeAdmissions:  parseInt(admissions.rows[0].total),
        todayAppointments: parseInt(todayAppts.rows[0].total),
        pendingBills:      parseInt(pendingBills.rows[0].total),
      },
      wardOccupancy:  occupancy.rows,
      revenueByMonth: revenue.rows,
      criticalPatients: critical.rows,
      deptLoad: deptLoad.rows,
      activity: activityRows.rows,
      admissionsByHour: hourly,
    });
  } catch (err) { next(err); }
});

module.exports = router;
