-- Migration: Add owner response fields to reviews table
-- These columns store owner responses from Google Maps

ALTER TABLE reviews
ADD COLUMN owner_response TEXT,
ADD COLUMN owner_response_date TIMESTAMP WITH TIME ZONE;

-- Add index for faster lookups
CREATE INDEX idx_reviews_owner_response ON reviews(owner_response);
