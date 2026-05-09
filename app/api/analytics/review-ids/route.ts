/**
 * API Route: GET /api/analytics/review-ids
 *
 * Returns all review IDs for a business.
 * Used by TopicAnalysis component to track which reviews have been analyzed.
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

    // Get all review IDs with text
    const { data: reviews } = await supabase
      .from("reviews")
      .select("id")
      .eq("business_id", businessId)
      .not("review_text", "is", null);

    return NextResponse.json({ ids: reviews?.map(r => r.id) || [] });

  } catch (err) {
    console.error("Review IDs error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
