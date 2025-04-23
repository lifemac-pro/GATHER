import { SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="relative flex min-h-[80vh] flex-col items-center justify-center bg-primary px-4 py-16 text-center">
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-secondary via-primary to-primary opacity-10" />

      {/* Content */}
      <div className="relative z-10 max-w-4xl">
        <h1 className="mb-6 text-4xl font-bold text-white md:text-5xl lg:text-6xl">
          Seamless Event Management, Simplified Registration
        </h1>
        <p className="mb-8 text-lg text-white/80 md:text-xl">
          Discover and manage events with ease. Your all-in-one platform for
          creating memorable gatherings.
        </p>
        <SignInButton mode="modal">
          <Button
            className="bg-white text-primary transition-all duration-200 hover:bg-white/90 hover:shadow-lg"
            size="lg"
          >
            Sign in to Continue
          </Button>
        </SignInButton>
      </div>
    </section>
  );
}
