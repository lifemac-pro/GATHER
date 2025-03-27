"use client";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

export default function Navbar({ isOpen }: { isOpen: boolean }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav 
    className={`bg-[#0E3A5D] text-white p-4 fixed top-0 right-0 w-full z-50 shadow-md transition-all 
      ${isOpen ? "ml-64" : "ml-20"}`}
    >
      <div className="container mx-auto flex justify-between items-center">
        {/* Welcome Message */}
        <span className="hidden md:block text-lg font-medium">Welcome, Admin!</span>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-6">
          {/* <Link href="/about" className="hover:text-[#E1A913] transition">About</Link>
          <Link href="/events" className="hover:text-[#E1A913] transition">Events</Link>
          <Link href="/contact" className="hover:text-[#E1A913] transition">Contact</Link> */}

          <Button className="bg-[#E1A913] text-[#072446] px-4 py-2">Logout</Button>
        </div>

        {/* Mobile Menu Button */}
        <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden flex flex-col items-center bg-[#0A2A4A] py-4 space-y-4 absolute top-full left-0 w-full shadow-lg">
          <span className="text-lg font-medium">Welcome, Admin!</span>
          <Link href="/about" className="hover:text-[#E1A913] transition" onClick={() => setIsMenuOpen(false)}>About</Link>
          <Link href="/events" className="hover:text-[#E1A913] transition" onClick={() => setIsMenuOpen(false)}>Events</Link>
          <Link href="/contact" className="hover:text-[#E1A913] transition" onClick={() => setIsMenuOpen(false)}>Contact</Link>

          <Button className="bg-[#E1A913] text-[#072446] px-4 py-2 w-full" onClick={() => setIsMenuOpen(false)}>Sign In</Button>
        </div>
      )}
    </nav>
  );
}
