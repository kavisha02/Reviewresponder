import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/Sidebar";

export type UserPlanInfo = {
  planId: string;
  totalCredits: number;
  usedCredits: number;
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/auth/login");
  }

  // Fetch ALL businesses for this user to pass to Sidebar
  const { data: businesses } = await supabase
    .from("businesses")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  // Fetch user plan and credits
  const { data: subData } = await supabase
    .from("user_subscriptions")
    .select("plan_id")
    .eq("user_id", user.id)
    .single();

  const { data: creditsData } = await supabase
    .from("user_credits")
    .select("total_credits, used_credits")
    .eq("user_id", user.id)
    .single();

  const planInfo: UserPlanInfo = {
    planId: subData?.plan_id || "free",
    totalCredits: creditsData?.total_credits || 0,
    usedCredits: creditsData?.used_credits || 0,
  };

  return (
    <div className="flex h-screen bg-slate-900 overflow-hidden">
      {/* Sidebar with all navigation */}
      <Sidebar businesses={businesses || []} planInfo={planInfo} />
      
      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
