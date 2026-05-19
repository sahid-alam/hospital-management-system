-- ============================================================
-- Hospital Management System — Seed Data
-- BCS403 DBMS Mini Project | VTU Sem IV AIML
-- ============================================================

-- ============================================================
-- DEPARTMENTS
-- ============================================================
INSERT INTO department (dept_name, location) VALUES
  ('Cardiology',       'Block A, Floor 2'),
  ('Neurology',        'Block B, Floor 3'),
  ('Orthopaedics',     'Block A, Floor 1'),
  ('Paediatrics',      'Block C, Floor 1'),
  ('General Medicine', 'Block D, Floor 1');

-- ============================================================
-- DOCTORS (15 doctors across 5 departments)
-- ============================================================
INSERT INTO doctor (name, speciality, phone, email, dept_id, salary, join_date) VALUES
  ('Dr. Ananya Krishnan',  'Cardiologist',         '9900001001', 'ananya.k@hospital.com',   1, 180000, '2018-03-15'),
  ('Dr. Rohan Mehta',      'Cardiologist',         '9900001002', 'rohan.m@hospital.com',    1, 165000, '2020-07-01'),
  ('Dr. Priya Rao',        'Neurologist',          '9900001003', 'priya.r@hospital.com',    2, 190000, '2016-01-10'),
  ('Dr. Vikram Nair',      'Neurologist',          '9900001004', 'vikram.n@hospital.com',   2, 175000, '2019-05-20'),
  ('Dr. Suresh Patil',     'Orthopaedic Surgeon',  '9900001005', 'suresh.p@hospital.com',   3, 200000, '2015-08-12'),
  ('Dr. Kavitha Menon',    'Orthopaedic Surgeon',  '9900001006', 'kavitha.m@hospital.com',  3, 170000, '2021-02-28'),
  ('Dr. Amit Sharma',      'Paediatrician',        '9900001007', 'amit.s@hospital.com',     4, 155000, '2017-11-05'),
  ('Dr. Deepa Srinivas',   'Paediatrician',        '9900001008', 'deepa.s@hospital.com',    4, 148000, '2022-04-14'),
  ('Dr. Kiran Bhat',       'General Physician',    '9900001009', 'kiran.b@hospital.com',    5, 130000, '2019-09-01'),
  ('Dr. Shalini Iyer',     'General Physician',    '9900001010', 'shalini.i@hospital.com',  5, 128000, '2020-06-15'),
  ('Dr. Rajesh Kumar',     'General Physician',    '9900001011', 'rajesh.k@hospital.com',   5, 125000, '2021-08-20'),
  ('Dr. Meena Das',        'Cardiologist',         '9900001012', 'meena.d@hospital.com',    1, 172000, '2019-03-30'),
  ('Dr. Arjun Pillai',     'Neurologist',          '9900001013', 'arjun.p@hospital.com',    2, 182000, '2018-07-07'),
  ('Dr. Sunita Gupta',     'Paediatrician',        '9900001014', 'sunita.g@hospital.com',   4, 152000, '2020-12-01'),
  ('Dr. Harish Verma',     'Orthopaedic Surgeon',  '9900001015', 'harish.v@hospital.com',   3, 195000, '2014-05-18');

-- Set department heads
UPDATE department SET head_doctor = 1  WHERE dept_id = 1;  -- Cardiology → Dr. Ananya
UPDATE department SET head_doctor = 3  WHERE dept_id = 2;  -- Neurology  → Dr. Priya
UPDATE department SET head_doctor = 5  WHERE dept_id = 3;  -- Ortho      → Dr. Suresh
UPDATE department SET head_doctor = 7  WHERE dept_id = 4;  -- Paeds      → Dr. Amit
UPDATE department SET head_doctor = 9  WHERE dept_id = 5;  -- Gen Med    → Dr. Kiran

-- ============================================================
-- PATIENTS (30 patients)
-- ============================================================
INSERT INTO patient (name, dob, gender, phone, address, blood_group) VALUES
  ('Ravi Shankar',     '1985-04-12', 'M', '8800000101', '12 MG Road, Bengaluru',      'O+'),
  ('Lakshmi Devi',     '1970-09-25', 'F', '8800000102', '34 Indiranagar, Bengaluru',  'B+'),
  ('Mohammed Imran',   '1992-01-08', 'M', '8800000103', '56 Koramangala, Bengaluru',  'A+'),
  ('Pooja Nair',       '2001-07-19', 'F', '8800000104', '78 Whitefield, Bengaluru',   'AB+'),
  ('Aryan Kapoor',     '2015-03-30', 'M', '8800000105', '90 HSR Layout, Bengaluru',   'O-'),
  ('Shanta Bai',       '1955-11-14', 'F', '8800000106', '11 Jayanagar, Bengaluru',    'B-'),
  ('Deepak Raj',       '1988-06-22', 'M', '8800000107', '22 BTM Layout, Bengaluru',   'A-'),
  ('Anjali Singh',     '1995-02-10', 'F', '8800000108', '33 Electronic City',         'O+'),
  ('Sunil Gowda',      '1978-08-03', 'M', '8800000109', '44 Rajajinagar, Bengaluru',  'B+'),
  ('Kaveri Amma',      '1962-12-28', 'F', '8800000110', '55 Malleswaram, Bengaluru',  'AB-'),
  ('Nikhil Menon',     '1999-05-16', 'M', '8800000111', '66 Yelahanka, Bengaluru',    'O+'),
  ('Preethi Kumar',    '1990-10-04', 'F', '8800000112', '77 Sarjapur, Bengaluru',     'A+'),
  ('Venkat Reddy',     '1975-03-21', 'M', '8800000113', '88 Hebbal, Bengaluru',       'B+'),
  ('Fatima Begum',     '2008-07-07', 'F', '8800000114', '99 Shivajinagar, Bengaluru', 'O+'),
  ('Kartik Shetty',    '1983-01-17', 'M', '8800000115', '10 JP Nagar, Bengaluru',     'A-'),
  ('Rekha Pillai',     '1967-09-09', 'F', '8800000116', '21 Mysore Road, Bengaluru',  'O+'),
  ('Sameer Khan',      '2000-04-25', 'M', '8800000117', '32 Old Airport Rd',          'B+'),
  ('Usha Rani',        '1945-06-18', 'F', '8800000118', '43 Banashankari, Bengaluru', 'AB+'),
  ('Ganesh Bhat',      '1993-11-30', 'M', '8800000119', '54 Bellandur, Bengaluru',    'O-'),
  ('Nalini Prasad',    '1987-08-14', 'F', '8800000120', '65 Marathahalli, Bengaluru', 'A+'),
  ('Vijay Anand',      '1972-02-02', 'M', '8800000121', '76 Domlur, Bengaluru',       'B-'),
  ('Meera Krishnan',   '2010-12-12', 'F', '8800000122', '87 Frazer Town, Bengaluru',  'O+'),
  ('Prakash Rao',      '1965-07-27', 'M', '8800000123', '98 Cunningham Rd',           'A+'),
  ('Sridevi Naidu',    '1980-03-05', 'F', '8800000124', '19 Residency Rd, Bengaluru', 'B+'),
  ('Aditya Patel',     '2003-09-13', 'M', '8800000125', '30 MG Road, Bengaluru',      'AB+'),
  ('Bhavana Gowda',    '1996-01-28', 'F', '8800000126', '41 Tumkur Road, Bengaluru',  'O+'),
  ('Ramesh Srinivas',  '1958-05-05', 'M', '8800000127', '52 Richmond Town',           'A-'),
  ('Chitra Devi',      '1973-10-20', 'F', '8800000128', '63 Indiranagar, Bengaluru',  'B+'),
  ('Yusuf Ali',        '2012-08-08', 'M', '8800000129', '74 Frazer Town, Bengaluru',  'O+'),
  ('Sarita Joshi',     '1984-04-04', 'F', '8800000130', '85 Sadashivnagar',           'AB-');

-- ============================================================
-- WARDS (8 wards)
-- ============================================================
INSERT INTO ward (ward_name, ward_type, total_beds, available_beds, charge_per_day) VALUES
  ('Cardiac ICU',           'ICU',          10, 4,  8000),
  ('Neuro ICU',             'ICU',           8, 3,  8500),
  ('General Ward A',        'General',      30, 18, 1500),
  ('General Ward B',        'General',      30, 22, 1500),
  ('Private Suite 1',       'Private',      10, 6,  6000),
  ('Private Suite 2',       'Private',      10, 7,  5500),
  ('Semi-Private Wing',     'Semi-Private', 20, 11, 3000),
  ('Paediatric Ward',       'General',      15, 9,  2000);

-- ============================================================
-- APPOINTMENTS (40 appointments, spread over past 3 months)
-- ============================================================
INSERT INTO appointment (patient_id, doctor_id, appt_date, appt_time, status, notes) VALUES
  (1,  1,  CURRENT_DATE - 60, '09:00', 'Completed',  'Routine cardiac checkup'),
  (2,  3,  CURRENT_DATE - 58, '10:30', 'Completed',  'Headache and dizziness'),
  (3,  5,  CURRENT_DATE - 55, '11:00', 'Completed',  'Knee pain follow-up'),
  (4,  7,  CURRENT_DATE - 52, '09:30', 'Completed',  'Child fever and cough'),
  (5,  7,  CURRENT_DATE - 50, '14:00', 'Completed',  'Growth assessment'),
  (6,  1,  CURRENT_DATE - 48, '10:00', 'Completed',  'Chest pain evaluation'),
  (7,  9,  CURRENT_DATE - 45, '11:30', 'Completed',  'Blood pressure check'),
  (8,  10, CURRENT_DATE - 43, '09:00', 'Completed',  'General health checkup'),
  (9,  5,  CURRENT_DATE - 40, '10:00', 'Completed',  'Back pain'),
  (10, 3,  CURRENT_DATE - 38, '11:00', 'Completed',  'Memory issues'),
  (11, 2,  CURRENT_DATE - 35, '09:30', 'Completed',  'Palpitations'),
  (12, 6,  CURRENT_DATE - 32, '14:30', 'Completed',  'Fracture follow-up'),
  (13, 1,  CURRENT_DATE - 30, '10:00', 'Completed',  'ECG and review'),
  (14, 8,  CURRENT_DATE - 28, '11:00', 'Completed',  'Vaccination schedule'),
  (15, 9,  CURRENT_DATE - 25, '09:00', 'Completed',  'Diabetes management'),
  (16, 3,  CURRENT_DATE - 23, '10:30', 'Completed',  'Migraine treatment'),
  (17, 11, CURRENT_DATE - 20, '14:00', 'Completed',  'Thyroid follow-up'),
  (18, 1,  CURRENT_DATE - 18, '09:00', 'Completed',  'Heart disease management'),
  (19, 5,  CURRENT_DATE - 15, '11:00', 'Completed',  'Sports injury'),
  (20, 7,  CURRENT_DATE - 12, '10:00', 'Completed',  'Asthma management'),
  (21, 9,  CURRENT_DATE - 10, '09:30', 'Completed',  'Annual physical'),
  (22, 8,  CURRENT_DATE - 8,  '14:00', 'Completed',  'Ear infection'),
  (23, 2,  CURRENT_DATE - 6,  '10:00', 'Completed',  'Arrhythmia checkup'),
  (24, 4,  CURRENT_DATE - 5,  '11:30', 'Cancelled',  'Patient no-show'),
  (25, 6,  CURRENT_DATE - 4,  '09:00', 'Completed',  'Joint replacement review'),
  (26, 10, CURRENT_DATE - 3,  '10:30', 'Completed',  'Flu symptoms'),
  (27, 1,  CURRENT_DATE - 2,  '14:00', 'Completed',  'Post-op cardiac review'),
  (28, 3,  CURRENT_DATE - 1,  '09:00', 'Completed',  'Epilepsy medication review'),
  (1,  2,  CURRENT_DATE,       '09:00', 'Scheduled',  'Follow-up ECG'),
  (3,  5,  CURRENT_DATE,       '10:00', 'Scheduled',  'Physiotherapy review'),
  (7,  9,  CURRENT_DATE,       '11:00', 'Scheduled',  'BP and sugar levels'),
  (12, 6,  CURRENT_DATE,       '14:00', 'Scheduled',  'X-ray review'),
  (15, 11, CURRENT_DATE,       '15:00', 'Scheduled',  'Diabetes quarterly'),
  (20, 7,  CURRENT_DATE,       '09:30', 'Scheduled',  'Allergy test results'),
  (5,  8,  CURRENT_DATE + 1,   '10:00', 'Scheduled',  'Growth hormone check'),
  (8,  10, CURRENT_DATE + 1,   '11:30', 'Scheduled',  'General follow-up'),
  (13, 1,  CURRENT_DATE + 2,   '09:00', 'Scheduled',  'Stress test'),
  (16, 3,  CURRENT_DATE + 2,   '10:30', 'Scheduled',  'MRI review'),
  (22, 8,  CURRENT_DATE + 3,   '14:00', 'Scheduled',  'Post-antibiotic checkup'),
  (30, 9,  CURRENT_DATE + 3,   '15:30', 'Scheduled',  'New patient consultation');

-- ============================================================
-- ADMISSIONS (15 admissions, some discharged, some active)
-- Disable the decrement trigger during bulk seed so historical
-- (already-discharged) admissions don't reduce available_beds.
-- We recalculate the correct count with a single UPDATE at the end.
-- ============================================================
ALTER TABLE admission DISABLE TRIGGER trig_after_admission_insert;

INSERT INTO admission (patient_id, ward_id, attending_doctor, admit_date, discharge_date) VALUES
  (6,  1, 1,  CURRENT_DATE - 45, CURRENT_DATE - 38),  -- discharged
  (10, 2, 3,  CURRENT_DATE - 40, CURRENT_DATE - 33),  -- discharged
  (18, 1, 1,  CURRENT_DATE - 35, CURRENT_DATE - 28),  -- discharged
  (23, 5, 2,  CURRENT_DATE - 30, CURRENT_DATE - 24),  -- discharged
  (27, 3, 9,  CURRENT_DATE - 25, CURRENT_DATE - 18),  -- discharged
  (9,  6, 5,  CURRENT_DATE - 20, CURRENT_DATE - 14),  -- discharged
  (13, 1, 1,  CURRENT_DATE - 15, CURRENT_DATE - 9),   -- discharged
  (21, 7, 11, CURRENT_DATE - 12, CURRENT_DATE - 6),   -- discharged
  (2,  2, 3,  CURRENT_DATE - 8,  NULL),               -- ACTIVE (Neuro ICU)
  (6,  1, 1,  CURRENT_DATE - 6,  NULL),               -- ACTIVE (Cardiac ICU)
  (16, 3, 4,  CURRENT_DATE - 5,  NULL),               -- ACTIVE (General A)
  (19, 6, 5,  CURRENT_DATE - 4,  NULL),               -- ACTIVE (Private 2)
  (24, 7, 6,  CURRENT_DATE - 3,  NULL),               -- ACTIVE (Semi-Private)
  (28, 2, 3,  CURRENT_DATE - 2,  NULL),               -- ACTIVE (Neuro ICU)
  (4,  8, 7,  CURRENT_DATE - 1,  NULL);               -- ACTIVE (Paediatric)

ALTER TABLE admission ENABLE TRIGGER trig_after_admission_insert;

-- Recalculate available_beds: total_beds minus currently active admissions
UPDATE ward w
SET available_beds = w.total_beds - (
  SELECT COUNT(*) FROM admission a
  WHERE a.ward_id = w.ward_id AND a.discharge_date IS NULL
);

-- ============================================================
-- PRESCRIPTIONS (for completed appointments)
-- ============================================================
INSERT INTO prescription (appt_id, medicine_name, dosage, duration_days, instructions) VALUES
  (1,  'Atorvastatin',    '20mg OD',    30, 'Take at night with food'),
  (1,  'Aspirin',         '75mg OD',    30, 'Take after breakfast'),
  (2,  'Sumatriptan',     '50mg SOS',    7, 'Take at onset of headache'),
  (3,  'Diclofenac',      '50mg BD',    10, 'Take with food, avoid empty stomach'),
  (4,  'Amoxicillin',     '250mg TDS',   7, 'Complete the full course'),
  (6,  'Amlodipine',      '5mg OD',     30, 'Take in the morning'),
  (6,  'Metoprolol',      '25mg BD',    30, 'Do not stop suddenly'),
  (7,  'Amlodipine',      '5mg OD',     30, 'Monitor BP daily'),
  (9,  'Ibuprofen',       '400mg TDS',   5, 'Take after meals'),
  (10, 'Donepezil',       '5mg OD',     90, 'Take at bedtime'),
  (11, 'Bisoprolol',      '2.5mg OD',   30, 'Morning with water'),
  (15, 'Metformin',       '500mg BD',   90, 'Take with breakfast and dinner'),
  (15, 'Glimepiride',     '1mg OD',     90, 'Take 30 min before breakfast'),
  (16, 'Topiramate',      '25mg BD',    60, 'Increase dose gradually'),
  (18, 'Warfarin',        '5mg OD',    180, 'Regular INR monitoring required');

-- ============================================================
-- BILLING (for discharged admissions + some outpatients)
-- ============================================================
INSERT INTO billing (patient_id, admission_id, total_amount, paid_amount, bill_date, payment_mode, notes) VALUES
  -- Discharged patients (admission-based)
  (6,  1,  56000, 56000, CURRENT_DATE - 38, 'Insurance', 'Cardiac ICU 7 days'),
  (10, 2,  59500, 30000, CURRENT_DATE - 33, 'Card',      'Neuro ICU 7 days, partial payment'),
  (18, 3,  56000, 56000, CURRENT_DATE - 28, 'Cash',      'Cardiac ICU 7 days'),
  (23, 4,  36000,  5000, CURRENT_DATE - 24, 'UPI',       'Private Suite 6 days'),
  (27, 5,  22500, 22500, CURRENT_DATE - 18, 'Card',      'General Ward 15 days'),
  (9,  6,  33000, 33000, CURRENT_DATE - 14, 'Insurance', 'Private Suite 6 days'),
  (13, 7,  48000, 48000, CURRENT_DATE - 9,  'Card',      'Cardiac ICU 6 days'),
  (21, 8,  18000,  9000, CURRENT_DATE - 6,  'Cash',      'Semi-Private 6 days, partial'),
  -- Outpatient consultation bills
  (1,  NULL, 800,   800, CURRENT_DATE - 60, 'Cash',   'Consultation fee'),
  (3,  NULL, 800,   800, CURRENT_DATE - 55, 'UPI',    'Consultation + X-Ray'),
  (7,  NULL, 500,   500, CURRENT_DATE - 45, 'Cash',   'BP consultation'),
  (15, NULL, 600,   600, CURRENT_DATE - 25, 'Card',   'Diabetes review'),
  (17, NULL, 600,     0, CURRENT_DATE - 20, NULL,     'Thyroid follow-up - unpaid'),
  (26, NULL, 500,   500, CURRENT_DATE - 3,  'UPI',    'Flu consultation');

SELECT 'Seed data inserted successfully.' AS status;
