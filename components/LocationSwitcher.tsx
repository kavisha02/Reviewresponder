/**
 * LocationSwitcher — navbar dropdown to switch between business locations.
 *
 * Props:
 *   businesses  — all locations belonging to this user
 *   currentId   — the businessId currently shown ("all" = aggregate view)
 *   basePath    — base URL to navigate to on switch (default: /dashboard)
 *   showAll     — when true, adds an "All Locations" option at the top
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Business } from "@/lib/types";

interface Props {
  businesses: Business[];
  currentId:  string;
  basePath?:  string;   // default "/dashboard"
  showAll?:   boolean;  // default false
}

export default function LocationSwitcher({
  businesses,
  currentId,
  basePath = "/dashboard",
  showAll  = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const ref             = useRef<HTMLDivElement>(null);
  const router          = useRouter();

  const isAll   = currentId === "all";
  const current = isAll ? null : (businesses.find((b) => b.id === currentId) ?? businesses[0]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function switchTo(id: string) {
    setOpen(false);
    router.push(`${basePath}?business=${id}`);
    router.refresh();
  }

  return (
    <div ref={ref} className="relative">

      {/* Current location button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-500 rounded-lg px-3 py-2 transition-all duration-200 max-w-[220px]"
      >
        <div className={`w-5 h-5 rounded flex items-center justify-center text-white text-xs flex-shrink-0 font-bold bg-gradient-to-br ${
          isAll ? "from-violet-500 to-purple-600" : "from-indigo-500 to-violet-600"
        }`}>
          {isAll ? "✦" : current?.name.charAt(0).toUpperCase()}
        </div>

        <span className="text-white text-sm font-medium truncate">
          {isAll ? "All Locations" : current?.name}
        </span>

        <svg
          className={`w-3.5 h-3.5 text-slate-400 flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50">

          <div className="px-3 py-2 border-b border-slate-700">
            <span className="text-slate-500 text-xs font-medium uppercase tracking-wider">
              Your Locations
            </span>
          </div>

          <div className="py-1 max-h-60 overflow-y-auto">

            {/* All Locations option — analytics only */}
            {showAll && (
              <button
                onClick={() => switchTo("all")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-slate-700 transition-colors duration-150 ${
                  isAll ? "bg-indigo-950/50" : ""
                }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0 bg-gradient-to-br ${
                  isAll ? "from-violet-500 to-purple-600" : "from-slate-600 to-slate-700"
                }`}>
                  ✦
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">All Locations</div>
                  <div className="text-xs text-slate-400 truncate">Combined analytics</div>
                </div>
                {isAll && (
                  <svg className="w-4 h-4 text-indigo-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            )}

            {/* Individual location rows */}
            {businesses.map((biz) => (
              <button
                key={biz.id}
                onClick={() => switchTo(biz.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-slate-700 transition-colors duration-150 ${
                  biz.id === currentId ? "bg-indigo-950/50" : ""
                }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0 bg-gradient-to-br ${
                  biz.id === currentId
                    ? "from-indigo-500 to-violet-600"
                    : "from-slate-600 to-slate-700"
                }`}>
                  {biz.name.charAt(0).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">{biz.name}</div>
                  {biz.business_type && (
                    <div className="text-xs text-slate-400 truncate">{biz.business_type}</div>
                  )}
                </div>

                {biz.id === currentId && (
                  <svg className="w-4 h-4 text-indigo-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
