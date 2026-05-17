/**
 * ReviewCard — full interactive review card.
 *
 * States a card moves through:
 *   new  →  (click Generate)  →  draft  →  (click Save)  →  published
 *
 * If owner_response exists, shows that instead of generating AI response.
 * In "draft" state the owner can:
 *   - Read the AI draft
 *   - Click "Edit" to open an inline textarea and change any word
 *   - Click "Regenerate" to get a fresh AI draft
 *   - Click "Save" to publish the response
 *
 * Draft responses are saved but not published to Google.
 */

"use client";

import { useState } from "react";
import { Review } from "@/lib/types";

const STATUS_STYLES: Record<string, string> = {
  new:       "bg-yellow-900/50 text-yellow-300 border-yellow-700/50",
  draft:     "bg-blue-900/50 text-blue-300 border-blue-700/50",
  responded: "bg-emerald-900/50 text-emerald-300 border-emerald-700/50",
  ignored:   "bg-slate-800 text-slate-400 border-slate-700",
};

const STATUS_LABELS: Record<string, string> = {
  new:       "Needs Response",
  draft:     "Draft Ready",
  responded: "Responded",
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

export default function ReviewCard({ review, planId = "free", onStatusChange }: { review: Review; planId?: string; onStatusChange?: (newStatus: string) => void }) {
  const isNegative = review.rating <= 2;
  const hasOwnerResponse = review.owner_response && review.owner_response.trim().length > 0;
  const hasPublishedResponse = review.published_response && review.published_response.trim().length > 0;

  const initialStatus = hasOwnerResponse && review.status === "new" ? "responded" : review.status;

  // ── Local UI state ──────────────────────────────────────────────────────
  const [status,     setStatus]     = useState(initialStatus);
  const [draft,      setDraft]      = useState<string | null>(review.draft_response);

  // Editing state — when true, draft becomes a textarea
  const [isEditing,  setIsEditing]  = useState(false);
  const [editedText, setEditedText] = useState(review.draft_response ?? "");

  const [generating, setGenerating] = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState("");
  const [showToneModal, setShowToneModal] = useState(false);
  const [selectedTone, setSelectedTone] = useState<"professional" | "friendly" | "casual">("professional");

  const initials = review.author_name
    ? review.author_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  // ── Generate / Regenerate ───────────────────────────────────────────────
  async function handleGenerate(tone: "professional" | "friendly" | "casual" = "professional") {
    setGenerating(true);
    setError("");
    setIsEditing(false);
    setShowToneModal(false);

    const res  = await fetch("/api/reviews/generate-response", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ reviewId: review.id, tone }),
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

  // ── Save response ───────────────────────────────────────────────────────
  async function handleSave() {
    if (!editedText.trim()) {
      setError("Response cannot be empty");
      return;
    }

    setSaving(true);
    setError("");

    const res = await fetch("/api/reviews/save-response", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reviewId: review.id,
        response: editedText,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Failed to save response");
      setSaving(false);
      return;
    }

    setStatus("responded");
    setDraft(editedText);
    setIsEditing(false);
    setSaving(false);
    onStatusChange?.("responded");

    // Refresh page to update stats
    setTimeout(() => {
      window.location.reload();
    }, 500);
  }

  return (
    <>
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
              <div className="text-white font-medium text-sm flex items-center gap-2">
                {review.author_name ?? "Anonymous"}
                {review.is_local_guide && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30 font-semibold" title="Local Guide">
                    ⭐ Local Guide
                  </span>
                )}
                {(review.reviewer_review_count ?? 0) > 50 && !review.is_local_guide && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 font-semibold" title="Prolific Reviewer">
                    🌟 VIP Reviewer
                  </span>
                )}
              </div>
              <div className="text-slate-500 text-xs flex items-center gap-2 mt-0.5">
                <span>{formatDate(review.review_date)} · {timeAgo(review.review_date)}</span>
                {review.has_photos && (
                  <span className="text-[10px] flex items-center gap-1 px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30" title="Includes Photos">
                    📸 Photos
                  </span>
                )}
                {(review.likes_count ?? 0) > 0 && (
                  <span className="text-[10px] flex items-center gap-1 px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-400 border border-pink-500/30" title="Likes">
                    ❤️ {review.likes_count}
                  </span>
                )}
              </div>
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

        {/* ── SAVED / OWNER RESPONSE ── */}
        {(hasOwnerResponse || hasPublishedResponse || status === "responded") && (
          <div className="bg-emerald-950/40 border border-emerald-800/40 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-emerald-400 text-xs font-semibold uppercase tracking-wide">
                {hasOwnerResponse ? "Owner Response" : "Saved Response"}
              </span>
              {(hasOwnerResponse || review.published_at) && (
                <span className="text-slate-500 text-xs">
                  · {formatDate(hasOwnerResponse ? review.owner_response_date : review.published_at)}
                </span>
              )}
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">
              {hasOwnerResponse 
                ? review.owner_response 
                : (hasPublishedResponse ? review.published_response : draft)}
            </p>
          </div>
        )}

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

            {/* Generate — shown when no draft and no owner response */}
            {status === "new" && !hasOwnerResponse && (
              <>
                {["pro", "elite"].includes(planId) ? (
                  <button
                    onClick={() => setShowToneModal(true)}
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
                ) : (
                  <a
                    href="/pricing"
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border bg-slate-800/80 hover:bg-slate-700/80 text-indigo-300 border-slate-700 hover:border-indigo-500/50 transition-all duration-200"
                    title="AI Responses require Pro or Elite plan"
                  >
                    <span>🔒</span> Upgrade for AI Responses
                  </a>
                )}
              </>
            )}

            {/* Regenerate — shown when draft exists */}
            {status === "draft" && (
              <button
                onClick={() => setShowToneModal(true)}
                disabled={generating}
                className="text-xs px-3 py-1.5 rounded-lg border bg-slate-700/50 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border-slate-600 transition-all duration-200 disabled:opacity-50"
              >
                {generating ? "Regenerating…" : "Regenerate"}
              </button>
            )}

            {/* Save — shown when editing or draft exists */}
            {status === "draft" && (
              <button
                onClick={handleSave}
                disabled={saving || !editedText.trim()}
                className="text-xs px-3 py-1.5 rounded-lg border bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border-emerald-700/50 hover:border-emerald-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {saving ? (
                  <span className="flex items-center gap-1.5">
                    <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Saving…
                  </span>
                ) : "Save Response"}
              </button>
            )}
          </div>
        )}
      </div>

      </div>

      {/* ── Tone Selection Modal ── */}
      {showToneModal && (
        <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-md w-full shadow-2xl relative">
            <h2 className="text-xl font-bold text-white mb-2">Choose Response Tone</h2>
            <p className="text-slate-400 text-sm mb-6">
              How would you like the AI to respond to this review?
            </p>

            <div className="space-y-3 mb-6">
              {[
                {
                  id: "professional",
                  label: "Professional",
                  description: "Formal, polished, and professional",
                  icon: "💼",
                },
                {
                  id: "friendly",
                  label: "Friendly",
                  description: "Warm, approachable, and conversational",
                  icon: "😊",
                },
                {
                  id: "casual",
                  label: "Casual",
                  description: "Relaxed, informal, and personable",
                  icon: "👋",
                },
              ].map((tone) => (
                <label
                  key={tone.id}
                  className={`flex items-start gap-4 p-4 border rounded-xl cursor-pointer transition-all duration-200 ${
                    selectedTone === tone.id
                      ? "bg-indigo-900/20 border-indigo-500 ring-2 ring-indigo-500/50 shadow-lg shadow-indigo-900/20"
                      : "bg-slate-800/50 border-slate-700 hover:border-slate-500 hover:bg-slate-800"
                  }`}
                >
                  <div className={`mt-1 flex items-center justify-center w-5 h-5 rounded-full border-2 transition-colors ${
                    selectedTone === tone.id ? "border-indigo-500 bg-indigo-500" : "border-slate-500 bg-slate-800"
                  }`}>
                    {selectedTone === tone.id && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                  
                  {/* Hidden actual radio input */}
                  <input
                    type="radio"
                    name={`tone-${review.id}`}
                    value={tone.id}
                    checked={selectedTone === tone.id}
                    onChange={(e) => setSelectedTone(e.target.value as "professional" | "friendly" | "casual")}
                    className="sr-only"
                  />
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{tone.icon}</span>
                      <span className="font-semibold text-white">{tone.label}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1.5">{tone.description}</p>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setShowToneModal(false)}
                className="flex-1 border border-slate-600 hover:border-slate-400 hover:bg-slate-800 text-slate-300 hover:text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={() => handleGenerate(selectedTone)}
                disabled={generating}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-lg text-sm font-medium shadow-lg shadow-indigo-600/20 transition-all duration-200"
              >
                {generating ? "Generating…" : "Generate AI Response"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
