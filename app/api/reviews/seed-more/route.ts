/**
 * API Route: POST /api/reviews/seed-more
 *
 * Re-seeds 28 diverse mock reviews for an existing business.
 * Useful when a business was created before the full mock-review set existed.
 *
 * Steps:
 *   1. Verify auth + ownership
 *   2. Delete all existing mock reviews (external_id starts with "mock_")
 *   3. Insert the full 28-review set
 *
 * Request body: { businessId: string }
 * Response:     { success: true, count: 28 }
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getMockReviews } from "@/lib/mock-reviews";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { businessId } = await request.json();

    if (!businessId) {
      return NextResponse.json({ error: "businessId is required" }, { status: 400 });
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

    // Remove all previously seeded mock reviews for this business
    await supabase
      .from("reviews")
      .delete()
      .eq("business_id", businessId)
      .like("external_id", "mock_%");

    // Insert the full 28-review set
    const { error } = await supabase
      .from("reviews")
      .insert(getMockReviews(businessId));

    if (error) {
      console.error("Seed-more error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, count: 28 });

  } catch (err) {
    console.error("Unexpected seed-more error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
