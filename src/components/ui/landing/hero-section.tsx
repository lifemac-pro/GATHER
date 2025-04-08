import { SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="relative flex min-h-[80vh] flex-col items-center justify-center bg-[#072446] px-4 py-16 text-center">
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#00b0a6] via-[#072446] to-[#072446]" />
      
      {/* Content */}
      <div className="relative z-10 max-w-4xl">
        <h1 className="mb-6 text-4xl font-bold text-[#E1A913] md:text-5xl lg:text-6xl">
          Seamless Event Management, Simplified Registration
        </h1>
        <p className="mb-8 text-lg text-[#00b0a6] md:text-xl">
          Discover and manage events with ease. Your all-in-one platform for creating memorable gatherings.
        </p>
        <SignInButton mode="modal">
          <Button
            className="bg-[#E1A913] text-[#072446] hover:bg-[#E1A913]/90 hover:shadow-lg transition-all duration-200"
            size="lg"
          >
            Sign in to Continue
          </Button>
        </SignInButton>
      </div>
    </section>
  );
}
