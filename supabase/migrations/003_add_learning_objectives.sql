-- Migration: Add learning_objectives column to events table
-- Run this in the Supabase SQL Editor

-- Add learning_objectives column (array of text)
ALTER TABLE events ADD COLUMN IF NOT EXISTS learning_objectives TEXT[];

-- Verify the column was added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'events'
AND column_name = 'learning_objectives';
