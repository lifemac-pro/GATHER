"use client";
import { useState } from "react";
import Link from "next/link";
import { Button } from "./button";
import { Menu, X } from "lucide-react";
import { AuthButton } from "./auth-button";
import { useAuth } from "@clerk/nextjs";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { isSignedIn, isLoaded } = useAuth();

  return (
    <nav className="fixed top-0 z-50 w-full bg-[#082865] px-6 py-4 text-white shadow-md">
      <div className="container mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/">
          <span className="cursor-pointer text-2xl font-bold text-white">
            GatherEase
          </span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden space-x-8 md:flex">
          <Link
            href="/about"
            className="text-sm font-medium uppercase tracking-wide text-white/80 transition hover:text-white"
          >
            About
          </Link>
          <Link
            href="/events"
            className="text-sm font-medium uppercase tracking-wide text-white/80 transition hover:text-white"
          >
            Events
          </Link>
          <Link
            href="/contact"
            className="text-sm font-medium uppercase tracking-wide text-white/80 transition hover:text-white"
          >
            Contact
          </Link>
        </div>

        {/* Sign In Button */}
        <div className="hidden md:block">
          <AuthButton
            mode="sign-in"
            redirectUrl="/attendee/dashboard"
            className="rounded-lg bg-[#0055FF] px-6 py-2 font-medium text-white shadow-lg transition-colors hover:bg-[#004BD9]"
          >
            Sign In
          </AuthButton>
        </div>

        {/* Mobile Menu Button */}
        <button className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-20 flex flex-col items-center space-y-4 bg-[#082865] py-6 shadow-lg md:hidden">
          <Link
            href="/about"
            className="text-sm font-medium uppercase tracking-wide text-white/80 transition hover:text-white"
            onClick={() => setIsOpen(false)}
          >
            About
          </Link>
          <Link
            href="/events"
            className="text-sm font-medium uppercase tracking-wide text-white/80 transition hover:text-white"
            onClick={() => setIsOpen(false)}
          >
            Events
          </Link>
          <Link
            href="/contact"
            className="text-sm font-medium uppercase tracking-wide text-white/80 transition hover:text-white"
            onClick={() => setIsOpen(false)}
          >
            Contact
          </Link>
          <AuthButton
            mode="sign-in"
            redirectUrl="/attendee/dashboard"
            className="mt-2 rounded-lg bg-[#0055FF] px-6 py-2 font-medium text-white shadow-lg transition-colors hover:bg-[#004BD9]"
          >
            Sign In
          </AuthButton>
        </div>
      )}
    </nav>
  );
}
