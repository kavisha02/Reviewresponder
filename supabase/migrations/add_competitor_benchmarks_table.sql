-- Create competitor_benchmarks table for storing competitor metrics snapshots
CREATE TABLE IF NOT EXISTS competitor_benchmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  competitor_name TEXT NOT NULL,
  competitor_location TEXT,
  google_maps_url TEXT,
  google_place_id TEXT,

  -- Metrics snapshot
  avg_rating DECIMAL(3,2),
  total_reviews INT,
  response_rate DECIMAL(5,2),

  -- Sentiment breakdown
  positive_count INT DEFAULT 0,
  mixed_count INT DEFAULT 0,
  negative_count INT DEFAULT 0,

  -- Growth metrics
  reviews_last_30_days INT DEFAULT 0,
  reviews_last_90_days INT DEFAULT 0,

  -- Language distribution
  english_count INT DEFAULT 0,
  hindi_count INT DEFAULT 0,
  hinglish_count INT DEFAULT 0,

  -- Metadata
  last_synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id, business_id, google_place_id)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_competitor_benchmarks_user_id ON competitor_benchmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_competitor_benchmarks_business_id ON competitor_benchmarks(business_id);
CREATE INDEX IF NOT EXISTS idx_competitor_benchmarks_google_place_id ON competitor_benchmarks(google_place_id);

-- Enable RLS
ALTER TABLE competitor_benchmarks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own competitors"
  ON competitor_benchmarks FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own competitors"
  ON competitor_benchmarks FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own competitors"
  ON competitor_benchmarks FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own competitors"
  ON competitor_benchmarks FOR DELETE
  USING (user_id = auth.uid());
