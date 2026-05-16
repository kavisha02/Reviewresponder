/**
 * API Route: POST /api/competitors/:competitorId/generate-topics
 *
 * Extracts topics from competitor reviews using Gemini API.
 * Analyzes all reviews and returns top topics with mention counts.
 *
 * Response: { topics: Array<{ topic: string, mention_count: number, sentiment_score: number }> }
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-2.5-flash";

export async function POST(
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
      .select("*")
      .eq("id", competitorId)
      .eq("user_id", user.id)
      .single();

    if (!competitor) {
      return NextResponse.json({ error: "Competitor not found" }, { status: 404 });
    }

    // Fetch competitor's reviews
    const { data: competitorReviews } = await supabase
      .from("competitor_reviews")
      .select("*")
      .eq("competitor_benchmark_id", competitorId);

    if (!competitorReviews || competitorReviews.length === 0) {
      return NextResponse.json({
        topics: [],
      });
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Gemini API key not configured" },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

    // Prepare reviews for analysis
    const reviewsText = competitorReviews
      .map((r, i) => `Review ${i + 1} (${r.rating} stars): ${r.review_text || "No text"}`)
      .join("\n\n");

    const prompt = `Analyze the following reviews and extract the top 5-8 topics/themes mentioned.
For each topic, count how many reviews mention it and calculate a sentiment score (-1 to 1, where -1 is negative, 0 is neutral, 1 is positive).

Reviews:
${reviewsText}

Return ONLY a JSON array of topics:
[
  {"topic": "topic name", "mention_count": number, "sentiment_score": number},
  ...
]`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "Failed to parse topics analysis" },
        { status: 500 }
      );
    }

    const topics = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      topics: Array.isArray(topics) ? topics : [],
    });

  } catch (err: unknown) {
    console.error("Generate topics error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
