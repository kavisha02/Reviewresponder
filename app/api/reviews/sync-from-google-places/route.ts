/**
 * API Route: POST /api/reviews/sync-from-google-places
 *
 * Fetches reviews from Google Places API (free tier - up to 5 reviews)
 * and syncs them into the database.
 *
 * Uses the official Google Places API - no scraping, completely legal.
 *
 * Request body: { businessId: string, googlePlaceId: string }
 * Response:     { success: true, count: number, message: string }
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const GOOGLE_PLACES_API_URL = "https://places.googleapis.com/v1/places";

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

    if (!GOOGLE_PLACES_API_KEY) {
      return NextResponse.json(
        { error: "Google Places API key not configured" },
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

    // Fetch place details from Google Places API
    console.log(`Fetching reviews from Google Places for: ${googlePlaceId}`);

    const googleRes = await fetch(
      `${GOOGLE_PLACES_API_URL}/${googlePlaceId}?fields=displayName,reviews&key=${GOOGLE_PLACES_API_KEY}`
    );

    if (!googleRes.ok) {
      const error = await googleRes.json();
      console.error("Google Places API error:", error);
      return NextResponse.json(
        { error: "Failed to fetch from Google Places API" },
        { status: 500 }
      );
    }

    const placeData = await googleRes.json();

    // Check if reviews exist
    if (!placeData.reviews || placeData.reviews.length === 0) {
      return NextResponse.json(
        { success: true, count: 0, message: "No reviews found for this place" },
        { status: 200 }
      );
    }

    // Transform Google reviews to our format
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
      external_id:   review.name || `google_${review.publishTime}`,
      author_name:   review.authorAttribution?.displayName || "Anonymous",
      author_photo_url: review.authorAttribution?.photoUri || null,
      rating:        review.rating || 5,
      review_text:   review.originalText || review.text || null,
      review_date:   review.publishTime || new Date().toISOString(),
      status:        "new", // All synced reviews start as "new"
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

    // Insert new reviews into database
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

    // Send negative review alerts for new negative reviews
    if (inserted && inserted.length > 0) {
      const negativeReviews = inserted.filter((r: any) => r.rating <= 2);

      for (const review of negativeReviews) {
        try {
          await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notifications/send-negative-alert`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              businessId,
              reviewId: review.id,
            }),
          });
        } catch (alertError) {
          console.error("Failed to send negative alert:", alertError);
          // Don't fail the sync if alert fails
        }
      }
    }

    return NextResponse.json({
      success: true,
      count: inserted?.length || 0,
      message: `Successfully synced ${inserted?.length || 0} review${inserted?.length !== 1 ? "s" : ""} from Google Places`,
    });

  } catch (err) {
    console.error("Sync error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
