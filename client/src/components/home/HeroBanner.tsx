'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { categoriesApi, productsApi } from '@/lib/api';
import { ICategory, IProduct } from '@/types';

/*
 * ─────────────────────────────────────────────────────────────
 *  HERO SLIDER CONFIGURATION — edit this to change banners
 *
 *  HOW TO SET A CUSTOM BANNER IMAGE FOR ANY SLIDE:
 *  Add an  image: 'https://...'  field to the slide object.
 *  That URL will be used directly, overriding the category image.
 *
 *  BEST PRACTICE:
 *  • Upload your banner photos to /public/banners/ (e.g. /banners/engagement.jpg)
 *    then set  image: '/banners/engagement.jpg'
 *  • OR update the category image via Admin → Categories (no code change needed)
 *
 *  RECOMMENDED IMAGE SIZE:  1800 × 1100 px  (landscape, high quality)
 * ─────────────────────────────────────────────────────────────
 */
const SLIDE_CONFIG = [
  {
    categorySlug: 'engagement-rings',
    image:        'https://res.cloudinary.com/dzwnc3gkw/image/upload/v1780928620/1_mfwn05.png',   // ← paste your custom banner URL here, or leave '' to use category image
    href:         '/category/engagement-rings',
    eyebrow:      'New Collection — 2026',
    headline:     ['Begin Your', 'Forever'],
    sub:          'Handcrafted engagement rings, ethically sourced.',
    cta:          'Discover the Collection',
    fallback:     '/creatives/slide-engagement.svg',
  },
  // {
  //   categorySlug: 'wedding-rings',
  //   image:        '',   // ← paste your custom banner URL here
  //   href:         '/category/wedding-rings',
  //   eyebrow:      'Wedding Rings',
  //   headline:     ['Made to Last', 'a Lifetime'],
  //   sub:          'Platinum, gold & palladium. Crafted in London since 2018.',
  //   cta:          'Shop Wedding Rings',
  //   fallback:     '/creatives/slide-wedding.svg',
  // },
  // {
  //   categorySlug: 'eternity-rings',
  //   image:        '',   // ← paste your custom banner URL here
  //   href:         '/category/eternity-rings',
  //   eyebrow:      'Eternity Rings',
  //   headline:     ['Mark Every', 'Milestone'],
  //   sub:          'Diamond eternity rings for every anniversary.',
  //   cta:          'Explore Eternity Rings',
  //   fallback:     '/creatives/slide-diamonds.svg',
  // },
  // {
  //   categorySlug: 'engagement-rings',
  //   image:        '',   // ← paste your bespoke/lifestyle banner URL here
  //   href:         '/bespoke',
  //   eyebrow:      'Bespoke Design',
  //   headline:     ['Your Vision,', 'Our Craft'],
  //   sub:          'One-of-a-kind pieces. Designed entirely around you.',
  //   cta:          'Start Bespoke Design',
  //   fallback:     '/creatives/slide-bespoke.svg',
  // },
];

const INTERVAL = 6000;

function pickProductImage(products: IProduct[]): string {
  const best =
    products.find(p => p.lifestyleImageUrl) ||
    products.find(p => p.isBestseller && p.images?.length > 0) ||
    products.find(p => p.images?.length > 0);
  if (!best) return '';
  if (best.lifestyleImageUrl) return best.lifestyleImageUrl;
  const defaultMetal = best.metalOptions?.find(m => m.isDefault);
  if (defaultMetal?.images?.[0]) return defaultMetal.images[0];
  return best.images?.[0] || '';
}

export default function HeroBanner() {
  const [mounted, setMounted]         = useState(false);
  const [current, setCurrent]         = useState(0);
  const [prev, setPrev]               = useState<number | null>(null);
  const [animating, setAnimating]     = useState(false);
  const [paused, setPaused]           = useState(false);
  const [progressKey, setProgressKey] = useState(0);
  const total = SLIDE_CONFIG.length;

  // Prevent hydration mismatch — slider is 100% client-side
  useEffect(() => { setMounted(true); }, []);

  // Fetch all categories (each has an image field)
  const { data: catData } = useQuery({
    queryKey: ['all-categories'],
    queryFn:  () => categoriesApi.getAll(),
    staleTime: 600000,
  });

  // Fetch all featured products — filter client-side by category slug
  const { data: prodData } = useQuery({
    queryKey: ['featured-products'],
    queryFn:  () => productsApi.getFeatured(),
    staleTime: 300000,
  });

  const categories: ICategory[]  = catData?.data  || [];
  const featuredProducts: IProduct[] = prodData?.data || [];

  function getSlideImage(slide: typeof SLIDE_CONFIG[0]): string {
    // 1. Manual override — image field set directly in SLIDE_CONFIG
    if (slide.image) return slide.image;
    // 2. Category's own image (set via Admin → Categories)
    const cat = categories.find(c => c.slug === slide.categorySlug);
    if (cat?.image) return cat.image;
    // 3. Best featured product in that category
    const matching = featuredProducts.filter(
      p => (p.category as ICategory)?.slug === slide.categorySlug
    );
    return pickProductImage(matching) || slide.fallback;
  }

  const slideImages = SLIDE_CONFIG.map(s => getSlideImage(s));

  const goTo = useCallback((idx: number) => {
    if (animating || idx === current) return;
    setPrev(current);
    setAnimating(true);
    setCurrent(idx);
    setProgressKey(k => k + 1);
    setTimeout(() => { setPrev(null); setAnimating(false); }, 1000);
  }, [current, animating]);

  const advance = useCallback(() => goTo((current + 1) % total), [current, goTo, total]);
  const retreat = useCallback(() => goTo((current - 1 + total) % total), [current, goTo, total]);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(advance, INTERVAL);
    return () => clearInterval(t);
  }, [advance, paused]);

  // ── Server / first-paint guard ──────────────────────────────────────────
  // The slider is 100% client-side (state, query data, event handlers).
  // Returning a simple static block on the server prevents the hydration
  // mismatch caused by the server HTML differing from the first client render.
  if (!mounted) {
    return (
      <section
        className="relative w-full bg-black"
        style={{ height: '100svh', minHeight: '560px' }}
      >
        <div
          className="absolute inset-0 bg-center bg-cover"
          style={{ backgroundImage: `url('${SLIDE_CONFIG[0].fallback}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-black/60" />
      </section>
    );
  }
  // ────────────────────────────────────────────────────────────────────────

  return (
    <section
      className="relative w-full overflow-hidden bg-black select-none"
      style={{ height: '100svh', minHeight: '560px' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {SLIDE_CONFIG.map((slide, i) => {
        const isActive   = i === current;
        const isPrev     = i === prev;
        const image      = slideImages[i];
        const isFallback = !image || image === slide.fallback;

        return (
          <div
            key={`${slide.categorySlug}-${i}`}
            aria-hidden={!isActive}
            className="absolute inset-0"
            style={{
              zIndex:        isActive ? 2 : isPrev ? 1 : 0,
              opacity:       isActive ? 1 : isPrev ? 1 : 0,
              transition:    (isActive || isPrev) ? 'opacity 1s ease-in-out' : 'none',
              pointerEvents: isActive ? 'auto' : 'none',
            }}
          >
            {/* SVG creative — instant base layer */}
            <div className="absolute inset-0 bg-center bg-cover"
              style={{ backgroundImage: `url('${slide.fallback}')` }} />

            {/* Real product / category photo on top */}
            {!isFallback && (
              <div
                className="absolute inset-0 bg-center bg-cover will-change-transform"
                style={{
                  backgroundImage: `url('${image}')`,
                  transform:  isActive ? 'scale(1.06)' : 'scale(1)',
                  transition: isActive
                    ? `transform ${INTERVAL + 1200}ms ease-out`
                    : 'transform 1s ease',
                }}
              />
            )}

            {/* Gradient overlays */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-black/60" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-transparent" />

            {/* Frame lines */}
            <div className="absolute top-12 left-1/2 -translate-x-1/2 w-px h-8 border-l border-white/25"
              style={{ opacity: isActive ? 1 : 0, transition: 'opacity 0.6s ease 0.8s' }} />
            <div className="absolute bottom-28 left-1/2 -translate-x-1/2 w-16 border-t border-white/25"
              style={{ opacity: isActive ? 1 : 0, transition: 'opacity 0.6s ease 0.8s' }} />

            {/* Wordmark */}
            <div className="absolute top-8 left-1/2 -translate-x-1/2 z-10"
              style={{ opacity: isActive ? 1 : 0, transition: 'opacity 0.5s ease 0.4s' }}>
              <p className="font-sans text-[9px] tracking-[0.55em] uppercase text-white/40">
                Sterling Jewellers
              </p>
            </div>

            {/* Centre text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center md:justify-center text-center px-6 pb-16 md:pb-0">

              <p className="font-sans text-[9px] tracking-[0.5em] uppercase text-white/55 mb-6"
                style={{
                  opacity:    isActive ? 1 : 0,
                  transform:  isActive ? 'translateY(0)' : 'translateY(12px)',
                  transition: 'opacity 0.7s ease 0.35s, transform 0.7s ease 0.35s',
                }}>
                {slide.eyebrow}
              </p>

              <div style={{
                opacity:    isActive ? 1 : 0,
                transform:  isActive ? 'translateY(0)' : 'translateY(18px)',
                transition: 'opacity 0.75s ease 0.5s, transform 0.75s ease 0.5s',
              }}>
                {slide.headline.map((line, li) => (
                  <h1 key={li}
                    className="font-serif font-light text-white leading-[1.05] block"
                    style={{ fontSize: 'clamp(3rem, 8vw, 6.5rem)' }}>
                    {line}
                  </h1>
                ))}
              </div>

              <p className="font-sans text-sm text-white/55 mt-6 mb-10 tracking-wide max-w-sm leading-relaxed"
                style={{
                  opacity:    isActive ? 1 : 0,
                  transform:  isActive ? 'translateY(0)' : 'translateY(12px)',
                  transition: 'opacity 0.7s ease 0.65s, transform 0.7s ease 0.65s',
                }}>
                {slide.sub}
              </p>

              <Link href={slide.href}
                className="group inline-flex items-center gap-3 font-sans text-[11px] tracking-[0.35em] uppercase text-white relative"
                style={{
                  opacity:    isActive ? 1 : 0,
                  transform:  isActive ? 'translateY(0)' : 'translateY(10px)',
                  transition: 'opacity 0.7s ease 0.8s, transform 0.7s ease 0.8s',
                }}>
                {slide.cta}
                <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                <span className="absolute -bottom-1 left-0 w-0 group-hover:w-full h-px bg-white transition-all duration-400" />
              </Link>
            </div>
          </div>
        );
      })}

      {/* Arrows */}
      <button onClick={retreat} aria-label="Previous"
        className="absolute left-6 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center text-white/30 hover:text-white/90 transition-colors duration-300">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <button onClick={advance} aria-label="Next"
        className="absolute right-6 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center text-white/30 hover:text-white/90 transition-colors duration-300">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      {/* Slide counter */}
      <div className="absolute top-8 right-8 z-10 flex items-center gap-2 text-white/35 font-sans text-[10px] tracking-widest">
        <span className="text-white/70">{String(current + 1).padStart(2, '0')}</span>
        <span>/</span>
        <span>{String(total).padStart(2, '0')}</span>
      </div>

      {/* Dot nav */}
      <div className="absolute bottom-9 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2">
        {SLIDE_CONFIG.map((_, i) => (
          <button key={i} onClick={() => goTo(i)} aria-label={`Slide ${i + 1}`}
            className="transition-all duration-500 ease-out"
            style={{
              height: '1.5px', width: i === current ? '36px' : '12px',
              background: i === current ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.28)',
              border: 'none', padding: 0, cursor: 'pointer', borderRadius: 0,
            }} />
        ))}
      </div>

      {/* Progress bar */}
      {!paused && (
        <div className="absolute bottom-0 left-0 right-0 z-10 h-px bg-white/10">
          <div key={progressKey} className="h-full bg-white/40"
            style={{ animation: `sjProgress ${INTERVAL}ms linear forwards` }} />
        </div>
      )}

      <style>{`
        @keyframes sjProgress { from { width: 0 } to { width: 100% } }
      `}</style>
    </section>
  );
}
