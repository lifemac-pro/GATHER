import { Separator } from "@/components/ui/separator";

export function Footer() {
  return (
    <footer className="bg-primary px-4 py-8 text-primary-foreground/70">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="text-center md:text-left">
            <h3 className="text-xl font-bold text-primary-foreground">GatherEase</h3>
            <p className="mt-2 text-sm">Simplifying event management</p>
          </div>

          <nav className="flex gap-6 text-sm">
            <a
              href="#"
              className="text-primary-foreground/70 transition-colors hover:text-primary-foreground"
            >
              About
            </a>
            <a
              href="#"
              className="text-primary-foreground/70 transition-colors hover:text-primary-foreground"
            >
              Contact
            </a>
            <a
              href="#"
              className="text-primary-foreground/70 transition-colors hover:text-primary-foreground"
            >
              Terms
            </a>
            <a
              href="#"
              className="text-primary-foreground/70 transition-colors hover:text-primary-foreground"
            >
              Privacy
            </a>
          </nav>
        </div>

        <Separator className="my-6 bg-primary-foreground/20" />

        <div className="text-center text-sm">
          © {new Date().getFullYear()} GatherEase. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
