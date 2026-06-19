-- Allow abandoned attempts when a student restarts a simulation
ALTER TABLE attempts DROP CONSTRAINT IF EXISTS attempts_status_check;
ALTER TABLE attempts ADD CONSTRAINT attempts_status_check
  CHECK (status IN ('in_progress', 'completed', 'abandoned'));
