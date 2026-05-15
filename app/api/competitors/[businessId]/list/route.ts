/**
 * API Route: GET /api/competitors/:businessId
 *
 * Fetches all competitors for a business.
 *
 * Response: { competitors: CompetitorBenchmark[] }
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ businessId: string }> }
) {
  try {
    const { businessId } = await params;
    const supabase = await createClient();

    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify business belongs to user
    const { data: business } = await supabase
      .from("businesses")
      .select("id")
      .eq("id", businessId)
      .eq("user_id", user.id)
      .single();

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // Fetch all competitors for this business
    const { data: competitors, error: fetchError } = await supabase
      .from("competitor_benchmarks")
      .select("*")
      .eq("user_id", user.id)
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });

    if (fetchError) {
      console.error("Error fetching competitors:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch competitors" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      competitors: competitors || [],
    });
  } catch (err: unknown) {
    console.error("List competitors error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
