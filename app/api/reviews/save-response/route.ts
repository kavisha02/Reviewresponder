import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { reviewId, response } = await request.json();

    if (!reviewId || !response?.trim()) {
      return NextResponse.json(
        { error: "reviewId and response are required" },
        { status: 400 }
      );
    }

    // Fetch the review to verify ownership
    const { data: review } = await supabase
      .from("reviews")
      .select("id, business_id")
      .eq("id", reviewId)
      .single();

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // Verify business ownership
    const { data: business } = await supabase
      .from("businesses")
      .select("id")
      .eq("id", review.business_id)
      .eq("user_id", user.id)
      .single();

    if (!business) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Update review with published response
    const { error: updateError } = await supabase
      .from("reviews")
      .update({
        published_response: response.trim(),
        status: "published",
        published_at: new Date().toISOString(),
      })
      .eq("id", reviewId);

    if (updateError) {
      console.error("Update error:", updateError);
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Response saved successfully",
    });

  } catch (err) {
    console.error("Save response error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
