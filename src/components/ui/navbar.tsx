"use client";
import { useState } from "react";
import Link from "next/link";
import { Button } from "./button";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-[#072446] text-white py-4 px-6 fixed w-full top-0 shadow-md z-50">
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo */}
        <Link href="/">
          <span className="text-2xl font-bold text-[#E1A913] cursor-pointer">GatherEase</span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex space-x-6">
          <Link href="/about" className="hover:text-[#E1A913] transition">About</Link>
          <Link href="/events" className="hover:text-[#E1A913] transition">Events</Link>
          <Link href="/contact" className="hover:text-[#E1A913] transition">Contact</Link>
        </div>

        {/* Sign In Button */}
        <div className="hidden md:block">
          <Button className="bg-[#E1A913] text-[#072446] px-4 py-2">Sign In</Button>
        </div>

        {/* Mobile Menu Button */}
        <button className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden flex flex-col items-center bg-[#0A2A4A] py-4 space-y-4">
          <Link href="/about" className="hover:text-[#E1A913] transition" onClick={() => setIsOpen(false)}>About</Link>
          <Link href="/events" className="hover:text-[#E1A913] transition" onClick={() => setIsOpen(false)}>Events</Link>
          <Link href="/contact" className="hover:text-[#E1A913] transition" onClick={() => setIsOpen(false)}>Contact</Link>
          <Button className="bg-[#E1A913] text-[#072446] px-4 py-2 w-full" onClick={() => setIsOpen(false)}>Sign In</Button>
        </div>
      )}
    </nav>
  );
}
