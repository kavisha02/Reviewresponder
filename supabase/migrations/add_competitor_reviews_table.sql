-- Create competitor_reviews table for storing cached competitor reviews
CREATE TABLE IF NOT EXISTS competitor_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_benchmark_id UUID NOT NULL REFERENCES competitor_benchmarks(id) ON DELETE CASCADE,

  -- Review data (cached from Google Places API)
  external_id TEXT NOT NULL,
  author_name TEXT,
  rating INT,
  review_text TEXT,
  review_date TIMESTAMP WITH TIME ZONE,

  -- Sentiment & topics (from Gemini analysis)
  sentiment TEXT, -- 'positive', 'mixed', 'negative'
  topics TEXT[], -- array of extracted topics

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(competitor_benchmark_id, external_id)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_competitor_reviews_benchmark_id ON competitor_reviews(competitor_benchmark_id);
CREATE INDEX IF NOT EXISTS idx_competitor_reviews_rating ON competitor_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_competitor_reviews_sentiment ON competitor_reviews(sentiment);

-- Enable RLS
ALTER TABLE competitor_reviews ENABLE ROW LEVEL SECURITY;

-- Create RLS policy: inherit from competitor_benchmarks
CREATE POLICY "Users can view their own competitor reviews"
  ON competitor_reviews FOR SELECT
  USING (
    competitor_benchmark_id IN (
      SELECT id FROM competitor_benchmarks WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own competitor reviews"
  ON competitor_reviews FOR INSERT
  WITH CHECK (
    competitor_benchmark_id IN (
      SELECT id FROM competitor_benchmarks WHERE user_id = auth.uid()
    )
  );
