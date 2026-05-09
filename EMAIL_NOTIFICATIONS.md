# Email Notifications & Digest System

## Overview

ReviewResponder now includes a comprehensive email notification system that keeps users informed about their reviews without requiring them to log in daily.

## Features

### 1. **Negative Review Alerts** 🚨
- **Trigger:** When a 1 or 2-star review is posted
- **Timing:** Instant (within minutes of review sync)
- **Content:** Full review text, rating, author, and action link
- **Purpose:** Allows quick response to negative feedback before it impacts ranking

### 2. **Daily Digest** 📊
- **Trigger:** Once per day at user's preferred time
- **Timing:** Scheduled (default 9 AM, customizable)
- **Content:** 
  - New reviews count
  - Average rating
  - Response rate
  - Recent reviews (last 5)
  - Negative reviews requiring attention
- **Purpose:** Provides complete overview without logging in

## Architecture

### Database Schema

```sql
notification_settings
├── user_id (FK to auth.users)
├── business_id (FK to businesses)
├── negative_alerts_enabled (boolean)
├── daily_digest_enabled (boolean)
├── digest_time (time)
├── notification_email (text)
└── timestamps
```

### API Endpoints

#### 1. Send Negative Alert
```
POST /api/notifications/send-negative-alert
Body: { businessId: string, reviewId: string }
Response: { success: boolean, messageId?: string }
```

**When to call:**
- After a new review is synced from Google Places API
- In the review creation flow

**Example:**
```typescript
await fetch("/api/notifications/send-negative-alert", {
  method: "POST",
  body: JSON.stringify({
    businessId: "business-123",
    reviewId: "review-456"
  })
});
```

#### 2. Send Daily Digest
```
POST /api/notifications/send-daily-digest
Body: { businessId: string }
Response: { success: boolean, messageId?: string, newReviewsCount: number }
```

**When to call:**
- Via cron job (e.g., every day at 9 AM)
- Can be called manually for testing

**Example:**
```typescript
await fetch("/api/notifications/send-daily-digest", {
  method: "POST",
  body: JSON.stringify({
    businessId: "business-123"
  })
});
```

#### 3. Update Settings
```
POST /api/notifications/update-settings
Body: {
  businessId: string,
  negativeAlerts: boolean,
  dailyDigest: boolean,
  digestTime: string,
  email: string
}
Response: { success: boolean, message: string }
```

**When to call:**
- User changes notification preferences in settings page

### Email Templates

#### Negative Review Alert
- Professional red alert styling
- Full review details
- Action buttons linking to dashboard
- Explanation of why it matters
- Step-by-step response instructions

#### Daily Digest
- Summary stats in grid layout
- Recent reviews with ratings
- Negative review count warning
- Link to full dashboard
- Customizable send time

## Integration Points

### 1. Review Sync Flow
When syncing reviews from Google Places API, call the negative alert endpoint:

```typescript
// In app/api/reviews/sync-from-google-places/route.ts
if (review.rating <= 2) {
  await fetch("/api/notifications/send-negative-alert", {
    method: "POST",
    body: JSON.stringify({
      businessId,
      reviewId: newReview.id
    })
  });
}
```

### 2. Cron Job for Daily Digest
Set up a cron job to send daily digests:

```typescript
// Example using a service like EasyCron or Vercel Cron
// Call: POST /api/notifications/send-daily-digest
// Schedule: Every day at 9 AM (user's timezone)
```

### 3. Settings Page
Users can manage notifications at:
```
/dashboard/settings/notifications?business=<business-id>
```

## User Experience

### First Time Setup
1. User signs up → Default settings enabled (both alerts and digest)
2. User can customize in settings page
3. Settings are saved per business (multi-location support)

### Notification Flow
1. **Negative Review Posted** → Instant alert email
2. **User clicks link** → Taken to dashboard with review highlighted
3. **User responds** → Saves draft response
4. **Daily 9 AM** → Digest email with all metrics

## Configuration

### Environment Variables
```
RESEND_API_KEY=your_resend_api_key
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### Email Addresses
- Alerts: `alerts@reviewresponder.com`
- Digest: `digest@reviewresponder.com`

## Future Enhancements

- [ ] Weekly digest option
- [ ] Custom alert thresholds (e.g., 1-3 stars)
- [ ] SMS alerts via Twilio
- [ ] Slack integration
- [ ] Digest frequency customization (daily/weekly/monthly)
- [ ] Email template customization
- [ ] Unsubscribe links
- [ ] Email delivery tracking

## Testing

### Test Negative Alert
```bash
curl -X POST http://localhost:3000/api/notifications/send-negative-alert \
  -H "Content-Type: application/json" \
  -d '{"businessId":"<id>","reviewId":"<id>"}'
```

### Test Daily Digest
```bash
curl -X POST http://localhost:3000/api/notifications/send-daily-digest \
  -H "Content-Type: application/json" \
  -d '{"businessId":"<id>"}'
```

## Troubleshooting

### Emails not sending
1. Check RESEND_API_KEY is set correctly
2. Verify email domain is verified in Resend
3. Check Resend dashboard for delivery status
4. Review server logs for errors

### Settings not saving
1. Verify notification_settings table exists
2. Check RLS policies are correct
3. Ensure user is authenticated
4. Check browser console for API errors

## Metrics & Analytics

Track email performance:
- Emails sent per day
- Open rates (via Resend)
- Click-through rates
- Unsubscribe rates
- Delivery failures

## Compliance

- GDPR: Users can opt-out of all emails
- CAN-SPAM: Unsubscribe links in all emails
- Privacy: Email addresses only used for notifications
- Data: Settings stored securely in Supabase
