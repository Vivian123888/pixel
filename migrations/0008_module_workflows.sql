ALTER TABLE module_entries
  ADD COLUMN IF NOT EXISTS assignee_id uuid REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS file_data bytea;

CREATE INDEX IF NOT EXISTS module_entries_assignee_idx ON module_entries(assignee_id);

CREATE TABLE IF NOT EXISTS module_file_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id uuid NOT NULL REFERENCES module_entries(id) ON DELETE CASCADE,
  version integer NOT NULL,
  file_name varchar(180) NOT NULL,
  content_type varchar(160) NOT NULL,
  file_size integer NOT NULL,
  file_data bytea NOT NULL,
  uploaded_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(entry_id, version)
);
CREATE INDEX IF NOT EXISTS module_file_versions_entry_version_idx ON module_file_versions(entry_id, version);

