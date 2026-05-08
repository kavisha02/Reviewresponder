# Google Places API - Sync Real Reviews

## Setup (5 minutes)

### Step 1: Get Your Google Places API Key

You already have this! It's the same key you use for Gemini.

**If you don't have it yet:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable **Places API**
4. Create an API key
5. Add to `.env.local`:

```bash
GOOGLE_PLACES_API_KEY=your_key_here
```

### Step 2: Find Your Google Place ID

**Method 1: From Google Maps URL**
1. Open Google Maps
2. Search for your business
3. Look at the URL: `https://www.google.com/maps/place/...`
4. The Place ID is in the URL (looks like: `ChIJN1blFLsB3ogAeUBAIQK8J0s`)

**Method 2: Using Google Places API**
1. Go to [Google Places API Explorer](https://developers.google.com/maps/documentation/places/web-service/overview)
2. Search for your business
3. Copy the Place ID

### Step 3: Sync Reviews

1. Go to your Dashboard
2. Click **"Sync Real Reviews"** button
3. Paste your Google Place ID
4. Click **"Sync Reviews"**
5. Wait for sync to complete
6. Page refreshes with real reviews!

---

## What You Get

✅ **Up to 5 reviews per sync** (free tier)  
✅ **Real reviews from Google Maps**  
✅ **Author names & photos**  
✅ **Star ratings**  
✅ **Review dates**  
✅ **Completely legal** (official API)  
✅ **$0 cost** (free tier)  

---

## Pricing

| Tier | Cost | Reviews |
|---|---|---|
| **Free** | $0 | 5 per sync |
| **Paid** | $7 per 1,000 | Unlimited |

---

## Example Place IDs

Search your business on Google Maps and copy the ID from the URL.

---

## Troubleshooting

**"API key not configured"**
- Add `GOOGLE_PLACES_API_KEY` to `.env.local`
- Restart your dev server

**"No reviews found"**
- Make sure the Place ID is correct
- The business must have reviews on Google Maps

**"Failed to sync"**
- Check your API key is valid
- Make sure Places API is enabled in Google Cloud Console

---

## Next Steps

Once you have real reviews synced:
1. Generate AI responses for them
2. Test the full workflow
3. When ready, upgrade to paid tier for unlimited reviews
