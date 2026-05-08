/**
 * API Route: POST /api/analytics/topics
 *
 * Uses Gemini LLM to analyze reviews and extract:
 * - Main topics/themes
 * - Sentiment for each topic
 * - Frequency of mentions
 * - Actionable insights
 *
 * Request body: { businessId: string }
 * Response:     { topics: [...], insights: [...] }
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Auth check
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

    // Fetch all reviews for this business
    const { data: reviews } = await supabase
      .from("reviews")
      .select("review_text, rating")
      .eq("business_id", businessId)
      .not("review_text", "is", null);

    if (!reviews || reviews.length === 0) {
      return NextResponse.json(
        { topics: [], insights: [], message: "No reviews to analyze" },
        { status: 200 }
      );
    }

    // Prepare reviews for Gemini
    const reviewsText = reviews
      .map((r) => `Rating: ${r.rating}★\nReview: ${r.review_text}`)
      .join("\n---\n");

    // Call Gemini for analysis
    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Gemini API key not configured" },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" },
    });

    const prompt = `Analyze these customer reviews and extract key topics, themes, and insights.

Reviews:
${reviewsText}

Please analyze and return a JSON response with:
1. "topics" - array of main topics mentioned with:
   - topic: name of the topic
   - sentiment: "positive", "negative", or "neutral"
   - mentions: approximate number of mentions
   - examples: 1-2 example phrases from reviews

2. "insights" - array of 3-5 actionable insights:
   - insight: what you discovered
   - impact: why it matters
   - recommendation: what to do about it

3. "summary" - 1-2 sentence summary of overall sentiment

Return ONLY valid JSON, no markdown or extra text.

Example format:
{
  "topics": [
    {
      "topic": "Service Quality",
      "sentiment": "positive",
      "mentions": 15,
      "examples": ["great service", "staff was helpful"]
    }
  ],
  "insights": [
    {
      "insight": "Customers frequently praise service speed",
      "impact": "This is a key differentiator",
      "recommendation": "Highlight fast service in marketing"
    }
  ],
  "summary": "Overall positive sentiment with strong service ratings"
}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Parse JSON response
    let analysisData;
    try {
      // Remove markdown code blocks if the model wrapped the JSON
      const cleanedText = responseText.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();
      analysisData = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", responseText);
      return NextResponse.json(
        { error: "Failed to parse analysis results" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      reviewsAnalyzed: reviews.length,
      topics: analysisData.topics || [],
      insights: analysisData.insights || [],
      summary: analysisData.summary || "",
    });

  } catch (err) {
    console.error("Topic analysis error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
