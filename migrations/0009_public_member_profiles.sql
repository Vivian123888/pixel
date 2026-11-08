ALTER TABLE users
  ADD COLUMN IF NOT EXISTS pixel_role varchar(100),
  ADD COLUMN IF NOT EXISTS entered_year integer,
  ADD COLUMN IF NOT EXISTS profile_project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS profile_photo_data bytea,
  ADD COLUMN IF NOT EXISTS profile_photo_type varchar(80);

CREATE TABLE IF NOT EXISTS public_visibility (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  show_active_members boolean NOT NULL DEFAULT true,
  show_former_members boolean NOT NULL DEFAULT true,
  show_portfolio boolean NOT NULL DEFAULT true,
  show_awards boolean NOT NULL DEFAULT true,
  updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public_visibility (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

