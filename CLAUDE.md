# Hospital Management System – CLAUDE.md

## Project Overview

A full-stack **Hospital Management System** built as a DBMS mini-project for VTU BCS403 (Sem IV – AIML).
It demonstrates: SQL DDL/DML, Joins, Triggers, Stored Procedures, Views, Normalization (3NF/BCNF),
and Transactions — all through a real working web application.

---

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Database   | PostgreSQL 15+                      |
| Backend    | Node.js 20+ · Express.js 4.x        |
| ORM/Query  | Raw SQL via `pg` (node-postgres)    |
| Frontend   | React 18 · Vite · Tailwind CSS 3    |
| Auth       | JWT (jsonwebtoken) + bcryptjs       |
| Dev Tools  | Nodemon · ESLint · Prettier         |

---

## Project Structure

```
hospital-mgmt/
├── CLAUDE.md                  ← you are here
├── README.md
├── .env.example
├── db/
│   ├── schema.sql             ← all CREATE TABLE + constraints
│   ├── seed.sql               ← sample data
│   ├── triggers.sql           ← all DB triggers
│   ├── views.sql              ← all DB views
│   └── procedures.sql         ← stored procedures / functions
├── backend/
│   ├── package.json
│   ├── server.js              ← Express app entry
│   ├── config/
│   │   └── db.js              ← pg Pool config
│   ├── routes/
│   │   ├── patients.js
│   │   ├── doctors.js
│   │   ├── appointments.js
│   │   ├── wards.js
│   │   └── billing.js
│   ├── controllers/
│   │   ├── patientsController.js
│   │   ├── doctorsController.js
│   │   ├── appointmentsController.js
│   │   ├── wardsController.js
│   │   └── billingController.js
│   └── middleware/
│       ├── errorHandler.js
│       └── validate.js
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── index.html
    ├── tailwind.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css
        ├── api/
        │   └── axios.js
        ├── pages/
        │   ├── Dashboard.jsx
        │   ├── Patients.jsx
        │   ├── Doctors.jsx
        │   ├── Appointments.jsx
        │   ├── Wards.jsx
        │   └── Billing.jsx
        └── components/
            ├── Navbar.jsx
            ├── Sidebar.jsx
            ├── Table.jsx
            ├── Modal.jsx
            ├── StatCard.jsx
            └── charts/
                ├── OccupancyChart.jsx
                └── RevenueChart.jsx
```

---

## Database Schema (PostgreSQL)

The schema is in `db/schema.sql`. Here is the complete entity summary:

### Entities & Relationships

```
DEPARTMENT (1) ──< DOCTOR (M) ──< APPOINTMENT (M) >── (1) PATIENT
                                                              │
                                                              ▼
                                                        ADMISSION
                                                              │
                                                         WARD (1) ──< BED (M)
                                                              
APPOINTMENT ──> PRESCRIPTION ──< MEDICINE
PATIENT ──< BILLING
```

### Tables

```sql
-- 1. DEPARTMENT
CREATE TABLE department (
  dept_id     SERIAL PRIMARY KEY,
  dept_name   VARCHAR(100) NOT NULL UNIQUE,
  location    VARCHAR(100),
  head_doctor INT   -- FK to doctor (set after doctor table)
);

-- 2. DOCTOR
CREATE TABLE doctor (
  doctor_id   SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  speciality  VARCHAR(100) NOT NULL,
  phone       VARCHAR(15) UNIQUE,
  email       VARCHAR(100) UNIQUE,
  dept_id     INT REFERENCES department(dept_id) ON DELETE SET NULL,
  salary      NUMERIC(10,2) CHECK (salary > 0),
  join_date   DATE DEFAULT CURRENT_DATE
);

-- 3. PATIENT
CREATE TABLE patient (
  patient_id  SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  dob         DATE NOT NULL,
  gender      CHAR(1) CHECK (gender IN ('M','F','O')),
  phone       VARCHAR(15),
  address     TEXT,
  blood_group VARCHAR(5),
  registered_on DATE DEFAULT CURRENT_DATE
);

-- 4. WARD
CREATE TABLE ward (
  ward_id     SERIAL PRIMARY KEY,
  ward_name   VARCHAR(50) NOT NULL,
  ward_type   VARCHAR(30) CHECK (ward_type IN ('General','ICU','Private','Semi-Private')),
  total_beds  INT NOT NULL CHECK (total_beds > 0),
  available_beds INT NOT NULL CHECK (available_beds >= 0),
  charge_per_day NUMERIC(8,2) NOT NULL
);

-- 5. APPOINTMENT
CREATE TABLE appointment (
  appt_id     SERIAL PRIMARY KEY,
  patient_id  INT NOT NULL REFERENCES patient(patient_id) ON DELETE CASCADE,
  doctor_id   INT NOT NULL REFERENCES doctor(doctor_id) ON DELETE RESTRICT,
  appt_date   DATE NOT NULL,
  appt_time   TIME NOT NULL,
  status      VARCHAR(20) DEFAULT 'Scheduled'
                CHECK (status IN ('Scheduled','Completed','Cancelled','No-Show')),
  notes       TEXT,
  UNIQUE (doctor_id, appt_date, appt_time)   -- no double-booking
);

-- 6. ADMISSION (Patient admitted to ward)
CREATE TABLE admission (
  admission_id  SERIAL PRIMARY KEY,
  patient_id    INT NOT NULL REFERENCES patient(patient_id),
  ward_id       INT NOT NULL REFERENCES ward(ward_id),
  admit_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  discharge_date DATE,
  attending_doctor INT REFERENCES doctor(doctor_id),
  CONSTRAINT discharge_after_admit CHECK (discharge_date IS NULL OR discharge_date >= admit_date)
);

-- 7. PRESCRIPTION
CREATE TABLE prescription (
  rx_id       SERIAL PRIMARY KEY,
  appt_id     INT NOT NULL REFERENCES appointment(appt_id) ON DELETE CASCADE,
  medicine_name VARCHAR(100) NOT NULL,
  dosage      VARCHAR(50),
  duration_days INT CHECK (duration_days > 0),
  instructions TEXT
);

-- 8. BILLING
CREATE TABLE billing (
  bill_id     SERIAL PRIMARY KEY,
  patient_id  INT NOT NULL REFERENCES patient(patient_id),
  admission_id INT REFERENCES admission(admission_id),
  total_amount NUMERIC(10,2) NOT NULL CHECK (total_amount >= 0),
  paid_amount  NUMERIC(10,2) DEFAULT 0 CHECK (paid_amount >= 0),
  bill_date    DATE DEFAULT CURRENT_DATE,
  payment_status VARCHAR(20) DEFAULT 'Pending'
                CHECK (payment_status IN ('Pending','Partial','Paid')),
  payment_mode VARCHAR(20) CHECK (payment_mode IN ('Cash','Card','UPI','Insurance'))
);
```

---

## Triggers (db/triggers.sql)

### Trigger 1 – Auto-decrement available beds on admission
```sql
CREATE OR REPLACE FUNCTION trg_decrement_beds()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE ward SET available_beds = available_beds - 1
  WHERE ward_id = NEW.ward_id;

  IF (SELECT available_beds FROM ward WHERE ward_id = NEW.ward_id) < 0 THEN
    RAISE EXCEPTION 'No available beds in ward %', NEW.ward_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_admission_insert
AFTER INSERT ON admission
FOR EACH ROW EXECUTE FUNCTION trg_decrement_beds();
```

### Trigger 2 – Auto-increment beds on discharge
```sql
CREATE OR REPLACE FUNCTION trg_increment_beds()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.discharge_date IS NOT NULL AND OLD.discharge_date IS NULL THEN
    UPDATE ward SET available_beds = available_beds + 1
    WHERE ward_id = NEW.ward_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_discharge_update
AFTER UPDATE ON admission
FOR EACH ROW EXECUTE FUNCTION trg_increment_beds();
```

### Trigger 3 – Auto-update billing status on payment
```sql
CREATE OR REPLACE FUNCTION trg_update_payment_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.paid_amount >= NEW.total_amount THEN
    NEW.payment_status := 'Paid';
  ELSIF NEW.paid_amount > 0 THEN
    NEW.payment_status := 'Partial';
  ELSE
    NEW.payment_status := 'Pending';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_billing_upsert
BEFORE INSERT OR UPDATE ON billing
FOR EACH ROW EXECUTE FUNCTION trg_update_payment_status();
```

---

## Views (db/views.sql)

```sql
-- View 1: Active admissions with patient + ward + doctor info
CREATE OR REPLACE VIEW v_active_admissions AS
SELECT
  a.admission_id,
  p.name          AS patient_name,
  w.ward_name,
  w.ward_type,
  d.name          AS attending_doctor,
  a.admit_date,
  a.discharge_date,
  w.charge_per_day,
  (CURRENT_DATE - a.admit_date) AS days_admitted
FROM admission a
JOIN patient  p ON p.patient_id  = a.patient_id
JOIN ward     w ON w.ward_id     = a.ward_id
LEFT JOIN doctor d ON d.doctor_id = a.attending_doctor
WHERE a.discharge_date IS NULL;

-- View 2: Doctor schedule (appointments for today)
CREATE OR REPLACE VIEW v_doctor_schedule_today AS
SELECT
  d.name    AS doctor_name,
  d.speciality,
  p.name    AS patient_name,
  a.appt_time,
  a.status
FROM appointment a
JOIN doctor  d ON d.doctor_id  = a.doctor_id
JOIN patient p ON p.patient_id = a.patient_id
WHERE a.appt_date = CURRENT_DATE
ORDER BY d.name, a.appt_time;

-- View 3: Ward occupancy summary
CREATE OR REPLACE VIEW v_ward_occupancy AS
SELECT
  ward_name,
  ward_type,
  total_beds,
  available_beds,
  (total_beds - available_beds)                           AS occupied_beds,
  ROUND(((total_beds - available_beds)::NUMERIC / total_beds) * 100, 2) AS occupancy_pct
FROM ward;

-- View 4: Revenue report by month
CREATE OR REPLACE VIEW v_monthly_revenue AS
SELECT
  TO_CHAR(bill_date, 'YYYY-MM') AS month,
  COUNT(*)                       AS total_bills,
  SUM(total_amount)              AS total_billed,
  SUM(paid_amount)               AS total_collected,
  SUM(total_amount - paid_amount) AS outstanding
FROM billing
GROUP BY TO_CHAR(bill_date, 'YYYY-MM')
ORDER BY month DESC;
```

---

## Key SQL Queries (for DBMS lab / viva)

```sql
-- Q1: Doctors with no appointments today
SELECT d.name, d.speciality
FROM doctor d
WHERE d.doctor_id NOT IN (
  SELECT doctor_id FROM appointment WHERE appt_date = CURRENT_DATE
);

-- Q2: Patients admitted more than 7 days (long stays)
SELECT p.name, a.admit_date, w.ward_name,
       (CURRENT_DATE - a.admit_date) AS days
FROM admission a
JOIN patient p ON p.patient_id = a.patient_id
JOIN ward    w ON w.ward_id    = a.ward_id
WHERE a.discharge_date IS NULL
  AND (CURRENT_DATE - a.admit_date) > 7;

-- Q3: Department-wise doctor count and avg salary
SELECT dept_name, COUNT(d.doctor_id) AS num_doctors,
       ROUND(AVG(d.salary), 2) AS avg_salary
FROM department dep
LEFT JOIN doctor d ON d.dept_id = dep.dept_id
GROUP BY dept_name
ORDER BY num_doctors DESC;

-- Q4: Top 5 patients by total billing amount
SELECT p.name, SUM(b.total_amount) AS total_billed
FROM billing b
JOIN patient p ON p.patient_id = b.patient_id
GROUP BY p.name
ORDER BY total_billed DESC
LIMIT 5;

-- Q5: Schedule conflict check for a doctor (double-booking guard)
-- Already enforced by UNIQUE(doctor_id, appt_date, appt_time)
-- Manual check:
SELECT doctor_id, appt_date, appt_time, COUNT(*)
FROM appointment
GROUP BY doctor_id, appt_date, appt_time
HAVING COUNT(*) > 1;

-- Q6: Unpaid bills older than 30 days
SELECT b.bill_id, p.name, b.total_amount, b.paid_amount,
       b.bill_date, (CURRENT_DATE - b.bill_date) AS days_overdue
FROM billing b
JOIN patient p ON p.patient_id = b.patient_id
WHERE b.payment_status != 'Paid'
  AND b.bill_date < CURRENT_DATE - INTERVAL '30 days';
```

---

## API Endpoints (Express Backend)

### Patients
| Method | Endpoint              | Description             |
|--------|-----------------------|-------------------------|
| GET    | /api/patients         | List all patients        |
| GET    | /api/patients/:id     | Patient detail + history |
| POST   | /api/patients         | Register new patient     |
| PUT    | /api/patients/:id     | Update patient info      |
| DELETE | /api/patients/:id     | Remove patient           |

### Doctors
| Method | Endpoint              | Description              |
|--------|-----------------------|--------------------------|
| GET    | /api/doctors          | List all doctors          |
| GET    | /api/doctors/:id/schedule | Doctor's appointments |
| POST   | /api/doctors          | Add doctor               |
| PUT    | /api/doctors/:id      | Update doctor             |

### Appointments
| Method | Endpoint              | Description              |
|--------|-----------------------|--------------------------|
| GET    | /api/appointments     | All appointments (filter by date/doctor) |
| POST   | /api/appointments     | Book appointment         |
| PATCH  | /api/appointments/:id | Update status            |
| DELETE | /api/appointments/:id | Cancel appointment       |

### Wards
| Method | Endpoint              | Description              |
|--------|-----------------------|--------------------------|
| GET    | /api/wards            | Ward list with occupancy |
| POST   | /api/wards/admit      | Admit patient to ward    |
| PATCH  | /api/wards/discharge/:id | Discharge patient     |

### Billing
| Method | Endpoint              | Description              |
|--------|-----------------------|--------------------------|
| GET    | /api/billing          | All bills                |
| POST   | /api/billing          | Create bill              |
| PATCH  | /api/billing/:id/pay  | Record payment           |
| GET    | /api/billing/revenue  | Monthly revenue view     |

---

## Frontend Pages

### Dashboard (`/`)
- Stat cards: Total Patients, Active Admissions, Today's Appointments, Pending Bills
- Ward Occupancy bar chart (Recharts)
- Monthly Revenue line chart (Recharts)
- Recent appointments table

### Patients (`/patients`)
- Searchable paginated table
- Add / Edit / View patient modal
- Patient history tab (admissions, appointments, bills)

### Doctors (`/doctors`)
- Doctor list with department filter
- Today's schedule panel per doctor
- Add / Edit doctor form

### Appointments (`/appointments`)
- Calendar + list view toggle
- Book appointment form with doctor availability check
- Status update (Completed / Cancelled / No-Show)

### Wards (`/wards`)
- Occupancy cards per ward type (ICU / General / Private)
- Admit patient form
- Active admissions table with discharge button

### Billing (`/billing`)
- Bills table with payment status badge
- Record payment modal
- Revenue summary cards

---

## Implementation Instructions for Claude Code

When building this project, follow this order strictly:

### Phase 1 – Database Setup
1. Create `db/schema.sql` with all tables and constraints exactly as specified above
2. Create `db/triggers.sql` with all 3 triggers
3. Create `db/views.sql` with all 4 views
4. Create `db/seed.sql` with realistic sample data:
   - 5 departments, 15 doctors, 50 patients, 8 wards
   - 100+ appointments (spread over past 3 months)
   - 40+ admissions (some discharged, some active)
   - 60+ billing records

### Phase 2 – Backend
1. Initialize with `npm init` in `backend/`
2. Install: `express pg dotenv cors helmet morgan`
3. Build `config/db.js` using connection pool (`pg.Pool`)
4. Build each router + controller pair
5. Use parameterized queries (`$1, $2`) — NEVER string interpolation (SQL injection!)
6. Add global error handler middleware
7. Add input validation middleware using `express-validator`

### Phase 3 – Frontend
1. Initialize with `npm create vite@latest frontend -- --template react`
2. Install: `tailwindcss axios recharts react-router-dom react-hook-form`
3. Build shared components first (Navbar, Sidebar, Table, Modal, StatCard)
4. Then build pages in order: Dashboard → Patients → Doctors → Appointments → Wards → Billing
5. Use `react-hook-form` for all forms
6. Use `axios` with a base config in `src/api/axios.js`

### Phase 4 – Integration & Polish
1. CORS setup in backend for frontend origin
2. Environment variables via `.env`
3. Error boundaries in React
4. Loading states and empty states for all tables
5. Toast notifications for CRUD operations

---

## Design System (Tailwind)

```js
// tailwind.config.js
colors: {
  primary:  { DEFAULT: '#0F4C81', light: '#1a6baa', dark: '#0a3560' },
  accent:   { DEFAULT: '#00C49F', light: '#33d4b5' },
  danger:   '#EF4444',
  warning:  '#F59E0B',
  surface:  '#F8FAFC',
  card:     '#FFFFFF',
}
// Font: 'DM Sans' (body) + 'DM Serif Display' (headings)
```

Status badge colors:
- `Scheduled` → blue, `Completed` → green, `Cancelled` → red, `No-Show` → gray
- `Paid` → green, `Partial` → yellow, `Pending` → red
- `ICU` ward → red badge, `General` → blue, `Private` → purple

---

## Environment Variables (.env.example)

```
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hospital_mgmt
DB_USER=postgres
DB_PASSWORD=your_password

# Server
PORT=5000
NODE_ENV=development

# JWT
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d

# Frontend
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## DBMS Concepts Covered (VTU BCS403)

| Concept              | Where it appears                                      |
|----------------------|-------------------------------------------------------|
| DDL (CREATE, ALTER)  | `db/schema.sql` — all table definitions               |
| DML (INSERT/UPDATE)  | `db/seed.sql` + API controllers                       |
| Constraints          | PRIMARY KEY, FOREIGN KEY, CHECK, UNIQUE, NOT NULL     |
| Joins                | Views, report queries (INNER, LEFT, aggregate joins)  |
| Subqueries           | Q1 (NOT IN), Q6 (correlated date filter)              |
| Aggregate Functions  | COUNT, AVG, SUM, ROUND — in views and queries         |
| GROUP BY / HAVING    | Department-wise stats, revenue by month               |
| Views                | 4 views in `db/views.sql`                             |
| Triggers             | 3 row-level triggers in `db/triggers.sql`             |
| Transactions         | Payment update wrapped in BEGIN/COMMIT in controller  |
| Normalization        | All tables in 3NF (documented in README.md)           |
| ER → Relational Map  | Documented in README.md with schema diagram           |

---

## Running the Project

```bash
# 1. Database setup
psql -U postgres -c "CREATE DATABASE hospital_mgmt;"
psql -U postgres -d hospital_mgmt -f db/schema.sql
psql -U postgres -d hospital_mgmt -f db/triggers.sql
psql -U postgres -d hospital_mgmt -f db/views.sql
psql -U postgres -d hospital_mgmt -f db/seed.sql

# 2. Backend
cd backend
cp ../.env.example .env    # fill in your values
npm install
npm run dev                # nodemon server.js → http://localhost:5000

# 3. Frontend
cd frontend
npm install
npm run dev                # Vite → http://localhost:5173
```

---

## Viva / Exam Talking Points

1. **Why triggers?** Automated bed count management prevents race conditions vs. application-level checks
2. **Why views?** Abstract complex joins; expose only relevant data (security + simplicity)
3. **Normalization:** All tables are in 3NF — every non-key attribute depends only on the whole key and nothing but the key (no transitive dependencies)
4. **UNIQUE constraint on appointment** enforces no double-booking at the DB level, not just app level
5. **Parameterized queries** prevent SQL injection attacks
6. **Transactions** in billing ensure paid_amount and payment_status stay consistent atomically
7. **ON DELETE CASCADE vs RESTRICT** — different business rules: deleting a patient removes their appointments, but doctor deletion is blocked if they have appointments (referential integrity)
