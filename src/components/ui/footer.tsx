import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#072446] py-6 text-center text-[#B0B8C5]">
      <div className="container mx-auto flex flex-col items-center justify-between px-6 md:flex-row">
        {/* Copyright */}
        <p className="mb-4 md:mb-0">
          © {new Date().getFullYear()} GatherEase. All Rights Reserved.
        </p>

        {/* Footer Links */}
        <div className="flex space-x-6">
          <Link href="/about" className="transition hover:text-[#E1A913]">
            About
          </Link>
          <Link href="/contact" className="transition hover:text-[#E1A913]">
            Contact
          </Link>
          <Link href="/terms" className="transition hover:text-[#E1A913]">
            Terms of Service
          </Link>
          <Link href="/privacy" className="transition hover:text-[#E1A913]">
            Privacy Policy
          </Link>
        </div>
      </div>
    </footer>
  );
}
