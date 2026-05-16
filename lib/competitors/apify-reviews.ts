/**
 * Apify Google Maps Reviews Scraper integration for competitors
 */

import { ApifyClient } from "apify-client";

const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN;
const APIFY_ACTOR_ID = "Xb8osYTtOjlsgI6k9";

export interface ApifyReview {
  reviewId?: string;
  id?: string;
  publishedAtDate?: string;
  publishedAt?: string;
  date?: string;
  name?: string;
  reviewerName?: string;
  reviewer?: string;
  author?: string;
  reviewerPhotoUrl?: string;
  reviewerPhoto?: string;
  authorPhoto?: string;
  stars?: number;
  rating?: number;
  text?: string;
  reviewText?: string;
  content?: string;
  ownerResponse?: string;
  responseFromOwnerText?: string;
  ownerReply?: string;
  ownerResponseDate?: string;
  responseFromOwnerDate?: string;
  ownerReplyDate?: string;
}

export async function fetchCompetitorReviewsFromApify(
  googleMapsUrl: string,
  maxReviews: number = 50
): Promise<ApifyReview[]> {
  if (!APIFY_API_TOKEN) {
    throw new Error("Apify API token not configured");
  }

  if (!googleMapsUrl) {
    throw new Error("Google Maps URL is required");
  }

  try {
    console.log(`Fetching ${maxReviews} reviews from Apify for URL: ${googleMapsUrl}`);

    const client = new ApifyClient({ token: APIFY_API_TOKEN });

    const input = {
      startUrls: [{ url: googleMapsUrl }],
      maxReviews: Math.min(maxReviews, 500),
      reviewsSort: "newest",
      language: "en",
      personalData: true,
    };

    console.log(`Calling Apify actor ${APIFY_ACTOR_ID} with input:`, input);

    const run = await client.actor(APIFY_ACTOR_ID).call(input);
    console.log(`Apify run completed with ID: ${run.id}`);
    console.log(`Apify run status:`, run.status);
    console.log(`Apify run exitCode:`, run.exitCode);

    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    console.log(`Apify returned ${items?.length || 0} reviews`);
    if (items && items.length > 0) {
      console.log(`First review sample:`, items[0]);
    }

    if (!items || items.length === 0) {
      console.warn("No reviews found from Apify");
      return [];
    }

    return items as ApifyReview[];
  } catch (error) {
    console.error("Error fetching reviews from Apify:", error);
    throw error;
  }
}

export function transformApifyReviewToCompetitorReview(item: ApifyReview, competitorId: string, placeId: string | null) {
  const externalId = item.reviewId || item.id || `apify_${item.publishedAtDate}`;
  const authorName = item.name || item.reviewerName || item.reviewer || item.author || "Anonymous";
  const rating = item.stars || item.rating || 5;
  const reviewText = item.text || item.reviewText || item.content || null;
  const reviewDate = item.publishedAtDate || item.publishedAt || item.date || new Date().toISOString();
  const ownerResponse = item.ownerResponse || item.responseFromOwnerText || item.ownerReply || null;
  const ownerResponseDate = item.ownerResponseDate || item.responseFromOwnerDate || item.ownerReplyDate || null;

  console.log(`Transforming review:`, {
    externalId,
    authorName,
    rating,
    reviewText: reviewText?.substring(0, 50),
    reviewDate,
    hasOwnerResponse: !!ownerResponse,
  });

  return {
    competitor_benchmark_id: competitorId,
    external_id: externalId,
    author_name: authorName,
    rating,
    review_text: reviewText,
    review_date: reviewDate,
    owner_response: ownerResponse,
    owner_response_date: ownerResponseDate,
    sentiment: null,
    topics: null,
  };
}
