-- Add user_id to competitor_reviews for simpler RLS policies
ALTER TABLE competitor_reviews ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_competitor_reviews_user_id ON competitor_reviews(user_id);

-- Drop old RLS policies that use subqueries
DROP POLICY IF EXISTS "Users can view their own competitor reviews" ON competitor_reviews;
DROP POLICY IF EXISTS "Users can insert their own competitor reviews" ON competitor_reviews;
DROP POLICY IF EXISTS "Users can update their own competitor reviews" ON competitor_reviews;
DROP POLICY IF EXISTS "Users can delete their own competitor reviews" ON competitor_reviews;

-- Create new simpler RLS policies
CREATE POLICY "Users can view their own competitor reviews"
  ON competitor_reviews FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own competitor reviews"
  ON competitor_reviews FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own competitor reviews"
  ON competitor_reviews FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own competitor reviews"
  ON competitor_reviews FOR DELETE
  USING (user_id = auth.uid());
