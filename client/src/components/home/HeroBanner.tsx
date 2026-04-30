'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const slides = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1600&h=900&fit=crop',
    tag: 'New Collection',
    title: 'Where Love\nBegins',
    subtitle: 'Discover our handcrafted engagement rings, each one a symbol of your unique love story.',
    cta: { label: 'Shop Engagement Rings', href: '/category/engagement-rings' },
    cta2: { label: 'Build Your Ring', href: '/custom-ring' },
    align: 'left',
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=1600&h=900&fit=crop',
    tag: 'Timeless Elegance',
    title: 'Eternal\nBeauty',
    subtitle: 'GIA & IGI certified diamonds set in platinum and 18ct gold. Crafted to last a lifetime.',
    cta: { label: 'Explore Diamonds', href: '/diamonds' },
    cta2: { label: 'View Collections', href: '/products' },
    align: 'center',
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=1600&h=900&fit=crop',
    tag: 'Wedding Season',
    title: 'For Your\nSpecial Day',
    subtitle: 'Complete your bridal look with our stunning wedding bands and matching sets.',
    cta: { label: 'Wedding Rings', href: '/category/wedding-rings' },
    cta2: { label: 'Bridal Sets', href: '/products?style=set' },
    align: 'right',
  },
];

export default function HeroBanner() {
  const [current, setCurrent] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const goTo = useCallback((idx: number) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrent(idx);
    setTimeout(() => setIsAnimating(false), 600);
  }, [isAnimating]);

  useEffect(() => {
    const interval = setInterval(() => goTo((current + 1) % slides.length), 6000);
    return () => clearInterval(interval);
  }, [current, goTo]);

  const slide = slides[current];

  return (
    <section className="relative h-[85vh] min-h-[600px] overflow-hidden bg-charcoal">
      {/* Background Images */}
      {slides.map((s, i) => (
        <div
          key={s.id}
          className={cn('absolute inset-0 transition-opacity duration-1000', i === current ? 'opacity-100' : 'opacity-0')}
        >
          <Image src={s.image} alt={s.title} fill className="object-cover" priority={i === 0} />
          <div className="absolute inset-0 bg-gradient-to-r from-charcoal/70 via-charcoal/40 to-transparent" />
        </div>
      ))}

      {/* Content */}
      <div className="relative z-10 h-full page-container flex items-center">
        <div className={cn('max-w-xl', slide.align === 'center' && 'mx-auto text-center', slide.align === 'right' && 'ml-auto text-right')}>
          <p className="section-subtitle text-gold-300 mb-4 animate-fade-in">{slide.tag}</p>
          <h1 className="font-serif text-6xl md:text-7xl font-light text-white leading-none mb-6 whitespace-pre-line animate-slide-up">
            {slide.title}
          </h1>
          <p className="text-base font-sans text-gray-300 leading-relaxed mb-8 max-w-md animate-fade-in">
            {slide.subtitle}
          </p>
          <div className={cn('flex gap-4 flex-wrap', slide.align === 'center' && 'justify-center', slide.align === 'right' && 'justify-end')}>
            <Link href={slide.cta.href} className="btn-gold">{slide.cta.label}</Link>
            <Link href={slide.cta2.href} className="btn-outline-gold border-white text-white hover:bg-white hover:text-charcoal">
              {slide.cta2.label}
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <button
        onClick={() => goTo((current - 1 + slides.length) % slides.length)}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
      >
        <ChevronLeft size={20} className="text-white" />
      </button>
      <button
        onClick={() => goTo((current + 1) % slides.length)}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
      >
        <ChevronRight size={20} className="text-white" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={cn('transition-all duration-300', i === current ? 'w-8 h-1 bg-gold-400' : 'w-2 h-1 bg-white/40 hover:bg-white/70')}
          />
        ))}
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 right-8 z-20 hidden md:flex flex-col items-center gap-2">
        <div className="w-0.5 h-12 bg-white/20 relative overflow-hidden">
          <div className="absolute top-0 w-full h-1/2 bg-gold-400 animate-[slideDown_2s_ease-in-out_infinite]" />
        </div>
        <span className="text-white/60 text-[9px] font-sans tracking-widest uppercase rotate-90 origin-center translate-y-4">Scroll</span>
      </div>
    </section>
  );
}
