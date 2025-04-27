"use server";

import Stripe from "stripe";
import { env } from "@/env";

// Server-side only - uses the secret key
export const stripe = new Stripe(env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-03-31.basil",
  typescript: true,
});
