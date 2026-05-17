import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-flash-latest";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { businessId } = await request.json();
    if (!businessId) return NextResponse.json({ error: "businessId is required" }, { status: 400 });

    // Fetch business + user reviews + all competitors in parallel
    const [
      { data: business },
      { data: userReviews },
      { data: competitors },
    ] = await Promise.all([
      supabase.from("businesses").select("name, total_platform_reviews, total_platform_rating").eq("id", businessId).eq("user_id", user.id).single(),
      supabase.from("reviews").select("rating, status").eq("business_id", businessId),
      supabase.from("competitor_benchmarks").select("*").eq("business_id", businessId).eq("user_id", user.id),
    ]);

    if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

    if (!GEMINI_API_KEY) return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 });

    const userReviewsArr = userReviews || [];
    const userAvgRating = business.total_platform_rating || (userReviewsArr.length > 0
      ? (userReviewsArr.reduce((s, r) => s + r.rating, 0) / userReviewsArr.length).toFixed(1)
      : "0");
    const userTotalReviews = business.total_platform_reviews || userReviewsArr.length;
    const userResponseRate = userReviewsArr.length > 0
      ? Math.round((userReviewsArr.filter((r) => r.status === "responded").length / userReviewsArr.length) * 100)
      : 0;

    const competitorsArr = competitors || [];

    // Build competitor descriptions for the prompt
    const competitorLines = competitorsArr.map((c, i) =>
      `Competitor ${i + 1} (${c.competitor_name}):
  - Rating: ${c.avg_rating ?? 0}/5.0
  - Total Reviews: ${c.total_platform_reviews || c.total_reviews || 0}
  - Response Rate: ${Math.round(c.response_rate ?? 0)}%
  - Positive: ${c.positive_count ?? 0}, Mixed: ${c.mixed_count ?? 0}, Negative: ${c.negative_count ?? 0}`
    ).join("\n\n");

    const prompt = `You are a business growth advisor. Compare my business against ALL ${competitorsArr.length} competitor(s) below and generate exactly 4-5 sharp, actionable insights to outperform all of them and grow revenue and profit.

My Business (${business.name}):
- Rating: ${userAvgRating}/5.0
- Total Reviews: ${userTotalReviews}
- Response Rate: ${userResponseRate}%
- Positive Reviews: ${userReviewsArr.filter((r) => r.rating >= 4).length}
- Negative Reviews: ${userReviewsArr.filter((r) => r.rating <= 2).length}

${competitorLines}

Rules:
- Generate EXACTLY 4-5 insights, no more, no less
- Each must directly help grow revenue or profit by outperforming competitors
- Start each with a strong action verb (Improve, Leverage, Fix, Capitalise, Build)
- Be specific about which competitor gap to exploit
- No generic advice

Return ONLY a valid JSON array of strings (4-5 items):
["insight 1", "insight 2", "insight 3", "insight 4"]`;

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const cleaned = text.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();
    const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return NextResponse.json({ error: "Failed to parse recommendations" }, { status: 500 });

    let recs: string[];
    try {
      recs = JSON.parse(jsonMatch[0].replace(/[\r\n]+/g, " "));
    } catch {
      return NextResponse.json({ error: "Failed to parse recommendations response" }, { status: 500 });
    }

    const recsArray = Array.isArray(recs) ? recs.slice(0, 5).map((s) => String(s).trim()) : [];

    // Upsert into DB
    await supabase
      .from("competitor_multi_recommendations")
      .upsert({
        user_id: user.id,
        business_id: businessId,
        recommendations: recsArray,
        generated_at: new Date().toISOString(),
      }, { onConflict: "user_id,business_id" });

    return NextResponse.json({ recommendations: recsArray });
  } catch (err: unknown) {
    console.error("Multi recommendations error:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Internal server error" }, { status: 500 });
  }
}
