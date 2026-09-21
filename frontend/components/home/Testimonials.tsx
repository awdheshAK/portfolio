import Image from "next/image";

const TESTIMONIALS = [
  { name: "Ananya R.", role: "Custom hoodie order", quote: "The live preview matched the finished product almost exactly. I could see my logo placement before committing." },
  { name: "Rohit K.", role: "Corporate order, 40 shirts", quote: "Embroidery quality was excellent and the customizer made getting sign-off from our team painless." },
  { name: "Meera S.", role: "Custom kurta", quote: "Loved being able to pick the fabric and see the price update live as I changed things." },
];

export function Testimonials() {
  return (
    <section className="bg-neutral-50 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="mb-10 text-center font-serif text-2xl font-semibold text-neutral-900 sm:text-3xl">
          Loved by Our Customers
        </h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <figure key={t.name} className="flex flex-col gap-4 rounded-xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
              <blockquote className="text-sm leading-relaxed text-neutral-700">&ldquo;{t.quote}&rdquo;</blockquote>
              <figcaption className="mt-auto flex items-center gap-3">
                <Image src="/placeholders/avatar.svg" alt="" width={36} height={36} className="rounded-full" />
                <div>
                  <p className="text-sm font-semibold text-neutral-900">{t.name}</p>
                  <p className="text-xs text-neutral-500">{t.role}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
