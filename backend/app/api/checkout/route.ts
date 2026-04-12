import { stripe } from "@/lib/stripe";

const PRICE_IDS: Record<string, string | undefined> = {
  monitor: process.env.STRIPE_MONITOR_PRICE_ID,
  defend: process.env.STRIPE_DEFEND_PRICE_ID,
};

export async function POST(request: Request) {
  let body: { plan?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const plan = body.plan;
  if (!plan || !PRICE_IDS[plan]) {
    return Response.json({ error: "Invalid plan" }, { status: 400 });
  }

  const priceId = PRICE_IDS[plan];
  if (!priceId) {
    return Response.json(
      { error: "This plan is not configured yet. Please set the Stripe Price ID." },
      { status: 500 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/#pricing`,
      allow_promotion_codes: true,
    });

    return Response.json({ url: session.url });
  } catch (err) {
    console.error("Checkout session error:", err);
    return Response.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
