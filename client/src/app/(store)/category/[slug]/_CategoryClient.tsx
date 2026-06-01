'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { categoriesApi, productsApi } from '@/lib/api';
import { IProduct } from '@/types';
import { formatPrice } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, SlidersHorizontal, ChevronDown, ChevronUp, X, Star, ArrowUpDown } from 'lucide-react';
import { RING_BUILDER_ENABLED } from '@/lib/features';
import { useWishlistStore } from '@/store/wishlistStore';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import Breadcrumb from '@/components/layout/Breadcrumb';

// ── Filter config ─────────────────────────────────────────────────────────────
const METAL_OPTIONS = ['Platinum', 'White Gold', 'Yellow Gold', 'Rose Gold'];
const STYLE_OPTIONS = ['Solitaire', 'Halo', 'Three Stone', 'Pavé', 'Vintage', 'Cluster', 'Channel'];
const PRICE_RANGES  = [
  { label: 'Under £1,000',      min: 0,     max: 999    },
  { label: '£1,000 – £2,000',   min: 1000,  max: 1999   },
  { label: '£2,000 – £5,000',   min: 2000,  max: 4999   },
  { label: '£5,000 – £10,000',  min: 5000,  max: 9999   },
  { label: 'Over £10,000',      min: 10000, max: 999999 },
];
const SORT_OPTIONS = [
  { value: 'featured',   label: 'Featured'            },
  { value: 'price-asc',  label: 'Price: Low – High'   },
  { value: 'price-desc', label: 'Price: High – Low'   },
  { value: 'newest',     label: 'Newest'               },
  { value: 'rating',     label: 'Best Rated'           },
];

// ── Metal swatch colours ──────────────────────────────────────────────────────
const METAL_COLORS: Record<string, string> = {
  platinum:     '#C5CBD4',
  'white-gold': '#D8D8D0',
  'yellow-gold': '#D4A843',
  'rose-gold':  '#D4866A',
  silver:       '#B8B8B8',
};

// ── Collapsible filter group ──────────────────────────────────────────────────
function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-b border-gray-100 py-4">
      <button onClick={() => setOpen(o => !o)} className="flex items-center justify-between w-full text-left">
        <span className="text-[11px] font-sans font-semibold tracking-[0.12em] uppercase text-charcoal">{title}</span>
        {open ? <ChevronUp size={13} className="text-gray-400" /> : <ChevronDown size={13} className="text-gray-400" />}
      </button>
      {open && <div className="mt-3 space-y-2.5">{children}</div>}
    </div>
  );
}

// ── Ring product card — Blue Nile / Abelini style ─────────────────────────────
function RingCard({ product }: { product: IProduct }) {
  const { toggleItem, isWishlisted } = useWishlistStore();
  const [hovered, setHovered] = useState(false);
  const wishlisted = isWishlisted(product._id);
  const price = product.salePrice ?? product.basePrice;
  const isSettable = RING_BUILDER_ENABLED && product.isRingBuilder === true;
  const href = isSettable ? `/custom-ring/settings/${product.slug}` : `/products/${product.slug}`;

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    toggleItem(product);
    toast(wishlisted ? 'Removed from wishlist' : 'Saved', { icon: wishlisted ? '💔' : '❤️' });
  };

  return (
    <Link href={href} className="group block">
      {/* Image */}
      <div
        className="relative aspect-square bg-[#f9f8f6] overflow-hidden"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {product.images?.[0] ? (
          <Image
            src={hovered && product.images[1] ? product.images[1] : product.images[0]}
            alt={product.name}
            fill
            className="object-contain p-5 transition-all duration-500 group-hover:scale-[1.04]"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center opacity-20">
            <svg viewBox="0 0 80 80" className="w-20 h-20">
              <circle cx="40" cy="40" r="28" fill="none" stroke="#888" strokeWidth="7" />
            </svg>
          </div>
        )}

        {/* Status badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 pointer-events-none">
          {product.isNewArrival && (
            <span className="bg-charcoal text-white text-[9px] font-sans tracking-widest uppercase px-1.5 py-0.5">New</span>
          )}
          {product.isBestseller && (
            <span className="text-white text-[9px] font-sans tracking-widest uppercase px-1.5 py-0.5" style={{ background: '#8B6914' }}>Bestseller</span>
          )}
          {product.salePrice && (
            <span className="bg-rose-600 text-white text-[9px] font-sans tracking-widest uppercase px-1.5 py-0.5">Sale</span>
          )}
        </div>

        {/* Wishlist heart */}
        <button
          onClick={handleWishlist}
          aria-label="Save to wishlist"
          className={cn(
            'absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/90 flex items-center justify-center shadow-sm',
            'opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-white',
            wishlisted && 'opacity-100 text-rose-500'
          )}
        >
          <Heart size={13} fill={wishlisted ? 'currentColor' : 'none'} />
        </button>

        {/* Build CTA slide-in */}
        {isSettable && (
          <div className="absolute inset-x-0 bottom-0 bg-charcoal/95 text-white text-[11px] font-sans text-center py-2.5
            translate-y-full group-hover:translate-y-0 transition-transform duration-200">
            Build Your Ring →
          </div>
        )}
      </div>

      {/* Card text */}
      <div className="pt-3">
        {/* Metal swatches */}
        {(product.metalOptions?.length ?? 0) > 0 && (
          <div className="flex items-center gap-1.5 mb-2">
            {product.metalOptions.map(m => (
              <span key={m.type}
                title={m.type.replace(/-/g, ' ')}
                className="w-3.5 h-3.5 rounded-full border border-gray-200 inline-block flex-shrink-0"
                style={{ background: METAL_COLORS[m.type] ?? '#ccc' }}
              />
            ))}
            <span className="text-[10px] font-sans text-gray-400 ml-0.5">
              {product.metalOptions.length === 1 ? product.metalOptions[0].type.replace(/-/g, ' ') : `${product.metalOptions.length} metals`}
            </span>
          </div>
        )}

        {/* Name */}
        <h3 className="text-[13px] font-sans text-[#1a1a1a] leading-snug mb-1.5 line-clamp-2 group-hover:text-[#5a3e1b] transition-colors">
          {product.name}
        </h3>

        {/* Stars */}
        {product.reviewCount > 0 && (
          <div className="flex items-center gap-0.5 mb-1.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={9}
                className={i < Math.round(product.averageRating)
                  ? 'text-[#B8860B] fill-[#B8860B]' : 'text-gray-200 fill-gray-200'}
              />
            ))}
            <span className="text-[10px] font-sans text-gray-400 ml-1">({product.reviewCount})</span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-2">
          <span className="text-[13px] font-sans font-semibold text-[#1a1a1a]">
            {isSettable ? 'Setting from ' : ''}{formatPrice(price)}
          </span>
          {product.salePrice && (
            <span className="text-[11px] font-sans text-gray-400 line-through">{formatPrice(product.basePrice)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function CategoryClient({ slug }: { slug: string }) {
  const [metals,       setMetals]       = useState<string[]>([]);
  const [styles,       setStyles]       = useState<string[]>([]);
  const [priceIdx,     setPriceIdx]     = useState<number | null>(null);
  const [sort,         setSort]         = useState('featured');
  const [drawerOpen,   setDrawerOpen]   = useState(false);

  // Fetch the category — catch 404s so the query still resolves
  const { data: catData, isSuccess: catResolved } = useQuery({
    queryKey: ['category', slug],
    queryFn:  () => categoriesApi.getBySlug(slug).catch(() => null),
    retry:    false,
  });

  const categoryId = catData?.data?._id as string | undefined;

  // Run the product query once the category lookup is done.
  // If a real category was found  → filter by its MongoDB _id.
  // If no category matched (e.g. "jewellery", "rings" meta-slugs) → return ALL active products.
  const { data: prodData, isLoading } = useQuery({
    queryKey: ['cat-products', slug, categoryId ?? 'all'],
    queryFn:  () => productsApi.getAll({
      ...(categoryId ? { category: categoryId } : {}),
      limit: 200,
    }),
    enabled: catResolved,   // run as soon as category lookup finishes (found or not)
    staleTime: 5 * 60_000,
  });

  const category = catData?.data;
  const all: IProduct[] = prodData?.data?.products ?? [];

  const filtered = useMemo(() => {
    let list = [...all];
    if (metals.length)   list = list.filter(p => p.metalOptions?.some(m => metals.some(s => m.type.includes(s.toLowerCase().replace(' ', '-')))));
    if (styles.length)   list = list.filter(p => styles.some(s => [p.style, p.settingType].join(' ').toLowerCase().includes(s.toLowerCase())));
    if (priceIdx !== null) {
      const r = PRICE_RANGES[priceIdx];
      list = list.filter(p => { const v = p.salePrice ?? p.basePrice; return v >= r.min && v <= r.max; });
    }
    list.sort((a, b) => {
      const pa = a.salePrice ?? a.basePrice, pb = b.salePrice ?? b.basePrice;
      if (sort === 'price-asc')  return pa - pb;
      if (sort === 'price-desc') return pb - pa;
      if (sort === 'newest')     return (b.isNewArrival ? 1 : 0) - (a.isNewArrival ? 1 : 0);
      if (sort === 'rating')     return (b.averageRating ?? 0) - (a.averageRating ?? 0);
      return ((b.isFeatured ? 2 : 0) + (b.isBestseller ? 1 : 0)) - ((a.isFeatured ? 2 : 0) + (a.isBestseller ? 1 : 0));
    });
    return list;
  }, [all, metals, styles, priceIdx, sort]);

  const activeCount = metals.length + styles.length + (priceIdx !== null ? 1 : 0);
  const clearAll = () => { setMetals([]); setStyles([]); setPriceIdx(null); };
  const toggleMetal = (m: string) => setMetals(p => p.includes(m) ? p.filter(x => x !== m) : [...p, m]);
  const toggleStyle = (s: string) => setStyles(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]);

  const SidebarContent = () => (
    <>
      {activeCount > 0 && (
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-sans text-gray-400">{activeCount} active</span>
          <button onClick={clearAll} className="text-[11px] font-sans underline underline-offset-2 text-charcoal">Clear all</button>
        </div>
      )}

      <FilterSection title="Metal">
        {METAL_OPTIONS.map(m => (
          <label key={m} className="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" checked={metals.includes(m)} onChange={() => toggleMetal(m)} className="accent-charcoal" />
            <span className="w-3.5 h-3.5 rounded-full border border-gray-200 inline-block flex-shrink-0"
              style={{ background: METAL_COLORS[m.toLowerCase().replace(' ', '-')] ?? '#ccc' }} />
            <span className={cn('text-[12px] font-sans', metals.includes(m) ? 'text-charcoal font-semibold' : 'text-gray-600')}>{m}</span>
          </label>
        ))}
      </FilterSection>

      <FilterSection title="Style">
        {STYLE_OPTIONS.map(s => (
          <label key={s} className="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" checked={styles.includes(s)} onChange={() => toggleStyle(s)} className="accent-charcoal" />
            <span className={cn('text-[12px] font-sans', styles.includes(s) ? 'text-charcoal font-semibold' : 'text-gray-600')}>{s}</span>
          </label>
        ))}
      </FilterSection>

      <FilterSection title="Price">
        {PRICE_RANGES.map((r, i) => (
          <label key={i} className="flex items-center gap-2.5 cursor-pointer">
            <input type="radio" name="price-range" checked={priceIdx === i}
              onChange={() => setPriceIdx(priceIdx === i ? null : i)} className="accent-charcoal" />
            <span className={cn('text-[12px] font-sans', priceIdx === i ? 'text-charcoal font-semibold' : 'text-gray-600')}>{r.label}</span>
          </label>
        ))}
      </FilterSection>
    </>
  );

  const categoryName = category?.name ?? slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="bg-white min-h-screen">

      {/* ── Breadcrumb ── */}
      <Breadcrumb items={[{ label: categoryName }]} />

      {/* ── Category hero ── */}
      <div className="bg-[#111] text-white">
        <div className="max-w-[1400px] mx-auto px-6 py-12 text-center">
          <p className="text-[10px] font-sans tracking-[0.28em] uppercase text-gray-500 mb-2">Sterling Jewellers</p>
          <h1 className="font-serif text-3xl md:text-4xl font-light capitalize">
            {category?.name ?? slug.replace(/-/g, ' ')}
          </h1>
          <p className="text-[13px] font-sans text-gray-400 mt-2 max-w-md mx-auto">
            {category?.description ?? 'Browse our full collection of fine jewellery — handcrafted in gold and silver with free UK delivery.'}
          </p>
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-[#B8860B]/50 to-transparent" />
      </div>

      {/* ── Toolbar ── */}
      <div className="border-b border-gray-100 sticky top-[64px] z-30 bg-white/95 backdrop-blur-sm">
        <div className="max-w-[1400px] mx-auto px-6 h-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile filter toggle */}
            <button onClick={() => setDrawerOpen(true)}
              className="lg:hidden flex items-center gap-1.5 text-[12px] font-sans text-charcoal border border-gray-200 px-3 py-1 hover:border-charcoal transition-colors">
              <SlidersHorizontal size={12} />
              Filter {activeCount > 0 && <span className="bg-charcoal text-white text-[8px] rounded-full w-4 h-4 flex items-center justify-center">{activeCount}</span>}
            </button>

            {/* Active chips */}
            <div className="hidden sm:flex items-center gap-1.5">
              {metals.map(m => (
                <button key={m} onClick={() => toggleMetal(m)}
                  className="flex items-center gap-1 bg-charcoal text-white text-[10px] font-sans px-2 py-0.5">
                  {m} <X size={9} />
                </button>
              ))}
              {styles.map(s => (
                <button key={s} onClick={() => toggleStyle(s)}
                  className="flex items-center gap-1 bg-charcoal text-white text-[10px] font-sans px-2 py-0.5">
                  {s} <X size={9} />
                </button>
              ))}
              {priceIdx !== null && (
                <button onClick={() => setPriceIdx(null)}
                  className="flex items-center gap-1 bg-charcoal text-white text-[10px] font-sans px-2 py-0.5">
                  {PRICE_RANGES[priceIdx].label} <X size={9} />
                </button>
              )}
            </div>
            <span className="text-[11px] font-sans text-gray-400">
              {isLoading ? '' : `${filtered.length} result${filtered.length !== 1 ? 's' : ''}`}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[12px] font-sans text-gray-600">
            <ArrowUpDown size={12} className="text-gray-400" />
            <select value={sort} onChange={e => setSort(e.target.value)}
              className="bg-transparent border-none outline-none cursor-pointer text-[12px] font-sans">
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* ── Main layout ── */}
      <div className="max-w-[1400px] mx-auto px-6 py-8 flex gap-8 items-start">

        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-52 flex-shrink-0 sticky top-[120px]">
          <SidebarContent />
        </aside>

        {/* Mobile drawer */}
        {drawerOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
            <div className="absolute left-0 top-0 bottom-0 w-72 bg-white overflow-y-auto p-5 shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <span className="font-serif text-lg">Filters</span>
                <button onClick={() => setDrawerOpen(false)}><X size={18} /></button>
              </div>
              <SidebarContent />
            </div>
          </div>
        )}

        {/* Product grid */}
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-square bg-gray-100 mb-3" />
                  <div className="h-3 bg-gray-100 rounded mb-2 w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <svg viewBox="0 0 80 80" className="w-14 h-14 mb-4 opacity-15">
                <circle cx="40" cy="40" r="28" fill="none" stroke="#888" strokeWidth="7" />
              </svg>
              {activeCount > 0 ? (
                <>
                  <p className="font-serif text-xl text-charcoal">No results match your selection</p>
                  <button onClick={clearAll} className="mt-4 text-[13px] font-sans underline text-charcoal">Clear filters</button>
                </>
              ) : (
                <>
                  <p className="font-serif text-xl text-charcoal">Coming Soon</p>
                  <p className="mt-2 text-[13px] font-sans text-gray-400">This collection is coming soon. Explore our other collections in the meantime.</p>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
              {filtered.map(product => <RingCard key={product._id} product={product} />)}
            </div>
          )}
        </div>
      </div>

      {/* ── SEO content block — rendered below grid, above trust bar ── */}
      <CategorySeoContent slug={slug} categoryName={categoryName} />

      {/* ── Trust bar ── */}
      <div className="border-t border-gray-100 bg-[#fafaf9] mt-12">
        <div className="max-w-[1400px] mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { icon: '💎', h: 'GIA & IGI Certified',  p: 'Every diamond graded' },
            { icon: '🔧', h: 'Handcrafted in UK',    p: 'Master craftsmen'     },
            { icon: '🔄', h: '30-Day Returns',       p: 'No questions asked'   },
            { icon: '🛡️', h: 'Lifetime Warranty',    p: 'Free servicing'       },
          ].map(({ icon, h, p }) => (
            <div key={h} className="flex flex-col items-center gap-2">
              <span className="text-xl">{icon}</span>
              <p className="text-[11px] font-sans font-semibold text-charcoal">{h}</p>
              <p className="text-[10px] font-sans text-gray-400">{p}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Per-category SEO content blocks (placed below product grid) ─────────────
// Each block is ~500 words of buyer-intent evergreen copy. Helps rank head terms.

const categoryContent: Record<string, { heading: string; body: string[]; faqs: { q: string; a: string }[] }> = {
  'engagement-rings': {
    heading: 'How to Choose the Perfect Engagement Ring',
    body: [
      'An engagement ring is one of the most significant purchases you will ever make — a symbol worn every day for a lifetime. At Sterling Jewellers, every engagement ring in our collection is handcrafted in the UK using ethically sourced diamonds and certified precious metals, giving you a piece that is as meaningful as the moment it marks.',
      'The most popular styles in our collection include the timeless solitaire, where a single diamond takes centre stage; the romantic halo setting, where a ring of smaller diamonds amplifies the centre stone; and the modern three-stone ring, representing past, present and future. We also offer pavé bands, vintage-inspired designs with intricate milgrain detail, and sleek contemporary east-west settings.',
      'When choosing a metal, platinum remains the gold standard for engagement rings. It is naturally white, hypoallergenic, and exceptionally durable — it does not wear away like white gold, which requires periodic rhodium plating. For a warmer look, 18ct yellow gold and 18ct rose gold are perennial favourites, especially paired with round brilliant or oval-cut diamonds.',
      'Every diamond in our engagement ring collection is certified by the GIA (Gemological Institute of America) or IGI (International Gemological Institute), the two most respected grading laboratories in the world. Your certificate confirms the exact carat weight, colour, clarity and cut of your stone — giving you complete confidence in your purchase.',
      'Not sure of the right size? Use our free ring sizing guide or request a complimentary ring sizer by post. Our gemmologists are also available for a free consultation — in-store at our London boutique or by video call.',
    ],
    faqs: [
      { q: 'What is the average price of an engagement ring in the UK?', a: 'The average spend on an engagement ring in the UK is between £1,500 and £3,000, though many couples invest £3,000–£8,000 for a GIA-certified diamond ring. At Sterling Jewellers, our collection ranges from under £1,000 to bespoke commissions over £20,000.' },
      { q: 'What engagement ring style is most popular?', a: 'The round brilliant solitaire is the most popular engagement ring style in the UK, prized for its timeless simplicity and exceptional sparkle. Oval halo rings have seen rapid growth in recent years, driven by their elongating effect on the finger and vintage-inspired romance.' },
      { q: 'Can I customise an engagement ring?', a: 'Yes. Use our Ring Builder to choose your setting and diamond online, or speak to our team for a fully bespoke commission. We can work from a sketch, a reference image, or an heirloom stone you wish to re-set.' },
    ],
  },
  'wedding-rings': {
    heading: 'Wedding Rings: A Buyer\'s Guide',
    body: [
      'A wedding ring is worn every day for the rest of your life — which means the choice of metal, width and finish matters more than most people realise. At Sterling Jewellers, our wedding ring collection spans platinum, 18ct gold, and 9ct gold in a range of widths from 2mm court bands to bold 6mm flat court styles.',
      'Platinum wedding rings are the most durable choice. The metal develops a natural patina over time that many couples love, and it can be polished back to a mirror finish at any point. Unlike white gold, platinum does not fade or require replating.',
      'Yellow gold and rose gold wedding rings offer warmth and character. Our 18ct gold bands are 75% pure gold, making them richer in colour and more precious than 9ct. For everyday wear, 9ct gold offers excellent scratch resistance at a lower price point.',
      'For couples buying both an engagement ring and wedding ring together, we recommend choosing metals that complement each other — or opting for a perfectly flush fitted wedding ring designed specifically to nest alongside your engagement ring.',
      'All our wedding rings are hallmarked at the London Assay Office, confirming their metal purity, and come with free engraving of up to 30 characters. Standard ring sizing is available for two years after purchase at no charge.',
    ],
    faqs: [
      { q: 'Should a wedding ring match the engagement ring?', a: 'Traditionally yes, but modern couples often mix metals intentionally. White gold or platinum engagement rings are frequently paired with yellow gold wedding bands for an on-trend mixed-metal look. The key is that both rings sit comfortably together on the finger.' },
      { q: 'What width wedding ring should I choose?', a: 'A 2–3mm band suits slender fingers and a delicate look. A 4–5mm band is the most versatile and the bestselling width at Sterling Jewellers. Wider bands of 6mm+ make a bolder statement and suit those with broader fingers.' },
      { q: 'How long does it take to make a bespoke wedding ring?', a: 'Standard rings from our collection are available within 5–7 working days. Bespoke commissions, custom engravings and made-to-order pieces typically take 3–4 weeks. We recommend allowing 6 weeks before your wedding date.' },
    ],
  },
  'eternity-rings': {
    heading: 'Eternity Rings: Styles, Occasions & How to Choose',
    body: [
      'An eternity ring is one of the most versatile and emotionally resonant pieces of fine jewellery. Traditionally given to mark the birth of a child or a significant anniversary, eternity rings are increasingly worn as a statement piece in their own right.',
      'At Sterling Jewellers, our eternity ring collection is available in two main styles: the full eternity ring, where diamonds encircle the band completely, and the half eternity ring, where stones run along the top half of the band. Full eternity rings create uninterrupted sparkle but require a specific ring size; half eternity rings are easier to resize and more comfortable for everyday wear.',
      'The most popular cuts for eternity rings are round brilliant diamonds, known for their classic sparkle, and princess cuts, which allow more stones to sit closer together. Baguette diamonds offer an Art Deco elegance. Our eternity rings are available in platinum, 18ct white gold, yellow gold and rose gold.',
      'When pairing an eternity ring with an engagement ring and wedding band, a popular arrangement is to wear the wedding band and eternity ring on either side of the engagement ring as a bridal set.',
    ],
    faqs: [
      { q: 'When should you give an eternity ring?', a: 'Traditionally given on a milestone anniversary (first, fifth or tenth) or to celebrate the birth of a child. Today, many couples also give eternity rings as an upgrade to the original engagement ring after a few years of marriage.' },
      { q: 'Can eternity rings be resized?', a: 'Half eternity rings can be resized in most cases. Full eternity rings — where stones run all the way around — cannot be resized, so it is essential to measure your ring size carefully. We offer a free ring sizer by post.' },
    ],
  },
  'diamond-rings': {
    heading: 'Diamond Rings: Understanding the 4 Cs',
    body: [
      'Buying a diamond ring is a significant investment, and understanding the 4 Cs — Cut, Colour, Clarity and Carat — will help you get the best diamond for your budget.',
      'Cut is the most important factor. A well-cut diamond reflects light beautifully and appears larger and more brilliant than a poorly cut stone of the same carat weight. Our diamonds are graded Excellent or Very Good cut by the GIA.',
      'Colour is graded on a scale from D (completely colourless) to Z (noticeable yellow tint). For engagement rings, we recommend stones in the D–H range for a bright, white appearance. I–J stones offer excellent value and appear white to the naked eye when mounted in white metal.',
      'Clarity refers to the presence of inclusions (internal) or blemishes (surface). Grades range from Flawless to Included. For the best balance of beauty and value, VS1–VS2 (Very Slightly Included) stones are ideal — any inclusions are invisible to the naked eye.',
      'Carat is a measure of weight (1 carat = 0.2 grams), not size. Two diamonds of the same carat weight can appear very different depending on cut quality. A well-cut 0.90ct round brilliant will often appear larger than a poorly cut 1.00ct stone.',
    ],
    faqs: [
      { q: 'What is the difference between GIA and IGI certified diamonds?', a: 'The GIA (Gemological Institute of America) is widely considered the most stringent grading laboratory. IGI (International Gemological Institute) is equally trusted and is the primary certifier for lab-grown diamonds. Both provide reliable and detailed grading reports.' },
      { q: 'Are lab-grown diamonds real diamonds?', a: 'Yes. Lab-grown diamonds are chemically, physically and optically identical to mined diamonds. They are graded by the same criteria (4 Cs) and certified by the same laboratories. They typically cost 50–70% less than equivalent natural diamonds.' },
    ],
  },
};

// Generic fallback for categories without a specific content block
const genericContent = (name: string) => ({
  heading: `${name}: Handcrafted Fine Jewellery`,
  body: [
    `Our ${name.toLowerCase()} collection is handcrafted in the UK using ethically sourced materials and certified precious metals. Every piece is quality-checked by our master craftsmen before dispatch.`,
    `Browse our full range of ${name.toLowerCase()} available in platinum, 18ct gold and 9ct gold. All orders include free UK delivery, a 30-day returns guarantee, and our lifetime craftsmanship warranty.`,
  ],
  faqs: [] as { q: string; a: string }[],
});

function CategorySeoContent({ slug, categoryName }: { slug: string; categoryName: string }) {
  const content = categoryContent[slug] ?? genericContent(categoryName);

  const faqSchema = content.faqs.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: content.faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  } : null;

  return (
    <div className="bg-white border-t border-gray-100 mt-16">
      {faqSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      )}
      <div className="page-container py-16 max-w-4xl mx-auto">
        <h2 className="font-serif text-2xl font-light text-charcoal mb-6">{content.heading}</h2>
        <div className="w-12 h-px bg-navy mb-8" />

        <div className="space-y-4 mb-10">
          {content.body.map((para, i) => (
            <p key={i} className="text-sm font-sans text-gray-600 leading-relaxed">{para}</p>
          ))}
        </div>

        {content.faqs.length > 0 && (
          <>
            <h3 className="font-serif text-xl font-light text-charcoal mb-5">Frequently Asked Questions</h3>
            <div className="space-y-4">
              {content.faqs.map((faq, i) => (
                <details key={i} className="group border border-gray-100">
                  <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none">
                    <span className="font-sans text-sm font-medium text-charcoal">{faq.q}</span>
                    <span className="text-gray-400 group-open:rotate-45 transition-transform text-lg leading-none ml-4 flex-shrink-0">+</span>
                  </summary>
                  <div className="px-5 pb-5 border-t border-gray-100">
                    <p className="text-sm font-sans text-gray-600 leading-relaxed pt-4">{faq.a}</p>
                  </div>
                </details>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
