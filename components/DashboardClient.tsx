/**
 * DashboardClient — client wrapper for the reviews grid with sorting.
 *
 * Handles:
 *   - Sort dropdown state
 *   - Applying sort to reviews
 *   - Rendering the grid
 *   - Sync button for real reviews
 */

"use client";

import { useState, useEffect } from "react";
import { Review, Business } from "@/lib/types";
import ReviewCard from "@/components/ReviewCard";
import ReviewSortDropdown from "@/components/ReviewSortDropdown";
import SyncReviewsButton from "@/components/SyncReviewsButton";
import SyncApifyModal from "@/components/SyncApifyModal";

interface Props {
  allReviews: Review[];
  isAllLocations?: boolean;
  businessId?: string;
  business?: Business | null;
}

export default function DashboardClient({
  allReviews,
  isAllLocations = false,
  businessId = "",
  business = null,
}: Props) {
  const [sortedReviews, setSortedReviews] = useState(allReviews);
  const [reviews, setReviews] = useState(allReviews);

  // Default sort by urgency on mount
  useEffect(() => {
    const sorted = [...reviews].sort((a, b) => {
      const aIsUrgent = a.status === "new" && a.rating <= 2 ? 1 : 0;
      const bIsUrgent = b.status === "new" && b.rating <= 2 ? 1 : 0;
      if (aIsUrgent !== bIsUrgent) return bIsUrgent - aIsUrgent;
      return a.rating - b.rating;
    });
    setSortedReviews(sorted);
  }, [reviews]);

  // Handle status change from ReviewCard
  function handleStatusChange(reviewId: string, newStatus: string) {
    setReviews(reviews.map(r =>
      r.id === reviewId ? { ...r, status: newStatus as any } : r
    ));
  }

  return (
    <>
      {/* Sort dropdown + Sync button — only show if there are reviews or not all locations */}
      {(allReviews.length > 0 || !isAllLocations) && (
        <div className="mb-6 flex items-center gap-2 flex-wrap">
          {allReviews.length > 0 && (
            <ReviewSortDropdown
              reviews={allReviews}
              isAllLocations={isAllLocations}
              onSortChange={setSortedReviews}
            />
          )}
          {!isAllLocations && businessId && business && (
            <>
              {business.google_maps_url ? (
                <SyncApifyModal businessId={businessId} googleMapsUrl={business.google_maps_url} />
              ) : (
                <SyncReviewsButton businessId={businessId} />
              )}
            </>
          )}
          {allReviews.length > 0 && (
            <span className="text-xs text-slate-500">
              {sortedReviews.length} review{sortedReviews.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      )}

      {/* Reviews grid */}
      {sortedReviews.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <div className="text-4xl mb-4">📭</div>
          <p className="mb-2">{isAllLocations ? "No reviews across any location yet." : "No reviews for this location yet."}</p>
          <p className="text-xs text-slate-600">
            {!isAllLocations && businessId ? "Click 'Sync Real Reviews' to fetch from Google Maps, or reviews will appear here once synced." : "Reviews will appear here once synced."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedReviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onStatusChange={(newStatus) => handleStatusChange(review.id, newStatus)}
            />
          ))}
        </div>
      )}
    </>
  );
}

