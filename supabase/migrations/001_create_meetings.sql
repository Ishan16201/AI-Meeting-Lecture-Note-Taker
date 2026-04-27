-- Create the meetings table with full-text search
CREATE TABLE meetings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL DEFAULT 'Untitled Meeting',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  duration_seconds INTEGER,
  speaker_count INTEGER,
  audio_url TEXT,
  utterances JSONB,
  summary JSONB,
  status TEXT CHECK (status IN ('processing', 'ready', 'failed')) DEFAULT 'processing',
  fts_vector TSVECTOR GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce((summary->>'tldr'), ''))
  ) STORED
);

-- Full-text search index
CREATE INDEX meetings_fts_idx ON meetings USING GIN (fts_vector);

-- Index for faster user queries
CREATE INDEX meetings_user_id_idx ON meetings(user_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own meetings
CREATE POLICY "Users can only access their own meetings"
  ON meetings FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policy: Allow insert for authenticated users (they can only insert their own due to user_id constraint)
CREATE POLICY "Users can insert their own meetings"
  ON meetings FOR INSERT
  WITH CHECK (auth.uid() = user_id);
