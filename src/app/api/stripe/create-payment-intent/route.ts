import { stripe } from "@/lib/stripe";
import { NextResponse } from "next/server";

// Define the runtime for Edge compatibility
export const runtime = 'edge';

// Define dynamic config to prevent static optimization
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { amount, eventId } = await request.json();

    // Validate input
    if (!amount || !eventId) {
      return NextResponse.json(
        { error: "Amount and eventId are required" },
        { status: 400 }
      );
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: "usd",
      metadata: {
        eventId,
      },
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("Error creating payment intent:", error);
    return NextResponse.json(
      { error: "Failed to create payment intent" },
      { status: 500 }
    );
  }
}
