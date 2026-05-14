-- Create analytics_cache table for storing analysis results
CREATE TABLE IF NOT EXISTS analytics_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis_type TEXT NOT NULL CHECK (analysis_type IN ('category', 'sentiment', 'insights', 'summary')),
  results JSONB NOT NULL,
  review_count INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(business_id, analysis_type)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_analytics_cache_business_id ON analytics_cache(business_id);
CREATE INDEX IF NOT EXISTS idx_analytics_cache_user_id ON analytics_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_cache_analysis_type ON analytics_cache(analysis_type);

-- Enable RLS
ALTER TABLE analytics_cache ENABLE ROW LEVEL SECURITY;

-- Create RLS policy: users can only see their own business analytics
CREATE POLICY "Users can view their own business analytics"
  ON analytics_cache FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own business analytics"
  ON analytics_cache FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own business analytics"
  ON analytics_cache FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own business analytics"
  ON analytics_cache FOR DELETE
  USING (user_id = auth.uid());
