"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import MultiCompetitorDashboard from "@/components/MultiCompetitorDashboard";

function OverviewContent() {
  const searchParams = useSearchParams();
  const businessId = searchParams.get("business");

  if (!businessId) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-400">No business selected</div>
      </div>
    );
  }

  return <MultiCompetitorDashboard businessId={businessId} />;
}

export default function CompetitorOverviewPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-400">Loading...</div>
      </div>
    }>
      <OverviewContent />
    </Suspense>
  );
}
