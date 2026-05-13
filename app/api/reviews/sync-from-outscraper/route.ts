/**
 * API Route: POST /api/reviews/sync-from-outscraper
 *
 * Fetches real Google Maps reviews from Outscraper API and syncs them
 * into the database for a specific business.
 *
 * Uses the free tier (500 reviews) for testing.
 *
 * Request body: { businessId: string, googlePlaceId: string }
 * Response:     { success: true, count: number, message: string }
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const OUTSCRAPER_API_KEY = process.env.OUTSCRAPER_API_KEY;
const OUTSCRAPER_API_URL = "https://api.outscraper.com/api/v2/google-maps-reviews";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { businessId, googlePlaceId } = await request.json();

    if (!businessId || !googlePlaceId) {
      return NextResponse.json(
        { error: "businessId and googlePlaceId are required" },
        { status: 400 }
      );
    }

    if (!OUTSCRAPER_API_KEY) {
      return NextResponse.json(
        { error: "Outscraper API key not configured" },
        { status: 500 }
      );
    }

    // Verify ownership
    const { data: business } = await supabase
      .from("businesses")
      .select("id")
      .eq("id", businessId)
      .eq("user_id", user.id)
      .single();

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // Fetch reviews from Outscraper
    console.log(`Fetching reviews from Outscraper for place: ${googlePlaceId}`);

    const outscrapeRes = await fetch(OUTSCRAPER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": OUTSCRAPER_API_KEY,
      },
      body: JSON.stringify({
        queries: [googlePlaceId],
        limit: 100, // Fetch up to 100 reviews per request
        sort: "newest",
        language: "en",
      }),
    });

    if (!outscrapeRes.ok) {
      const error = await outscrapeRes.json();
      console.error("Outscraper error:", error);
      return NextResponse.json(
        { error: "Failed to fetch reviews from Outscraper" },
        { status: 500 }
      );
    }

    const outscrapeData = await outscrapeRes.json();

    // Parse Outscraper response
    if (!outscrapeData.data || !Array.isArray(outscrapeData.data)) {
      return NextResponse.json(
        { error: "Invalid response from Outscraper" },
        { status: 500 }
      );
    }

    const placeData = outscrapeData.data[0];
    if (!placeData || !placeData.reviews) {
      return NextResponse.json(
        { success: true, count: 0, message: "No reviews found for this place" },
        { status: 200 }
      );
    }

    // Transform Outscraper reviews to our format
    const reviewsToInsert: Array<{
      business_id: string;
      platform: string;
      external_id: string;
      author_name: string;
      author_photo_url: string | null;
      rating: number;
      review_text: string | null;
      review_date: string;
      status: string;
    }> = placeData.reviews.map((review: any) => ({
      business_id:   businessId,
      platform:      "google",
      external_id:   review.review_id || `outscraper_${review.review_datetime_utc}`,
      author_name:   review.reviewer_name || "Anonymous",
      author_photo_url: review.reviewer_image_url || null,
      rating:        parseInt(review.review_rating) || 5,
      review_text:   review.review_text || null,
      review_date:   review.review_datetime_utc || new Date().toISOString(),
      status:        "new",
    }));

    // Check for duplicates before inserting
    const existingExternalIds = reviewsToInsert.map((r) => r.external_id);

    const { data: existingReviews } = await supabase
      .from("reviews")
      .select("external_id")
      .eq("business_id", businessId)
      .in("external_id", existingExternalIds);

    const existingIds = new Set(existingReviews?.map((r) => r.external_id) || []);
    const newReviews = reviewsToInsert.filter((r) => !existingIds.has(r.external_id));

    if (newReviews.length === 0) {
      return NextResponse.json(
        { success: true, count: 0, message: "All reviews already synced" },
        { status: 200 }
      );
    }

    // Insert reviews into database
    const { error: insertError, data: inserted } = await supabase
      .from("reviews")
      .insert(newReviews)
      .select();

    if (insertError) {
      console.error("Insert error:", insertError);
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: inserted?.length || 0,
      message: `Successfully synced ${inserted?.length || 0} reviews from Google Maps`,
    });

  } catch (err) {
    console.error("Sync error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
