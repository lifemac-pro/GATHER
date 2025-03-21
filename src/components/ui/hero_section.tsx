"use client";
import { motion } from "framer-motion";
import { Button } from "./button";

export default function HeroSection() {
  return (
    <section className="h-screen flex flex-col items-center justify-center text-center px-6">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-4xl md:text-6xl font-bold text-[#E1A913]"
      >
        Seamless Event Management, Simplified Registration
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.3 }}
        className="text-lg text-[#00b0a6] mt-4 max-w-xl"
      >
        Plan, manage, and analyze your events with ease using GatherEase.
      </motion.p>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <Button className="mt-6 bg-[#E1A913] text-[#072446] px-6 py-3 text-lg">
          Sign in to Continue
        </Button>
      </motion.div>
    </section>
  );
}
