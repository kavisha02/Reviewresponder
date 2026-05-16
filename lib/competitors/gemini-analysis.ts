/**
 * Gemini AI integration for competitor analysis
 * Extracts topics, sentiment, and generates insights
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { CompetitorReview } from "@/lib/types";

const GEMINI_MODEL = "gemini-flash-latest";

export interface TopicAnalysis {
  topics: Array<{
    topic: string;
    mention_count: number;
    sentiment_score: number;
  }>;
}

export interface SentimentAnalysis {
  sentiment: "positive" | "mixed" | "negative";
  topics: string[];
}

export async function extractTopicsFromReviews(
  reviews: CompetitorReview[]
): Promise<TopicAnalysis> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  if (reviews.length === 0) {
    return { topics: [] };
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

  // Include all reviews, even those with ratings only
  const reviewTexts = reviews
    .map((r) => {
      if (r.review_text) {
        return `"${r.review_text}"`;
      }
      // For rating-only reviews, create a synthetic description
      const ratingDesc = r.rating >= 4 ? "positive" : r.rating === 3 ? "neutral" : "negative";
      return `"${ratingDesc} rating"`;
    })
    .join("\n");

  const prompt = `Analyze these customer reviews and extract the top 5-7 most mentioned topics/themes.
For each topic, provide:
1. The topic name (2-3 words)
2. How many times it's mentioned (estimate from reviews)
3. Overall sentiment score (-1 to 1, where -1 is very negative, 0 is neutral, 1 is very positive)

Reviews:
${reviewTexts}

Return ONLY valid JSON in this exact format:
{
  "topics": [
    {"topic": "friendly staff", "mention_count": 15, "sentiment_score": 0.8},
    {"topic": "clean environment", "mention_count": 12, "sentiment_score": 0.9}
  ]
}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("No JSON found in Gemini response:", text);
      return { topics: [] };
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return parsed;
  } catch (error) {
    console.error("Error extracting topics from Gemini:", error);
    return { topics: [] };
  }
}

export async function analyzeSingleReviewSentiment(
  reviewText: string,
  rating?: number
): Promise<SentimentAnalysis> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  // If no text, infer sentiment from rating
  if (!reviewText || reviewText.trim() === "") {
    if (rating) {
      const sentiment = rating >= 4 ? "positive" : rating === 3 ? "mixed" : "negative";
      return { sentiment: sentiment as "positive" | "mixed" | "negative", topics: [] };
    }
    return { sentiment: "mixed", topics: [] };
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

  const prompt = `Analyze this customer review and determine:
1. Overall sentiment (positive, mixed, or negative)
2. Top 2-3 topics/themes mentioned

Review: "${reviewText}"

Return ONLY valid JSON in this exact format:
{
  "sentiment": "positive",
  "topics": ["friendly staff", "clean"]
}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { sentiment: "mixed", topics: [] };
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return parsed;
  } catch (error) {
    console.error("Error analyzing review sentiment:", error);
    return { sentiment: "mixed", topics: [] };
  }
}

export async function analyzeBatchReviewSentiment(
  reviews: Array<{ id: string; text: string; rating?: number }>
): Promise<Array<{ id: string; sentiment: "positive" | "mixed" | "negative"; topics: string[] }>> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  // Filter out reviews with no text and infer their sentiment directly
  const textReviews = reviews.filter(r => r.text && r.text.trim() !== "");
  const inferredResults = reviews.filter(r => !r.text || r.text.trim() === "").map(r => {
    const sentiment = r.rating ? (r.rating >= 4 ? "positive" : r.rating === 3 ? "mixed" : "negative") : "mixed";
    return { id: r.id, sentiment: sentiment as "positive" | "mixed" | "negative", topics: [] };
  });

  if (textReviews.length === 0) {
    return inferredResults;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

  const prompt = `Analyze these customer reviews and determine for each:
1. Overall sentiment (positive, mixed, or negative)
2. Top 2-3 topics/themes mentioned

Reviews:
${textReviews.map(r => `[ID: ${r.id}] Rating: ${r.rating || "N/A"} - "${r.text}"`).join("\n\n")}

Return ONLY valid JSON array in this exact format, with NO Markdown formatting or other text:
[
  { "id": "id1", "sentiment": "positive", "topics": ["friendly staff", "clean"] },
  { "id": "id2", "sentiment": "negative", "topics": ["slow service"] }
]`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error("No JSON array found in Gemini batch response.");
      return [
        ...inferredResults,
        ...textReviews.map(r => ({ id: r.id, sentiment: "mixed" as const, topics: [] }))
      ];
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return [...inferredResults, ...parsed];
  } catch (error) {
    console.error("Error analyzing batch review sentiment:", error);
    return [
      ...inferredResults,
      ...textReviews.map(r => ({ id: r.id, sentiment: "mixed" as const, topics: [] }))
    ];
  }
}

export async function generateHeadToHeadInsights(
  yourMetrics: {
    name: string;
    avgRating: number;
    totalReviews: number;
    responseRate: number;
    positiveCount: number;
    negativeCount: number;
    topTopics: string[];
  },
  competitorMetrics: {
    name: string;
    avgRating: number;
    totalReviews: number;
    responseRate: number;
    positiveCount: number;
    negativeCount: number;
    topTopics: string[];
  }
): Promise<string[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

  const prompt = `Compare these two businesses and generate 3-5 actionable competitive insights.

Your Business (${yourMetrics.name}):
- Rating: ${yourMetrics.avgRating}/5.0
- Total Reviews: ${yourMetrics.totalReviews}
- Response Rate: ${yourMetrics.responseRate}%
- Positive Reviews: ${yourMetrics.positiveCount}
- Negative Reviews: ${yourMetrics.negativeCount}
- Top Topics: ${yourMetrics.topTopics.join(", ")}

Competitor (${competitorMetrics.name}):
- Rating: ${competitorMetrics.avgRating}/5.0
- Total Reviews: ${competitorMetrics.totalReviews}
- Response Rate: ${competitorMetrics.responseRate}%
- Positive Reviews: ${competitorMetrics.positiveCount}
- Negative Reviews: ${competitorMetrics.negativeCount}
- Top Topics: ${competitorMetrics.topTopics.join(", ")}

Generate insights as a JSON array of strings. Focus on:
1. Where you're winning/losing
2. Sentiment differences
3. Topic differences
4. Actionable recommendations

Return ONLY valid JSON array:
["insight 1", "insight 2", "insight 3"]`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return [];
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Error generating insights:", error);
    return [];
  }
}
