-- Initial schema for Signal Dash

CREATE TABLE IF NOT EXISTS experiments (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  hypothesis TEXT NOT NULL,
  primary_metric TEXT NOT NULL DEFAULT 'conversion',
  status TEXT NOT NULL DEFAULT 'Draft',
  owner TEXT NOT NULL DEFAULT 'unknown',
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  decision TEXT, -- 'Ship' | 'Kill' | 'Iterate' | NULL
  notes TEXT
);

CREATE TABLE IF NOT EXISTS variants (
  id SERIAL PRIMARY KEY,
  experiment_id INT NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_control BOOLEAN NOT NULL DEFAULT FALSE
);

-- event_type: 'exposure' or 'conversion'
CREATE TABLE IF NOT EXISTS events (
  id BIGSERIAL PRIMARY KEY,
  experiment_id INT NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
  variant_id INT NOT NULL REFERENCES variants(id) ON DELETE CASCADE,
  user_key TEXT NOT NULL,
  event_type TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  props JSONB NOT NULL DEFAULT '{}'::jsonb
);
