# Hospital Management System
### BCS403 DBMS Mini Project | VTU Sem IV – AIML | BMSIT&M

A full-stack Hospital Management System demonstrating all core DBMS concepts: DDL/DML, Joins, Views, Triggers, Stored Procedures, Normalization, and Transactions.

---

## ER Diagram (Conceptual)

```
┌─────────────┐        ┌──────────────┐        ┌─────────────┐
│ DEPARTMENT  │  1─── M│   DOCTOR     │ M ─── M│ APPOINTMENT │
│─────────────│        │──────────────│        │─────────────│
│ dept_id  PK │        │ doctor_id PK │        │ appt_id  PK │
│ dept_name   │        │ name         │        │ patient_id  │
│ location    │        │ speciality   │        │ doctor_id   │
│ head_doctor │        │ salary       │        │ appt_date   │
└─────────────┘        └──────────────┘        │ status      │
                                               └──────┬──────┘
                                                      │ 1
                                                      │
┌─────────────┐        ┌──────────────┐        ┌──────▼──────┐
│   PATIENT   │  1─── M│  ADMISSION   │        │ PRESCRIPTION│
│─────────────│        │──────────────│        │─────────────│
│ patient_id  │        │ admission_id │        │ rx_id    PK │
│ name        │        │ patient_id   │        │ appt_id  FK │
│ dob         │        │ ward_id      │        │ medicine    │
│ blood_group │        │ admit_date   │        │ dosage      │
└──────┬──────┘        └──────┬───────┘        └─────────────┘
       │ 1                    │ M
       │               ┌──────▼──────┐
       │ 1─── M        │    WARD     │
┌──────▼──────┐        │─────────────│
│   BILLING   │        │ ward_id  PK │
│─────────────│        │ ward_name   │
│ bill_id  PK │        │ ward_type   │
│ patient_id  │        │ total_beds  │
│ total_amount│        │ avail_beds  │
│ paid_amount │        └─────────────┘
│ status      │
└─────────────┘
```

## Normalization Analysis (3NF proof)

All tables satisfy 3NF:
- **1NF**: All attributes are atomic, no repeating groups
- **2NF**: No partial dependencies (all tables have single-column PKs, so 2NF is trivially satisfied)
- **3NF**: No transitive dependencies
  - `billing`: `payment_status` is derived via trigger, not stored as a transitive dependency
  - `department.head_doctor` → FK, not a transitive FD through a non-key attribute
  - `appointment.status` depends only on `appt_id`

## Quick Start

```bash
# 1. Clone / extract project
# 2. Database
psql -U postgres -c "CREATE DATABASE hospital_mgmt;"
psql -U postgres -d hospital_mgmt -f db/schema.sql
psql -U postgres -d hospital_mgmt -f db/triggers.sql
psql -U postgres -d hospital_mgmt -f db/views.sql
psql -U postgres -d hospital_mgmt -f db/seed.sql

# 3. Backend
cd backend && cp ../.env.example .env
# Edit .env with your DB credentials
npm install && npm run dev

# 4. Frontend
cd frontend && npm install && npm run dev
# Open http://localhost:5173
```

## DBMS Concepts Demonstrated

| # | Concept | File |
|---|---------|------|
| 1 | DDL – CREATE TABLE, constraints | db/schema.sql |
| 2 | DML – INSERT, UPDATE, DELETE | db/seed.sql + API routes |
| 3 | DQL – SELECT with JOINs | All controllers |
| 4 | Aggregate + GROUP BY | v_monthly_revenue, v_dept_load |
| 5 | Subqueries | billing route, doctor queries |
| 6 | Views | db/views.sql (6 views) |
| 7 | Triggers | db/triggers.sql (4 triggers) |
| 8 | Stored Functions | db/views.sql (2 functions) |
| 9 | Transactions | wards route – discharge+bill in BEGIN/COMMIT |
| 10 | Normalization (3NF) | Schema design + this README |

## Team / Author

- Name: ___________________________
- USN:  ___________________________
- Section: ___  |  Semester: IV AIML
- Guide: ___________________________
