CREATE TABLE IF NOT EXISTS module_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module varchar(40) NOT NULL,
  category varchar(100) NOT NULL,
  title varchar(220) NOT NULL,
  description text,
  status varchar(40) NOT NULL DEFAULT 'EM_ANDAMENTO',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  owner_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS module_entries_module_idx ON module_entries(module);
CREATE INDEX IF NOT EXISTS module_entries_owner_idx ON module_entries(owner_id);
CREATE INDEX IF NOT EXISTS module_entries_updated_idx ON module_entries(updated_at);

