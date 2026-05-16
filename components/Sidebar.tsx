"use client";

import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Business } from "@/lib/types";
import LocationSwitcher from "@/components/LocationSwitcher";
import SignOutButton from "@/components/SignOutButton";

interface SidebarProps {
  businesses: Business[];
}

export default function Sidebar({ businesses }: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Try to get current business from searchParams, fallback to the first business
  const currentBusinessId = searchParams.get("business") ?? (businesses[0]?.id || "all");
  
  const navItems = [
    { name: "Reviews Dashboard", href: `/dashboard`, icon: "🏠" },
    { name: "Analytics", href: `/dashboard/analytics`, icon: "📊" },
    { name: "Deep Analysis", href: `/dashboard/analyse-deeply`, icon: "🧠" },
    { name: "Reputation Scorecard", href: `/dashboard/competitors/head-to-head`, icon: "🏆" },
    { name: "Competitor Overview", href: `/dashboard/competitors/overview`, icon: "📈" },
    { name: "Export Report", href: `/dashboard/export`, icon: "📄" },
  ];

  const supportItems = [
    { name: "Add Location", href: `/dashboard/setup`, icon: "📍", appendBusiness: false },
    { name: "Notification Settings", href: `/dashboard/settings/notifications`, icon: "⚙️", appendBusiness: true },
    { name: "FAQ", href: `/faq`, icon: "❓", appendBusiness: true },
    { name: "Help & Support", href: `/help`, icon: "💬", appendBusiness: true },
  ];

  return (
    <div className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col h-screen shrink-0 text-slate-300">
      {/* Top Header */}
      <div className="p-6 pb-4">
        <Link
          href="/home"
          className="flex items-center gap-3 mb-6 hover:opacity-80 transition-opacity"
        >
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0">
            RR
          </div>
          <span className="text-white font-bold text-lg tracking-tight">ReviewResponder</span>
        </Link>
        
        {businesses.length > 0 && (
          <div className="mb-2">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 block">
              Active Location
            </span>
            <LocationSwitcher businesses={businesses} currentId={currentBusinessId} showAll={true} basePath={pathname} />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3 px-2 block">
          Menu
        </span>
        {navItems.map((item) => {
          const isActive = pathname === item.href.split('?')[0];
          // Always append the current business to preserve context
          const targetUrl = `${item.href}?business=${currentBusinessId}`;
          
          return (
            <Link
              key={item.name}
              href={targetUrl}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                isActive 
                  ? "bg-indigo-600/10 text-indigo-400 font-medium" 
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-sm">{item.name}</span>
            </Link>
          );
        })}

        <div className="pt-4 mt-4 border-t border-slate-800/50">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3 px-2 block">
            Settings & Support
          </span>
          {supportItems.map((item) => {
            const isActive = pathname === item.href.split('?')[0];
            const targetUrl = item.appendBusiness 
              ? `${item.href}?business=${currentBusinessId}` 
              : item.href;
            
            return (
              <Link
                key={item.name}
                href={targetUrl}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors mt-1 ${
                  isActive 
                    ? "bg-indigo-600/10 text-indigo-400 font-medium" 
                    : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="text-sm">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer / User Area */}
      <div className="p-4 border-t border-slate-800">
        <SignOutButton />
      </div>
    </div>
  );
}
