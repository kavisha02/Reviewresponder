/**
 * API Route: POST /api/analytics/actionable-insights
 *
 * Generates problem-solving insights from reviews.
 * Optimized for token efficiency - returns 3-4 concise insights only.
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
      .select("id")
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
        { insights: [] },
        { status: 200 }
      );
    }

    // Check if all reviews are 5-star
    const allFiveStar = reviews.every(r => r.rating === 5);
    if (allFiveStar) {
      return NextResponse.json({
        insights: [{
          insight: "All reviews are 5-star",
          impact: "Your business is performing exceptionally well with perfect ratings across all reviews.",
          recommendation: "Continue maintaining your current service standards and consider sharing customer testimonials in your marketing."
        }]
      }, { status: 200 });
    }

    // Sample reviews for efficiency (max 15)
    const sampleReviews = reviews.slice(0, 15);
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
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Extract 3-4 actionable insights to solve customer problems from these reviews. Each insight should identify a problem, its impact, and a specific action.

Reviews:
${reviewsText}

Respond in JSON format ONLY:
{
  "insights": [
    {
      "insight": "problem identified",
      "impact": "why it matters (1 sentence)",
      "recommendation": "specific action to take"
    }
  ]
}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    let analysisData;
    try {
      const cleanedText = responseText.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();
      analysisData = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("Failed to parse insights response:", responseText);
      return NextResponse.json(
        { error: "Failed to parse analysis results" },
        { status: 500 }
      );
    }

    return NextResponse.json(analysisData);

  } catch (err) {
    console.error("Actionable insights error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
