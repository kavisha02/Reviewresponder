import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";

// Define the plan IDs (In production, replace these with actual Stripe Price IDs)
const PLAN_PRICES = {
  starter: "price_starter_placeholder", // $20
  pro: "price_pro_placeholder",         // $40
  elite: "price_elite_placeholder",     // $50
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia", // Use latest stable version or current account default
});

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { planId } = await req.json();

    if (!planId || !["starter", "pro", "elite"].includes(planId)) {
      return NextResponse.json({ error: "Invalid plan ID" }, { status: 400 });
    }

    const priceId = PLAN_PRICES[planId as keyof typeof PLAN_PRICES];

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?checkout=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?checkout=canceled`,
      client_reference_id: user.id,
      metadata: {
        userId: user.id,
        planId: planId,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Stripe Checkout Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
