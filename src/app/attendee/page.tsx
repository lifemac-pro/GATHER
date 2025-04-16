import Navbar from "@/components/ui/navbar";
import { Button } from "@/components/ui/button";
import HeroSection from "@/components/ui/hero_section";
import Testimonials from "@/components/ui/testimonials";
import CTA from "@/components/ui/cta";
import Footer from "@/components/ui/footer";
import FeaturedEvents from "@/components/ui/FeaturedEvents";

export default function AttendeePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      {/* Hero Section - Moved to top */}
      <HeroSection />

      {/* Main Content */}
      <main className="flex-grow bg-gradient-to-b from-[#006EFF] to-[#0055FF] px-6 py-20 text-white">
        <section className="container mx-auto py-10 text-center">
          <h1 className="text-4xl font-bold text-white">Featured Events</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80">
            Discover and register for our upcoming events. Join us for memorable
            experiences and networking opportunities.
          </p>
        </section>

        {/* Event Cards using FeaturedEvents component */}
        <div className="container mx-auto">
          <FeaturedEvents />
        </div>
      </main>

      <Testimonials />
      <CTA />
      <Footer />
    </div>
  );
}
