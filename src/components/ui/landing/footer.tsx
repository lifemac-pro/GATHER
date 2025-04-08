import { Separator } from "@/components/ui/separator";

export function Footer() {
  return (
    <footer className="bg-[#072446] px-4 py-8 text-[#B0B8C5]">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="text-center md:text-left">
            <h3 className="text-xl font-bold text-[#E1A913]">GatherEase</h3>
            <p className="mt-2 text-sm">Simplifying event management</p>
          </div>
          
          <nav className="flex gap-6 text-sm">
            <a
              href="#"
              className="text-[#B0B8C5] transition-colors hover:text-[#00b0a6]"
            >
              About
            </a>
            <a
              href="#"
              className="text-[#B0B8C5] transition-colors hover:text-[#00b0a6]"
            >
              Contact
            </a>
            <a
              href="#"
              className="text-[#B0B8C5] transition-colors hover:text-[#00b0a6]"
            >
              Terms
            </a>
            <a
              href="#"
              className="text-[#B0B8C5] transition-colors hover:text-[#00b0a6]"
            >
              Privacy
            </a>
          </nav>
        </div>
        
        <Separator className="my-6 bg-[#B0B8C5]/20" />
        
        <div className="text-center text-sm">
          © {new Date().getFullYear()} GatherEase. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
