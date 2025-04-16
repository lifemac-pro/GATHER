"use client";
import { motion } from "framer-motion";
import { AuthButton } from "./auth-button";

export default function HeroSection() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-r from-[#082865] to-[#003FA3] px-6 text-center">
      {/* Background elements */}
      <div className="absolute inset-0 z-0 opacity-10">
        <div className="absolute left-1/4 top-1/4 h-64 w-64 rounded-full bg-[#0055FF] blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-[#0055FF] blur-3xl"></div>
      </div>

      <div className="relative z-10">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-4xl font-bold leading-tight text-white md:text-6xl lg:text-7xl"
        >
          Seamless Event Management,
          <br />
          <span className="text-[#0055FF] drop-shadow-lg">
            Simplified Registration
          </span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="mx-auto mt-6 max-w-2xl text-xl text-white/80"
        >
          Plan, manage, and analyze your events with ease using GatherEase. Join
          thousands of event organizers who trust our platform.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-10 flex flex-col items-center justify-center space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0"
        >
          <AuthButton
            mode="sign-in"
            redirectUrl="/attendee/dashboard"
            className="rounded-lg bg-[#0055FF] px-8 py-4 text-lg font-medium text-white shadow-lg transition-transform hover:scale-105 hover:bg-[#004BD9]"
          >
            Sign in to Continue
          </AuthButton>
          <AuthButton
            mode="sign-up"
            redirectUrl="/attendee/dashboard"
            className="rounded-lg border-2 border-white/20 bg-transparent px-8 py-4 text-lg font-medium text-white shadow-lg transition-transform hover:scale-105 hover:bg-white/10"
          >
            Create Account
          </AuthButton>
        </motion.div>
      </div>
    </section>
  );
}
