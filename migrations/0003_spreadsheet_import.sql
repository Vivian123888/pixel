ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS sheet_acronym text,
  ADD COLUMN IF NOT EXISTS sheet_type text,
  ADD COLUMN IF NOT EXISTS sheet_target_audience text,
  ADD COLUMN IF NOT EXISTS sheet_coordinator text,
  ADD COLUMN IF NOT EXISTS sheet_co_coordinator text,
  ADD COLUMN IF NOT EXISTS sheet_student_leader text,
  ADD COLUMN IF NOT EXISTS source_sheet_row integer UNIQUE;

CREATE TABLE IF NOT EXISTS participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(160) NOT NULL,
  matricula varchar(40),
  linked_project text,
  current_affiliation text,
  exit_date text,
  attendance_date date,
  attendance_status varchar(40),
  source_sheet_row integer NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
