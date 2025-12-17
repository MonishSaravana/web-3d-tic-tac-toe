-- Tournament Tables for 3D T³
-- Run this SQL in your Supabase SQL Editor

-- Tournament lobby
CREATE TABLE IF NOT EXISTS tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(6) UNIQUE NOT NULL,
  name VARCHAR(50) DEFAULT 'Tournament',
  host_session_id VARCHAR(100) NOT NULL,
  status VARCHAR(20) DEFAULT 'waiting', -- waiting, in_progress, completed
  player_count INTEGER DEFAULT 4, -- 4 or 8
  current_round INTEGER DEFAULT 1,
  winner_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Players in a tournament
CREATE TABLE IF NOT EXISTS tournament_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  session_id VARCHAR(100) NOT NULL,
  nickname VARCHAR(50) NOT NULL,
  seed INTEGER, -- bracket position (1-8)
  eliminated BOOLEAN DEFAULT false,
  placement INTEGER, -- final standing
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tournament_id, session_id)
);

-- Individual matches in tournament
CREATE TABLE IF NOT EXISTS tournament_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  round INTEGER NOT NULL, -- 1 = first round, 2 = semifinals, etc.
  match_order INTEGER NOT NULL, -- position within round
  player1_id UUID REFERENCES tournament_participants(id),
  player2_id UUID REFERENCES tournament_participants(id),
  winner_id UUID REFERENCES tournament_participants(id),
  lobby_code VARCHAR(6), -- links to lobbies table for actual game
  status VARCHAR(20) DEFAULT 'pending', -- pending, ready, in_progress, completed
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable realtime for all tournament tables
ALTER PUBLICATION supabase_realtime ADD TABLE tournaments;
ALTER PUBLICATION supabase_realtime ADD TABLE tournament_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE tournament_matches;

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_tournament_code ON tournaments(code);
CREATE INDEX IF NOT EXISTS idx_tournament_participants_tournament ON tournament_participants(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_tournament ON tournament_matches(tournament_id);
