CREATE TYPE calendar_event_kind AS ENUM ('MEETING','DEADLINE','EVENT','TRAINING');
CREATE TABLE calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title varchar(180) NOT NULL,
  kind calendar_event_kind NOT NULL DEFAULT 'MEETING',
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT calendar_event_dates_valid CHECK (ends_at IS NULL OR ends_at >= starts_at)
);
CREATE INDEX calendar_events_starts_at_idx ON calendar_events(starts_at);
