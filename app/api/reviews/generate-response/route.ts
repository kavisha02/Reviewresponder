/**
 * API Route: POST /api/reviews/generate-response
 *
 * Generates an AI draft response for a single review using Gemini.
 *
 * Steps:
 *  1. Verify the user is logged in
 *  2. Fetch the review + its parent business from Supabase
 *  3. Confirm the review belongs to this user (security check)
 *  4. Build a prompt with business context + review details
 *  5. Call Gemini API to generate the response
 *  6. Save the draft back to Supabase (status → "draft")
 *  7. Return the draft text to the client
 *
 * Request body: { reviewId: string }
 * Response:     { draft: string }
 */

import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/server";

// Initialise Gemini once — reused across requests in the same worker
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// gemini-1.5-flash works on the free tier — upgrade to gemini-2.5-pro-preview once billing is enabled
const GEMINI_MODEL = "gemini-1.5-flash";

function buildPrompt(
  businessName: string,
  businessType: string | null,
  tone: string,
  rating: number,
  reviewText: string | null
): string {
  const toneGuide: Record<string, string> = {
    professional: "formal, polished, and professional",
    friendly:     "warm, approachable, and conversational",
    casual:       "relaxed, informal, and personable",
  };

  const toneDescription = toneGuide[tone] ?? toneGuide.professional;
  const businessContext  = businessType ? `${businessName} (${businessType})` : businessName;

  // Tailor instructions based on star rating
  let sentimentGuide: string;
  if (rating >= 4) {
    sentimentGuide = `This is a positive review. Write a warm, grateful response that:
- Thanks the customer genuinely and specifically references what they mentioned
- Reinforces the positive experience
- Invites them to return`;
  } else if (rating === 3) {
    sentimentGuide = `This is a neutral review. Write a balanced response that:
- Thanks the customer for their feedback
- Acknowledges any concerns they mentioned
- Shows commitment to improvement
- Invites them to return and give you another chance`;
  } else {
    sentimentGuide = `This is a negative review (${rating} star). Write an empathetic, de-escalating response that:
- Opens with a sincere apology
- Acknowledges their specific frustration without being defensive
- Takes responsibility
- Offers to make it right (invite them to contact you directly)
- Keeps a calm, professional tone throughout`;
  }

  return `You are writing a Google Business review response on behalf of ${businessContext}.

Tone: ${toneDescription}

${sentimentGuide}

Rules:
- Keep the response under 100 words
- Do NOT use generic phrases like "We value your feedback" or "Thank you for your review"
- Be specific to what the customer actually mentioned
- Sound human, not like a template
- Sign off as "The ${businessName} Team"
- Do NOT include any subject line or heading

Customer review (${rating} star${rating !== 1 ? "s" : ""}):
"${reviewText ?? "No written review provided — customer left a star rating only."}"

Write only the response text, nothing else:`;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { reviewId } = await request.json();
    if (!reviewId) {
      return NextResponse.json({ error: "reviewId is required" }, { status: 400 });
    }

    // Fetch the review and its parent business in one query
    const { data: review, error: reviewError } = await supabase
      .from("reviews")
      .select("*, businesses(*)")
      .eq("id", reviewId)
      .single();

    if (reviewError || !review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // Security: make sure this review belongs to the logged-in user's business
    if (review.businesses.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Build the prompt
    const prompt = buildPrompt(
      review.businesses.name,
      review.businesses.business_type,
      review.businesses.tone,
      review.rating,
      review.review_text
    );

    // Call Gemini
    const model  = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    const result = await model.generateContent(prompt);
    const draft  = result.response.text().trim();

    if (!draft) {
      return NextResponse.json({ error: "Gemini returned an empty response" }, { status: 500 });
    }

    // Save the draft to Supabase and update status to "draft"
    const { error: updateError } = await supabase
      .from("reviews")
      .update({ draft_response: draft, status: "draft" })
      .eq("id", reviewId);

    if (updateError) {
      console.error("Failed to save draft:", updateError);
      // Still return the draft to the UI even if DB save failed
      return NextResponse.json({ draft, warning: "Draft generated but not saved" });
    }

    return NextResponse.json({ draft });

  } catch (err: unknown) {
    console.error("Generate response error:", err);

    // Surface Gemini model-not-found errors clearly
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
