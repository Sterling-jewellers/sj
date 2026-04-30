'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const faqs = [
  { q: 'How do I find my ring size?', a: 'You can use our free ring sizing guide to measure at home. We also offer a free ring sizer sent by post. Alternatively, visit our London boutique for an in-store fitting.' },
  { q: 'Are your diamonds ethically sourced?', a: 'Yes. All our diamonds are conflict-free and certified by the Kimberley Process. We only work with suppliers who meet the highest ethical and environmental standards. GIA and IGI certificates are available for every diamond.' },
  { q: 'Can I customise my ring?', a: 'Absolutely. Use our online Ring Builder to choose your setting and diamond, or visit us in-store for a fully bespoke experience. We can also engrave personal messages free of charge.' },
  { q: 'What is your returns policy?', a: 'We offer hassle-free returns within 30 days of delivery. Items must be unworn and in their original packaging. Custom and engraved pieces are non-refundable unless faulty.' },
  { q: 'How long does delivery take?', a: 'Standard delivery takes 5–7 working days. Express delivery (2–3 working days) is available for £9.99, and next-day delivery for £14.99. All orders are fully insured and tracked.' },
  { q: 'Do you offer a warranty?', a: 'Yes. Every piece comes with our Lifetime Craftsmanship Guarantee covering manufacturing defects. We also offer free resizing within the first year of purchase.' },
  { q: 'Can I pay in instalments?', a: 'Yes, we offer 0% interest finance on orders over £500 through our partner Klarna. Select "Pay in 3" or "Pay Later" at checkout.' },
  { q: 'Do you buy or part-exchange old jewellery?', a: 'We do offer part-exchange on selected pieces. Visit our boutique or contact us for a free valuation. We assess each piece individually.' },
];

export default function FAQPage() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="bg-ivory py-16">
      <div className="page-container max-w-3xl">
        <div className="text-center mb-14">
          <p className="section-subtitle mb-3">Support</p>
          <h1 className="section-title">Frequently Asked Questions</h1>
          <div className="gold-divider mt-4" />
        </div>

        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-white border border-gray-100">
              <button onClick={() => setOpen(open === i ? null : i)} className="w-full flex items-center justify-between px-6 py-5 text-left">
                <span className="font-sans font-medium text-sm text-charcoal">{faq.q}</span>
                <ChevronDown size={16} className={cn('text-gold-500 flex-shrink-0 transition-transform', open === i && 'rotate-180')} />
              </button>
              {open === i && (
                <div className="px-6 pb-5">
                  <div className="h-0.5 w-8 bg-gold-400 mb-4" />
                  <p className="text-sm font-sans text-gray-600 leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="bg-charcoal text-white p-8 text-center mt-10">
          <h3 className="font-serif text-2xl font-light mb-2">Still have questions?</h3>
          <p className="text-sm font-sans text-gray-300 mb-5">Our team is available 7 days a week.</p>
          <a href="/contact" className="btn-gold inline-block">Contact Us</a>
        </div>
      </div>
    </div>
  );
}
