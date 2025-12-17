-- Enhanced Lobby Schema Updates
-- Run this in Supabase SQL Editor AFTER the original migration

-- Add new columns to lobbies table
ALTER TABLE lobbies ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;
ALTER TABLE lobbies ADD COLUMN IF NOT EXISTS time_mode VARCHAR(20) DEFAULT 'unlimited';
-- 'unlimited', 'per_move', 'time_bank'
ALTER TABLE lobbies ADD COLUMN IF NOT EXISTS time_per_move INTEGER DEFAULT 30;
-- seconds for per_move mode
ALTER TABLE lobbies ADD COLUMN IF NOT EXISTS time_bank INTEGER DEFAULT 120;
-- total seconds for time_bank mode
ALTER TABLE lobbies ADD COLUMN IF NOT EXISTS default_takeovers INTEGER DEFAULT 5;
ALTER TABLE lobbies ADD COLUMN IF NOT EXISTS round_number INTEGER DEFAULT 1;

-- Add new columns to players table
ALTER TABLE players ADD COLUMN IF NOT EXISTS takeovers_setting INTEGER DEFAULT 5;
-- can override per-player
ALTER TABLE players ADD COLUMN IF NOT EXISTS time_remaining INTEGER;
-- for time_bank tracking
ALTER TABLE players ADD COLUMN IF NOT EXISTS confirm_moves BOOLEAN DEFAULT true;
ALTER TABLE players ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
-- for tracking disconnections

-- Add rematch tracking to games
ALTER TABLE games ADD COLUMN IF NOT EXISTS round_number INTEGER DEFAULT 1;
ALTER TABLE games ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'playing';
-- 'playing', 'finished', 'rematch_pending'

-- Index for Quick Play (public lobbies)
CREATE INDEX IF NOT EXISTS idx_lobbies_public ON lobbies(is_public, status) WHERE is_public = true;
