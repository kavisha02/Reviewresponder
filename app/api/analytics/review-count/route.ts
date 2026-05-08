/**
 * API Route: GET /api/analytics/review-count
 *
 * Returns the count of reviews for a business.
 * Used by TopicAnalysis component to check if cache is still valid.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get("businessId");

    if (!businessId) {
      return NextResponse.json(
        { error: "businessId is required" },
        { status: 400 }
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

    // Get review count
    const { count } = await supabase
      .from("reviews")
      .select("*", { count: "exact", head: true })
      .eq("business_id", businessId)
      .not("review_text", "is", null);

    return NextResponse.json({ count: count || 0 });

  } catch (err) {
    console.error("Review count error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
