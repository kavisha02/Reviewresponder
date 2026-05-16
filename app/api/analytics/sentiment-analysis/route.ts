/**
 * API Route: POST /api/analytics/sentiment-analysis
 *
 * Analyzes sentiment distribution and provides brief insights.
 * Optimized for token efficiency - returns concise insights only.
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
        { positive: "No data", negative: "No data", mixed: "No data" },
        { status: 200 }
      );
    }

    // Categorize reviews
    const positive = reviews.filter(r => r.rating >= 4);
    const negative = reviews.filter(r => r.rating <= 2);
    const mixed = reviews.filter(r => r.rating === 3);

    // Check if all reviews are 5-star
    const allFiveStar = reviews.every(r => r.rating === 5);
    if (allFiveStar) {
      return NextResponse.json({
        positive: "All reviews are 5-star ratings. Your customers are extremely satisfied with your service.",
        negative: "No negative reviews found.",
        mixed: "No mixed reviews found."
      }, { status: 200 });
    }

    // Sample for efficiency
    const samplePositive = positive.slice(0, 3).map(r => r.review_text).join(" | ");
    const sampleNegative = negative.slice(0, 3).map(r => r.review_text).join(" | ");
    const sampleMixed = mixed.slice(0, 3).map(r => r.review_text).join(" | ");

    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Gemini API key not configured" },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const prompt = `Analyze sentiment and provide 1 brief insight (1 sentence max) for each category:

POSITIVE (${positive.length} reviews): ${samplePositive || "None"}
NEGATIVE (${negative.length} reviews): ${sampleNegative || "None"}
MIXED (${mixed.length} reviews): ${sampleMixed || "None"}

Respond in JSON format ONLY:
{
  "positive": "insight about positive reviews",
  "negative": "insight about negative reviews",
  "mixed": "insight about mixed reviews"
}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    let analysisData;
    try {
      const cleanedText = responseText.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();
      analysisData = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("Failed to parse sentiment response:", responseText);
      return NextResponse.json(
        { error: "Failed to parse analysis results" },
        { status: 500 }
      );
    }

    return NextResponse.json(analysisData);

  } catch (err) {
    console.error("Sentiment analysis error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
