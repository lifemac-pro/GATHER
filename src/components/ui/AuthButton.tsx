"use client";

import { SignInButton, SignOutButton, useAuth } from "@clerk/nextjs";

export function AuthButton() {
  const { isSignedIn } = useAuth();

  return isSignedIn ? (
    <SignOutButton>
      <button className="rounded bg-red-500 px-4 py-2 text-white">
        Sign Out
      </button>
    </SignOutButton>
  ) : (
    <SignInButton fallbackRedirectUrl="/attendee/dashboard">
      <button className="rounded bg-blue-500 px-4 py-2 text-white">
        Sign In
      </button>
    </SignInButton>
  );
}
