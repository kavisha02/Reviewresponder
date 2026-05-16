/**
 * Business Setup Page — /dashboard/setup
 *
 * New flow:
 *   1. Show existing locations (if any) - user can click to edit URL
 *   2. Option to add new location
 *   3. Form to create new location with preview step
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Business {
  id: string;
  name: string;
  business_type: string | null;
  google_maps_url: string | null;
}

const BUSINESS_TYPES = [
  "Restaurant / Café",
  "Salon / Spa",
  "Medical / Dental Clinic",
  "Auto Services",
  "Retail Shop",
  "Hotel / Accommodation",
  "Gym / Fitness",
  "Real Estate",
  "Legal / Financial Services",
  "Other",
];

export default function SetupPage() {
  const router = useRouter();

  // Existing locations
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loadingBusinesses, setLoadingBusinesses] = useState(true);

  // Add new location form
  const [name, setName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [googleMapsUrl, setGoogleMapsUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [urlValidating, setUrlValidating] = useState(false);
  const [urlValid, setUrlValid] = useState(false);
  const [urlValidationMsg, setUrlValidationMsg] = useState("");
  const [step, setStep] = useState<"list" | "add-details" | "add-preview">("list");

  // Edit existing location
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editUrl, setEditUrl] = useState("");
  const [editUrlValidating, setEditUrlValidating] = useState(false);
  const [editUrlValid, setEditUrlValid] = useState(false);
  const [editUrlValidationMsg, setEditUrlValidationMsg] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  // Load existing businesses
  useEffect(() => {
    async function loadBusinesses() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("businesses")
        .select("id, name, business_type, google_maps_url")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setBusinesses(data || []);
      setLoadingBusinesses(false);
    }
    loadBusinesses();
  }, []);

  // Validate Google Maps URL
  async function validateGoogleMapsUrl() {
    if (!googleMapsUrl.trim()) {
      setUrlValidationMsg("Please enter a URL");
      setUrlValid(false);
      return;
    }

    setUrlValidating(true);
    setUrlValidationMsg("");

    try {
      const res = await fetch("/api/validate-google-maps-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: googleMapsUrl }),
      });

      const data = await res.json();

      if (!res.ok) {
        setUrlValidationMsg(data.error || "Invalid Google Maps URL");
        setUrlValid(false);
        setUrlValidating(false);
        return;
      }

      setUrlValidationMsg(`✓ Location verified: ${data.businessName}`);
      setUrlValid(true);
      setUrlValidating(false);
    } catch (err) {
      setUrlValidationMsg("Failed to validate URL. Please try again.");
      setUrlValid(false);
      setUrlValidating(false);
    }
  }

  // Validate edit URL
  async function validateEditUrl() {
    if (!editUrl.trim()) {
      setEditUrlValidationMsg("Please enter a URL");
      setEditUrlValid(false);
      return;
    }

    setEditUrlValidating(true);
    setEditUrlValidationMsg("");

    try {
      const res = await fetch("/api/validate-google-maps-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: editUrl }),
      });

      const data = await res.json();

      if (!res.ok) {
        setEditUrlValidationMsg(data.error || "Invalid Google Maps URL");
        setEditUrlValid(false);
        setEditUrlValidating(false);
        return;
      }

      setEditUrlValidationMsg(`✓ Location verified: ${data.businessName}`);
      setEditUrlValid(true);
      setEditUrlValidating(false);
    } catch (err) {
      setEditUrlValidationMsg("Failed to validate URL. Please try again.");
      setEditUrlValid(false);
      setEditUrlValidating(false);
    }
  }

  // Handle add location next
  async function handleAddNext(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Business name is required");
      return;
    }

    setStep("add-preview");
  }

  // Handle add location submit
  async function handleAddSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/business/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, businessType, googleMapsUrl }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Something went wrong. Please try again.");
      setLoading(false);
      return;
    }

    // Reload businesses and reset form
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: updatedBusinesses } = await supabase
        .from("businesses")
        .select("id, name, business_type, google_maps_url")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setBusinesses(updatedBusinesses || []);
    }

    // Reset form
    setName("");
    setBusinessType("");
    setGoogleMapsUrl("");
    setUrlValid(false);
    setUrlValidationMsg("");
    setStep("list");
    setLoading(false);
  }

  // Handle edit location
  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;

    setEditLoading(true);

    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("businesses")
      .update({ google_maps_url: editUrl })
      .eq("id", editingId);

    if (updateError) {
      alert("Failed to update URL: " + updateError.message);
      setEditLoading(false);
      return;
    }

    // Reload businesses
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: updatedBusinesses } = await supabase
        .from("businesses")
        .select("id, name, business_type, google_maps_url")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setBusinesses(updatedBusinesses || []);
    }

    setEditingId(null);
    setEditUrl("");
    setEditUrlValid(false);
    setEditUrlValidationMsg("");
    setEditLoading(false);
  }

  if (loadingBusinesses) {
    return (
      <main className="h-full flex items-center justify-center px-4 py-8">
        <div className="text-slate-400">Loading...</div>
      </main>
    );
  }

  return (
    <main className="h-full flex items-center justify-center px-4 py-8">
      <div className="orb orb-1 opacity-10" aria-hidden="true" />

      <div className="relative z-10 w-full max-w-lg">
        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-8 backdrop-blur-sm shadow-2xl">

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                RR
              </div>
              <span className="font-semibold text-lg text-white">ReviewResponder</span>
            </div>
          </div>

          {/* Show existing locations or add new */}
          {step === "list" ? (
            <>
              <h1 className="text-2xl font-bold text-white mb-1">
                {businesses.length === 0 ? "Tell us about your business" : "Your Locations"}
              </h1>
              <p className="text-slate-400 text-sm mb-8">
                {businesses.length === 0
                  ? "This helps the AI write responses that match your business context and tone."
                  : "Click on a location to edit its Google Maps URL, or add a new one."}
              </p>

              {/* Existing locations list */}
              {businesses.length > 0 && (
                <div className="space-y-3 mb-8">
                  {businesses.map((business) => (
                    <div
                      key={business.id}
                      onClick={() => {
                        setEditingId(business.id);
                        setEditUrl(business.google_maps_url || "");
                        setEditUrlValid(!!business.google_maps_url);
                      }}
                      className="bg-slate-900/50 border border-slate-700 hover:border-indigo-500 rounded-lg p-4 cursor-pointer transition-all duration-200 hover:bg-slate-900"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-white">{business.name}</h3>
                          {business.business_type && (
                            <p className="text-xs text-slate-400 mt-1">{business.business_type}</p>
                          )}
                          {business.google_maps_url ? (
                            <p className="text-xs text-emerald-400 mt-2">✓ Google Maps URL added</p>
                          ) : (
                            <p className="text-xs text-yellow-400 mt-2">⚠ No Google Maps URL</p>
                          )}
                        </div>
                        <div className="text-indigo-400 text-lg">→</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add new location button */}
              <button
                onClick={() => {
                  setStep("add-details");
                  setName("");
                  setBusinessType("");
                  setGoogleMapsUrl("");
                  setUrlValid(false);
                  setError("");
                }}
                className="btn-shimmer w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-indigo-600/30"
              >
                {businesses.length === 0 ? "Add Your Business →" : "+ Add Another Location"}
              </button>
            </>
          ) : step === "add-details" ? (
            <>
              <h1 className="text-2xl font-bold text-white mb-1">Add a New Location</h1>
              <p className="text-slate-400 text-sm mb-8">
                Each location gets its own review dashboard, stats, and AI responses.
              </p>

              <form onSubmit={handleAddNext} className="space-y-5">
                {/* Business name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-1.5">
                    Location name <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. The Salon – Bandra Branch"
                    className="w-full bg-slate-900 border border-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 text-sm outline-none transition-all duration-200"
                  />
                </div>

                {/* Business type */}
                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-slate-300 mb-1.5">
                    Business type
                  </label>
                  <select
                    id="type"
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 rounded-lg px-4 py-2.5 text-sm outline-none transition-all duration-200 text-white"
                  >
                    <option value="">Select a type (optional)</option>
                    {BUSINESS_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                {/* Google Maps URL */}
                <div>
                  <label htmlFor="url" className="block text-sm font-medium text-slate-300 mb-1.5">
                    Google Maps Business URL <span className="text-slate-500">(optional)</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="url"
                      type="url"
                      value={googleMapsUrl}
                      onChange={(e) => {
                        setGoogleMapsUrl(e.target.value);
                        setUrlValid(false);
                        setUrlValidationMsg("");
                      }}
                      placeholder="https://www.google.com/maps/place/..."
                      className={`flex-1 bg-slate-900 border rounded-lg px-4 py-2.5 text-white placeholder-slate-500 text-sm outline-none transition-all duration-200 ${
                        urlValid
                          ? "border-emerald-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                          : "border-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                      }`}
                    />
                    {googleMapsUrl.trim() && !urlValid && (
                      <button
                        type="button"
                        onClick={validateGoogleMapsUrl}
                        disabled={urlValidating}
                        className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap"
                      >
                        {urlValidating ? "Verifying..." : "Verify"}
                      </button>
                    )}
                  </div>

                  {urlValidationMsg && (
                    <p className={`text-xs mt-2 ${urlValid ? "text-emerald-400" : "text-red-400"}`}>
                      {urlValidationMsg}
                    </p>
                  )}

                  <p className="text-xs text-slate-500 mt-2">
                    Paste the URL from your Google Maps business listing to fetch reviews automatically.
                  </p>
                </div>

                {/* Error */}
                {error && (
                  <div className="bg-red-950/50 border border-red-700/50 rounded-lg px-4 py-3 text-red-300 text-sm">
                    {error}
                  </div>
                )}

                {/* Buttons */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep("list")}
                    disabled={loading}
                    className="flex-1 border border-slate-600 hover:border-slate-500 text-slate-300 hover:text-white px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-50"
                  >
                    ← Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !name.trim()}
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-indigo-600/30"
                  >
                    Next →
                  </button>
                </div>
              </form>
            </>
          ) : step === "add-preview" ? (
            <>
              <h1 className="text-2xl font-bold text-white mb-1">Review Your Details</h1>
              <p className="text-slate-400 text-sm mb-8">
                Review your information. You can edit the URL if needed.
              </p>

              <form onSubmit={handleAddSubmit} className="space-y-5">
                {/* Location name - Display only */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Location name
                  </label>
                  <div className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white text-sm">
                    {name}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Cannot be changed</p>
                </div>

                {/* Business type - Display only */}
                {businessType && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                      Business type
                    </label>
                    <div className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white text-sm">
                      {businessType}
                    </div>
                  </div>
                )}

                {/* Google Maps URL - Editable */}
                <div>
                  <label htmlFor="preview-url" className="block text-sm font-medium text-slate-300 mb-1.5">
                    Google Maps Business URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="preview-url"
                      type="url"
                      value={googleMapsUrl}
                      onChange={(e) => {
                        setGoogleMapsUrl(e.target.value);
                        setUrlValid(false);
                        setUrlValidationMsg("");
                      }}
                      placeholder="https://www.google.com/maps/place/..."
                      className={`flex-1 bg-slate-900 border rounded-lg px-4 py-2.5 text-white placeholder-slate-500 text-sm outline-none transition-all duration-200 ${
                        urlValid
                          ? "border-emerald-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                          : "border-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                      }`}
                    />
                    {googleMapsUrl.trim() && !urlValid && (
                      <button
                        type="button"
                        onClick={validateGoogleMapsUrl}
                        disabled={urlValidating}
                        className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap"
                      >
                        {urlValidating ? "Verifying..." : "Verify"}
                      </button>
                    )}
                  </div>

                  {urlValidationMsg && (
                    <p className={`text-xs mt-2 ${urlValid ? "text-emerald-400" : "text-red-400"}`}>
                      {urlValidationMsg}
                    </p>
                  )}

                  <p className="text-xs text-slate-500 mt-2">
                    You can edit this URL if needed.
                  </p>
                </div>

                {/* Info Box */}
                <div className="bg-indigo-950/40 border border-indigo-800/40 rounded-lg px-4 py-3 text-indigo-300 text-sm">
                  <p className="font-medium mb-1">✓ Details Confirmed</p>
                  <p>Ready to set up your location dashboard.</p>
                </div>

                {/* Error */}
                {error && (
                  <div className="bg-red-950/50 border border-red-700/50 rounded-lg px-4 py-3 text-red-300 text-sm">
                    {error}
                  </div>
                )}

                {/* Buttons */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep("add-details")}
                    disabled={loading}
                    className="flex-1 border border-slate-600 hover:border-slate-500 text-slate-300 hover:text-white px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-50"
                  >
                    ← Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-shimmer flex-1 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg shadow-indigo-600/30"
                  >
                    {loading ? "Adding location…" : "Add Location →"}
                  </button>
                </div>
              </form>
            </>
          ) : null}

          {/* Edit location modal */}
          {editingId && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-md w-full">
                <h2 className="text-lg font-bold text-white mb-2">Edit Google Maps URL</h2>
                <p className="text-slate-400 text-sm mb-6">
                  Update the Google Maps URL for this location.
                </p>

                <form onSubmit={handleEditSubmit} className="space-y-4">
                  {/* Location name - Display only */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                      Location name
                    </label>
                    <div className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white text-sm">
                      {businesses.find((b) => b.id === editingId)?.name}
                    </div>
                  </div>

                  {/* Google Maps URL - Editable */}
                  <div>
                    <label htmlFor="edit-url" className="block text-sm font-medium text-slate-300 mb-1.5">
                      Google Maps URL
                    </label>
                    <div className="flex gap-2">
                      <input
                        id="edit-url"
                        type="url"
                        value={editUrl}
                        onChange={(e) => {
                          setEditUrl(e.target.value);
                          setEditUrlValid(false);
                          setEditUrlValidationMsg("");
                        }}
                        placeholder="https://www.google.com/maps/place/..."
                        className={`flex-1 bg-slate-900 border rounded-lg px-4 py-2.5 text-white placeholder-slate-500 text-sm outline-none transition-all duration-200 ${
                          editUrlValid
                            ? "border-emerald-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                            : "border-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                        }`}
                      />
                      {editUrl.trim() && !editUrlValid && (
                        <button
                          type="button"
                          onClick={validateEditUrl}
                          disabled={editUrlValidating}
                          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap"
                        >
                          {editUrlValidating ? "Verifying..." : "Verify"}
                        </button>
                      )}
                    </div>

                    {editUrlValidationMsg && (
                      <p className={`text-xs mt-2 ${editUrlValid ? "text-emerald-400" : "text-red-400"}`}>
                        {editUrlValidationMsg}
                      </p>
                    )}
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(null);
                        setEditUrl("");
                        setEditUrlValid(false);
                        setEditUrlValidationMsg("");
                      }}
                      disabled={editLoading}
                      className="flex-1 border border-slate-600 hover:border-slate-500 text-slate-300 hover:text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={editLoading || !editUrl.trim()}
                      className="flex-1 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                    >
                      {editLoading ? "Saving..." : "Save URL"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
