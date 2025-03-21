import Navbar from "../components/ui/navbar";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import HeroSection from "../components/ui/hero_section";
import Testimonials from "../components/ui/testimonials";
import CTA from "../components/ui/cta";
import Footer from "../components/ui/footer";
import FeaturedEvents from "../components/ui/featured-events";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      {/* Main Content */}
      <main className="flex-grow px-6 pt-20 bg-[#0A2A4A] text-white">
        <section className="py-10 text-center">
          <h1 className="text-4xl font-bold text-[#E1A913]">Featured Events</h1>
          <p className="text-lg text-[#B0B8C5] mt-2">Check out our latest events and register now!</p>
        </section>

        {/* Event Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          {[1, 2, 3].map((event, index) => (
            <Card key={index} className="bg-[#072446] text-white p-6 rounded-lg shadow-lg">
              <CardContent>
                <h3 className="text-xl font-semibold text-[#E1A913]">Event Name {event}</h3>
                <p className="text-[#00b0a6] mt-2">📅 Date & Time</p>
                <Button className="mt-4 bg-[#00b0a6] text-[#072446] px-4 py-2">Register Now</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      <HeroSection />
      <Testimonials />
      <CTA />
      <FeaturedEvents />
      <Footer />
      
    </div>
  );
}


