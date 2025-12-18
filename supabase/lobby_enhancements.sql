-- Timer columns for lobbies table
-- Run this in Supabase SQL Editor

ALTER TABLE lobbies ADD COLUMN IF NOT EXISTS time_mode VARCHAR(20) DEFAULT 'unlimited';
ALTER TABLE lobbies ADD COLUMN IF NOT EXISTS time_per_move INTEGER DEFAULT 30;
ALTER TABLE lobbies ADD COLUMN IF NOT EXISTS time_bank INTEGER DEFAULT 120;
