-- ============================================================
-- Hospital Management System — Triggers
-- ============================================================

-- ============================================================
-- TRIGGER 1: Decrement available_beds on new admission
-- Fires AFTER INSERT on admission
-- ============================================================
CREATE OR REPLACE FUNCTION trg_decrement_beds()
RETURNS TRIGGER AS $$
DECLARE
  v_available INT;
BEGIN
  -- Decrement
  UPDATE ward
  SET available_beds = available_beds - 1
  WHERE ward_id = NEW.ward_id;

  -- Check it didn't go negative
  SELECT available_beds INTO v_available
  FROM ward WHERE ward_id = NEW.ward_id;

  IF v_available < 0 THEN
    RAISE EXCEPTION 'Ward % has no available beds. Admission denied.', NEW.ward_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trig_after_admission_insert ON admission;
CREATE TRIGGER trig_after_admission_insert
AFTER INSERT ON admission
FOR EACH ROW
EXECUTE FUNCTION trg_decrement_beds();

-- ============================================================
-- TRIGGER 2: Increment available_beds on discharge
-- Fires AFTER UPDATE on admission (when discharge_date is set)
-- ============================================================
CREATE OR REPLACE FUNCTION trg_increment_beds()
RETURNS TRIGGER AS $$
BEGIN
  -- Only act when discharge_date transitions from NULL → a date
  IF NEW.discharge_date IS NOT NULL AND OLD.discharge_date IS NULL THEN
    UPDATE ward
    SET available_beds = available_beds + 1
    WHERE ward_id = NEW.ward_id;

    RAISE NOTICE 'Patient % discharged from ward %. Bed freed.',
                  NEW.patient_id, NEW.ward_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trig_after_discharge_update ON admission;
CREATE TRIGGER trig_after_discharge_update
AFTER UPDATE ON admission
FOR EACH ROW
EXECUTE FUNCTION trg_increment_beds();

-- ============================================================
-- TRIGGER 3: Auto-update payment_status in billing
-- Fires BEFORE INSERT OR UPDATE on billing
-- Shows salary-difference style logic (like IPCC Experiment 4)
-- ============================================================
CREATE OR REPLACE FUNCTION trg_update_payment_status()
RETURNS TRIGGER AS $$
DECLARE
  v_old_paid NUMERIC := COALESCE(OLD.paid_amount, 0);
  v_diff     NUMERIC;
BEGIN
  -- Compute difference for logging (mirrors IPCC Exp 4 pattern)
  v_diff := NEW.paid_amount - v_old_paid;

  IF v_diff <> 0 THEN
    RAISE NOTICE 'Bill %: payment changed by % (old=%, new=%)',
                  NEW.bill_id, v_diff, v_old_paid, NEW.paid_amount;
  END IF;

  -- Auto-derive status
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

DROP TRIGGER IF EXISTS trig_before_billing_upsert ON billing;
CREATE TRIGGER trig_before_billing_upsert
BEFORE INSERT OR UPDATE ON billing
FOR EACH ROW
EXECUTE FUNCTION trg_update_payment_status();

-- ============================================================
-- TRIGGER 4: Prevent double-booking via trigger (belt + suspenders)
-- The UNIQUE constraint handles this, but this gives a nice message
-- ============================================================
CREATE OR REPLACE FUNCTION trg_check_schedule_conflict()
RETURNS TRIGGER AS $$
DECLARE
  v_count INT;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM appointment
  WHERE doctor_id = NEW.doctor_id
    AND appt_date = NEW.appt_date
    AND appt_time = NEW.appt_time
    AND appt_id  <> COALESCE(NEW.appt_id, -1)
    AND status NOT IN ('Cancelled', 'No-Show');

  IF v_count > 0 THEN
    RAISE EXCEPTION 'Doctor % already has an appointment on % at %. Please choose another time.',
                     NEW.doctor_id, NEW.appt_date, NEW.appt_time;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trig_before_appointment_insert ON appointment;
CREATE TRIGGER trig_before_appointment_insert
BEFORE INSERT OR UPDATE ON appointment
FOR EACH ROW
EXECUTE FUNCTION trg_check_schedule_conflict();

SELECT 'Triggers created successfully.' AS status;
