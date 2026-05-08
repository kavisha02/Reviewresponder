/**
 * ReviewSortDropdown — client component for sorting reviews.
 *
 * Sort options:
 *   - Urgency (negative + new first, then by rating)
 *   - Date (newest first)
 *   - Author name (A–Z)
 *   - Business location (for "All Locations" view)
 */

"use client";

import { useState } from "react";
import { Review } from "@/lib/types";

type SortOption = "urgency" | "date" | "author" | "location";

interface Props {
  reviews: Review[];
  isAllLocations?: boolean;
  onSortChange: (sorted: Review[]) => void;
}

export default function ReviewSortDropdown({
  reviews,
  isAllLocations = false,
  onSortChange,
}: Props) {
  const [sortBy, setSortBy] = useState<SortOption>("urgency");
  const [open, setOpen] = useState(false);

  function applySort(option: SortOption) {
    setSortBy(option);
    setOpen(false);

    let sorted = [...reviews];

    switch (option) {
      case "urgency":
        // Negative + new first, then by rating (lowest first)
        sorted.sort((a, b) => {
          const aIsUrgent = a.status === "new" && a.rating <= 2 ? 1 : 0;
          const bIsUrgent = b.status === "new" && b.rating <= 2 ? 1 : 0;
          if (aIsUrgent !== bIsUrgent) return bIsUrgent - aIsUrgent;
          // Then by rating (lowest first)
          return a.rating - b.rating;
        });
        break;

      case "date":
        // Newest first
        sorted.sort((a, b) => {
          const aDate = new Date(a.review_date ?? 0).getTime();
          const bDate = new Date(b.review_date ?? 0).getTime();
          return bDate - aDate;
        });
        break;

      case "author":
        // A–Z by author name
        sorted.sort((a, b) => {
          const aName = a.author_name ?? "Anonymous";
          const bName = b.author_name ?? "Anonymous";
          return aName.localeCompare(bName);
        });
        break;

      case "location":
        // Only relevant for "All Locations" view
        // Sort by business_id (which groups by location)
        sorted.sort((a, b) => {
          if (a.business_id !== b.business_id) {
            return a.business_id.localeCompare(b.business_id);
          }
          // Within same location, sort by urgency
          const aIsUrgent = a.status === "new" && a.rating <= 2 ? 1 : 0;
          const bIsUrgent = b.status === "new" && b.rating <= 2 ? 1 : 0;
          if (aIsUrgent !== bIsUrgent) return bIsUrgent - aIsUrgent;
          return a.rating - b.rating;
        });
        break;
    }

    onSortChange(sorted);
  }

  const sortLabels: Record<SortOption, string> = {
    urgency: "🚨 Urgency",
    date: "📅 Date (Newest)",
    author: "👤 Author Name",
    location: "📍 Location",
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 text-sm text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-3 py-1.5 rounded-lg transition-all duration-200 bg-slate-800/40 hover:bg-slate-800"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        Sort: {sortLabels[sortBy]}
        <svg
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl shadow-black/50 overflow-hidden z-40">
          {[
            { key: "urgency" as SortOption, label: "🚨 Urgency (Negative First)" },
            { key: "date" as SortOption,     label: "📅 Date (Newest First)" },
            { key: "author" as SortOption,   label: "👤 Author Name (A–Z)" },
            ...(isAllLocations ? [{ key: "location" as SortOption, label: "📍 Location" }] : []),
          ].map((option) => (
            <button
              key={option.key}
              onClick={() => applySort(option.key)}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors duration-150 ${
                sortBy === option.key
                  ? "bg-indigo-950/60 text-indigo-300 border-l-2 border-indigo-500"
                  : "text-slate-300 hover:bg-slate-700/50"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
