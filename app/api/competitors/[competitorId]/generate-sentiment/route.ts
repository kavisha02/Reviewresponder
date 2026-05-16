/**
 * API Route: POST /api/competitors/:competitorId/generate-sentiment
 *
 * Generates sentiment breakdown for competitor reviews using Gemini API.
 * Analyzes all reviews and returns sentiment distribution.
 *
 * Response: { sentiment: { positive: number, mixed: number, negative: number } }
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-flash-latest";

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
        sentiment: { positive: 0, mixed: 0, negative: 0 },
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

    const prompt = `Analyze the following reviews and categorize each as positive, mixed, or negative sentiment.

Reviews:
${reviewsText}

Return ONLY a JSON object with counts:
{"positive": number, "mixed": number, "negative": number}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const cleaned = text.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Failed to parse sentiment analysis" }, { status: 500 });
    }

    let sentiment: { positive: number; mixed: number; negative: number };
    try {
      sentiment = JSON.parse(jsonMatch[0].replace(/[\r\n]+/g, " "));
    } catch {
      return NextResponse.json({ error: "Failed to parse sentiment response" }, { status: 500 });
    }

    const counts = {
      positive: sentiment.positive || 0,
      mixed: sentiment.mixed || 0,
      negative: sentiment.negative || 0,
    };

    // Persist to DB so it survives navigation
    await supabase
      .from("competitor_benchmarks")
      .update({
        positive_count: counts.positive,
        mixed_count: counts.mixed,
        negative_count: counts.negative,
      })
      .eq("id", competitorId);

    return NextResponse.json({ sentiment: counts });

  } catch (err: unknown) {
    console.error("Generate sentiment error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
