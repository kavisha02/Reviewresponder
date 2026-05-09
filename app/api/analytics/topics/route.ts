/**
 * API Route: POST /api/analytics/topics
 *
 * Analyzes reviews using stop word filtering and keyword extraction.
 * No LLM required - extracts topics by finding frequently mentioned words/phrases.
 *
 * Request body: { businessId: string, analyzedReviewIds?: string[] }
 * Response:     { topics: [...], insights: [...], newTopics: [...], newInsights: [...] }
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Common words to filter out
const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by",
  "from", "up", "about", "into", "through", "during", "before", "after", "above", "below",
  "between", "under", "again", "further", "then", "once", "here", "there", "when", "where",
  "why", "how", "all", "each", "every", "both", "few", "more", "most", "other", "some",
  "such", "no", "nor", "not", "only", "own", "same", "so", "than", "too", "very", "can",
  "just", "should", "now", "is", "are", "was", "were", "be", "been", "being", "have", "has",
  "had", "do", "does", "did", "will", "would", "could", "should", "may", "might", "must",
  "shall", "i", "you", "he", "she", "it", "we", "they", "what", "which", "who", "whom",
  "this", "that", "these", "those", "my", "your", "his", "her", "its", "our", "their",
  "as", "if", "because", "while", "although", "though", "unless", "until", "since", "after",
  "before", "am", "me", "him", "us", "them", "got", "get", "gets", "getting", "got",
  "really", "very", "quite", "just", "even", "still", "also", "too", "either", "neither",
  "hi", "hello", "thanks", "thank", "please", "ok", "okay", "yes", "no", "yeah", "yep",
  "nope", "sure", "definitely", "absolutely", "totally", "completely", "really", "actually",
  "basically", "literally", "honestly", "seriously", "obviously", "clearly", "apparently",
  "supposedly", "allegedly", "reportedly", "admittedly", "frankly", "personally", "generally",
  "usually", "typically", "normally", "often", "sometimes", "rarely", "seldom", "hardly",
  "barely", "scarcely", "almost", "nearly", "practically", "virtually", "essentially",
  "basically", "fundamentally", "primarily", "mainly", "largely", "mostly", "partly",
  "somewhat", "rather", "quite", "fairly", "pretty", "rather", "sort", "kind", "like",
  "as", "such", "etc", "etc.", "e.g", "e.g.", "i.e", "i.e.", "vs", "vs.", "v", "v.",
  "etc", "etc.", "etc", "etc.", "etc", "etc.", "etc", "etc.", "etc", "etc.", "etc", "etc.",
  "good", "bad", "ok", "okay", "fine", "nice", "great", "awesome", "terrible", "horrible",
  "amazing", "wonderful", "fantastic", "excellent", "poor", "awful", "dreadful", "lovely",
  "beautiful", "ugly", "pretty", "handsome", "ugly", "attractive", "unattractive", "cute",
  "ugly", "beautiful", "gorgeous", "stunning", "striking", "impressive", "remarkable",
  "notable", "noteworthy", "significant", "important", "major", "minor", "slight", "small",
  "big", "large", "huge", "tiny", "little", "small", "medium", "large", "extra", "super",
  "hyper", "ultra", "mega", "mini", "micro", "macro", "semi", "anti", "pro", "multi",
  "uni", "bi", "tri", "quad", "penta", "hexa", "hepta", "octa", "nona", "deca", "mono",
  "di", "tri", "poly", "mono", "homo", "hetero", "iso", "iso", "iso", "iso", "iso", "iso",
  "etc", "etc.", "etc", "etc.", "etc", "etc.", "etc", "etc.", "etc", "etc.", "etc", "etc.",
  "thing", "stuff", "things", "something", "anything", "nothing", "everything", "anything",
  "someone", "anyone", "no one", "everyone", "somebody", "anybody", "nobody", "everybody",
  "somewhere", "anywhere", "nowhere", "everywhere", "somehow", "anyhow", "anyway", "anyways",
  "whenever", "wherever", "whatever", "whichever", "whoever", "whomever", "however",
  "whatsoever", "whomsoever", "whosoever", "whatsoever", "whichsoever", "howsoever",
  "etc", "etc.", "etc", "etc.", "etc", "etc.", "etc", "etc.", "etc", "etc.", "etc", "etc.",
]);

// Common category keywords to group topics
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "Service Quality": ["service", "staff", "team", "employee", "attendant", "waiter", "server", "helper", "assistant", "support", "help", "support", "customer service"],
  "Food & Taste": ["food", "taste", "flavor", "delicious", "tasty", "fresh", "quality", "dish", "meal", "cuisine", "recipe", "cooking", "prepared"],
  "Cleanliness": ["clean", "dirty", "hygiene", "sanitary", "messy", "tidy", "neat", "organized", "cluttered", "spotless", "filthy", "pristine"],
  "Ambiance": ["ambiance", "atmosphere", "decor", "decoration", "interior", "design", "lighting", "music", "vibe", "environment", "setting", "cozy", "comfortable"],
  "Price & Value": ["price", "cost", "expensive", "cheap", "affordable", "value", "money", "worth", "overpriced", "reasonable", "fair", "deal"],
  "Speed & Wait": ["wait", "waiting", "slow", "fast", "quick", "speed", "time", "delay", "rushed", "hurried", "prompt", "efficient"],
  "Location & Access": ["location", "access", "parking", "convenient", "far", "near", "distance", "traffic", "easy", "difficult", "reachable"],
  "Portion Size": ["portion", "size", "quantity", "amount", "generous", "small", "big", "large", "tiny", "huge", "serving"],
  "Delivery": ["delivery", "delivered", "shipping", "shipped", "package", "box", "arrived", "on time", "late", "damaged", "condition"],
  "Product Quality": ["quality", "product", "item", "material", "durability", "defect", "broken", "damaged", "perfect", "excellent", "poor"],
};

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

function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter(word => word.length > 2 && !STOP_WORDS.has(word));
}

function categorizeKeywords(keywords: string[]): Record<string, number> {
  const categoryScores: Record<string, number> = {};

  for (const [category, categoryWords] of Object.entries(CATEGORY_KEYWORDS)) {
    const score = keywords.filter(kw => categoryWords.some(cw => cw.includes(kw) || kw.includes(cw))).length;
    if (score > 0) {
      categoryScores[category] = (categoryScores[category] || 0) + score;
    }
  }

  return categoryScores;
}

function detectSentiment(text: string): "positive" | "negative" | "neutral" {
  const positiveWords = ["good", "great", "excellent", "amazing", "wonderful", "fantastic", "awesome", "love", "perfect", "best", "beautiful", "lovely", "nice", "happy", "satisfied", "impressed", "recommend", "worth", "enjoyed", "delighted", "thrilled", "pleased"];
  const negativeWords = ["bad", "terrible", "awful", "horrible", "poor", "worst", "hate", "disgusting", "disappointing", "disappointed", "angry", "upset", "frustrated", "annoyed", "rude", "unprofessional", "waste", "regret", "never", "avoid", "disgusted", "appalled"];

  const lowerText = text.toLowerCase();
  const positiveCount = positiveWords.filter(w => lowerText.includes(w)).length;
  const negativeCount = negativeWords.filter(w => lowerText.includes(w)).length;

  if (positiveCount > negativeCount) return "positive";
  if (negativeCount > positiveCount) return "negative";
  return "neutral";
}

function extractExamples(text: string, limit: number = 2): string[] {
  const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 10);
  return sentences.slice(0, limit);
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { businessId, analyzedReviewIds = [] } = await request.json();

    if (!businessId) {
      return NextResponse.json(
        { error: "businessId is required" },
        { status: 400 }
      );
    }

    const { data: business } = await supabase
      .from("businesses")
      .select("id")
      .eq("id", businessId)
      .eq("user_id", user.id)
      .single();

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const { data: allReviews } = await supabase
      .from("reviews")
      .select("id, review_text, rating")
      .eq("business_id", businessId)
      .not("review_text", "is", null);

    if (!allReviews || allReviews.length === 0) {
      return NextResponse.json(
        { topics: [], insights: [], newTopics: [], newInsights: [], message: "No reviews to analyze" },
        { status: 200 }
      );
    }

    const newReviews = analyzedReviewIds.length > 0
      ? allReviews.filter(r => !analyzedReviewIds.includes(r.id))
      : allReviews;

    if (newReviews.length === 0) {
      return NextResponse.json({
        success: true,
        reviewsAnalyzed: allReviews.length,
        topics: [],
        insights: [],
        newTopics: [],
        newInsights: [],
        summary: "No new reviews to analyze",
      });
    }

    // Extract keywords from all reviews
    const allKeywords: string[] = [];
    const categoryMentions: Record<string, { positive: number; negative: number; neutral: number; examples: string[] }> = {};

    for (const review of newReviews) {
      const keywords = extractKeywords(review.review_text || "");
      allKeywords.push(...keywords);

      const sentiment = detectSentiment(review.review_text || "");
      const categories = categorizeKeywords(keywords);

      for (const [category, score] of Object.entries(categories)) {
        if (!categoryMentions[category]) {
          categoryMentions[category] = { positive: 0, negative: 0, neutral: 0, examples: [] };
        }
        categoryMentions[category][sentiment]++;
        categoryMentions[category].examples.push(...extractExamples(review.review_text || ""));
      }
    }

    // Generate topics from categories
    const topics: Topic[] = Object.entries(categoryMentions)
      .map(([category, data]) => {
        const total = data.positive + data.negative + data.neutral;
        let sentiment: "positive" | "negative" | "neutral" = "neutral";
        if (data.positive > data.negative && data.positive > data.neutral) sentiment = "positive";
        else if (data.negative > data.positive && data.negative > data.neutral) sentiment = "negative";

        return {
          topic: category,
          sentiment,
          mentions: total,
          examples: [...new Set(data.examples)].slice(0, 2),
        };
      })
      .sort((a, b) => b.mentions - a.mentions);

    // Generate insights from topics
    const insights: Insight[] = [];
    for (const topic of topics.slice(0, 4)) {
      if (topic.sentiment === "positive") {
        insights.push({
          insight: `Customers consistently praise ${topic.topic.toLowerCase()}`,
          impact: "This is a key strength that differentiates your business",
          recommendation: `Highlight ${topic.topic.toLowerCase()} in your marketing and training`,
        });
      } else if (topic.sentiment === "negative") {
        insights.push({
          insight: `${topic.topic} is a recurring concern among customers`,
          impact: "This is affecting customer satisfaction and retention",
          recommendation: `Prioritize improvements in ${topic.topic.toLowerCase()} and track progress`,
        });
      }
    }

    // Calculate overall sentiment
    const positiveReviews = newReviews.filter(r => detectSentiment(r.review_text || "") === "positive").length;
    const negativeReviews = newReviews.filter(r => detectSentiment(r.review_text || "") === "negative").length;
    const sentimentSummary = positiveReviews > negativeReviews
      ? `Overall positive sentiment with ${positiveReviews} positive reviews`
      : negativeReviews > positiveReviews
        ? `Mixed sentiment with ${negativeReviews} negative reviews requiring attention`
        : "Balanced sentiment across reviews";

    return NextResponse.json({
      success: true,
      reviewsAnalyzed: allReviews.length,
      newReviewsAnalyzed: newReviews.length,
      topics: topics.slice(0, 6),
      insights: insights.slice(0, 4),
      newTopics: topics.slice(0, 6),
      newInsights: insights.slice(0, 4),
      summary: sentimentSummary,
    });

  } catch (err) {
    console.error("Topic analysis error:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Internal server error: ${errorMessage}` },
      { status: 500 }
    );
  }
}
