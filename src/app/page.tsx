"use client";

import { SignedIn, SignedOut, SignInButton, SignUpButton } from "@clerk/nextjs";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="mb-8 text-4xl font-bold text-[#072446]">
        Welcome to GatherEase
      </h1>
      <p className="mb-8 text-center text-lg text-gray-600">
        Your all-in-one event management platform
      </p>

      <SignedOut>
        <div className="flex gap-4">
          <SignInButton mode="modal">
            <button className="rounded-md bg-[#072446] px-4 py-2 text-white hover:bg-[#0a2f5c]">
              Sign In
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="rounded-md bg-[#E1A913] px-4 py-2 text-white hover:bg-[#c99a0f]">
              Sign Up
            </button>
          </SignUpButton>
        </div>
      </SignedOut>

      <SignedIn>
        <div className="flex gap-4">
          <Link
            href="/attendee/dashboard"
            className="rounded-md bg-[#072446] px-4 py-2 text-white hover:bg-[#0a2f5c]"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/attendee/events"
            className="rounded-md bg-[#E1A913] px-4 py-2 text-white hover:bg-[#c99a0f]"
          >
            View Events
          </Link>
        </div>
      </SignedIn>
    </main>
  );
}
