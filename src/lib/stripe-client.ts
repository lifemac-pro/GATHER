"use client";

import { loadStripe } from "@stripe/stripe-js";
import { env } from "@/env";

// Client-side only - uses the public key
export const stripePromise = loadStripe(
  env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
);
