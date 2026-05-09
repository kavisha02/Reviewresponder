/**
 * API Route: POST /api/analytics/location-summary
 *
 * Generates a concise AI summary of the business based on reviews.
 * Optimized for token efficiency - returns only 1-2 sentences.
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

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

    // Verify ownership
    const { data: business } = await supabase
      .from("businesses")
      .select("id, name, business_type")
      .eq("id", businessId)
      .eq("user_id", user.id)
      .single();

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // Fetch reviews
    const { data: reviews } = await supabase
      .from("reviews")
      .select("review_text, rating")
      .eq("business_id", businessId)
      .not("review_text", "is", null);

    if (!reviews || reviews.length === 0) {
      return NextResponse.json(
        { summary: "No reviews to summarize yet." },
        { status: 200 }
      );
    }

    // Sample reviews for efficiency (max 10)
    const sampleReviews = reviews.slice(0, 10);
    const reviewsText = sampleReviews
      .map((r) => `${r.rating}★: ${r.review_text}`)
      .join("\n");

    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Gemini API key not configured" },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Summarize this ${business.business_type || "business"} in 1-2 sentences based on customer reviews. Focus on: what customers like, main services, and overall reputation.

Reviews:
${reviewsText}

Respond with ONLY the summary, no extra text.`;

    const result = await model.generateContent(prompt);
    const summary = result.response.text().trim();

    return NextResponse.json({ summary });

  } catch (err) {
    console.error("Location summary error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
