import { Card, CardContent } from "./card";

const testimonials = [
  {
    name: "Alice Johnson",
    role: "Event Organizer",
    text: "GatherEase made organizing our conference seamless! The platform's intuitive design saved us countless hours.",
  },
  {
    name: "Michael Smith",
    role: "Corporate Trainer",
    text: "The best event management tool I've used! Registration tracking and analytics are outstanding.",
  },
  {
    name: "Sarah Lee",
    role: "Community Manager",
    text: "Quick and hassle-free event registration. The attendee management features are exactly what we needed!",
  },
];

export default function Testimonials() {
  return (
    <section className="bg-gradient-to-b from-[#004BD9] to-[#082865] px-6 py-24 text-center text-white">
      <div className="container mx-auto">
        <h2 className="text-4xl font-bold text-white">What Our Users Say</h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80">
          Trusted by event organizers worldwide
        </p>

        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <Card
              key={index}
              className="overflow-hidden rounded-xl border-none bg-white/5 p-6 backdrop-blur-sm transition-all duration-300 hover:bg-white/10 hover:shadow-xl"
            >
              <CardContent className="p-0">
                <div className="mb-4 text-3xl font-bold text-[#0055FF]">
                  &quot;
                </div>
                <p className="mb-6 text-lg text-white/90">{testimonial.text}</p>
                <div className="mt-auto">
                  <h3 className="font-semibold text-white">
                    {testimonial.name}
                  </h3>
                  <p className="text-sm text-white/60">{testimonial.role}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
