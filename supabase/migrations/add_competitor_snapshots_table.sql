-- Create competitor_snapshots table for historical trend tracking
CREATE TABLE IF NOT EXISTS competitor_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_benchmark_id UUID NOT NULL REFERENCES competitor_benchmarks(id) ON DELETE CASCADE,

  -- Snapshot data (immutable historical record)
  avg_rating DECIMAL(3,2),
  total_reviews INT,
  response_rate DECIMAL(5,2),
  positive_count INT,
  mixed_count INT,
  negative_count INT,
  reviews_last_30_days INT,

  -- Timestamp for trend calculation
  snapshot_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_competitor_snapshots_benchmark_id ON competitor_snapshots(competitor_benchmark_id);
CREATE INDEX IF NOT EXISTS idx_competitor_snapshots_date ON competitor_snapshots(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_competitor_snapshots_benchmark_date ON competitor_snapshots(competitor_benchmark_id, snapshot_date);

-- Enable RLS
ALTER TABLE competitor_snapshots ENABLE ROW LEVEL SECURITY;

-- Create RLS policy: inherit from competitor_benchmarks
CREATE POLICY "Users can view their own competitor snapshots"
  ON competitor_snapshots FOR SELECT
  USING (
    competitor_benchmark_id IN (
      SELECT id FROM competitor_benchmarks WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own competitor snapshots"
  ON competitor_snapshots FOR INSERT
  WITH CHECK (
    competitor_benchmark_id IN (
      SELECT id FROM competitor_benchmarks WHERE user_id = auth.uid()
    )
  );
