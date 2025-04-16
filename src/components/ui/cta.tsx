"use client";
import { AuthButton } from "./auth-button";

export default function CTA() {
  return (
    <section className="relative overflow-hidden bg-[#082865] py-20 text-center text-white">
      {/* Background elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#0055FF] opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-[#0055FF] opacity-20 blur-3xl"></div>
      </div>

      <div className="container relative z-10 mx-auto px-6">
        <h2 className="text-4xl font-bold">Ready to Get Started?</h2>
        <p className="mx-auto mt-4 max-w-2xl text-xl text-white/80">
          Join thousands of event organizers who trust GatherEase to simplify
          their event management process.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
          <AuthButton
            mode="sign-up"
            redirectUrl="/attendee/dashboard"
            className="rounded-lg bg-[#0055FF] px-8 py-4 text-lg font-medium text-white shadow-lg transition-transform hover:scale-105 hover:bg-[#004BD9]"
          >
            Create Free Account
          </AuthButton>
          <AuthButton
            mode="sign-in"
            redirectUrl="/attendee/dashboard"
            className="rounded-lg border-2 border-white/20 bg-transparent px-8 py-4 text-lg font-medium text-white shadow-lg transition-transform hover:scale-105 hover:bg-white/10"
          >
            Sign In
          </AuthButton>
        </div>
      </div>
    </section>
  );
}
