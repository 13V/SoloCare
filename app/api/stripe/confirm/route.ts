import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.redirect(new URL("/subscribe", request.url));
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    });

    if (session.payment_status === "paid" && session.subscription) {
      const sub = session.subscription as import("stripe").Stripe.Subscription & { current_period_end: number };
      await supabase.from("profiles").update({
        stripe_subscription_id: sub.id,
        subscription_status: sub.status,
        subscription_period_end: new Date(sub.current_period_end * 1000).toISOString(),
      }).eq("id", user.id);
    }
  } catch (e) {
    console.error("Stripe confirm error:", e);
  }

  return NextResponse.redirect(new URL("/dashboard?subscribed=true", request.url));
}
