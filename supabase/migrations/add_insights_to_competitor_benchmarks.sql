-- Add insights column to competitor_benchmarks for persisting generated AI insights
ALTER TABLE competitor_benchmarks ADD COLUMN IF NOT EXISTS insights JSONB DEFAULT '[]'::jsonb;
