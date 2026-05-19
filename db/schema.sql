-- ============================================================
-- Hospital Management System — Schema
-- ============================================================

-- Drop existing (for clean re-runs)
DROP TABLE IF EXISTS billing       CASCADE;
DROP TABLE IF EXISTS prescription  CASCADE;
DROP TABLE IF EXISTS admission     CASCADE;
DROP TABLE IF EXISTS appointment   CASCADE;
DROP TABLE IF EXISTS ward          CASCADE;
DROP TABLE IF EXISTS patient       CASCADE;
DROP TABLE IF EXISTS doctor        CASCADE;
DROP TABLE IF EXISTS department    CASCADE;

-- ============================================================
-- 1. DEPARTMENT
-- ============================================================
CREATE TABLE department (
  dept_id     SERIAL PRIMARY KEY,
  dept_name   VARCHAR(100) NOT NULL UNIQUE,
  location    VARCHAR(100),
  head_doctor INT           -- FK added after doctor table
);

-- ============================================================
-- 2. DOCTOR
-- ============================================================
CREATE TABLE doctor (
  doctor_id   SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  speciality  VARCHAR(100) NOT NULL,
  phone       VARCHAR(15)  UNIQUE,
  email       VARCHAR(100) UNIQUE,
  dept_id     INT REFERENCES department(dept_id) ON DELETE SET NULL,
  salary      NUMERIC(10,2) CHECK (salary > 0),
  join_date   DATE DEFAULT CURRENT_DATE
);

-- Now add FK for department head
ALTER TABLE department
  ADD CONSTRAINT fk_head_doctor
  FOREIGN KEY (head_doctor) REFERENCES doctor(doctor_id) ON DELETE SET NULL;

-- ============================================================
-- 3. PATIENT
-- ============================================================
CREATE TABLE patient (
  patient_id    SERIAL PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  dob           DATE NOT NULL,
  gender        CHAR(1) CHECK (gender IN ('M', 'F', 'O')),
  phone         VARCHAR(15),
  address       TEXT,
  blood_group   VARCHAR(5)   CHECK (blood_group IN ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  registered_on DATE DEFAULT CURRENT_DATE
);

-- ============================================================
-- 4. WARD
-- ============================================================
CREATE TABLE ward (
  ward_id        SERIAL PRIMARY KEY,
  ward_name      VARCHAR(50)  NOT NULL UNIQUE,
  ward_type      VARCHAR(30)  CHECK (ward_type IN ('General','ICU','Private','Semi-Private')),
  total_beds     INT          NOT NULL CHECK (total_beds > 0),
  available_beds INT          NOT NULL CHECK (available_beds >= 0),
  charge_per_day NUMERIC(8,2) NOT NULL CHECK (charge_per_day > 0),
  CONSTRAINT beds_valid CHECK (available_beds <= total_beds)
);

-- ============================================================
-- 5. APPOINTMENT
-- ============================================================
CREATE TABLE appointment (
  appt_id    SERIAL PRIMARY KEY,
  patient_id INT NOT NULL REFERENCES patient(patient_id) ON DELETE CASCADE,
  doctor_id  INT NOT NULL REFERENCES doctor(doctor_id)  ON DELETE RESTRICT,
  appt_date  DATE NOT NULL,
  appt_time  TIME NOT NULL,
  status     VARCHAR(20) DEFAULT 'Scheduled'
             CHECK (status IN ('Scheduled','Completed','Cancelled','No-Show')),
  notes      TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  -- No double-booking: one doctor cannot have two appointments at same date+time
  UNIQUE (doctor_id, appt_date, appt_time)
);

-- ============================================================
-- 6. ADMISSION
-- ============================================================
CREATE TABLE admission (
  admission_id     SERIAL PRIMARY KEY,
  patient_id       INT NOT NULL REFERENCES patient(patient_id) ON DELETE RESTRICT,
  ward_id          INT NOT NULL REFERENCES ward(ward_id)       ON DELETE RESTRICT,
  attending_doctor INT          REFERENCES doctor(doctor_id)   ON DELETE SET NULL,
  admit_date       DATE NOT NULL DEFAULT CURRENT_DATE,
  discharge_date   DATE,
  CONSTRAINT discharge_after_admit
    CHECK (discharge_date IS NULL OR discharge_date >= admit_date)
);

-- ============================================================
-- 7. PRESCRIPTION
-- ============================================================
CREATE TABLE prescription (
  rx_id          SERIAL PRIMARY KEY,
  appt_id        INT NOT NULL REFERENCES appointment(appt_id) ON DELETE CASCADE,
  medicine_name  VARCHAR(100) NOT NULL,
  dosage         VARCHAR(50),
  duration_days  INT CHECK (duration_days > 0),
  instructions   TEXT
);

-- ============================================================
-- 8. BILLING
-- ============================================================
CREATE TABLE billing (
  bill_id        SERIAL PRIMARY KEY,
  patient_id     INT          NOT NULL REFERENCES patient(patient_id),
  admission_id   INT                   REFERENCES admission(admission_id),
  total_amount   NUMERIC(10,2) NOT NULL CHECK (total_amount >= 0),
  paid_amount    NUMERIC(10,2) DEFAULT 0 CHECK (paid_amount >= 0),
  bill_date      DATE DEFAULT CURRENT_DATE,
  payment_status VARCHAR(20) DEFAULT 'Pending'
                 CHECK (payment_status IN ('Pending','Partial','Paid')),
  payment_mode   VARCHAR(20)  CHECK (payment_mode IN ('Cash','Card','UPI','Insurance')),
  notes          TEXT,
  CONSTRAINT paid_lte_total CHECK (paid_amount <= total_amount)
);

-- ============================================================
-- Indexes (for performance on common query patterns)
-- ============================================================
CREATE INDEX idx_appt_doctor_date   ON appointment(doctor_id, appt_date);
CREATE INDEX idx_appt_patient       ON appointment(patient_id);
CREATE INDEX idx_admission_patient  ON admission(patient_id);
CREATE INDEX idx_admission_ward     ON admission(ward_id);
CREATE INDEX idx_billing_patient    ON billing(patient_id);
CREATE INDEX idx_billing_status     ON billing(payment_status);

-- Done.
SELECT 'Schema created successfully.' AS status;
