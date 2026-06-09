'use client';

import { useState } from 'react';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Data — plain objects only, NO JSX at module scope ───────────────────────

const REVIEWS = [
  {
    id: 1,
    name: 'Sarah T.',
    verified: true,
    rating: 5,
    title: 'Absolutely stunning ring!',
    body: 'The engagement ring arrived beautifully packaged and exceeded every expectation. Truly luxurious quality for the price. Will recommend to everyone.',
    date: '2 days ago',
  },
  {
    id: 2,
    name: 'James W.',
    verified: true,
    rating: 5,
    title: 'Perfect wedding bands',
    body: 'Our matching wedding bands are exactly what we dreamed of. The engraving was flawless and the whole experience from order to delivery was seamless.',
    date: '5 days ago',
  },
  {
    id: 3,
    name: 'Emily R.',
    verified: true,
    rating: 5,
    title: 'Diamond necklace as a gift — perfect!',
    body: 'Bought this as a birthday gift and she was speechless. Delivery was next day and the jewellery was presented in a gorgeous box. 10/10.',
    date: '1 week ago',
  },
  {
    id: 4,
    name: 'Michael B.',
    verified: true,
    rating: 5,
    title: 'Efficient and friendly service',
    body: 'I had a few questions before ordering and the team responded within the hour. The ring is beautiful — exactly as shown in the photos.',
    date: '1 week ago',
  },
];

const PLATFORMS = [
  { name: 'Trustpilot',     score: '4.9', count: '3,570 reviews',  color: '#00b67a' },
  { name: 'Google',         score: '4.9', count: '6,444 reviews',  color: '#4285F4' },
  { name: 'Trusted Shops',  score: '4.9', count: '3,244 reviews',  color: '#FFDC0F' },
];

// ─── Tiny logo components — JSX lives inside components, never at module scope
function TrustpilotLogo() {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-6 h-6 rounded-sm flex items-center justify-center" style={{ background: '#00b67a' }}>
        <Star size={14} fill="white" stroke="none" />
      </div>
      <span className="font-bold text-sm text-gray-800" style={{ fontFamily: 'Arial, sans-serif' }}>Trustpilot</span>
    </div>
  );
}

function GoogleLogo() {
  return (
    <div className="flex items-center gap-1">
      <span className="font-bold text-xl leading-none" style={{ color: '#4285F4' }}>G</span>
      <span className="font-bold text-xl leading-none" style={{ color: '#EA4335' }}>o</span>
      <span className="font-bold text-xl leading-none" style={{ color: '#FBBC05' }}>o</span>
      <span className="font-bold text-xl leading-none" style={{ color: '#4285F4' }}>g</span>
      <span className="font-bold text-xl leading-none" style={{ color: '#34A853' }}>l</span>
      <span className="font-bold text-xl leading-none" style={{ color: '#EA4335' }}>e</span>
    </div>
  );
}

function TrustedShopsLogo() {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: '#FFDC0F' }}>
        <Star size={11} fill="#333" stroke="none" />
      </div>
      <span className="font-bold text-sm text-gray-800" style={{ fontFamily: 'Arial, sans-serif' }}>Trusted Shops</span>
    </div>
  );
}

const PLATFORM_LOGOS = [TrustpilotLogo, GoogleLogo, TrustedShopsLogo];

// ─── Main component ───────────────────────────────────────────────────────────
export default function TrustReviews() {
  const [current, setCurrent] = useState(0);
  const total = REVIEWS.length;

  const prev = () => setCurrent(c => (c - 1 + total) % total);
  const next = () => setCurrent(c => (c + 1) % total);

  // Visible cards: 3 on desktop, 1 on mobile
  const visible = [
    REVIEWS[current % total],
    REVIEWS[(current + 1) % total],
    REVIEWS[(current + 2) % total],
  ];

  return (
    <section className="py-20 bg-white border-t border-gray-100">
      <div className="page-container">

        {/* Header */}
        <div className="text-center mb-12">
          <p className="section-subtitle mb-3">Customer Stories</p>
          <h2 className="section-title">Our Customers Love Us</h2>
          <div className="gold-divider mt-4" />
        </div>

        {/* Platform badges */}
        <div className="flex flex-wrap items-start justify-center gap-12 mb-14">
          {PLATFORMS.map((p, i) => {
            const LogoComponent = PLATFORM_LOGOS[i];
            return (
              <div key={p.name} className="flex flex-col items-center gap-2">
                <LogoComponent />
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, si) => (
                    <Star key={si} size={14} fill={p.color} stroke="none" />
                  ))}
                </div>
                <p className="text-xs font-sans text-gray-500">
                  {p.name} {p.score} | {p.count}
                </p>
              </div>
            );
          })}
        </div>

        {/* Review cards + arrows */}
        <div className="relative">
          {/* Arrow — left */}
          <button
            onClick={prev}
            aria-label="Previous reviews"
            className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 hidden md:flex items-center justify-center bg-white border border-gray-200 rounded-full shadow-sm hover:border-charcoal transition-colors"
          >
            <ChevronLeft size={16} />
          </button>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:mx-6">
            {visible.map((r, i) => (
              <article
                key={`${r.id}-${i}`}
                className={cn(
                  'border border-gray-100 p-6 bg-white shadow-sm',
                  i > 0 && 'hidden md:block',
                )}
              >
                {/* Stars */}
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: 5 }).map((_, si) => (
                    <Star
                      key={si}
                      size={14}
                      className={si < r.rating ? 'text-[#00b67a] fill-[#00b67a]' : 'text-gray-200 fill-gray-200'}
                    />
                  ))}
                </div>

                {/* Title + verified badge */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="font-sans font-semibold text-sm text-charcoal leading-tight">{r.title}</p>
                  {r.verified && (
                    <span className="flex-shrink-0 text-[9px] font-sans font-medium text-green-700 bg-green-50 px-1.5 py-0.5 rounded-full border border-green-100 whitespace-nowrap">
                      ✓ Verified
                    </span>
                  )}
                </div>

                <p className="text-sm font-sans text-gray-600 leading-relaxed mb-4 line-clamp-3">{r.body}</p>

                <div className="flex items-center justify-between text-[11px] font-sans text-gray-400 border-t border-gray-50 pt-3">
                  <span className="font-medium text-charcoal">{r.name}</span>
                  <span>{r.date}</span>
                </div>
              </article>
            ))}
          </div>

          {/* Arrow — right */}
          <button
            onClick={next}
            aria-label="Next reviews"
            className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 hidden md:flex items-center justify-center bg-white border border-gray-200 rounded-full shadow-sm hover:border-charcoal transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Mobile dots */}
        <div className="flex justify-center gap-2 mt-6 md:hidden">
          {REVIEWS.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={cn(
                'transition-all duration-300 rounded-full',
                i === current ? 'w-6 h-1.5 bg-navy' : 'w-1.5 h-1.5 bg-gray-200',
              )}
            />
          ))}
        </div>

        {/* Aggregate stats */}
        <div className="grid grid-cols-3 gap-6 mt-14 pt-10 border-t border-gray-100">
          {[
            { num: '4.9/5',    label: 'Average Rating',    sub: 'Based on 13,000+ reviews' },
            { num: '98%',      label: 'Would Recommend',   sub: 'To friends & family' },
            { num: '15,000+',  label: 'Happy Customers',   sub: 'Across the UK' },
          ].map(s => (
            <div key={s.label} className="text-center">
              <p className="font-serif text-4xl font-light text-navy">{s.num}</p>
              <p className="font-sans font-medium text-sm text-charcoal mt-2">{s.label}</p>
              <p className="font-sans text-xs text-gray-400 mt-1">{s.sub}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
