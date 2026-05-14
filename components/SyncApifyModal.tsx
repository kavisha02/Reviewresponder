"use client";

import { useState } from "react";

interface Props {
  businessId: string;
  googleMapsUrl: string | null;
  onSuccess?: () => void;
}

export default function SyncApifyModal({ businessId, googleMapsUrl, onSuccess }: Props) {
  const [open, setOpen] = useState(false);
  const [maxReviews, setMaxReviews] = useState<number | "">(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [syncCount, setSyncCount] = useState(0);

  async function handleSync() {
    if (!maxReviews || maxReviews < 1 || maxReviews > 500) {
      setError("Please enter a number between 1 and 500");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch("/api/reviews/sync-from-apify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, maxReviews }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to sync reviews");
        setLoading(false);
        return;
      }

      setSyncCount(data.count);
      setSuccess(true);
      setLoading(false);

      // Close modal after 3 seconds and refresh
      setTimeout(() => {
        setOpen(false);
        setSuccess(false);
        onSuccess?.();
        window.location.reload();
      }, 3000);
    } catch (err) {
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  }

  if (!googleMapsUrl) {
    return null;
  }

  return (
    <>
      {/* Button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-xs text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-2.5 py-1.5 rounded-lg transition-all duration-200 bg-slate-800/40 hover:bg-slate-800"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Fetch More Reviews
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-md w-full">
            <h2 className="text-lg font-bold text-white mb-4">Fetch Reviews from Google Maps</h2>

            {success ? (
              <div className="bg-emerald-950/50 border border-emerald-700/50 rounded-lg px-4 py-3 text-emerald-300 text-sm">
                ✓ Successfully synced {syncCount} review{syncCount !== 1 ? "s" : ""}! Refreshing...
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    How many reviews to fetch?
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={maxReviews}
                    onChange={(e) => setMaxReviews(e.target.value ? parseInt(e.target.value) : "")}
                    placeholder="Enter number (1-500)"
                    className="w-full bg-slate-900 border border-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-lg px-3 py-2 text-white placeholder-slate-500 text-sm outline-none transition-all duration-200"
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    Maximum 500 reviews per fetch. Only new reviews will be added.
                  </p>
                </div>

                <div className="bg-indigo-950/40 border border-indigo-800/40 rounded-lg px-3 py-2 mb-4 text-indigo-300 text-xs">
                  <strong>URL:</strong> {googleMapsUrl.substring(0, 50)}...
                </div>

                {error && (
                  <div className="bg-red-950/50 border border-red-700/50 rounded-lg px-3 py-2 text-red-300 text-xs mb-4">
                    {error}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => setOpen(false)}
                    className="flex-1 border border-slate-600 hover:border-slate-500 text-slate-300 hover:text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSync}
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                  >
                    {loading ? "Fetching…" : "Fetch Reviews"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
