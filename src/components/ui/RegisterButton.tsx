"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { api } from "@/utils/trpc"; // ✅ Ensure correct import

export default function RegisterButton({ eventId }: { eventId: number }) {
  const { data: session } = useSession();
  const [isRegistering, setIsRegistering] = useState(false);
  const registerMutation = api.event.register.useMutation();

  async function handleRegister() {
    if (!session?.user?.id) return alert("You need to sign in first!");

    setIsRegistering(true);

    try {
      await registerMutation.mutateAsync({
        eventId,
        userId: parseInt(session.user.id), // ✅ Convert to number
      });
      alert("Registration successful!");
    } catch (error) {
      alert("Failed to register. Try again!");
    } finally {
      setIsRegistering(false);
    }
  }

  return (
    <button
      onClick={handleRegister}
      disabled={isRegistering}
      className="bg-blue-500 text-white px-4 py-2 rounded"
    >
      {isRegistering ? "Registering..." : "Register"}
    </button>
  );
}
