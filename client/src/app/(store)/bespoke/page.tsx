import Link from 'next/link';
import Image from 'next/image';
import Breadcrumb from '@/components/layout/Breadcrumb';

const steps = [
  {
    num: '01',
    title: 'Initial Consultation',
    body: 'Share your vision in a free 45-minute meeting — in our London boutique or by video call. Bring reference images, sketches, or simply describe the feeling you are looking for. Our gemmologist will discuss every detail: metal, stone shape, setting style and budget.',
  },
  {
    num: '02',
    title: 'Design & Quote',
    body: 'Within five working days, our designers produce detailed CAD renders and a full quote. You will see the ring from every angle before a single piece of metal is cut. Revisions are welcomed — this is your ring and we do not move forward until you are completely happy.',
  },
  {
    num: '03',
    title: 'Diamond Selection',
    body: 'We source GIA and IGI certified diamonds from our trusted network of ethical suppliers. You choose the exact stone for your ring — we show you options at different budget levels with full certificate details, and you approve the final choice.',
  },
  {
    num: '04',
    title: 'Handcrafting',
    body: 'Your ring is handmade by our master craftsmen in our UK workshop. We use traditional hand-setting techniques alongside precision casting, and every stone is set under magnification. The process takes 3–6 weeks depending on complexity.',
  },
  {
    num: '05',
    title: 'Quality Control & Delivery',
    body: 'Before dispatch, every bespoke piece is inspected under magnification, hallmarked at the London Assay Office, and photographed. It arrives in our signature jewellery box with its diamond certificate and a full care guide — insured and tracked.',
  },
];

const faqs = [
  { q: 'How much does a bespoke ring cost?', a: 'Our bespoke commissions start from around £800 for a simple band and typically range from £1,500 to £15,000+ for GIA-certified diamond engagement rings, depending on the diamond quality, metal and complexity of the design. We always provide a detailed quote before any work begins.' },
  { q: 'How long does a bespoke ring take?', a: 'From first consultation to delivery is typically 4–8 weeks. Simple designs can be completed in 3 weeks; complex pieces with intricate hand-engraving or multiple stones may take 8–10 weeks. We recommend allowing 10 weeks if you have a deadline (proposal date, anniversary, etc.).' },
  { q: 'Can I supply my own stone or heirloom?', a: 'Absolutely. We regularly re-set heirloom diamonds and precious stones. We will have the stone assessed by our gemmologist before committing to a setting design, to ensure the most secure and beautiful result.' },
  { q: 'Can I use the Ring Builder instead?', a: 'Yes — our online Ring Builder lets you choose from 200+ settings and 10,000+ certified diamonds entirely online. The bespoke service is for designs that go beyond our existing range.' },
  { q: 'Is there a design fee?', a: 'The initial consultation and CAD design are included in the overall commission price. There is no separate design fee — you only pay when you are happy to proceed to manufacture.' },
];

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
};

export default function BespokePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <Breadcrumb items={[{ label: 'Bespoke Design' }]} />

      {/* Hero */}
      <div className="relative bg-navy text-white overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <Image
            src="https://images.unsplash.com/photo-1543294001-f7cd5d7fb516?w=1600&h=700&fit=crop"
            alt="Bespoke jewellery workshop"
            fill
            className="object-cover"
          />
        </div>
        <div className="relative page-container py-24 text-center max-w-3xl mx-auto">
          <p className="section-subtitle text-white/60 mb-4">Made For You, By Hand</p>
          <h1 className="font-serif text-5xl md:text-6xl font-light leading-tight mb-6">
            Bespoke Jewellery Design
          </h1>
          <p className="text-sm font-sans text-white/70 leading-relaxed mb-8 max-w-xl mx-auto">
            A truly one-of-a-kind piece, handcrafted by our master craftsmen in London. From the first conversation to the finished ring — we guide you through every step.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/book-appointment" className="btn-gold">Book a Free Consultation</Link>
            <a href="tel:+447429065954" className="inline-block border border-white/40 text-white/80 hover:border-white hover:text-white font-sans font-medium tracking-widest uppercase text-xs px-8 py-4 transition-all duration-300">
              Call Us
            </a>
          </div>
        </div>
      </div>

      {/* Why bespoke */}
      <div className="bg-white py-20">
        <div className="page-container">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="section-subtitle mb-4">Why Choose Bespoke</p>
              <h2 className="section-title mb-6">A Ring as Unique as Your Story</h2>
              <div className="gold-divider mt-0 mb-6 mx-0" />
              <div className="space-y-4 text-sm font-sans text-gray-600 leading-relaxed">
                <p>Our ready-to-wear collection covers hundreds of styles, but sometimes only a completely original design will do. Perhaps you have fallen in love with an unusual diamond shape that does not exist in a standard setting. Perhaps you want to incorporate a family heirloom stone. Or perhaps you simply want something no one else in the world owns.</p>
                <p>The bespoke process at Sterling Jewellers is collaborative, transparent and joyful. We start by listening. Our designers and craftsmen bring decades of experience to the table — but it is your vision that drives every decision, from the initial sketch to the final hallmark.</p>
                <p>Every bespoke commission is hallmarked at the London Assay Office and comes with the same lifetime craftsmanship guarantee as our entire collection.</p>
              </div>
              <div className="mt-8 grid grid-cols-3 gap-6">
                {[
                  { stat: '500+', label: 'Bespoke pieces made' },
                  { stat: '4.9★', label: 'Average review score' },
                  { stat: '100%', label: 'UK handcrafted' },
                ].map(({ stat, label }) => (
                  <div key={label} className="text-center border border-gray-100 py-5 px-3">
                    <p className="font-serif text-2xl font-light text-navy mb-1">{stat}</p>
                    <p className="text-[10px] font-sans text-gray-400 uppercase tracking-widest">{label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative aspect-square">
              <Image
                src="https://images.unsplash.com/photo-1606800052052-a08af7148866?w=700&h=700&fit=crop"
                alt="Jeweller crafting a bespoke ring"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Process */}
      <div className="bg-[#F5F7FA] py-20">
        <div className="page-container">
          <div className="text-center mb-14">
            <p className="section-subtitle mb-3">How It Works</p>
            <h2 className="section-title">The Bespoke Process</h2>
            <div className="gold-divider mt-4" />
          </div>

          <div className="max-w-3xl mx-auto space-y-0">
            {steps.map((step, i) => (
              <div key={step.num} className="flex gap-8 relative">
                {/* Connector line */}
                {i < steps.length - 1 && (
                  <div className="absolute left-5 top-12 bottom-0 w-px bg-gray-200" />
                )}
                <div className="flex-shrink-0 w-10 h-10 bg-navy flex items-center justify-center relative z-10">
                  <span className="font-serif text-xs font-light text-white">{step.num}</span>
                </div>
                <div className="pb-10">
                  <h3 className="font-sans font-semibold text-sm text-charcoal mb-2">{step.title}</h3>
                  <p className="text-sm font-sans text-gray-600 leading-relaxed">{step.body}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link href="/book-appointment" className="btn-gold inline-block">Start Your Bespoke Journey</Link>
          </div>
        </div>
      </div>

      {/* FAQs */}
      <div className="bg-white py-20">
        <div className="page-container max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="section-title">Bespoke FAQs</h2>
            <div className="gold-divider mt-4" />
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <details key={i} className="group border border-gray-100">
                <summary className="flex items-center justify-between px-6 py-5 cursor-pointer list-none">
                  <span className="font-sans font-medium text-sm text-charcoal">{faq.q}</span>
                  <span className="text-gray-400 group-open:rotate-45 transition-transform text-lg leading-none ml-4 flex-shrink-0">+</span>
                </summary>
                <div className="px-6 pb-5 border-t border-gray-100">
                  <p className="text-sm font-sans text-gray-600 leading-relaxed pt-4">{faq.a}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="bg-navy text-white py-20 text-center">
        <div className="page-container max-w-2xl mx-auto">
          <p className="section-subtitle text-white/60 mb-4">Ready to Begin?</p>
          <h2 className="font-serif text-4xl font-light mb-5">Let&apos;s Create Something Extraordinary</h2>
          <p className="text-sm font-sans text-white/70 leading-relaxed mb-8">
            Book a free 45-minute consultation — in-store at our Bond Street boutique or by video call. There is no obligation to proceed, and no pressure of any kind.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/book-appointment" className="inline-block bg-white text-navy text-xs font-sans font-semibold tracking-widest uppercase px-10 py-4 hover:bg-gray-100 transition-colors">Book Consultation</Link>
            <Link href="/contact" className="inline-block border border-white/40 text-white/70 hover:border-white hover:text-white font-sans font-medium tracking-widest uppercase text-xs px-10 py-4 transition-all duration-300">Get in Touch</Link>
          </div>
        </div>
      </div>
    </>
  );
}
