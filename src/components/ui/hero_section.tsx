"use client";
import { motion } from "framer-motion";
import { AuthButton } from "./auth-button";

export default function HeroSection() {
  return (
    <section className="flex h-screen flex-col items-center justify-center px-6 text-center">
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-4xl font-bold text-[#E1A913] md:text-6xl"
      >
        Seamless Event Management, Simplified Registration
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.3 }}
        className="mt-4 max-w-xl text-lg text-[#00b0a6]"
      >
        Plan, manage, and analyze your events with ease using GatherEase.
      </motion.p>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <AuthButton
          mode="sign-in"
          redirectUrl="/attendee/dashboard"
          className="mt-6 bg-[#E1A913] px-6 py-3 text-lg text-[#072446]"
        >
          Sign in to Continue
        </AuthButton>
      </motion.div>
    </section>
  );
}
