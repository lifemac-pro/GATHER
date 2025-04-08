"use client";

import { Elements } from "@stripe/react-stripe-js";
import { stripePromise } from "@/lib/stripe";
import { useEffect, useState } from "react";
import { PaymentForm } from "./payment-form";

interface PaymentProviderProps {
  amount: number;
  eventId: string;
  onSuccess: () => void;
}

export function PaymentProvider({
  amount,
  eventId,
  onSuccess,
}: PaymentProviderProps) {
  const [clientSecret, setClientSecret] = useState("");

  useEffect(() => {
    // Create PaymentIntent as soon as the component loads
    fetch("/api/stripe/create-payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, eventId }),
    })
      .then((res) => res.json())
      .then((data) => setClientSecret(data.clientSecret))
      .catch((error) => console.error("Error:", error));
  }, [amount, eventId]);

  return (
    <div>
      {clientSecret && (
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            appearance: {
              theme: "stripe",
            },
          }}
        >
          <PaymentForm amount={amount} onSuccess={onSuccess} />
        </Elements>
      )}
    </div>
  );
}
