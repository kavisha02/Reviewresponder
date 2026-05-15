/**
 * API Route: DELETE /api/competitors/:competitorId
 *
 * Removes a competitor from tracking.
 *
 * Response: { success: boolean, error?: string }
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ competitorId: string }> }
) {
  try {
    const { competitorId } = await params;
    const supabase = await createClient();

    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify competitor belongs to user
    const { data: competitor } = await supabase
      .from("competitor_benchmarks")
      .select("id")
      .eq("id", competitorId)
      .eq("user_id", user.id)
      .single();

    if (!competitor) {
      return NextResponse.json({ error: "Competitor not found" }, { status: 404 });
    }

    // Delete competitor (cascades to reviews, topics, snapshots)
    const { error: deleteError } = await supabase
      .from("competitor_benchmarks")
      .delete()
      .eq("id", competitorId);

    if (deleteError) {
      console.error("Error deleting competitor:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete competitor" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Competitor removed successfully",
    });
  } catch (err: unknown) {
    console.error("Delete competitor error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
