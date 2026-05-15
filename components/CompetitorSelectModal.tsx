"use client";

import { useState } from "react";

interface CompetitorSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (competitorName: string, googleMapsUrl?: string) => Promise<void>;
  isLoading?: boolean;
  tierLimit?: number;
  currentCount?: number;
}

export default function CompetitorSelectModal({
  isOpen,
  onClose,
  onAdd,
  isLoading = false,
  tierLimit = 3,
  currentCount = 0,
}: CompetitorSelectModalProps) {
  const [competitorName, setCompetitorName] = useState("");
  const [googleMapsUrl, setGoogleMapsUrl] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canAddMore = currentCount < tierLimit;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!competitorName.trim()) {
      setError("Competitor name is required");
      return;
    }

    if (!canAddMore) {
      setError(`You've reached the limit of ${tierLimit} competitors for your tier`);
      return;
    }

    setIsSubmitting(true);
    try {
      await onAdd(competitorName, googleMapsUrl || undefined);
      setCompetitorName("");
      setGoogleMapsUrl("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add competitor");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-md w-full">
        <h2 className="text-lg font-bold text-white mb-2">Add Competitor</h2>
        <p className="text-slate-400 text-sm mb-6">
          Track a competitor to compare your reputation metrics.
        </p>

        {!canAddMore && (
          <div className="bg-yellow-950/50 border border-yellow-700/50 rounded-lg px-4 py-3 mb-4 text-yellow-300 text-sm">
            You've reached the limit of {tierLimit} competitors for your tier. Upgrade to Pro for unlimited competitors.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Competitor Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-1.5">
              Competitor Name <span className="text-red-400">*</span>
            </label>
            <input
              id="name"
              type="text"
              required
              value={competitorName}
              onChange={(e) => setCompetitorName(e.target.value)}
              placeholder="e.g. Competitor Salon"
              disabled={isSubmitting || !canAddMore}
              className="w-full bg-slate-900 border border-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 text-sm outline-none transition-all duration-200 disabled:opacity-50"
            />
          </div>

          {/* Google Maps URL */}
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-slate-300 mb-1.5">
              Google Maps URL <span className="text-slate-500">(optional)</span>
            </label>
            <input
              id="url"
              type="url"
              value={googleMapsUrl}
              onChange={(e) => setGoogleMapsUrl(e.target.value)}
              placeholder="https://www.google.com/maps/place/..."
              disabled={isSubmitting || !canAddMore}
              className="w-full bg-slate-900 border border-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 text-sm outline-none transition-all duration-200 disabled:opacity-50"
            />
            <p className="text-xs text-slate-500 mt-1.5">
              Paste the URL from Google Maps for more accurate data
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-950/50 border border-red-700/50 rounded-lg px-4 py-3 text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 border border-slate-600 hover:border-slate-500 text-slate-300 hover:text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !canAddMore}
              className="flex-1 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200"
            >
              {isSubmitting ? "Adding..." : "Add Competitor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
