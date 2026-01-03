-- Indexes for better query performance

CREATE INDEX IF NOT EXISTS idx_events_exp_variant_type_time
ON events (experiment_id, variant_id, event_type, occurred_at);

CREATE INDEX IF NOT EXISTS idx_events_user_key
ON events (user_key);
