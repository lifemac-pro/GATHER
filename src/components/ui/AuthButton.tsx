"use client";

import { signIn, signOut, useSession } from "next-auth/react";

export function AuthButton() {
  const { data: session } = useSession();

  return session ? (
    <button onClick={() => signOut()} className="bg-red-500 text-white px-4 py-2 rounded">
      Sign Out
    </button>
  ) : (
    <button onClick={() => signIn()} className="bg-blue-500 text-white px-4 py-2 rounded">
      Sign In
    </button>
  );
}
