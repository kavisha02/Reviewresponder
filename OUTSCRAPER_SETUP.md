# Outscraper Integration Setup

## Step 1: Get Outscraper API Key

1. Go to https://outscraper.com/google-maps-reviews-scraper/
2. Sign up for a free account
3. Go to **API Keys** section
4. Copy your API key

## Step 2: Add to .env.local

```bash
OUTSCRAPER_API_KEY=your_api_key_here
```

## Step 3: Find Your Google Place ID

### Option A: From Google Maps URL
1. Open Google Maps
2. Search for your business
3. Look at the URL: `https://www.google.com/maps/place/.../@...`
4. The Place ID is in the URL (looks like: `ChIJN1blFLsB3ogAeUBAIQK8J0s`)

### Option B: Using Outscraper's Search
1. Go to https://app.outscraper.com/
2. Search for your business
3. Copy the Place ID shown

## Step 4: Sync Reviews

1. Go to your Dashboard
2. Click **"Sync Real Reviews"** button (next to sort dropdown)
3. Paste your Google Place ID
4. Click **"Sync Reviews"**
5. Wait for the sync to complete (usually 5-30 seconds)
6. Page will refresh with real reviews from Google Maps

## Free Tier Limits

- **500 reviews free** per account
- After that: $3 per 1,000 reviews
- Great for testing!

## What Gets Synced

✅ Review text  
✅ Star rating (1-5)  
✅ Author name  
✅ Author photo  
✅ Review date  
✅ Owner responses (if any)  

All synced reviews start with status **"new"** so you can generate AI responses for them.

## Example Google Place IDs

- **Starbucks NYC**: ChIJN1blFLsB3ogAeUBAIQK8J0s
- **McDonald's Times Square**: ChIJqaHlG2lZwokRVfM7dMWy6DQ
- **Pizza Hut**: ChIJN1blFLsB3ogAeUBAIQK8J0s

(Search your business on Google Maps to find yours)
