import { Card, CardContent } from "./card";

const testimonials = [
  { name: "Alice Johnson", text: "GatherEase made organizing our conference seamless!" },
  { name: "Michael Smith", text: "The best event management tool I've used!" },
  { name: "Sarah Lee", text: "Quick and hassle-free event registration. Loved it!" },
];

export default function Testimonials() {
  return (
    <section className="py-20 px-6 text-center bg-[#0A2A4A] text-white">
      <h2 className="text-3xl font-bold text-[#E1A913]">What Our Users Say</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        {testimonials.map((testimonial, index) => (
          <Card key={index} className="bg-[#072446] text-white p-6 rounded-lg shadow-lg">
            <CardContent>
              <p className="italic">"{testimonial.text}"</p>
              <h3 className="mt-4 font-semibold text-[#E1A913]">{testimonial.name}</h3>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
