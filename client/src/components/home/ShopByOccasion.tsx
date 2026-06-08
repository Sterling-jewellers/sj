'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { categoriesApi, productsApi } from '@/lib/api';
import { ICategory, IProduct } from '@/types';

const OCCASIONS = [
  {
    id:           'engagement',
    label:        'Engagement Rings',
    caption:      'The ring she will wear forever',
    href:         '/category/engagement-rings',
    categorySlug: 'engagement-rings',
    layout:       'hero'  as const,
  },
  {
    id:           'wedding',
    label:        'Wedding Rings',
    caption:      'Symbols of your commitment',
    href:         '/category/wedding-rings',
    categorySlug: 'wedding-rings',
    layout:       'small' as const,
  },
  {
    id:           'eternity',
    label:        'Eternity Rings',
    caption:      'Mark every milestone',
    href:         '/category/eternity-rings',
    categorySlug: 'eternity-rings',
    layout:       'small' as const,
  },
  {
    id:           'jewellery',
    label:        'Fine Jewellery',
    caption:      'Necklaces, earrings and bracelets for every occasion',
    href:         '/category/jewellery',
    categorySlug: 'jewellery',
    layout:       'wide'  as const,
  },
];

type Layout = 'hero' | 'small' | 'wide';

function headingSize(layout: Layout) {
  if (layout === 'hero')  return '1.75rem';
  if (layout === 'wide')  return '1.45rem';
  return '1.2rem';
}

/** Pick best image from a product list */
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

function OccasionTile({
  item,
  image,
  eager = false,
}: {
  item: typeof OCCASIONS[0];
  image: string;
  eager?: boolean;
}) {
  return (
    <Link
      href={item.href}
      className="group relative block w-full h-full overflow-hidden bg-[#042241]"
    >
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt={item.label}
          loading={eager ? 'eager' : 'lazy'}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          style={{ opacity: 0.9 }}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#042241] to-[#0a3560] animate-pulse" />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/25 via-transparent to-transparent" />

      {/* Frosted badge */}
      <div className="absolute top-5 left-5">
        <span
          className="text-white text-[9px] font-sans tracking-[0.32em] uppercase px-3 py-1.5"
          style={{
            background:     'rgba(255,255,255,0.08)',
            backdropFilter: 'blur(6px)',
            border:         '1px solid rgba(255,255,255,0.18)',
          }}
        >
          {item.label}
        </span>
      </div>

      {/* Bottom text */}
      <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-2 group-hover:translate-y-0 transition-transform duration-500 ease-out">
        <h3 className="font-serif text-white font-light leading-tight mb-1.5"
          style={{ fontSize: headingSize(item.layout) }}>
          {item.label}
        </h3>
        <p className="font-sans text-white/55 text-xs tracking-wide leading-relaxed mb-4 max-w-xs">
          {item.caption}
        </p>
        <span className="inline-flex items-center gap-2 text-[10px] font-sans tracking-[0.3em] uppercase text-white/75 group-hover:text-white transition-colors duration-300 relative">
          Shop Now
          <span className="group-hover:translate-x-1 transition-transform duration-300 inline-block">→</span>
          <span className="absolute -bottom-0.5 left-0 w-0 group-hover:w-full h-px bg-white/60 transition-all duration-400" />
        </span>
      </div>
    </Link>
  );
}

export default function ShopByOccasion() {
  // 1. Fetch all categories — each has its own image field
  const { data: catData } = useQuery({
    queryKey: ['all-categories'],
    queryFn:  () => categoriesApi.getAll(),
    staleTime: 600000,
  });

  // 2. Fetch all featured products — filter client-side by category slug
  const { data: prodData } = useQuery({
    queryKey: ['featured-products'],
    queryFn:  () => productsApi.getFeatured(),
    staleTime: 300000,
  });

  const categories: ICategory[] = catData?.data || [];
  const featuredProducts: IProduct[] = prodData?.data || [];

  /** Get best image for an occasion — category image first, else featured product image */
  function getImage(slug: string): string {
    // Try category image first
    const cat = categories.find(c => c.slug === slug);
    if (cat?.image) return cat.image;

    // Fallback: find a featured product whose category matches
    const matching = featuredProducts.filter(
      p => (p.category as ICategory)?.slug === slug
    );
    return pickProductImage(matching);
  }

  const images = OCCASIONS.map(o => getImage(o.categorySlug));
  const [engagement, wedding, eternity, jewellery] = OCCASIONS;

  return (
    <section className="py-20 bg-ivory">
      <div className="page-container">

        <div className="text-center mb-12">
          <p className="section-subtitle mb-3">Explore by Occasion</p>
          <h2 className="section-title">Shop By Occasion</h2>
          <div className="gold-divider mt-4" />
        </div>

        {/* Mobile */}
        <div className="md:hidden grid grid-cols-2 gap-3">
          <div className="col-span-2" style={{ height: '300px' }}>
            <OccasionTile item={engagement} image={images[0]} eager />
          </div>
          <div style={{ height: '220px' }}>
            <OccasionTile item={wedding} image={images[1]} />
          </div>
          <div style={{ height: '220px' }}>
            <OccasionTile item={eternity} image={images[2]} />
          </div>
          <div className="col-span-2" style={{ height: '200px' }}>
            <OccasionTile item={jewellery} image={images[3]} />
          </div>
        </div>

        {/* Desktop editorial grid */}
        <div
          className="hidden md:grid gap-3"
          style={{
            gridTemplateColumns: '1fr 1fr 1fr',
            gridTemplateRows:    '420px 260px',
          }}
        >
          <div style={{ gridColumn: '1', gridRow: '1 / 3', height: '100%' }}>
            <OccasionTile item={engagement} image={images[0]} eager />
          </div>
          <div style={{ gridColumn: '2', gridRow: '1', height: '100%' }}>
            <OccasionTile item={wedding} image={images[1]} />
          </div>
          <div style={{ gridColumn: '3', gridRow: '1', height: '100%' }}>
            <OccasionTile item={eternity} image={images[2]} />
          </div>
          <div style={{ gridColumn: '2 / 4', gridRow: '2', height: '100%' }}>
            <OccasionTile item={jewellery} image={images[3]} />
          </div>
        </div>

      </div>
    </section>
  );
}
