-- ============================================================
-- Hospital Management System — Views & Stored Procedures
-- ============================================================

-- ============================================================
-- VIEWS
-- ============================================================

-- View 1: Active admissions with full info
CREATE OR REPLACE VIEW v_active_admissions AS
SELECT
  a.admission_id,
  p.patient_id,
  p.name                                         AS patient_name,
  p.blood_group,
  w.ward_name,
  w.ward_type,
  w.charge_per_day,
  d.name                                         AS attending_doctor,
  d.speciality,
  a.admit_date,
  (CURRENT_DATE - a.admit_date)                  AS days_admitted,
  ((CURRENT_DATE - a.admit_date) * w.charge_per_day) AS estimated_ward_cost
FROM admission a
JOIN patient p ON p.patient_id = a.patient_id
JOIN ward    w ON w.ward_id    = a.ward_id
LEFT JOIN doctor d ON d.doctor_id = a.attending_doctor
WHERE a.discharge_date IS NULL;

-- View 2: Today's doctor schedule
CREATE OR REPLACE VIEW v_doctor_schedule_today AS
SELECT
  d.doctor_id,
  d.name          AS doctor_name,
  d.speciality,
  dep.dept_name,
  p.name          AS patient_name,
  a.appt_time,
  a.status,
  a.notes
FROM appointment a
JOIN doctor     d   ON d.doctor_id   = a.doctor_id
JOIN patient    p   ON p.patient_id  = a.patient_id
LEFT JOIN department dep ON dep.dept_id = d.dept_id
WHERE a.appt_date = CURRENT_DATE
ORDER BY d.name, a.appt_time;

-- View 3: Ward occupancy summary
CREATE OR REPLACE VIEW v_ward_occupancy AS
SELECT
  ward_id,
  ward_name,
  ward_type,
  total_beds,
  available_beds,
  (total_beds - available_beds)                              AS occupied_beds,
  ROUND(((total_beds - available_beds)::NUMERIC / total_beds) * 100, 1) AS occupancy_pct,
  charge_per_day
FROM ward
ORDER BY occupancy_pct DESC;

-- View 4: Monthly revenue report
CREATE OR REPLACE VIEW v_monthly_revenue AS
SELECT
  TO_CHAR(bill_date, 'YYYY-MM')   AS month,
  COUNT(*)                         AS total_bills,
  SUM(total_amount)                AS total_billed,
  SUM(paid_amount)                 AS total_collected,
  SUM(total_amount - paid_amount)  AS outstanding,
  COUNT(CASE WHEN payment_status = 'Paid' THEN 1 END) AS fully_paid,
  COUNT(CASE WHEN payment_status = 'Pending' THEN 1 END) AS pending_count
FROM billing
GROUP BY TO_CHAR(bill_date, 'YYYY-MM')
ORDER BY month DESC;

-- View 5: Patient full profile
CREATE OR REPLACE VIEW v_patient_profile AS
SELECT
  p.patient_id,
  p.name,
  p.dob,
  DATE_PART('year', AGE(p.dob))::INT   AS age,
  p.gender,
  p.blood_group,
  p.phone,
  COUNT(DISTINCT a.appt_id)            AS total_appointments,
  COUNT(DISTINCT adm.admission_id)     AS total_admissions,
  COALESCE(SUM(b.total_amount), 0)     AS total_billed,
  COALESCE(SUM(b.paid_amount), 0)      AS total_paid
FROM patient p
LEFT JOIN appointment a  ON a.patient_id = p.patient_id
LEFT JOIN admission  adm ON adm.patient_id = p.patient_id
LEFT JOIN billing    b   ON b.patient_id  = p.patient_id
GROUP BY p.patient_id, p.name, p.dob, p.gender, p.blood_group, p.phone;

-- View 6: Department load (appointments per department this month)
CREATE OR REPLACE VIEW v_dept_load_this_month AS
SELECT
  dep.dept_name,
  COUNT(a.appt_id) AS appointments_this_month,
  COUNT(DISTINCT d.doctor_id) AS doctor_count
FROM department dep
JOIN doctor d ON d.dept_id = dep.dept_id
LEFT JOIN appointment a ON a.doctor_id = d.doctor_id
  AND a.appt_date >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY dep.dept_name
ORDER BY appointments_this_month DESC;

-- ============================================================
-- STORED PROCEDURES / FUNCTIONS
-- ============================================================

-- Function 1: Auto-generate bill for a discharged patient
CREATE OR REPLACE FUNCTION generate_discharge_bill(p_admission_id INT)
RETURNS INT AS $$
DECLARE
  v_patient_id INT;
  v_days       INT;
  v_ward_rate  NUMERIC;
  v_total      NUMERIC;
  v_bill_id    INT;
BEGIN
  -- Gather info
  SELECT
    a.patient_id,
    (a.discharge_date - a.admit_date),
    w.charge_per_day
  INTO v_patient_id, v_days, v_ward_rate
  FROM admission a
  JOIN ward w ON w.ward_id = a.ward_id
  WHERE a.admission_id = p_admission_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Admission % not found', p_admission_id;
  END IF;

  v_total := v_days * v_ward_rate;

  -- Insert bill
  INSERT INTO billing (patient_id, admission_id, total_amount, notes)
  VALUES (v_patient_id, p_admission_id, v_total,
          'Auto-generated on discharge. Days: ' || v_days)
  RETURNING bill_id INTO v_bill_id;

  RAISE NOTICE 'Bill % generated for admission %. Amount: %', v_bill_id, p_admission_id, v_total;
  RETURN v_bill_id;
END;
$$ LANGUAGE plpgsql;

-- Function 2: Get patient appointment history
CREATE OR REPLACE FUNCTION get_patient_history(p_patient_id INT)
RETURNS TABLE (
  appt_date   DATE,
  doctor_name VARCHAR,
  speciality  VARCHAR,
  status      VARCHAR,
  medicine    VARCHAR,
  dosage      VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.appt_date,
    d.name,
    d.speciality,
    a.status,
    rx.medicine_name,
    rx.dosage
  FROM appointment a
  JOIN doctor d ON d.doctor_id = a.doctor_id
  LEFT JOIN prescription rx ON rx.appt_id = a.appt_id
  WHERE a.patient_id = p_patient_id
  ORDER BY a.appt_date DESC;
END;
$$ LANGUAGE plpgsql;

SELECT 'Views and procedures created successfully.' AS status;
