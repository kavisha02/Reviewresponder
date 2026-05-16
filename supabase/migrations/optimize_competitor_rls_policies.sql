-- Optimize RLS policies by adding user_id to competitor_topics and competitor_snapshots
-- This eliminates subqueries in RLS policies which cause database locks and write conflicts

-- Add user_id to competitor_topics
ALTER TABLE competitor_topics ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Backfill user_id from competitor_benchmarks
UPDATE competitor_topics ct
SET user_id = cb.user_id
FROM competitor_benchmarks cb
WHERE ct.competitor_benchmark_id = cb.id AND ct.user_id IS NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_competitor_topics_user_id ON competitor_topics(user_id);

-- Drop old RLS policies with subqueries
DROP POLICY IF EXISTS "Users can view their own competitor topics" ON competitor_topics;
DROP POLICY IF EXISTS "Users can insert their own competitor topics" ON competitor_topics;
DROP POLICY IF EXISTS "Users can update their own competitor topics" ON competitor_topics;
DROP POLICY IF EXISTS "Users can delete their own competitor topics" ON competitor_topics;

-- Create new simpler RLS policies without subqueries
CREATE POLICY "Users can view their own competitor topics"
  ON competitor_topics FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own competitor topics"
  ON competitor_topics FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own competitor topics"
  ON competitor_topics FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own competitor topics"
  ON competitor_topics FOR DELETE
  USING (user_id = auth.uid());

-- Add user_id to competitor_snapshots
ALTER TABLE competitor_snapshots ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Backfill user_id from competitor_benchmarks
UPDATE competitor_snapshots cs
SET user_id = cb.user_id
FROM competitor_benchmarks cb
WHERE cs.competitor_benchmark_id = cb.id AND cs.user_id IS NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_competitor_snapshots_user_id ON competitor_snapshots(user_id);

-- Drop old RLS policies with subqueries
DROP POLICY IF EXISTS "Users can view their own competitor snapshots" ON competitor_snapshots;
DROP POLICY IF EXISTS "Users can insert their own competitor snapshots" ON competitor_snapshots;
DROP POLICY IF EXISTS "Users can delete their own competitor snapshots" ON competitor_snapshots;

-- Create new simpler RLS policies without subqueries
CREATE POLICY "Users can view their own competitor snapshots"
  ON competitor_snapshots FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own competitor snapshots"
  ON competitor_snapshots FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own competitor snapshots"
  ON competitor_snapshots FOR DELETE
  USING (user_id = auth.uid());
