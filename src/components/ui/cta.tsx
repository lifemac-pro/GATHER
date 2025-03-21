import { Button } from "./button";

export default function CTA() {
  return (
    <section className="py-10 text-center bg-[#E1A913] text-[#072446]">
      <h2 className="text-3xl font-bold">Ready to Get Started?</h2>
      <p className="text-lg mt-2">Join us and make event management effortless!</p>
      <Button className="mt-4 bg-[#072446] text-[#E1A913] px-6 py-3 text-lg">Sign Up Now</Button>
    </section>
  );
}
