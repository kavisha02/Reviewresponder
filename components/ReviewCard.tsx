/**
 * ReviewCard — full interactive review card.
 *
 * States a card moves through:
 *   new  →  (click Generate)  →  draft
 *
 * In "draft" state the owner can:
 *   - Read the AI draft
 *   - Click "Edit" to open an inline textarea and change any word
 *   - Click "Regenerate" to get a fresh AI draft
 *
 * Draft responses are saved but not published to Google.
 */

"use client";

import { useState } from "react";
import { Review } from "@/lib/types";

const STATUS_STYLES: Record<string, string> = {
  new:       "bg-yellow-900/50 text-yellow-300 border-yellow-700/50",
  draft:     "bg-blue-900/50 text-blue-300 border-blue-700/50",
  ignored:   "bg-slate-800 text-slate-400 border-slate-700",
};

const STATUS_LABELS: Record<string, string> = {
  new:       "Needs Response",
  draft:     "Draft Ready",
  ignored:   "Ignored",
};

function StarRating({ rating, isNegative }: { rating: number; isNegative: boolean }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`text-lg ${
            star <= rating
              ? isNegative ? "text-red-400" : "text-yellow-400"
              : "text-slate-700"
          }`}
        >
          ★
        </span>
      ))}
    </div>
  );
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months > 1 ? "s" : ""} ago`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function ReviewCard({ review }: { review: Review }) {
  const isNegative = review.rating <= 2;

  // ── Local UI state ──────────────────────────────────────────────────────
  const [status,     setStatus]     = useState(review.status);
  const [draft,      setDraft]      = useState<string | null>(review.draft_response);

  // Editing state — when true, draft becomes a textarea
  const [isEditing,  setIsEditing]  = useState(false);
  const [editedText, setEditedText] = useState(review.draft_response ?? "");

  const [generating, setGenerating] = useState(false);
  const [error,      setError]      = useState("");

  const initials = review.author_name
    ? review.author_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  // ── Generate / Regenerate ───────────────────────────────────────────────
  async function handleGenerate() {
    setGenerating(true);
    setError("");
    setIsEditing(false);

    const res  = await fetch("/api/reviews/generate-response", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ reviewId: review.id }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Generation failed. Please try again.");
      setGenerating(false);
      return;
    }

    setDraft(data.draft);
    setEditedText(data.draft);
    setStatus("draft");
    setGenerating(false);
  }

  return (
    <div className={`relative border rounded-2xl overflow-hidden ${
      isNegative && status === "new"
        ? "card-glow-negative border-red-700/40"
        : "card-glow bg-slate-800/70 border-slate-700"
    }`}>

      {/* Left accent bar */}
      {isNegative && status === "new" && (
        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-red-500/70" />
      )}

      <div className={isNegative && status === "new" ? "pl-4 pr-5 py-5" : "p-5"}>

        {/* ── Top row ── */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 bg-gradient-to-br ${
              isNegative && status === "new"
                ? "from-red-500/80 to-red-700/80"
                : "from-indigo-500 to-violet-600"
            }`}>
              {initials}
            </div>
            <div>
              <div className="text-white font-medium text-sm">{review.author_name ?? "Anonymous"}</div>
              <div className="text-slate-500 text-xs">{formatDate(review.review_date)} · {timeAgo(review.review_date)}</div>
            </div>
          </div>

          {/* Status badge */}
          <span className={`flex-shrink-0 text-xs px-2.5 py-1 rounded-full border font-medium ${
            isNegative && status === "new"
              ? "bg-red-900/60 text-red-300 border-red-600/60"
              : STATUS_STYLES[status] ?? STATUS_STYLES.new
          }`}>
            {STATUS_LABELS[status] ?? "New"}
          </span>
        </div>

        {/* ── Stars ── */}
        <StarRating rating={review.rating} isNegative={isNegative && status === "new"} />

        {/* ── Review text ── */}
        <p className="text-slate-300 text-sm leading-relaxed mt-2 mb-4">
          {review.review_text ?? (
            <span className="text-slate-500 italic">No written review — rating only</span>
          )}
        </p>

        {/* ── DRAFT state: AI draft box with edit controls ── */}
        {status === "draft" && draft && (
          <div className="bg-indigo-950/40 border border-indigo-800/40 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-indigo-400 text-xs font-semibold uppercase tracking-wide">
                  AI Draft Response
                </span>
                <span className="text-slate-500 text-xs">· Gemini</span>
              </div>
              {/* Edit toggle */}
              {!isEditing ? (
                <button
                  onClick={() => { setIsEditing(true); setEditedText(draft); }}
                  className="text-xs text-slate-400 hover:text-white border border-slate-600 hover:border-slate-400 px-2 py-0.5 rounded transition-all duration-150"
                >
                  Edit
                </button>
              ) : (
                <button
                  onClick={() => setIsEditing(false)}
                  className="text-xs text-slate-400 hover:text-white border border-slate-600 px-2 py-0.5 rounded transition-all duration-150"
                >
                  Cancel
                </button>
              )}
            </div>

            {/* Read-only view OR editable textarea */}
            {isEditing ? (
              <textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                rows={5}
                className="w-full bg-slate-900 border border-indigo-700/50 focus:border-indigo-400 rounded-lg px-3 py-2 text-slate-200 text-sm leading-relaxed outline-none resize-none transition-all duration-200"
                placeholder="Edit your response here…"
              />
            ) : (
              <p className="text-slate-300 text-sm leading-relaxed">{draft}</p>
            )}
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div className="bg-red-950/40 border border-red-700/40 rounded-lg px-3 py-2 mb-3 text-red-300 text-xs">
            {error}
          </div>
        )}

        {/* ── Action buttons ── */}
        {status !== "ignored" && (
          <div className="flex gap-2 flex-wrap">

            {/* Generate — shown when no draft */}
            {status === "new" && (
              <button
                onClick={handleGenerate}
                disabled={generating}
                className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all duration-200 ${
                  generating
                    ? "opacity-50 cursor-not-allowed bg-slate-700 text-slate-400 border-slate-600"
                    : isNegative
                      ? "bg-red-900/30 hover:bg-red-900/50 text-red-300 border-red-700/50 hover:border-red-500/70"
                      : "bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border-indigo-700/50 hover:border-indigo-500"
                }`}
              >
                {generating ? (
                  <span className="flex items-center gap-1.5">
                    <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Generating…
                  </span>
                ) : "Generate AI Response"}
              </button>
            )}

            {/* Regenerate — shown when draft exists */}
            {status === "draft" && (
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="text-xs px-3 py-1.5 rounded-lg border bg-slate-700/50 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border-slate-600 transition-all duration-200 disabled:opacity-50"
              >
                {generating ? "Regenerating…" : "Regenerate"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
