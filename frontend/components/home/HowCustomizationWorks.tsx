const STEPS = [
  { title: "Pick your base", body: "Choose a garment, fabric, color and size to start from." },
  { title: "Make it yours", body: "Upload a logo, add custom text, choose embroidery, print placement and patches." },
  { title: "Preview live", body: "Watch your design update in real time on an interactive canvas preview." },
  { title: "We craft it", body: "Our production team builds your one-of-a-kind piece and ships it to you." },
];

export function HowCustomizationWorks() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <h2 className="mb-10 text-center font-serif text-2xl font-semibold text-neutral-900 sm:text-3xl">
        How Customization Works
      </h2>
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, i) => (
          <div key={step.title} className="flex flex-col items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-900 text-sm font-semibold text-white">
              {i + 1}
            </span>
            <h3 className="text-base font-semibold text-neutral-900">{step.title}</h3>
            <p className="text-sm leading-relaxed text-neutral-600">{step.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
