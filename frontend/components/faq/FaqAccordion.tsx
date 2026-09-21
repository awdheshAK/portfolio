"use client";

import { useState } from "react";

const FAQS = [
  {
    question: "How does the garment customizer pricing work?",
    answer:
      "Every option you pick — fabric, color, print placement, embroidery, patches and quantity — is sent to our server, which calculates the authoritative price. The number shown in the customizer is always the real price, never an estimate.",
  },
  {
    question: "Can I use my own logo or artwork?",
    answer:
      "Yes. Upload a PNG, JPG, WEBP or SVG (up to 5MB) in the Logo step. It's uploaded securely to our storage and used for both the live preview and production.",
  },
  {
    question: "How accurate is the live preview?",
    answer:
      "The preview renders your exact color, logo, text and placement choices on a canvas that updates instantly. Actual embroidery texture and fabric drape may vary slightly from a flat digital render.",
  },
  {
    question: "What payment methods are supported?",
    answer: "We use Razorpay, which supports cards, UPI, net banking and popular wallets across India.",
  },
  {
    question: "Can I save a design and come back later?",
    answer: "Yes — sign in and use \"Save Design\" in the customizer. Find it later under My Account → Saved Designs.",
  },
  {
    question: "What's your return policy on custom orders?",
    answer:
      "Ready-to-wear items can be returned within 14 days if unworn. Fully custom garments are made to order and are generally final sale except for manufacturing defects — contact support and we'll make it right.",
  },
];

export function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="divide-y divide-neutral-200 border-t border-neutral-200">
      {FAQS.map((faq, i) => {
        const isOpen = openIndex === i;
        return (
          <div key={faq.question}>
            <h3>
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : i)}
                aria-expanded={isOpen}
                aria-controls={`faq-panel-${i}`}
                className="flex w-full items-center justify-between gap-4 py-5 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
              >
                <span className="text-sm font-medium text-neutral-900">{faq.question}</span>
                <span aria-hidden="true" className="text-neutral-400">
                  {isOpen ? "−" : "+"}
                </span>
              </button>
            </h3>
            {isOpen && (
              <div id={`faq-panel-${i}`} className="pb-5 text-sm leading-relaxed text-neutral-600">
                {faq.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
