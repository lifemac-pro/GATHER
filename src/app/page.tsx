import { HeroSection } from "@/components/ui/landing/hero-section";
import { AboutSection } from "@/components/ui/landing/about-section";
import { FeaturedEvents } from "@/components/ui/landing/featured-events";
import { Footer } from "@/components/ui/landing/footer";

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <HeroSection />
      <AboutSection />
      <FeaturedEvents />
      <Footer />
    </main>
  );
}
