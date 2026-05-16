-- Table for persisting multi-competitor AI recommendations per business
CREATE TABLE IF NOT EXISTS competitor_multi_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  recommendations JSONB DEFAULT '[]',
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, business_id)
);

CREATE INDEX IF NOT EXISTS idx_multi_recs_business_id ON competitor_multi_recommendations(business_id);
CREATE INDEX IF NOT EXISTS idx_multi_recs_user_id ON competitor_multi_recommendations(user_id);

ALTER TABLE competitor_multi_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own multi recommendations"
  ON competitor_multi_recommendations FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
