import { Card, CardContent } from "./card";

const testimonials = [
  {
    name: "Alice Johnson",
    text: "GatherEase made organizing our conference seamless!",
  },
  { name: "Michael Smith", text: "The best event management tool I've used!" },
  {
    name: "Sarah Lee",
    text: "Quick and hassle-free event registration. Loved it!",
  },
];

export default function Testimonials() {
  return (
    <section className="bg-[#0A2A4A] px-6 py-20 text-center text-white">
      <h2 className="text-3xl font-bold text-[#E1A913]">What Our Users Say</h2>
      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        {testimonials.map((testimonial, index) => (
          <Card
            key={index}
            className="rounded-lg bg-[#072446] p-6 text-white shadow-lg"
          >
            <CardContent>
              <p className="italic">&quot;{testimonial.text}&quot;</p>
              <h3 className="mt-4 font-semibold text-[#E1A913]">
                {testimonial.name}
              </h3>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
