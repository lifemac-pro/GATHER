"use client";
import Link from "next/link";
import { Button } from "./button";

export default function Navbar() {
  return (
    <nav className="bg-[#072446] text-white py-4 px-6 fixed w-full top-0 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo */}
        <Link href="/">
          <span className="text-2xl font-bold text-[#E1A913] cursor-pointer">GatherEase</span>
        </Link>

        {/* Menu Items */}
        <div className="hidden md:flex space-x-6">
          <Link href="/about" className="hover:text-[#E1A913] transition">About</Link>
          <Link href="/events" className="hover:text-[#E1A913] transition">Events</Link>
          <Link href="/contact" className="hover:text-[#E1A913] transition">Contact</Link>
        </div>

        {/* Sign In Button */}
        <Button className="bg-[#E1A913] text-[#072446] px-4 py-2">Sign In</Button>
      </div>
    </nav>
  );
}
