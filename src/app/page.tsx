"use client";

import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Navbar from "../components/ui/navbar";
import HeroSection from "../components/ui/hero_section";
import Testimonials from "../components/ui/testimonials";
import CTA from "../components/ui/cta";
import Footer from "../components/ui/footer";
import EventCard from "@/components/ui/EventCard";

export default function LandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // ✅ Use useEffect() to prevent render-time updates
  useEffect(() => {
    if (session?.user) {
      router.push("/attendee/dashboard");
    }
  }, [session, router]);

  // ✅ Define event types explicitly
  type EventStatus = "Not Registered" | "Registered";

  const events = [
    {
      id: 1,
      title: "Tech Conference 2025",
      date: "April 15, 2025 - 10:00 AM",
      status: "Not Registered" as EventStatus,
      image: "/images/tech-conference.jpg",
    },
    {
      id: 2,
      title: "AI & Web3 Summit",
      date: "June 20, 2025 - 1:00 PM",
      status: "Registered" as EventStatus,
      image: "/images/ai-web3-summit.jpg",
    },
    {
      id: 3,
      title: "Startup Pitch Night",
      date: "August 10, 2025 - 5:00 PM",
      status: "Not Registered" as EventStatus,
      image: "/images/startup-pitch.jpg",
    },
  ];

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

        {/* Sign-in Button */}
        <div className="flex justify-center my-6">
          <button
            onClick={() => signIn("google")}
            className="bg-white text-[#E1A913] px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
            aria-label="Sign in with Google"
          >
            Sign in with Google
          </button>
        </div>

        {/* Event Cards */}
        <div className="mt-8 flex flex-wrap justify-center gap-6">
          {events.map((event) => (
            <EventCard
              key={event.id}
              title={event.title}
              date={event.date}
              status={event.status}
              image={event.image}
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
