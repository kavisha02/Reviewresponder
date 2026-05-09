/**
 * API Route: POST /api/notifications/send-negative-alert
 *
 * Sends an email alert when a negative review (1-2 stars) is detected.
 * Called when a new review is synced or created.
 *
 * Request body: { businessId: string, reviewId: string }
 * Response: { success: boolean, messageId?: string }
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Resend } from "resend";
import { getNegativeReviewAlertHTML } from "@/lib/email-templates";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { businessId, reviewId } = await request.json();

    if (!businessId || !reviewId) {
      return NextResponse.json(
        { error: "businessId and reviewId are required" },
        { status: 400 }
      );
    }

    // Verify business ownership
    const { data: business } = await supabase
      .from("businesses")
      .select("id, name, business_type, user_id")
      .eq("id", businessId)
      .single();

    if (!business || business.user_id !== user.id) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // Fetch the review
    const { data: review } = await supabase
      .from("reviews")
      .select("id, review_text, rating, author_name, review_date")
      .eq("id", reviewId)
      .eq("business_id", businessId)
      .single();

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // Only send alert for negative reviews (1-2 stars)
    if (review.rating > 2) {
      return NextResponse.json({
        success: true,
        message: "Review is not negative, no alert sent",
      });
    }

    // Get user email
    const { data: { user: userData } } = await supabase.auth.getUser();
    if (!userData?.email) {
      return NextResponse.json(
        { error: "User email not found" },
        { status: 400 }
      );
    }

    // Format review date
    const reviewDate = new Date(review.review_date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    // Send email via Resend
    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
      to: userData.email,
      subject: `🚨 Negative Review Alert: ${business.name}`,
      html: getNegativeReviewAlertHTML({
        businessName: business.name,
        businessType: business.business_type,
        recipientEmail: userData.email,
        recipientName: user.user_metadata?.full_name || "User",
        reviewText: review.review_text || "No text provided",
        rating: review.rating,
        authorName: review.author_name,
        reviewDate,
      }),
    });

    if (result.error) {
      console.error("Resend error:", result.error);
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: result.data?.id,
    });

  } catch (err) {
    console.error("Negative alert error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
