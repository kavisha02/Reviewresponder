/**
 * API Route: POST /api/reviews/publish-response
 *
 * Saves the final response text to Supabase and marks the review
 * as "published". In a future phase, this will also POST the response
 * to the Google Business Profile API.
 *
 * Request body: { reviewId: string, responseText: string }
 * Response:     { success: true }
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { reviewId, responseText } = await request.json();

    if (!reviewId || !responseText?.trim()) {
      return NextResponse.json(
        { error: "reviewId and responseText are required" },
        { status: 400 }
      );
    }

    // Verify the review belongs to this user before updating
    const { data: review } = await supabase
      .from("reviews")
      .select("id, businesses(user_id)")
      .eq("id", reviewId)
      .single();

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // @ts-expect-error — Supabase join typing
    if (review.businesses.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Save the published response and mark as responded
    const { error } = await supabase
      .from("reviews")
      .update({
        published_response: responseText.trim(),
        status:             "published",
        published_at:       new Date().toISOString(),
        // Keep draft_response intact so the owner can see what was originally generated
      })
      .eq("id", reviewId);

    if (error) {
      console.error("Publish error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // ── TODO (Phase 3 Google API approval): post to Google here ──────────
    // const googleRes = await postReplyToGoogle(
    //   business.google_location_id,
    //   review.external_id,
    //   responseText
    // );
    // ─────────────────────────────────────────────────────────────────────

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("Unexpected publish error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
