-- Add constraints to events table for data integrity

-- Ensure event_type is only 'exposure' or 'conversion'
ALTER TABLE events
ADD CONSTRAINT chk_event_type
CHECK (event_type IN ('exposure', 'conversion'));

-- Enforce one event per user per experiment per type (deduplication)
CREATE UNIQUE INDEX IF NOT EXISTS ux_event_dedup
ON events (experiment_id, user_key, event_type);
