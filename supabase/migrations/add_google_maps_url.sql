-- Migration: Add google_maps_url column to businesses table
-- This column stores the Google Maps URL for the business listing
-- Used by the Apify scraper to fetch reviews

ALTER TABLE businesses
ADD COLUMN google_maps_url TEXT;

-- Add index for faster lookups
CREATE INDEX idx_businesses_google_maps_url ON businesses(google_maps_url);
