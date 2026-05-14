/**
 * API Route: POST /api/analytics/topics
 *
 * Analyzes reviews using Gemini AI to extract categories and topics.
 * Uses the same Gemini API key as other analysis endpoints.
 *
 * Request body: { businessId: string }
 * Response:     { topics: [...], insights: [...], summary: string }
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

interface Topic {
  topic: string;
  sentiment: "positive" | "negative" | "neutral";
  mentions: number;
  examples: string[];
}

interface Insight {
  insight: string;
  impact: string;
  recommendation: string;
}

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
        { topics: [], insights: [], summary: "No reviews to analyze" },
        { status: 200 }
      );
    }

    // Sample reviews for efficiency (max 20)
    const sampleReviews = reviews.slice(0, 20);
    const reviewsText = sampleReviews
      .map((r) => `${r.rating}★: ${r.review_text}`)
      .join("\n\n");

    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Gemini API key not configured" },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Analyze these customer reviews and extract the main categories/topics being discussed. For each topic, identify the sentiment and provide examples.

Reviews:
${reviewsText}

Respond in JSON format ONLY:
{
  "topics": [
    {
      "topic": "category name",
      "sentiment": "positive|negative|neutral",
      "mentions": number,
      "examples": ["example quote 1", "example quote 2"]
    }
  ],
  "insights": [
    {
      "insight": "what customers are saying about this topic",
      "impact": "why this matters for the business",
      "recommendation": "specific action to take"
    }
  ],
  "summary": "overall summary of main themes"
}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    let analysisData;
    try {
      const cleanedText = responseText.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();
      analysisData = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("Failed to parse topics response:", responseText);
      return NextResponse.json(
        { error: "Failed to parse analysis results" },
        { status: 500 }
      );
    }

    return NextResponse.json(analysisData);

  } catch (err) {
    console.error("Topic analysis error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
