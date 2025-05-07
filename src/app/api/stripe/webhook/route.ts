import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { env } from "@/env";
import { connectToDatabase } from "@/server/db/mongo";
import { Attendee } from "@/server/db/models";

// Force Node.js runtime for Stripe webhook handling
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const webhookSecret = env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const headersList = headers();
    const signature = (await headersList).get("stripe-signature");

    if (!signature || !webhookSecret) {
      return NextResponse.json(
        { error: "Missing signature or webhook secret" },
        { status: 400 }
      );
    }

    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );

    // Handle successful payments
    if (event.type === "payment_intent.succeeded") {
      const { eventId } = event.data.object.metadata;
      const paymentIntent = event.data.object;

      try {
        await connectToDatabase();

        // Update attendee record with payment confirmation
        await Attendee.findOneAndUpdate(
          { eventId: eventId },
          { 
            paymentStatus: "paid",
            paymentId: paymentIntent.id,
            updatedAt: new Date()
          }
        );

        return NextResponse.json({ success: true });
      } catch (dbError) {
        console.error("Database error processing payment:", dbError);
        return NextResponse.json(
          { error: "Failed to process payment confirmation" },
          { status: 500 }
        );
      }
    }

    // Default success response for other event types
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Webhook handler failed" },
      { status: 400 }
    );
  }
}
