"use client";
import { useState } from "react";
import Link from "next/link";
import { Button } from "./button";
import { Menu, X } from "lucide-react";
import { SignInButton } from "@clerk/nextjs"; // Changed import

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 z-50 w-full bg-[#072446] px-6 py-4 text-white shadow-md">
      <div className="container mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/">
          <span className="cursor-pointer text-2xl font-bold text-[#E1A913]">
            GatherEase
          </span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden space-x-6 md:flex">
          <Link href="/about" className="transition hover:text-[#E1A913]">
            About
          </Link>
          <Link href="/events" className="transition hover:text-[#E1A913]">
            Events
          </Link>
          <Link href="/contact" className="transition hover:text-[#E1A913]">
            Contact
          </Link>
        </div>

        {/* Sign In Button */}
        <div className="hidden md:block">
          <SignInButton mode="modal">
            <button className="rounded-lg border-2 border-[#E1A913] bg-[#072446] px-6 py-2 font-semibold text-[#E1A913] transition-colors hover:bg-[#0a3060]">
              Sign In
            </button>
          </SignInButton>
        </div>

        {/* Mobile Menu Button */}
        <button className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="flex flex-col items-center space-y-4 bg-[#0A2A4A] py-4 md:hidden">
          <Link
            href="/about"
            className="transition hover:text-[#E1A913]"
            onClick={() => setIsOpen(false)}
          >
            About
          </Link>
          <Link
            href="/events"
            className="transition hover:text-[#E1A913]"
            onClick={() => setIsOpen(false)}
          >
            Events
          </Link>
          <Link
            href="/contact"
            className="transition hover:text-[#E1A913]"
            onClick={() => setIsOpen(false)}
          >
            Contact
          </Link>
          <SignInButton mode="modal">
            <button className="rounded-lg border-2 border-[#E1A913] bg-[#072446] px-6 py-2 font-semibold text-[#E1A913] transition-colors hover:bg-[#0a3060]">
              Sign In
            </button>
          </SignInButton>
        </div>
      )}
    </nav>
  );
}
