const REASONS = [
  { title: "Premium Fabrics", body: "Sourced and quality-checked for comfort and durability." },
  { title: "True Customization", body: "Real logo, text, embroidery and print placement — not just color options." },
  { title: "Made-to-Measure Fit", body: "Save your measurements once, reuse them across every order." },
  { title: "Secure Payments", body: "Checkout with Razorpay, with every payment verified server-side." },
];

export function WhyChooseUs() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <h2 className="mb-10 text-center font-serif text-2xl font-semibold text-neutral-900 sm:text-3xl">Why Choose Us</h2>
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {REASONS.map((reason) => (
          <div key={reason.title} className="rounded-xl border border-neutral-200 p-6">
            <h3 className="text-base font-semibold text-neutral-900">{reason.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">{reason.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
