'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { DIAMONDS_ENABLED } from '@/lib/features';

interface Slide {
  collection: string;   // e.g. "ENGAGEMENT"
  title:      string;   // big line  e.g. "Crafted Forever"
  cta:        { label: string; href: string };
  image:      string;
}

const baseSlides: Slide[] = [
  {
    collection: 'ENGAGEMENT',
    title:      'Crafted Forever',
    cta:        { label: 'Discover the collection', href: '/category/engagement-rings' },
    image:      'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=1800&h=1200&fit=crop&q=90',
  },
  {
    collection: 'FINE JEWELLERY',
    title:      'Worn With Pride',
    cta:        { label: 'Discover the collection', href: '/category/jewellery' },
    image:      'https://images.unsplash.com/photo-1601121141461-9d6647bef0a1?w=1800&h=1200&fit=crop&q=90',
  },
  {
    collection: DIAMONDS_ENABLED ? 'DIAMONDS' : 'COLLECTIONS',
    title:      'A Diamond Forever',
    cta: {
      label: 'Discover the collection',
      href:  DIAMONDS_ENABLED ? '/diamonds' : '/category/jewellery',
    },
    image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1800&h=1200&fit=crop&q=90',
  },
];

export default function HeroBanner() {
  const [current, setCurrent] = useState(0);
  const [fading,  setFading]  = useState(false);

  const goTo = useCallback((idx: number) => {
    setFading(true);
    setTimeout(() => { setCurrent(idx); setFading(false); }, 500);
  }, []);

  useEffect(() => {
    const t = setInterval(() => goTo((current + 1) % baseSlides.length), 6000);
    return () => clearInterval(t);
  }, [current, goTo]);

  return (
    <section className="relative w-full min-h-screen overflow-hidden bg-charcoal">

      {/* ── Background images — all stacked, only current is visible ── */}
      {baseSlides.map((s, i) => (
        <Image
          key={i}
          src={s.image}
          alt={s.title}
          fill
          priority={i === 0}
          sizes="100vw"
          className={cn(
            'object-cover transition-opacity duration-700',
            i === current ? 'opacity-100' : 'opacity-0',
          )}
        />
      ))}

      {/* ── Bottom gradient for text legibility ── */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent pointer-events-none" />

      {/* ── Slide content — centered at the bottom ── */}
      <div
        className={cn(
          'absolute inset-x-0 bottom-0 flex flex-col items-center text-center pb-16 sm:pb-20 px-6 transition-opacity duration-500',
          fading ? 'opacity-0' : 'opacity-100',
        )}
      >
        {/* Collection label */}
        <p className="text-[10px] font-sans tracking-[0.4em] uppercase text-white/70 mb-3">
          {baseSlides[current].collection}
        </p>

        {/* Title */}
        <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-light text-white mb-5 leading-tight">
          {baseSlides[current].title}
        </h1>

        {/* CTA — underlined text link, Cartier style */}
        <Link
          href={baseSlides[current].cta.href}
          className="inline-flex flex-col items-center group"
        >
          <span className="font-sans text-sm font-light tracking-widest text-white pb-1">
            {baseSlides[current].cta.label}
          </span>
          <span className="h-px w-full bg-white/60 group-hover:bg-gold-400 transition-colors duration-300" />
        </Link>

        {/* Dot indicators */}
        <div className="flex items-center gap-2.5 mt-10">
          {baseSlides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Slide ${i + 1}`}
              className={cn(
                'transition-all duration-300 rounded-full',
                i === current
                  ? 'w-6 h-1 bg-white'
                  : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/70',
              )}
            />
          ))}
        </div>
      </div>

    </section>
  );
}
