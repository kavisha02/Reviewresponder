/**
 * API Route: POST /api/notifications/send-weekly-digest
 *
 * Sends a weekly digest email with review summary and metrics.
 * Should be called via a cron job (e.g., every Monday at 9 AM).
 *
 * Request body: { businessId: string }
 * Response: { success: boolean, messageId?: string }
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Resend } from "resend";
import { getDailyDigestHTML } from "@/lib/email-templates";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { businessId } = await request.json();

    if (!businessId) {
      return NextResponse.json(
        { error: "businessId is required" },
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

    // Fetch all reviews for this business
    const { data: reviews } = await supabase
      .from("reviews")
      .select("id, review_text, rating, author_name, review_date, status")
      .eq("business_id", businessId)
      .order("review_date", { ascending: false });

    if (!reviews || reviews.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No reviews to digest",
      });
    }

    // Calculate metrics
    const totalReviews = reviews.length;
    const averageRating = (
      reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
    ).toFixed(1);
    const responded = reviews.filter((r) => r.status === "draft").length;
    const responseRate = Math.round((responded / totalReviews) * 100);
    const negativeReviewsCount = reviews.filter((r) => r.rating <= 2).length;
    const positiveReviewsCount = reviews.filter((r) => r.rating >= 4).length;

    // Get reviews from last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const newReviews = reviews.filter(
      (r) => new Date(r.review_date) > sevenDaysAgo
    );

    // Format recent reviews for display
    const recentReviewsForDisplay = reviews.slice(0, 5).map((r) => ({
      text: r.review_text || "No text provided",
      rating: r.rating,
      author: r.author_name,
      date: new Date(r.review_date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
    }));

    // Get user email
    const { data: { user: userData } } = await supabase.auth.getUser();
    if (!userData?.email) {
      return NextResponse.json(
        { error: "User email not found" },
        { status: 400 }
      );
    }

    const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?business=${businessId}`;

    // Send email via Resend
    if (!resend) {
      return NextResponse.json(
        { error: "Email service not configured" },
        { status: 500 }
      );
    }

    const result = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
      to: userData.email,
      subject: `📊 Weekly Review Digest: ${business.name}`,
      html: getDailyDigestHTML({
        businessName: business.name,
        businessType: business.business_type,
        recipientEmail: userData.email,
        recipientName: user.user_metadata?.full_name || "User",
        totalReviews,
        newReviewsCount: newReviews.length,
        averageRating,
        responseRate,
        negativeReviewsCount,
        positiveReviewsCount,
        recentReviews: recentReviewsForDisplay,
        dashboardUrl,
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
      newReviewsCount: newReviews.length,
    });

  } catch (err) {
    console.error("Weekly digest error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
