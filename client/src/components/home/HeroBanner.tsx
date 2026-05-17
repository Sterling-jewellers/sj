'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RING_BUILDER_ENABLED } from '@/lib/features';

// ── SVG Illustrations (inline, brand-accurate, no external images) ────────────

/** Slide 1 — Solitaire engagement ring silhouette with sparkle animation */
const RingIllustration = () => (
  <svg viewBox="0 0 500 500" className="w-full h-full" aria-hidden>
    <defs>
      <radialGradient id="ringGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%"   stopColor="#D4B47A" stopOpacity="0.25" />
        <stop offset="100%" stopColor="#0A0A0A" stopOpacity="0"    />
      </radialGradient>
      <radialGradient id="diamondGlow" cx="50%" cy="40%" r="60%">
        <stop offset="0%"   stopColor="#FFFFFF" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#D4B47A" stopOpacity="0.3" />
      </radialGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
    </defs>

    {/* Ambient background circle */}
    <circle cx="250" cy="250" r="200" fill="url(#ringGlow)" />

    {/* Ring band */}
    <ellipse cx="250" cy="310" rx="90" ry="22" fill="none" stroke="#D4B47A" strokeWidth="18"
      strokeLinecap="round" opacity="0.9" />
    <ellipse cx="250" cy="310" rx="90" ry="22" fill="none" stroke="#B08D57" strokeWidth="2"
      strokeLinecap="round" opacity="0.5" />

    {/* Setting prongs */}
    {[225, 240, 260, 275].map((x, i) => (
      <line key={i} x1={x} y1="275" x2={x + (i < 2 ? -3 : 3)} y2="205"
        stroke="#D4B47A" strokeWidth="4" strokeLinecap="round" opacity="0.8" />
    ))}

    {/* Diamond (octagonal brilliant shape) */}
    <polygon
      points="250,162 274,174 286,198 274,222 250,234 226,222 214,198 226,174"
      fill="url(#diamondGlow)" stroke="#D4B47A" strokeWidth="1.5" filter="url(#glow)"
    />
    {/* Diamond facets */}
    <line x1="250" y1="162" x2="250" y2="234" stroke="#D4B47A" strokeWidth="0.5" opacity="0.5" />
    <line x1="214" y1="198" x2="286" y2="198" stroke="#D4B47A" strokeWidth="0.5" opacity="0.5" />
    <polygon points="250,175 270,185 270,211 250,221 230,211 230,185"
      fill="none" stroke="#D4B47A" strokeWidth="0.5" opacity="0.4" />

    {/* Sparkle 1 */}
    <g className="animate-[sparkle1_3s_ease-in-out_infinite]" style={{ transformOrigin: '200px 150px' }}>
      <line x1="200" y1="140" x2="200" y2="160" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
      <line x1="190" y1="150" x2="210" y2="150" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
      <line x1="193" y1="143" x2="207" y2="157" stroke="#FFFFFF" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
      <line x1="207" y1="143" x2="193" y2="157" stroke="#FFFFFF" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
    </g>

    {/* Sparkle 2 */}
    <g className="animate-[sparkle2_4s_ease-in-out_0.8s_infinite]" style={{ transformOrigin: '310px 170px' }}>
      <line x1="310" y1="162" x2="310" y2="178" stroke="#D4B47A" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="302" y1="170" x2="318" y2="170" stroke="#D4B47A" strokeWidth="1.5" strokeLinecap="round" />
    </g>

    {/* Sparkle 3 */}
    <g className="animate-[sparkle1_5s_ease-in-out_1.6s_infinite]" style={{ transformOrigin: '175px 250px' }}>
      <line x1="175" y1="244" x2="175" y2="256" stroke="#B08D57" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="169" y1="250" x2="181" y2="250" stroke="#B08D57" strokeWidth="1.5" strokeLinecap="round" />
    </g>

    {/* GIA cert suggestion */}
    <rect x="195" y="355" width="110" height="30" rx="2" fill="#1C1C1C" opacity="0.7" />
    <text x="250" y="373" textAnchor="middle" fill="#D4B47A" fontSize="10" fontFamily="sans-serif" letterSpacing="2">
      GIA CERTIFIED
    </text>
  </svg>
);

/** Slide 2 — Top-down diamond brilliant cut with facet lines */
const DiamondIllustration = () => (
  <svg viewBox="0 0 500 500" className="w-full h-full" aria-hidden>
    <defs>
      <radialGradient id="brilliantGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%"   stopColor="#FFFFFF" stopOpacity="0.95" />
        <stop offset="40%"  stopColor="#D4B47A" stopOpacity="0.6"  />
        <stop offset="100%" stopColor="#0A0A0A" stopOpacity="0"    />
      </radialGradient>
      <radialGradient id="facetFill" cx="50%" cy="50%" r="50%">
        <stop offset="0%"   stopColor="#FAF7F2" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#B08D57" stopOpacity="0.3" />
      </radialGradient>
      <filter id="brilliantGlow">
        <feGaussianBlur stdDeviation="6" result="blur" />
        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
    </defs>

    {/* Outer glow */}
    <circle cx="250" cy="250" r="190" fill="url(#brilliantGlow)" opacity="0.3" />

    {/* Main brilliant outline (58 facet top view approximation) */}
    <polygon
      points="250,80 320,100 370,150 390,220 370,290 320,340 250,360 180,340 130,290 110,220 130,150 180,100"
      fill="url(#facetFill)" stroke="#D4B47A" strokeWidth="1.5" filter="url(#brilliantGlow)"
    />
    {/* Table facet */}
    <polygon
      points="250,140 302,158 322,208 302,258 250,276 198,258 178,208 198,158"
      fill="none" stroke="#D4B47A" strokeWidth="1" opacity="0.7"
    />
    {/* Radiant facet lines */}
    {Array.from({ length: 12 }, (_, i) => {
      const angle = (i * 30) * Math.PI / 180;
      const x1 = 250 + 68 * Math.cos(angle);
      const y1 = 208 + 68 * Math.sin(angle);
      const x2 = 250 + 140 * Math.cos(angle);
      const y2 = 208 + 140 * Math.sin(angle);
      return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
        stroke="#D4B47A" strokeWidth="0.8" opacity={i % 2 === 0 ? 0.6 : 0.3} />;
    })}
    {/* Star facets */}
    {Array.from({ length: 8 }, (_, i) => {
      const a = (i * 45 + 22.5) * Math.PI / 180;
      const x = 250 + 95 * Math.cos(a);
      const y = 208 + 95 * Math.sin(a);
      return <line key={i} x1="250" y1="208" x2={x} y2={y}
        stroke="#FFFFFF" strokeWidth="0.6" opacity="0.5" />;
    })}

    {/* Certification logo area */}
    <rect x="210" y="390" width="80" height="24" rx="12" fill="#D4B47A" opacity="0.2" />
    <text x="250" y="406" textAnchor="middle" fill="#D4B47A" fontSize="9" fontFamily="sans-serif" letterSpacing="2">
      IGI · GIA
    </text>

    {/* Glint animations */}
    {[{x:170,y:155,d:0},{x:340,y:175,d:1.2},{x:320,y:310,d:2.4},{x:155,y:275,d:0.8}].map(({x,y,d},i) => (
      <g key={i} style={{ animation: `sparkle1 ${3+d}s ease-in-out ${d}s infinite`, transformOrigin:`${x}px ${y}px` }}>
        <line x1={x} y1={y-7} x2={x} y2={y+7} stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
        <line x1={x-7} y1={y} x2={x+7} y2={y} stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
      </g>
    ))}
  </svg>
);

/** Slide 3 — Two interlocking wedding bands */
const WeddingBandsIllustration = () => (
  <svg viewBox="0 0 500 500" className="w-full h-full" aria-hidden>
    <defs>
      <radialGradient id="bandsGlow" cx="50%" cy="50%" r="60%">
        <stop offset="0%"   stopColor="#D4B47A" stopOpacity="0.2" />
        <stop offset="100%" stopColor="#0A0A0A" stopOpacity="0"   />
      </radialGradient>
      <linearGradient id="band1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%"   stopColor="#FFFFFF" />
        <stop offset="50%"  stopColor="#D4B47A" />
        <stop offset="100%" stopColor="#B08D57" />
      </linearGradient>
      <linearGradient id="band2" x1="100%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%"   stopColor="#D4A843" />
        <stop offset="50%"  stopColor="#E8C880" />
        <stop offset="100%" stopColor="#B8912E" />
      </linearGradient>
    </defs>

    <circle cx="250" cy="250" r="200" fill="url(#bandsGlow)" />

    {/* Left band (platinum) — tilted ellipse */}
    <g transform="translate(250,250) rotate(-18)">
      <ellipse cx="-35" cy="0" rx="95" ry="95" fill="none"
        stroke="url(#band1)" strokeWidth="22" />
      <ellipse cx="-35" cy="0" rx="95" ry="95" fill="none"
        stroke="#B08D57" strokeWidth="1" opacity="0.4" />
    </g>

    {/* Right band (gold) — tilted opposite */}
    <g transform="translate(250,250) rotate(18)">
      <ellipse cx="35" cy="0" rx="95" ry="95" fill="none"
        stroke="url(#band2)" strokeWidth="22" />
      <ellipse cx="35" cy="0" rx="95" ry="95" fill="none"
        stroke="#D4A843" strokeWidth="1" opacity="0.4" />
    </g>

    {/* Diamond accents on platinum ring */}
    {[0, 45, 90, 135, 180].map((deg, i) => {
      const r = 60;
      const a = (deg - 18) * Math.PI / 180;
      const x = (250 - 35) + r * Math.cos(a);
      const y = 250 + r * Math.sin(a);
      return <circle key={i} cx={x} cy={y} r="3.5" fill="#FFFFFF" opacity="0.9" />;
    })}

    {/* "Forever" inscription between rings */}
    <text x="250" y="258" textAnchor="middle" fill="#D4B47A" fontSize="13"
      fontFamily="Georgia, serif" fontStyle="italic" opacity="0.7">
      forever
    </text>

    {/* Sparkles */}
    {[{x:160,y:160,d:0},{x:345,y:155,d:1.5},{x:180,y:345,d:0.7},{x:335,y:350,d:2.1}].map(({x,y,d},i) => (
      <g key={i} style={{ animation: `sparkle2 ${3.5+d}s ease-in-out ${d}s infinite`, transformOrigin:`${x}px ${y}px` }}>
        <line x1={x} y1={y-6} x2={x} y2={y+6} stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
        <line x1={x-6} y1={y} x2={x+6} y2={y} stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
      </g>
    ))}
  </svg>
);

// ── Slides config ─────────────────────────────────────────────────────────────
const slides = [
  {
    id: 1,
    bg: 'from-[#1a2015] via-[#272e1f] to-[#0A0A0A]',
    tag: 'New Collection',
    title: 'Where Love\nBegins',
    subtitle: 'Discover our handcrafted engagement rings, each one a symbol of your unique love story.',
    cta:  { label: 'Shop Engagement Rings', href: '/category/engagement-rings' },
    cta2: RING_BUILDER_ENABLED
      ? { label: 'Build Your Ring', href: '/custom-ring' }
      : { label: 'Search Diamonds', href: '/diamonds' },
    align: 'left',
    Illustration: RingIllustration,
  },
  {
    id: 2,
    bg: 'from-[#080808] via-[#0F0F0F] to-[#181818]',
    tag: 'Ethically Sourced',
    title: 'Eternal\nBeauty',
    subtitle: 'GIA & IGI certified diamonds set in platinum and 18ct gold. Crafted to last a lifetime.',
    cta:  { label: 'Explore Diamonds',   href: '/diamonds' },
    cta2: { label: 'Diamond Education',  href: '/diamond-education' },
    align: 'center',
    Illustration: DiamondIllustration,
  },
  {
    id: 3,
    bg: 'from-[#0E0B07] via-[#181410] to-[#221D15]',
    tag: 'Wedding Season',
    title: 'For Your\nSpecial Day',
    subtitle: 'Complete your bridal look with our stunning wedding bands and matching sets.',
    cta:  { label: 'Wedding Rings', href: '/category/wedding-rings' },
    cta2: { label: 'Bridal Sets',   href: '/products?style=set'    },
    align: 'right',
    Illustration: WeddingBandsIllustration,
  },
];

export default function HeroBanner() {
  const [current,     setCurrent]     = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const goTo = useCallback((idx: number) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrent(idx);
    setTimeout(() => setIsAnimating(false), 700);
  }, [isAnimating]);

  useEffect(() => {
    const t = setInterval(() => goTo((current + 1) % slides.length), 7000);
    return () => clearInterval(t);
  }, [current, goTo]);

  const slide = slides[current];

  return (
    <>
      {/* Sparkle keyframe styles */}
      <style>{`
        @keyframes sparkle1 {
          0%,100% { opacity:0; transform:scale(0.4); }
          50%      { opacity:1; transform:scale(1);   }
        }
        @keyframes sparkle2 {
          0%,100% { opacity:0; transform:scale(0.3) rotate(45deg); }
          50%      { opacity:0.9; transform:scale(1) rotate(45deg); }
        }
      `}</style>

      <section className="relative h-[88vh] min-h-[620px] overflow-hidden">
        {slides.map((s, i) => (
          <div
            key={s.id}
            className={cn(
              `absolute inset-0 bg-gradient-to-br ${s.bg} transition-opacity duration-700`,
              i === current ? 'opacity-100' : 'opacity-0 pointer-events-none'
            )}
          />
        ))}

        {/* Content */}
        <div className="relative z-10 h-full max-w-[1400px] mx-auto px-6 flex items-center">
          <div className={cn(
            'grid grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full',
            slide.align === 'center' && 'lg:grid-cols-1 max-w-2xl mx-auto text-center',
            slide.align === 'right'  && '',
          )}>
            {/* Text — left (or center/right based on align) */}
            <div className={cn(
              'max-w-xl',
              slide.align === 'right'  && 'lg:order-2',
              slide.align === 'center' && 'mx-auto',
            )}>
              <p className="text-[10px] font-sans tracking-[0.35em] uppercase text-gold-300 mb-4">
                {slide.tag}
              </p>
              <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-light text-white leading-none mb-6 whitespace-pre-line">
                {slide.title}
              </h1>
              <p className="text-base font-sans text-gray-300 leading-relaxed mb-8 max-w-md">
                {slide.subtitle}
              </p>
              <div className={cn(
                'flex gap-4 flex-wrap',
                slide.align === 'center' && 'justify-center',
                slide.align === 'right'  && 'justify-start',
              )}>
                <Link href={slide.cta.href}
                  className="px-8 py-3.5 bg-gold-500 text-charcoal text-sm font-sans font-medium tracking-widest uppercase hover:bg-gold-400 transition-colors">
                  {slide.cta.label}
                </Link>
                <Link href={slide.cta2.href}
                  className="px-8 py-3.5 border border-white/60 text-white text-sm font-sans font-medium tracking-widest uppercase hover:bg-white/10 transition-colors">
                  {slide.cta2.label}
                </Link>
              </div>
            </div>

            {/* SVG Illustration */}
            {slide.align !== 'center' && (
              <div className={cn(
                'hidden lg:flex items-center justify-center h-80 lg:h-[480px]',
                slide.align === 'right' && 'lg:order-1',
              )}>
                <div className="w-full max-w-[440px] aspect-square transition-opacity duration-700">
                  <slide.Illustration />
                </div>
              </div>
            )}
            {slide.align === 'center' && (
              <div className="flex justify-center mt-8">
                <div className="w-64 h-64 opacity-60">
                  <slide.Illustration />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Nav arrows */}
        <button onClick={() => goTo((current - 1 + slides.length) % slides.length)}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 bg-white/15 backdrop-blur-sm flex items-center justify-center hover:bg-white/25 transition-colors">
          <ChevronLeft size={20} className="text-white" />
        </button>
        <button onClick={() => goTo((current + 1) % slides.length)}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 bg-white/15 backdrop-blur-sm flex items-center justify-center hover:bg-white/25 transition-colors">
          <ChevronRight size={20} className="text-white" />
        </button>

        {/* Dots */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {slides.map((_, i) => (
            <button key={i} onClick={() => goTo(i)}
              className={cn('transition-all duration-300',
                i === current ? 'w-8 h-1 bg-gold-400' : 'w-2 h-1 bg-white/40 hover:bg-white/70'
              )} />
          ))}
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 right-8 z-20 hidden md:flex flex-col items-center gap-2">
          <div className="w-0.5 h-12 bg-white/20 relative overflow-hidden">
            <div className="absolute top-0 w-full h-1/2 bg-gold-400 animate-[scrollDown_2s_ease-in-out_infinite]" />
          </div>
          <span className="text-white/50 text-[9px] font-sans tracking-widest uppercase rotate-90 origin-center translate-y-4">Scroll</span>
        </div>
      </section>
    </>
  );
}
