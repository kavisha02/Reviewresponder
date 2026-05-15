/**
 * Shared TypeScript interfaces used across the app.
 * Import from here instead of redefining types in every file.
 */

export interface Business {
  id: string;
  user_id: string;
  name: string;
  place_id: string | null;
  address: string | null;
  business_type: string | null;
  google_maps_url: string | null;
  tone: string;
  language: string;
  auto_publish_positive: boolean;
  created_at: string;
}

export interface Review {
  id: string;
  business_id: string;
  platform: string;
  external_id: string | null;
  author_name: string | null;
  author_photo_url: string | null;
  rating: number;
  review_text: string | null;
  review_date: string | null;
  status: "new" | "draft" | "published" | "ignored";
  draft_response: string | null;
  published_response: string | null;
  published_at: string | null;
  owner_response: string | null;
  owner_response_date: string | null;
  created_at: string;
}

export interface CompetitorBenchmark {
  id: string;
  user_id: string;
  business_id: string;
  competitor_name: string;
  competitor_location: string | null;
  google_maps_url: string | null;
  google_place_id: string | null;
  avg_rating: number | null;
  total_reviews: number | null;
  response_rate: number | null;
  positive_count: number;
  mixed_count: number;
  negative_count: number;
  reviews_last_30_days: number;
  reviews_last_90_days: number;
  english_count: number;
  hindi_count: number;
  hinglish_count: number;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CompetitorSnapshot {
  id: string;
  competitor_benchmark_id: string;
  avg_rating: number | null;
  total_reviews: number | null;
  response_rate: number | null;
  positive_count: number;
  mixed_count: number;
  negative_count: number;
  reviews_last_30_days: number;
  snapshot_date: string;
  created_at: string;
}

export interface CompetitorTopic {
  id: string;
  competitor_benchmark_id: string;
  topic: string;
  mention_count: number;
  sentiment_score: number | null;
  created_at: string;
  updated_at: string;
}

export interface CompetitorReview {
  id: string;
  competitor_benchmark_id: string;
  external_id: string;
  author_name: string | null;
  rating: number | null;
  review_text: string | null;
  review_date: string | null;
  sentiment: "positive" | "mixed" | "negative" | null;
  topics: string[] | null;
  created_at: string;
}
