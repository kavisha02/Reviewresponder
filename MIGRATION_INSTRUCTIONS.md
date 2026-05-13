# Database Migration: Add google_maps_url Column

## What to do:

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy and paste the SQL from `supabase/migrations/add_google_maps_url.sql`
6. Click **Run**

## SQL to execute:

```sql
ALTER TABLE businesses
ADD COLUMN google_maps_url TEXT;

CREATE INDEX idx_businesses_google_maps_url ON businesses(google_maps_url);
```

## What this does:

- Adds a `google_maps_url` column to store the Google Maps business listing URL
- Creates an index for faster lookups
- This column is used by the Apify scraper to fetch reviews

## After running:

- New businesses will no longer get 28 mock reviews seeded automatically
- Users must enter a Google Maps URL during setup or add it later
- Once a URL is set, they can click "Fetch More Reviews" to sync real reviews from Google Maps
