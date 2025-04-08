import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { env } from "@/env";
import { db } from "@/server/db";
import { attendees } from "@/server/db/schema";
import { eq } from "drizzle-orm";

const webhookSecret = env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = headers().get("stripe-signature");

    if (!signature || !webhookSecret) {
      return NextResponse.json(
        { error: "Missing signature or webhook secret" },
        { status: 400 }
      );
    }

    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    if (event.type === "payment_intent.succeeded") {
      const { eventId } = event.data.object.metadata;
      const { id: paymentIntentId } = event.data.object;

      // Update attendee record with payment information
      await db
        .update(attendees)
        .set({
          paymentStatus: "paid",
          paymentIntentId,
          updatedAt: new Date(),
        })
        .where(eq(attendees.eventId, eventId));
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 400 }
    );
  }
}
