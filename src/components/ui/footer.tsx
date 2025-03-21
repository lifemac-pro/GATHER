import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#072446] text-[#B0B8C5] text-center py-6">
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-center px-6">
        {/* Copyright */}
        <p className="mb-4 md:mb-0">© {new Date().getFullYear()} GatherEase. All Rights Reserved.</p>

        {/* Footer Links */}
        <div className="flex space-x-6">
          <Link href="/about" className="hover:text-[#E1A913] transition">About</Link>
          <Link href="/contact" className="hover:text-[#E1A913] transition">Contact</Link>
          <Link href="/terms" className="hover:text-[#E1A913] transition">Terms of Service</Link>
          <Link href="/privacy" className="hover:text-[#E1A913] transition">Privacy Policy</Link>
        </div>
      </div>
    </footer>
  );
}
