import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createServiceClient } from "@/lib/supabase/service";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

const PLAN_CREDITS = {
  starter: 500,
  pro: 1500,
  elite: 3000,
};

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error: any) {
    console.error(`Webhook signature verification failed: ${error.message}`);
    return NextResponse.json({ error: "Webhook Error" }, { status: 400 });
  }

  const supabase = createServiceClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id;
        const planId = session.metadata?.planId as "starter" | "pro" | "elite";
        const subscriptionId = session.subscription as string;
        const customerId = session.customer as string;

        if (userId && planId) {
          // 1. Update or Insert Subscription
          const { error: subError } = await supabase
            .from("user_subscriptions")
            .upsert({
              user_id: userId,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              plan_id: planId,
              status: "active",
            }, { onConflict: "user_id" });

          if (subError) console.error("Error upserting subscription:", subError);

          // 2. Add Credits for the new plan
          const addedCredits = PLAN_CREDITS[planId] || 0;
          
          // Get current credits to append to them
          const { data: currentCredits } = await supabase
            .from("user_credits")
            .select("total_credits")
            .eq("user_id", userId)
            .single();

          const newTotal = (currentCredits?.total_credits || 0) + addedCredits;

          const { error: creditsError } = await supabase
            .from("user_credits")
            .upsert({
              user_id: userId,
              total_credits: newTotal,
            }, { onConflict: "user_id" });

          if (creditsError) console.error("Error updating credits:", creditsError);
        }
        break;
      }
      
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const status = subscription.status;

        // Update status in DB
        await supabase
          .from("user_subscriptions")
          .update({
            status: status,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id);
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
