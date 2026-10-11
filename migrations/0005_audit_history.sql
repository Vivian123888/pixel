ALTER TABLE audit_logs
  ADD COLUMN IF NOT EXISTS details jsonb;
