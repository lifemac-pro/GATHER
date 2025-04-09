"use client";
import { AuthButton } from "./auth-button";

export default function CTA() {
  return (
    <section className="bg-[#E1A913] py-10 text-center text-[#072446]">
      <h2 className="text-3xl font-bold">Ready to Get Started?</h2>
      <p className="mt-2 text-lg">
        Join us and make event management effortless!
      </p>
      <AuthButton
        mode="sign-up"
        redirectUrl="/attendee/dashboard"
        className="mt-4 bg-[#072446] px-6 py-3 text-lg text-[#E1A913]"
      >
        Sign Up Now
      </AuthButton>
    </section>
  );
}
