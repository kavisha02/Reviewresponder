/**
 * Email Templates for ReviewResponder
 * Used for sending digest and alert emails via Resend
 */

export interface EmailData {
  businessName: string;
  businessType?: string;
  recipientEmail: string;
  recipientName?: string;
}

export interface NegativeReviewAlert extends EmailData {
  reviewText: string;
  rating: number;
  authorName?: string;
  reviewDate: string;
}

export interface DailyDigestData extends EmailData {
  totalReviews: number;
  newReviewsCount: number;
  averageRating: string;
  responseRate: number;
  negativeReviewsCount: number;
  positiveReviewsCount: number;
  recentReviews: Array<{
    text: string;
    rating: number;
    author?: string;
    date: string;
  }>;
  dashboardUrl: string;
}

export function getNegativeReviewAlertHTML(data: NegativeReviewAlert): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; }
          .alert-badge { display: inline-block; background: #dc2626; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; margin-top: 10px; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .review-box { background: white; border-left: 4px solid #dc2626; padding: 20px; margin: 20px 0; border-radius: 4px; }
          .rating { font-size: 24px; color: #fbbf24; margin: 10px 0; }
          .review-text { font-style: italic; color: #666; margin: 15px 0; }
          .author { color: #999; font-size: 14px; }
          .cta-button { display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 20px; font-weight: bold; }
          .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚨 Negative Review Alert</h1>
            <div class="alert-badge">Action Required</div>
          </div>
          <div class="content">
            <p>Hi ${data.recipientName || 'there'},</p>
            <p>A new negative review just landed on your <strong>${data.businessName}</strong> Google Business Profile.</p>

            <div class="review-box">
              <div class="rating">${'★'.repeat(data.rating)}${'☆'.repeat(5 - data.rating)}</div>
              <div class="review-text">"${data.reviewText}"</div>
              <div class="author">
                ${data.authorName ? `by ${data.authorName}` : 'Anonymous'} • ${data.reviewDate}
              </div>
            </div>

            <p><strong>Why this matters:</strong> Negative reviews can impact your ranking and reputation. Responding quickly and professionally can turn this into an opportunity to show your commitment to customer satisfaction.</p>

            <p><strong>What to do:</strong></p>
            <ol>
              <li>Log in to your ReviewResponder dashboard</li>
              <li>View the AI-drafted response</li>
              <li>Edit if needed and save</li>
              <li>Copy and paste to Google Business Profile</li>
            </ol>

            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="cta-button">View in Dashboard</a>

            <div class="footer">
              <p>© 2025 ReviewResponder • ${data.businessName}</p>
              <p>You're receiving this because you have alerts enabled for negative reviews.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

export function getDailyDigestHTML(data: DailyDigestData): string {
  const recentReviewsHTML = data.recentReviews
    .slice(0, 3)
    .map(
      (review) => `
        <div style="background: white; padding: 15px; margin: 10px 0; border-radius: 4px; border-left: 4px solid ${
          review.rating >= 4 ? '#10b981' : review.rating <= 2 ? '#dc2626' : '#f59e0b'
        };">
          <div style="font-size: 18px; color: #fbbf24; margin-bottom: 8px;">
            ${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}
          </div>
          <div style="color: #333; margin-bottom: 8px;">"${review.text.substring(0, 100)}..."</div>
          <div style="color: #999; font-size: 12px;">
            ${review.author ? `by ${review.author}` : 'Anonymous'} • ${review.date}
          </div>
        </div>
      `
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
          .stat-card { background: white; padding: 15px; border-radius: 6px; text-align: center; }
          .stat-value { font-size: 28px; font-weight: bold; color: #4f46e5; }
          .stat-label { color: #666; font-size: 12px; margin-top: 5px; }
          .cta-button { display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 20px; font-weight: bold; }
          .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 Daily Review Digest</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Your ${data.businessName} summary</p>
          </div>
          <div class="content">
            <p>Hi ${data.recipientName || 'there'},</p>
            <p>Here's your daily review summary for <strong>${data.businessName}</strong>.</p>

            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-value">${data.newReviewsCount}</div>
                <div class="stat-label">New Reviews</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${data.averageRating}★</div>
                <div class="stat-label">Avg Rating</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${data.responseRate}%</div>
                <div class="stat-label">Response Rate</div>
              </div>
              <div class="stat-card">
                <div class="stat-value">${data.totalReviews}</div>
                <div class="stat-label">Total Reviews</div>
              </div>
            </div>

            <h3 style="margin-top: 30px; color: #1f2937;">Recent Reviews</h3>
            ${recentReviewsHTML}

            <p style="margin-top: 20px; padding: 15px; background: #fef3c7; border-radius: 6px; border-left: 4px solid #f59e0b;">
              <strong>⚠️ Attention:</strong> You have ${data.negativeReviewsCount} negative review(s) that need responses.
            </p>

            <a href="${data.dashboardUrl}" class="cta-button">View Full Dashboard</a>

            <div class="footer">
              <p>© 2025 ReviewResponder • ${data.businessName}</p>
              <p>You're receiving this weekly digest because you have notifications enabled.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}
