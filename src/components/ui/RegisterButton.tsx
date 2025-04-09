"use client";

import { useUser } from "@clerk/nextjs";
import { useState } from "react";
import { trpc } from "@/utils/trpc";

export default function RegisterButton({ eventId }: { eventId: number }) {
  const { user } = useUser();
  const [isRegistering, setIsRegistering] = useState(false);
  const registerMutation = trpc.event.register.useMutation();

  async function handleRegister() {
    if (!user?.id) return alert("You need to sign in first!");

    setIsRegistering(true);

    try {
      await registerMutation.mutateAsync({
        eventId: eventId.toString()
      });
      alert("Registration successful!");
    } catch (error) {
      console.error("Registration error:", error);
      alert("Failed to register. Try again!");
    } finally {
      setIsRegistering(false);
    }
  }

  return (
    <button
      onClick={handleRegister}
      disabled={isRegistering}
      className="bg-[#E1A913] text-[#072446] px-4 py-2 rounded-md hover:bg-[#c28e00] transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isRegistering ? "Registering..." : "Register"}
    </button>
  );
}
