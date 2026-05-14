# Database Migrations

## Migration 1: Add google_maps_url Column

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy and paste the SQL from `supabase/migrations/add_google_maps_url.sql`
6. Click **Run**

```sql
ALTER TABLE businesses
ADD COLUMN google_maps_url TEXT;

CREATE INDEX idx_businesses_google_maps_url ON businesses(google_maps_url);
```

## Migration 2: Add Owner Response Fields

1. Go to **SQL Editor** → **New Query**
2. Copy and paste the SQL from `supabase/migrations/add_owner_response_fields.sql`
3. Click **Run**

```sql
ALTER TABLE reviews
ADD COLUMN owner_response TEXT,
ADD COLUMN owner_response_date TIMESTAMP WITH TIME ZONE;

CREATE INDEX idx_reviews_owner_response ON reviews(owner_response);
```

## Migration 3: Add Analytics Cache Table

1. Go to **SQL Editor** → **New Query**
2. Copy and paste the SQL from `supabase/migrations/add_analytics_cache_table.sql`
3. Click **Run**

This creates the `analytics_cache` table for storing analysis results with:
- Unique constraint on (business_id, analysis_type) for upsert operations
- Row-level security policies to ensure users only see their own analytics
- Indexes for fast lookups by business_id, user_id, and analysis_type

## What These Do:

**Migration 1:**
- Adds a `google_maps_url` column to store the Google Maps business listing URL
- Used by the Apify scraper to fetch reviews

**Migration 2:**
- Adds `owner_response` column to store existing owner responses from Google Maps
- Adds `owner_response_date` column to store when the owner responded
- These are populated when syncing reviews from Apify

**Migration 3:**
- Creates `analytics_cache` table to store analysis results (category, sentiment, insights, summary)
- Stores review_count to detect when new reviews are added (cache invalidation)
- Enables cross-device and cross-browser persistence of analysis results
- Replaces localStorage-based caching with Supabase database storage

## After Running:

- New businesses can have Google Maps URLs set during setup
- Reviews synced from Apify will include owner responses if they exist
- Users can save AI-generated responses which update the `published_response` column
- Response rate will be calculated based on reviews with `status = 'published'`
- Analysis results (category, sentiment, insights, summary) persist across devices and browsers
- Analysis is automatically invalidated when new reviews are fetched
