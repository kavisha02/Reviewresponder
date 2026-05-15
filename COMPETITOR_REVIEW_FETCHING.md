# Competitor Review Fetching - Debugging Guide

## Issue
When adding a competitor, reviews are not being fetched from Google Places API.

## Root Cause
The Google Places API has limitations:
- **Free Tier**: Returns only up to 5 reviews per place
- **Requires API Key**: Must have `GOOGLE_PLACES_API_KEY` environment variable set
- **Requires Fields Parameter**: Must explicitly request `reviews` field in the API call
- **API Quota**: May be rate-limited or quota-exceeded

## How to Debug

### 1. Check Environment Variable
```bash
# Verify GOOGLE_PLACES_API_KEY is set
echo $GOOGLE_PLACES_API_KEY
```

### 2. Check Server Logs
When adding a competitor, look for these log messages:

```
Extracted place ID from URL: ChIJ...
Fetching place details for place ID: ChIJ...
Google Places API response status: OK
Place details retrieved: { name: "...", rating: 4.5, totalReviews: 120, reviewsCount: 5 }
Processing 5 reviews from Google Places API
Inserting 5 reviews into database
Analyzing sentiment for 5 reviews...
Sentiment breakdown: { positive: 3, mixed: 1, negative: 1 }
Successfully added 5 reviews for competitor
```

### 3. Common Issues

#### Issue: "No reviews found for competitor"
**Cause**: Google Places API returned 0 reviews
**Solution**: 
- Check if the place exists on Google Maps
- Verify the place ID is correct
- Check API quota and billing

#### Issue: "GOOGLE_PLACES_API_KEY is not configured"
**Cause**: Environment variable not set
**Solution**:
```bash
# Add to .env.local
GOOGLE_PLACES_API_KEY=your_api_key_here
```

#### Issue: "Google Places API response status: ZERO_RESULTS"
**Cause**: Place ID is invalid or place doesn't exist
**Solution**:
- Verify the Google Maps URL is correct
- Try searching by business name instead

#### Issue: "Google Places API response status: REQUEST_DENIED"
**Cause**: API key is invalid or doesn't have Places API enabled
**Solution**:
- Go to Google Cloud Console
- Enable "Places API"
- Verify API key has correct permissions

## Current Implementation

### Review Fetching Flow
1. Extract place ID from Google Maps URL (if provided)
2. If no place ID, search by competitor name
3. Fetch place details including reviews
4. For each review:
   - Analyze sentiment using Gemini AI
   - Extract topics
5. Store in database
6. Calculate sentiment breakdown

### Limitations
- Google Places API free tier: max 5 reviews per place
- Paid tier: up to 30 reviews per place
- Reviews are cached, not real-time

## Next Steps to Improve

### Option 1: Use Apify Google Maps Scraper
- Fetch more reviews (up to 500)
- More detailed review data
- Requires Apify account and credits

### Option 2: Implement Review Caching
- Cache reviews locally
- Update on manual sync
- Reduce API calls

### Option 3: Add Fallback Data
- If no reviews available, show placeholder
- Allow manual review entry
- Show "Fetching reviews..." state

## Testing

### Test with a Real Business
1. Go to Google Maps
2. Find a business with many reviews
3. Copy the Google Maps URL
4. Add as competitor
5. Check server logs for detailed output
6. Verify reviews appear in database

### Test with Business Name
1. Don't provide Google Maps URL
2. Just enter business name
3. System will search and find place ID
4. Fetch reviews automatically

## Monitoring

Check these metrics:
- Number of reviews fetched per competitor
- Sentiment distribution (positive/mixed/negative)
- Topics extracted
- API response times
- Error rates

## Support

If reviews still aren't fetching:
1. Check server logs for error messages
2. Verify Google Places API is enabled
3. Check API quota in Google Cloud Console
4. Try with a different business
5. Contact support with error logs
