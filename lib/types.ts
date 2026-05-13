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
  created_at: string;
}
