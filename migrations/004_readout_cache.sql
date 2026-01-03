-- Add readout caching columns to experiments table

ALTER TABLE experiments
ADD COLUMN readout_text TEXT,
ADD COLUMN readout_source TEXT,
ADD COLUMN readout_generated_at TIMESTAMPTZ;
