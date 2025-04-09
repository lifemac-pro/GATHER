import Navbar from "@/components/ui/navbar";
import { Button } from "@/components/ui/button";
import HeroSection from "@/components/ui/hero_section";
import Testimonials from "@/components/ui/testimonials";
import CTA from "@/components/ui/cta";
import Footer from "@/components/ui/footer";
import EventCard from "@/components/ui/EventCard";
//import FeaturedEvents from "@/components/ui/FeaturedEvents";

export default function AttendeePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      {/* Main Content */}
      <main className="flex-grow bg-[#6fc3f7] px-6 pt-20 text-white">
        <section className="py-10 text-center">
          <h1 className="text-4xl font-bold text-[#E1A913]">Featured Events</h1>
          <p className="mt-2 text-lg text-[#B0B8C5]">
            Check out our latest events and register now!
          </p>
        </section>

        {/* Event Cards using EventCard component */}
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          {[1, 2, 3].map((event, index) => (
            <EventCard
              key={index}
              title={`Event Name ${event}`}
              date="📅 Date & Time"
              status="Not Registered"
              image="/images/tech-conference.jpg"
              //image="/images/ai-web3-summit.jpg"      // Replace with the path to your image
            />
          ))}
        </div>
      </main>

      <HeroSection />
      <Testimonials />
      <CTA />
      <Footer />
    </div>
  );
}
