-- Create competitor_topics table for storing extracted topics from reviews
CREATE TABLE IF NOT EXISTS competitor_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_benchmark_id UUID NOT NULL REFERENCES competitor_benchmarks(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  mention_count INT DEFAULT 1,
  sentiment_score DECIMAL(3,2), -- -1 to 1

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(competitor_benchmark_id, topic)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_competitor_topics_benchmark_id ON competitor_topics(competitor_benchmark_id);

-- Enable RLS
ALTER TABLE competitor_topics ENABLE ROW LEVEL SECURITY;

-- Create RLS policy: inherit from competitor_benchmarks
CREATE POLICY "Users can view their own competitor topics"
  ON competitor_topics FOR SELECT
  USING (
    competitor_benchmark_id IN (
      SELECT id FROM competitor_benchmarks WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own competitor topics"
  ON competitor_topics FOR INSERT
  WITH CHECK (
    competitor_benchmark_id IN (
      SELECT id FROM competitor_benchmarks WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own competitor topics"
  ON competitor_topics FOR UPDATE
  USING (
    competitor_benchmark_id IN (
      SELECT id FROM competitor_benchmarks WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    competitor_benchmark_id IN (
      SELECT id FROM competitor_benchmarks WHERE user_id = auth.uid()
    )
  );
