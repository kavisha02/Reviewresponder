-- Add owner response fields to competitor_reviews table
ALTER TABLE competitor_reviews ADD COLUMN IF NOT EXISTS owner_response TEXT;
ALTER TABLE competitor_reviews ADD COLUMN IF NOT EXISTS owner_response_date TIMESTAMP WITH TIME ZONE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_competitor_reviews_has_response ON competitor_reviews(competitor_benchmark_id) WHERE owner_response IS NOT NULL;
