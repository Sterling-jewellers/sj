'use client';

import { useState, useMemo, lazy, Suspense, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import {
  Star, Truck, RefreshCw, Shield, ChevronLeft, ChevronRight,
  Award, TrendingDown, Heart, ShoppingBag, ChevronDown, Box, Gem,
} from 'lucide-react';
import { productsApi, reviewsApi, goldPriceApi } from '@/lib/api';
import { IProduct, IReview, IDiamond } from '@/types';
import { formatPrice, formatDate } from '@/lib/utils';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import ProductCard from '@/components/product/ProductCard';
import DiamondPicker from '@/components/product/DiamondPicker';
import SocialProof from '@/components/personalization/SocialProof';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { trackEvent, incrementVisitCount } from '@/lib/personalization';

// Lazy-load heavy 3D viewer so it never blocks page render
const Ring3DViewer = lazy(() => import('@/components/ring-builder/Ring3DViewer'));

// ─── JSON-LD ──────────────────────────────────────────────────────────────────
function ProductJsonLd({ product, price }: { product: IProduct; price: number }) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://sterlingjewellers.co.uk';
  const productUrl = `${siteUrl}/products/${product.slug}`;
  const categoryUrl = product.category?.slug ? `${siteUrl}/category/${product.category.slug}` : undefined;

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name:        product.name,
    description: product.metaDescription || product.shortDescription,
    image:       product.images,
    url:         productUrl,
    brand:       { '@type': 'Brand', name: 'Sterling Jewellers' },
    ...(product.gemstone   && { material: product.gemstone }),
    ...(product.style      && { style:    product.style }),
    offers: {
      '@type':          'Offer',
      price:            price.toFixed(2),
      priceCurrency:    'GBP',
      availability:     'https://schema.org/InStock',
      url:              productUrl,
      seller:           { '@type': 'Organization', name: 'Sterling Jewellers' },
      shippingDetails:  { '@type': 'OfferShippingDetails', shippingRate: { '@type': 'MonetaryAmount', value: '0', currency: 'GBP' }, deliveryTime: { '@type': 'ShippingDeliveryTime', businessDays: { '@type': 'QuantitativeValue', minValue: 2, maxValue: product.deliveryDays || 7 } } },
      hasMerchantReturnPolicy: { '@type': 'MerchantReturnPolicy', returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow', merchantReturnDays: 30 },
    },
    ...(product.reviewCount > 0 && {
      aggregateRating: { '@type': 'AggregateRating', ratingValue: product.averageRating, reviewCount: product.reviewCount, bestRating: 5, worstRating: 1 },
    }),
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type':    'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home',           item: siteUrl },
      ...(categoryUrl ? [{ '@type': 'ListItem', position: 2, name: product.category?.name, item: categoryUrl }] : []),
      { '@type': 'ListItem', position: categoryUrl ? 3 : 2, name: product.name, item: productUrl },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
    </>
  );
}

// ─── Metal swatch colours ─────────────────────────────────────────────────────
const METAL_COLOURS: Record<string, string> = {
  'yellow-gold': '#D4A843',
  'white-gold': '#D0D0D0',
  'rose-gold': '#E8A090',
  platinum: '#A8A8BC',
  silver: '#C0C0C0',
};

const METAL_LABELS: Record<string, string> = {
  'yellow-gold': 'Yellow Gold', 'white-gold': 'White Gold',
  'rose-gold': 'Rose Gold', platinum: 'Platinum', silver: 'Silver',
};

/**
 * CSS filter applied to the product image when no metal-specific photo has
 * been uploaded yet.  These approximate the look of each metal type so the
 * customer gets instant visual feedback on every ring/product page — with
 * zero API calls.  Once the admin generates or uploads per-metal images via
 * the AI tool in the admin panel the real photos take over.
 */
const METAL_FILTERS: Record<string, string> = {
  'yellow-gold': 'none',                                                      // base – original image is typically yellow gold
  'white-gold':  'grayscale(0.78) brightness(1.18) contrast(1.06)',           // cool bright silver-white
  'rose-gold':   'sepia(0.28) saturate(1.55) hue-rotate(-12deg) brightness(1.04)', // warm blush-pink
  platinum:      'grayscale(0.92) brightness(1.22) contrast(1.10)',           // cool light grey
  silver:        'grayscale(0.72) brightness(1.12) saturate(0.35)',           // neutral grey
};

// ─── Setting / Band / Shank icons (CSS shapes) ────────────────────────────────
const SETTING_ICONS: Record<string, React.ReactNode> = {
  'four-claw':   <div className="w-10 h-10 border-2 border-current rounded-full flex items-center justify-center"><div className="w-4 h-4 bg-current rounded-full opacity-60" /></div>,
  'six-claw':    <div className="w-10 h-10 border-2 border-current rounded-full flex items-center justify-center"><div className="w-4 h-4 bg-current rounded-full opacity-80" /></div>,
  bezel:         <div className="w-10 h-10 border-4 border-current rounded-full" />,
  pave:          <div className="w-10 h-10 border-2 border-current rounded-full flex items-center justify-center gap-0.5"><div className="w-2 h-2 bg-current rounded-full" /><div className="w-2 h-2 bg-current rounded-full" /></div>,
  halo:          <div className="w-10 h-10 border-2 border-current rounded-full flex items-center justify-center"><div className="w-6 h-6 border-2 border-current rounded-full" /></div>,
  'hidden-halo': <div className="w-10 h-10 border-2 border-current rounded-full flex items-center justify-center"><div className="w-5 h-5 border border-current rounded-full opacity-50" /></div>,
  plain:         <div className="w-10 h-10 border-2 border-current rounded-full" />,
};

const BAND_ICONS: Record<string, React.ReactNode> = {
  plain:       <div className="w-14 h-4 border-2 border-current rounded-full" />,
  pave:        <div className="w-14 h-4 border-2 border-current rounded-full flex items-center justify-center gap-1">{[0,1,2].map(i=><div key={i} className="w-1.5 h-1.5 bg-current rounded-full opacity-70"/>)}</div>,
  'half-pave': <div className="w-14 h-4 border-2 border-current rounded-full flex items-center justify-start pl-1 gap-1">{[0,1].map(i=><div key={i} className="w-1.5 h-1.5 bg-current rounded-full opacity-70"/>)}</div>,
  channel:     <div className="w-14 h-4 border-2 border-current rounded-full relative"><div className="absolute inset-y-0.5 inset-x-2 border border-current rounded-full opacity-50" /></div>,
  twisted:     <div className="w-14 h-4 border-2 border-current rounded-full" style={{background:'repeating-linear-gradient(45deg,transparent,transparent 3px,currentColor 3px,currentColor 4px)'}} />,
};

const SHANK_ICONS: Record<string, React.ReactNode> = {
  slim:     <div className="w-1.5 h-14 border border-current rounded-full" />,
  standard: <div className="w-2.5 h-14 border-2 border-current rounded-full" />,
  large:    <div className="w-4 h-14 border-2 border-current rounded-full" />,
};

const SHANK_LABELS: Record<string, string> = { slim: 'Slim', standard: 'Standard', large: 'Large' };
const BAND_LABELS: Record<string, string> = { plain: 'Plain', pave: 'Pavé', 'half-pave': 'Half Pavé', channel: 'Channel', twisted: 'Twisted' };
const SETTING_LABELS: Record<string, string> = { 'four-claw': 'Four Claw', 'six-claw': 'Six Claw', bezel: 'Bezel', pave: 'Pavé', halo: 'Halo', 'hidden-halo': 'Hidden Halo', plain: 'Plain' };

// ─── Metal purity multipliers ─────────────────────────────────────────────────
// The live gold price API returns a 24K (pure) price per gram.
// We multiply by this factor to get the alloy price for each karat.
const KARAT_PURITY: Record<string, number> = {
  '9ct': 9 / 24,   // 0.375 — 37.5% pure gold
  '14ct': 14 / 24, // 0.583 — 58.3% pure gold
  '18ct': 18 / 24, // 0.750 — 75.0% pure gold (most common for fine jewellery)
  '22ct': 22 / 24, // 0.917 — 91.7% pure gold
  '24ct': 1.0,     // 100%  — pure gold (rarely used for rings)
  platinum: 1.05,  // platinum priced ~5% above gold per gram
  silver: 0.018,   // silver ~1/55 of gold price
};

// ─── Price modifiers per style choice (£ added to ring mount) ─────────────────
// These reflect the extra labour / material cost for non-standard options.
const SETTING_MODS: Record<string, number> = {
  'four-claw': 0, 'six-claw': 45, bezel: 75, pave: 140, halo: 195, 'hidden-halo': 165, plain: 0,
};
const BAND_MODS: Record<string, number> = {
  plain: 0, pave: 110, 'half-pave': 65, channel: 80, twisted: 75,
};
const SHANK_MODS: Record<string, number> = { slim: -35, standard: 0, large: 55 };

// ─── Diamond shape icons for ring builder preview ────────────────────────────
const PREVIEW_SHAPES = [
  { id: 'round',    label: 'Round' },
  { id: 'oval',     label: 'Oval' },
  { id: 'princess', label: 'Princess' },
  { id: 'cushion',  label: 'Cushion' },
  { id: 'emerald',  label: 'Emerald' },
  { id: 'pear',     label: 'Pear' },
  { id: 'radiant',  label: 'Radiant' },
  { id: 'heart',    label: 'Heart' },
];

function DiamondShapeIcon({ shape, active, size = 24 }: { shape: string; active: boolean; size?: number }) {
  const c  = active ? '#1a1a1a' : '#9ca3af';
  const sw = 1.1;
  const s  = shape.toLowerCase();
  const ol = { fill: 'none', stroke: c, strokeWidth: sw,        strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };
  const tb = { fill: 'none', stroke: c, strokeWidth: sw * 0.55, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };
  const sk = { stroke: c, strokeWidth: sw * 0.35, opacity: 0.5, strokeLinecap: 'round' as const };
  const P  = (deg: number, r: number, cx = 24, cy = 24): [number, number] => [
    cx + r * Math.cos((deg - 90) * Math.PI / 180),
    cy + r * Math.sin((deg - 90) * Math.PI / 180),
  ];

  if (s === 'round') {
    const G = Array.from({length:8}, (_,i) => P(i*45,20));
    const T = Array.from({length:8}, (_,i) => P(i*45+22.5,11));
    return <svg viewBox="0 0 48 48" width={size} height={size}>
      <circle cx="24" cy="24" r="20" {...ol} />
      <polygon points={T.map(p=>p.join(',')).join(' ')} {...tb} />
      {G.map(([gx,gy],i) => <line key={i} x1={gx} y1={gy} x2={T[i][0]} y2={T[i][1]} {...sk} />)}
    </svg>;
  }
  if (s === 'oval') {
    const G = Array.from({length:8}, (_,i) => { const a=(i*45-90)*Math.PI/180; return [24+14*Math.cos(a),24+20*Math.sin(a)] as [number,number]; });
    const T = Array.from({length:8}, (_,i) => { const a=((i*45+22.5)-90)*Math.PI/180; return [24+7.5*Math.cos(a),24+11*Math.sin(a)] as [number,number]; });
    return <svg viewBox="0 0 48 48" width={size} height={size}>
      <ellipse cx="24" cy="24" rx="14" ry="20" {...ol} />
      <polygon points={T.map(p=>p.join(',')).join(' ')} {...tb} />
      {G.map(([gx,gy],i) => <line key={i} x1={gx} y1={gy} x2={T[i][0]} y2={T[i][1]} {...sk} />)}
    </svg>;
  }
  if (s === 'princess') {
    const G: [number,number][] = [[4,4],[44,4],[44,44],[4,44]];
    const M: [number,number][] = [[24,4],[44,24],[24,44],[4,24]];
    const Tc: [number,number][] = [[13,13],[35,13],[35,35],[13,35]];
    const Tm: [number,number][] = [[24,13],[35,24],[24,35],[13,24]];
    return <svg viewBox="0 0 48 48" width={size} height={size}>
      <rect x="4" y="4" width="40" height="40" {...ol} />
      <rect x="13" y="13" width="22" height="22" {...tb} />
      {G.map(([x,y],i)=><line key={`c${i}`} x1={x} y1={y} x2={Tc[i][0]} y2={Tc[i][1]} {...sk} />)}
      {M.map(([x,y],i)=><line key={`m${i}`} x1={x} y1={y} x2={Tm[i][0]} y2={Tm[i][1]} {...sk} />)}
    </svg>;
  }
  if (s === 'cushion') {
    const G: [number,number][] = [[4,4],[44,4],[44,44],[4,44]];
    const M: [number,number][] = [[24,4],[44,24],[24,44],[4,24]];
    const Tc: [number,number][] = [[13,13],[35,13],[35,35],[13,35]];
    const Tm: [number,number][] = [[24,13],[35,24],[24,35],[13,24]];
    return <svg viewBox="0 0 48 48" width={size} height={size}>
      <rect x="4" y="4" width="40" height="40" rx="9" {...ol} />
      <rect x="13" y="13" width="22" height="22" rx="4" {...tb} />
      {G.map(([x,y],i)=><line key={`c${i}`} x1={x} y1={y} x2={Tc[i][0]} y2={Tc[i][1]} {...sk} />)}
      {M.map(([x,y],i)=><line key={`m${i}`} x1={x} y1={y} x2={Tm[i][0]} y2={Tm[i][1]} {...sk} />)}
    </svg>;
  }
  if (s === 'emerald') {
    const o: [number,number][] = [[16,4],[32,4],[39,11],[39,37],[32,44],[16,44],[9,37],[9,11]];
    const m: [number,number][] = [[17,9],[31,9],[36,14],[36,34],[31,39],[17,39],[12,34],[12,14]];
    const inn: [number,number][] = [[18,15],[30,15],[33,18],[33,30],[30,33],[18,33],[15,30],[15,18]];
    return <svg viewBox="0 0 48 48" width={size} height={size}>
      <polygon points={o.map(p=>p.join(',')).join(' ')} {...ol} />
      <polygon points={m.map(p=>p.join(',')).join(' ')} {...tb} />
      <polygon points={inn.map(p=>p.join(',')).join(' ')} fill="none" stroke={c} strokeWidth={sw*0.38} opacity={0.65} />
    </svg>;
  }
  if (s === 'radiant') {
    const o: [number,number][] = [[13,4],[35,4],[44,13],[44,35],[35,44],[13,44],[4,35],[4,13]];
    const t: [number,number][] = [[16,11],[32,11],[37,16],[37,32],[32,37],[16,37],[11,32],[11,16]];
    return <svg viewBox="0 0 48 48" width={size} height={size}>
      <polygon points={o.map(p=>p.join(',')).join(' ')} {...ol} />
      <polygon points={t.map(p=>p.join(',')).join(' ')} {...tb} />
      {o.map(([ox,oy],i)=><line key={i} x1={ox} y1={oy} x2={t[i][0]} y2={t[i][1]} {...sk} />)}
    </svg>;
  }
  if (s === 'pear') {
    return <svg viewBox="0 0 48 48" width={size} height={size}>
      <path d="M24,44 C10,38 4,28 4,21 C4,12 13,4 24,4 C35,4 44,12 44,21 C44,28 38,38 24,44Z" {...ol} />
      <path d="M24,38 C13,33 10,25 10,21 C10,14 16,9 24,9 C32,9 38,14 38,21 C38,25 35,33 24,38Z" {...tb} />
      <line x1="24" y1="4"  x2="24" y2="9"  {...sk} />
      <line x1="44" y1="21" x2="38" y2="21" {...sk} />
      <line x1="4"  y1="21" x2="10" y2="21" {...sk} />
      <line x1="24" y1="44" x2="24" y2="38" {...sk} />
      <line x1="9"  y1="9"  x2="15" y2="14" {...sk} />
      <line x1="39" y1="9"  x2="33" y2="14" {...sk} />
    </svg>;
  }
  if (s === 'heart') {
    return <svg viewBox="0 0 48 48" width={size} height={size}>
      <path d="M24,42 C5,30 2,19 2,15 C2,8 8,4 14,4 C18,4 22,6 24,10 C26,6 30,4 34,4 C40,4 46,8 46,15 C46,19 43,30 24,42Z" {...ol} />
      <path d="M24,35 C9,25 7,18 7,15 C7,11 10,8 14,8 C17,8 21,10 24,14 C27,10 31,8 34,8 C38,8 41,11 41,15 C41,18 39,25 24,35Z" {...tb} />
      <line x1="24" y1="42" x2="24" y2="35" {...sk} />
      <line x1="2"  y1="15" x2="7"  y2="15" {...sk} />
      <line x1="46" y1="15" x2="41" y2="15" {...sk} />
      <line x1="4"  y1="7"  x2="9"  y2="11" {...sk} />
      <line x1="44" y1="7"  x2="39" y2="11" {...sk} />
    </svg>;
  }
  return <svg viewBox="0 0 48 48" width={size} height={size}>
    <circle cx="24" cy="24" r="20" {...ol} />
  </svg>;
}

// ─── Live pricing formula ─────────────────────────────────────────────────────
type ProductExt = IProduct & { weightBySize?: { size: string; weightGrams: number }[]; bandStyle?: string; shankWidth?: string; competitorPrice?: number };

function computePrice(
  product: ProductExt,
  goldPerGram: number | null,
  size: string,
  diamond: IDiamond | null,
  metalMod: number,
  settingStyle: string,
  bandStyle: string,
  shankWidth: string,
  karat?: string,
  metalType?: string,
) {
  const entry = product.weightBySize?.find(w => w.size === size) ?? product.weightBySize?.[Math.floor((product.weightBySize?.length ?? 0) / 2)];
  const grams = entry?.weightGrams ?? null;

  // Style modifiers — added on top of the ring mount
  const styleMod =
    (SETTING_MODS[settingStyle || product.settingType || ''] ?? 0) +
    (BAND_MODS[bandStyle || product.bandStyle || ''] ?? 0) +
    (SHANK_MODS[shankWidth || product.shankWidth || ''] ?? 0);

  // Purity factor — derive from karat or metal type
  // e.g. 18ct gold ring uses 75% of the 24K spot price per gram
  const purityKey = metalType === 'platinum' ? 'platinum'
                  : metalType === 'silver'   ? 'silver'
                  : (karat || '18ct');
  const purityFactor = KARAT_PURITY[purityKey] ?? KARAT_PURITY['18ct'];

  let ringMount: number;
  let isLive = false;
  if (goldPerGram && grams) {
    // goldPerGram here is the 24K price; purityFactor converts to the alloy price
    ringMount = +(goldPerGram * purityFactor * grams * 2 + styleMod + metalMod).toFixed(2);
    isLive = true;
  } else {
    ringMount = (product.salePrice ?? product.basePrice) + metalMod + styleMod;
  }
  const diamondPrice = diamond ? +(diamond.price * 2.5).toFixed(2) : 0;
  const total = diamond ? +((ringMount + diamondPrice * 1.5)).toFixed(2) : ringMount;
  return { ringMount, diamondPrice, total, isLive, styleMod };
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ProductDetailClient({ slug }: { slug: string }) {
  const { data, isLoading } = useQuery({ queryKey: ['product', slug], queryFn: () => productsApi.getBySlug(slug) });
  const product = data?.data as ProductExt | undefined;

  const { data: reviewsData } = useQuery({ queryKey: ['reviews', product?._id], queryFn: () => reviewsApi.getByProduct(product!._id), enabled: !!product?._id });
  const { data: relatedData } = useQuery({ queryKey: ['related', product?._id], queryFn: () => productsApi.getRelated(product!._id), enabled: !!product?._id });

  const { data: goldData } = useQuery({
    queryKey: ['gold-price'], queryFn: () => goldPriceApi.getPrice(),
    staleTime: 5 * 60 * 1000, refetchInterval: 5 * 60 * 1000,
  });
  // goldPerGram = 24K spot price per gram; purity factor applied in computePrice
  const goldPerGram: number | null = (goldData?.data as { pricePerGram?: number } | undefined)?.pricePerGram ?? null;

  const reviews: IReview[] = reviewsData?.data || [];
  const related: IProduct[] = relatedData?.data || [];

  const [activeImage, setActiveImage] = useState(0);
  const [previewShape, setPreviewShape] = useState('round');
  const [shapeDropOpen, setShapeDropOpen] = useState(false);
  const shapeDropRef = useRef<HTMLDivElement>(null);
  const [selectedMetalKey, setSelectedMetalKey] = useState(''); // "type__karat"
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedBand, setSelectedBand] = useState('');

  // ── Behaviour tracking ───────────────────────────────────────────────────
  useEffect(() => {
    incrementVisitCount();
  }, []);

  useEffect(() => {
    if (!product) return;
    trackEvent({
      type: 'view_product',
      productId: product._id,
      productSlug: product.slug,
      category: (product.category as { slug?: string })?.slug,
      style: product.style,
      metal: product.metalOptions?.[0]?.type,
      price: product.basePrice,
    });
  }, [product?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (shapeDropRef.current && !shapeDropRef.current.contains(e.target as Node)) {
        setShapeDropOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  const [selectedShank, setSelectedShank] = useState('');
  const [selectedSetting, setSelectedSetting] = useState('');
  const [engraving, setEngraving] = useState('');
  const [engravingOpen, setEngravingOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'description' | 'details' | 'reviews' | '3d'>('description');
  const [selectedDiamond, setSelectedDiamond] = useState<IDiamond | null>(null);

  const { addItem } = useCartStore();
  const { toggleItem, isWishlisted } = useWishlistStore();

  const activeMetal = useMemo(() => {
    if (!product) return undefined;
    if (selectedMetalKey) {
      const [type, karat] = selectedMetalKey.split('__');
      return product.metalOptions.find(m => m.type === type && (m.karat === karat || (!m.karat && !karat)));
    }
    return product.metalOptions.find(m => m.isDefault) ?? product.metalOptions[0];
  }, [product, selectedMetalKey]);

  // If the selected metal has its own photos use them; otherwise fall back to
  // the base product images and apply a CSS filter to simulate the metal colour.
  const hasMetalImages = (activeMetal?.images?.length ?? 0) > 0;
  const displayImages = hasMetalImages ? (activeMetal!.images) : (product?.images || []);
  // Apply CSS filter only when showing base images for a non-default metal
  const metalFilter = !hasMetalImages && activeMetal
    ? (METAL_FILTERS[activeMetal.type] ?? 'none')
    : 'none';

  const pricing = useMemo(() => {
    if (!product) return null;
    return computePrice(
      product, goldPerGram, selectedSize, selectedDiamond,
      activeMetal?.priceModifier || 0,
      selectedSetting, selectedBand, selectedShank,
      activeMetal?.karat,   // e.g. '18ct'
      activeMetal?.type,    // e.g. 'platinum' | 'yellow-gold'
    );
  }, [product, goldPerGram, selectedSize, selectedDiamond, activeMetal, selectedSetting, selectedBand, selectedShank]);

  if (isLoading) return <ProductSkeleton />;
  if (!product || !pricing) return <div className="py-20 text-center text-gray-500">Product not found.</div>;

  const finalPrice = pricing.total;
  const competitorPrice = product.competitorPrice;
  const saving = competitorPrice ? competitorPrice - finalPrice : null;
  const isDiamond = product.isRingBuilder === true;

  const metalKey = (m: { type: string; karat?: string }) => `${m.type}__${m.karat || ''}`;

  const handleAddToCart = () => {
    if (!selectedSize && product.variants.length > 0) { toast.error('Please select a ring size'); return; }
    addItem(product, { selectedMetal: activeMetal?.type, selectedSize, engraving, diamond: selectedDiamond || undefined });
    toast.success(selectedDiamond ? 'Ring + diamond added to bag!' : 'Added to bag!');
  };

  return (
    <div className="bg-white min-h-screen">
      <ProductJsonLd product={product} price={finalPrice} />

      {/* Breadcrumb */}
      <div className="page-container py-3 border-b border-gray-100">
        <nav className="flex items-center gap-2 text-xs font-sans text-gray-400">
          <Link href="/" className="hover:text-gold-600">Home</Link><span>/</span>
          <Link href="/products" className="hover:text-gold-600">Jewellery</Link><span>/</span>
          <Link href={`/category/${(product.category as unknown as { slug?: string })?.slug}`} className="hover:text-gold-600">{(product.category as unknown as { name?: string })?.name}</Link><span>/</span>
          <span className="text-charcoal line-clamp-1">{product.name}</span>
        </nav>
      </div>

      <div className="page-container py-8">
        {isDiamond ? (

          /* ══════════════ RING BUILDER — Blue Nile layout ══════════════ */
          <div className="grid lg:grid-cols-[1fr_460px] gap-10">

            {/* LEFT: large main image + 4-up thumbnail strip */}
            <div>
              {/* Main image with overlays */}
              <div className="relative aspect-square bg-gray-50 overflow-hidden mb-2">
                {activeImage === -1 ? (
                  <Suspense fallback={<div className="w-full h-full flex items-center justify-center text-gray-400 text-sm font-sans">Loading 3D…</div>}>
                    <Ring3DViewer
                      modelUrl={product.model3dUrl}
                      metal={activeMetal?.type || 'yellow-gold'}
                      diamondShape={previewShape}
                      className="w-full h-full"
                    />
                  </Suspense>
                ) : (
                  <Image
                    src={displayImages[Math.max(0, activeImage)] || displayImages[0] || ''}
                    alt={product.name}
                    fill priority
                    className="object-cover"
                    style={{ filter: metalFilter, transition: 'filter 0.4s ease' }}
                  />
                )}

                {/* "Shown in 1 ct." — bottom-left */}
                {activeImage !== -1 && (
                  <div className="absolute bottom-3 left-3 bg-white/92 backdrop-blur-sm border border-gray-100 px-3 py-1.5 text-[11px] font-sans text-charcoal shadow-sm">
                    Shown in 1 ct.
                  </div>
                )}

                {/* Diamond shape dropdown pill — bottom-right */}
                <div className="absolute bottom-3 right-3 z-10" ref={shapeDropRef}>
                  <button
                    onClick={() => setShapeDropOpen(v => !v)}
                    className="flex items-center gap-1.5 bg-white/92 backdrop-blur-sm border border-gray-200 px-3 py-1.5 text-[11px] font-sans text-charcoal hover:bg-white transition-colors shadow-sm"
                  >
                    <span className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                      <DiamondShapeIcon shape={previewShape} active />
                    </span>
                    <span className="font-medium">{PREVIEW_SHAPES.find(s => s.id === previewShape)?.label ?? 'Round'}</span>
                    <ChevronDown size={11} className={cn('transition-transform ml-0.5', shapeDropOpen && 'rotate-180')} />
                  </button>
                  {shapeDropOpen && (
                    <div className="absolute bottom-full right-0 mb-1 bg-white border border-gray-200 shadow-xl py-1 w-36 z-20">
                      {PREVIEW_SHAPES.map(s => (
                        <button
                          key={s.id}
                          onClick={() => { setPreviewShape(s.id); setActiveImage(-1); setShapeDropOpen(false); }}
                          className={cn(
                            'w-full flex items-center gap-2.5 px-3 py-2 text-[11px] font-sans hover:bg-gray-50 transition-colors',
                            previewShape === s.id ? 'text-charcoal font-semibold' : 'text-gray-600',
                          )}
                        >
                          <span className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                            <DiamondShapeIcon shape={s.id} active={previewShape === s.id} />
                          </span>
                          {s.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Prev/next arrows */}
                {displayImages.length > 1 && activeImage !== -1 && (
                  <>
                    <button onClick={() => setActiveImage(p => (p - 1 + displayImages.length) % displayImages.length)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 flex items-center justify-center shadow hover:bg-white">
                      <ChevronLeft size={16} />
                    </button>
                    <button onClick={() => setActiveImage(p => (p + 1) % displayImages.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 flex items-center justify-center shadow hover:bg-white">
                      <ChevronRight size={16} />
                    </button>
                  </>
                )}

                {product.isNewArrival && activeImage !== -1 && (
                  <span className="absolute top-3 left-3 bg-charcoal text-white text-[9px] px-2 py-1 font-sans tracking-widest uppercase">New</span>
                )}
              </div>

              {/* Thumbnail strip: 3D tile + up to 3 photos */}
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={() => setActiveImage(-1)}
                  title="View 3D ring preview"
                  className={cn(
                    'relative aspect-square border-2 overflow-hidden flex items-center justify-center bg-gray-50 transition-all',
                    activeImage === -1 ? 'border-charcoal' : 'border-gray-100 hover:border-gray-300',
                  )}
                >
                  {product.model3dPreview
                    ? <Image src={product.model3dPreview} alt="3D" fill className="object-cover" />
                    : <Box size={20} className="text-gray-400" />}
                  <span className="absolute bottom-0.5 left-0 right-0 text-center text-[8px] font-sans font-semibold text-charcoal bg-white/80">3D</span>
                </button>
                {displayImages.slice(0, 3).map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={cn(
                      'relative aspect-square border-2 overflow-hidden transition-all',
                      activeImage === i ? 'border-charcoal' : 'border-gray-100 hover:border-gray-300',
                    )}
                  >
                    <Image src={img} alt="" fill className="object-cover"
                      style={{ filter: metalFilter, transition: 'filter 0.4s ease' }} />
                  </button>
                ))}
              </div>
            </div>

            {/* RIGHT: Blue Nile-style compact panel */}
            <div className="lg:pl-2">
              <p className="text-[10px] font-sans tracking-widest uppercase text-gray-400 mb-1">
                {(product.category as unknown as { name?: string })?.name}
              </p>
              <h1 className="font-serif text-2xl lg:text-3xl font-light text-charcoal mb-3 leading-snug">{product.name}</h1>

              {product.reviewCount > 0 && (
                <button onClick={() => setActiveTab('reviews')} className="flex items-center gap-2 mb-4">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={13} className={i < Math.round(product.averageRating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'} />
                    ))}
                  </div>
                  <span className="text-xs text-gray-500 font-sans">{product.averageRating} ({product.reviewCount})</span>
                </button>
              )}

              {/* Price */}
              <div className="border-t border-gray-100 pt-4 mb-5">
                <p className="font-serif text-3xl font-light text-charcoal">{formatPrice(finalPrice)}</p>
                <p className="text-xs font-sans text-gray-400 mt-0.5">Setting Price</p>
                {pricing.isLive && <p className="text-[10px] font-sans text-emerald-600 mt-1">✓ Live gold price</p>}
                {saving && saving > 0 && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <TrendingDown size={13} className="text-green-600" />
                    <span className="text-xs font-sans text-green-700">Save <strong>{formatPrice(saving)}</strong> vs high street</span>
                  </div>
                )}
                {product.certification && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <Award size={13} className="text-gold-500" />
                    <span className="text-xs font-sans text-gold-600">{product.certification} Certified</span>
                  </div>
                )}
                <SocialProof productId={product._id} variants={product.variants} className="mt-2 pt-2 border-t border-gray-100" />
              </div>

              {/* Metal: compact pill circles */}
              {product.metalOptions.length > 0 && (
                <div className="mb-5">
                  <p className="text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-gray-500 mb-2.5">
                    Metal: <span className="normal-case font-normal text-charcoal">
                      {activeMetal?.karat ? `${activeMetal.karat} ` : ''}{METAL_LABELS[activeMetal?.type || ''] || activeMetal?.type}
                    </span>
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {product.metalOptions.map((metal) => {
                      const key = metalKey(metal);
                      const active = selectedMetalKey === key || (!selectedMetalKey && metal.isDefault);
                      return (
                        <button
                          key={key}
                          onClick={() => setSelectedMetalKey(key)}
                          title={`${metal.karat || ''} ${METAL_LABELS[metal.type] || metal.type}`.trim()}
                          className={cn(
                            'flex items-center gap-1.5 px-2.5 py-1.5 border-2 rounded-full text-[10px] font-sans font-medium transition-all',
                            active ? 'border-charcoal text-charcoal' : 'border-gray-200 text-gray-500 hover:border-gray-400',
                          )}
                        >
                          <span className="w-3 h-3 rounded-full flex-shrink-0 border border-gray-200"
                            style={{ background: METAL_COLOURS[metal.type] || '#ccc' }} />
                          {metal.karat || (metal.type === 'platinum' ? 'Plt' : metal.type.split('-')[0])}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Ring size dropdown */}
              {product.variants.length > 0 && (
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-gray-500">Ring Size</p>
                    <Link href="/size-guide" className="text-[10px] font-sans text-gold-600 hover:underline">Size Guide</Link>
                  </div>
                  <div className="relative">
                    <select
                      value={selectedSize}
                      onChange={e => setSelectedSize(e.target.value)}
                      className="w-full border border-gray-200 text-sm font-sans text-charcoal px-3 py-2.5 bg-white focus:outline-none focus:border-charcoal appearance-none cursor-pointer"
                    >
                      <option value="">Select a size</option>
                      {product.variants.map(v => (
                        <option key={v.size} value={v.size} disabled={v.stock === 0}>
                          {v.size}{v.stock === 0 ? ' — Out of stock' : ''}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              )}

              {/* Engraving accordion */}
              {product.isEngravable && (
                <div className="mb-5 border-t border-gray-100 pt-4">
                  <button
                    onClick={() => setEngravingOpen(!engravingOpen)}
                    className="flex items-center justify-between w-full text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-gray-500 hover:text-charcoal transition-colors"
                  >
                    <span>Add Free Engraving</span>
                    <ChevronDown size={13} className={cn('transition-transform', engravingOpen && 'rotate-180')} />
                  </button>
                  {engravingOpen && (
                    <div className="mt-3">
                      <input type="text" maxLength={20} placeholder="Your message (max 20 chars)"
                        value={engraving} onChange={e => setEngraving(e.target.value)}
                        className="w-full border border-gray-200 text-sm font-sans px-3 py-2.5 focus:outline-none focus:border-charcoal" />
                      <p className="text-xs text-gray-400 mt-1">{engraving.length}/20</p>
                    </div>
                  )}
                </div>
              )}

              {/* Delivery line */}
              <div className="flex items-center gap-2 text-xs font-sans text-gray-500 mb-5">
                <Truck size={13} className="text-gold-500 flex-shrink-0" />
                Free UK delivery in {product.deliveryDays} working days
              </div>

              {/* Primary CTA */}
              <Link
                href={`/custom-ring/settings/${product.slug}`}
                className="w-full bg-charcoal hover:bg-gold-600 text-white py-4 font-sans font-medium text-[11px] tracking-[0.2em] uppercase transition-colors flex items-center justify-center gap-2 mb-3"
              >
                <Gem size={14} />
                Select This Setting
                <ChevronRight size={14} />
              </Link>

              {/* Secondary CTAs */}
              <div className="flex gap-2 mb-5">
                <button
                  onClick={handleAddToCart}
                  className="flex-1 border-2 border-gray-300 hover:border-charcoal text-charcoal py-3 font-sans font-medium text-[10px] tracking-[0.15em] uppercase transition-colors flex items-center justify-center gap-1.5"
                >
                  <ShoppingBag size={13} />
                  Buy Setting Only — {formatPrice(finalPrice)}
                </button>
                <button
                  onClick={() => { toggleItem(product); toast(isWishlisted(product._id) ? 'Removed from wishlist' : 'Saved to wishlist', { icon: '❤️' }); }}
                  className={cn('w-12 border-2 flex items-center justify-center transition-colors flex-shrink-0',
                    isWishlisted(product._id) ? 'border-red-300 text-red-400 bg-red-50' : 'border-gray-200 text-gray-500 hover:border-charcoal hover:text-charcoal')}
                >
                  <Heart size={16} fill={isWishlisted(product._id) ? 'currentColor' : 'none'} />
                </button>
              </div>

              {/* Trust badges */}
              <div className="border border-gray-100 divide-y divide-gray-100">
                {[
                  { icon: Truck,     text: `Free delivery in ${product.deliveryDays} days` },
                  { icon: RefreshCw, text: '30-day returns' },
                  { icon: Shield,    text: 'Lifetime craftsmanship guarantee' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-3 px-4 py-3">
                    <Icon size={13} className="text-gold-500 flex-shrink-0" />
                    <span className="text-xs font-sans text-gray-600">{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        ) : (

          /* ══════════════ STANDARD LAYOUT ══════════════ */
          <div className="grid lg:grid-cols-2 gap-12">

            {/* ── LEFT: Image Gallery ── */}
            <div className="flex flex-col gap-4">
            <div className="flex gap-4">
              {/* Thumbnails */}
              <div className="flex flex-col gap-2 w-20 flex-shrink-0">
                {displayImages.map((img, i) => (
                  <button key={i} onClick={() => setActiveImage(i)}
                    className={cn('relative w-20 h-20 border-2 overflow-hidden flex-shrink-0 transition-all',
                      i === activeImage ? 'border-charcoal' : 'border-gray-100 hover:border-gray-300')}>
                    <Image src={img} alt="" fill className="object-cover"
                      style={{ filter: metalFilter, transition: 'filter 0.4s ease' }} />
                  </button>
                ))}
                {product.model3dUrl && (
                  <button onClick={() => setActiveImage(-1)}
                    title="View 3D model"
                    className={cn('relative w-20 h-20 border-2 overflow-hidden flex-shrink-0 transition-all flex items-center justify-center bg-gray-50',
                      activeImage === -1 ? 'border-charcoal' : 'border-gray-100 hover:border-gray-300')}>
                    {product.model3dPreview
                      ? <Image src={product.model3dPreview} alt="3D" fill className="object-cover" />
                      : <Box size={24} className="text-gray-400" />}
                    <span className="absolute bottom-0.5 left-0 right-0 text-center text-[9px] font-sans font-semibold text-charcoal bg-white/80">3D</span>
                  </button>
                )}
              </div>

              {/* Main image / 3D viewer */}
              <div className="relative flex-1 aspect-square bg-gray-50 overflow-hidden">
                {activeImage === -1 && product.model3dUrl ? (
                  <Suspense fallback={<div className="w-full h-full flex items-center justify-center text-gray-400 text-sm font-sans">Loading 3D…</div>}>
                    <Ring3DViewer
                      modelUrl={product.model3dUrl}
                      metal={activeMetal?.type || 'yellow-gold'}
                      className="w-full h-full"
                    />
                  </Suspense>
                ) : (
                  <>
                    <Image
                      src={displayImages[Math.max(0, activeImage)] || displayImages[0] || ''}
                      alt={product.name}
                      fill priority
                      className="object-cover"
                      style={{ filter: metalFilter, transition: 'filter 0.4s ease' }}
                    />
                    {metalFilter !== 'none' && (
                      <div className="absolute top-3 right-3 bg-white/85 backdrop-blur-sm border border-gray-100 rounded px-2 py-1 text-[10px] font-sans text-gray-500">
                        Colour preview
                      </div>
                    )}
                  </>
                )}
                {displayImages.length > 1 && activeImage !== -1 && (
                  <>
                    <button onClick={() => setActiveImage(p => (p - 1 + displayImages.length) % displayImages.length)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 flex items-center justify-center shadow hover:bg-white">
                      <ChevronLeft size={16} />
                    </button>
                    <button onClick={() => setActiveImage(p => (p + 1) % displayImages.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 flex items-center justify-center shadow hover:bg-white">
                      <ChevronRight size={16} />
                    </button>
                  </>
                )}
                {product.isNewArrival && activeImage !== -1 && (
                  <span className="absolute top-3 left-3 bg-charcoal text-white text-[9px] px-2 py-1 font-sans tracking-widest uppercase">New</span>
                )}
              </div>
            </div>
            </div>

            {/* ── RIGHT: Product Info ── */}
            <div>
              <p className="text-xs text-gray-400 font-sans tracking-widest uppercase mb-1">{(product.category as unknown as { name?: string })?.name}</p>
              <h1 className="font-serif text-2xl lg:text-3xl font-light text-charcoal mb-2">{product.name}</h1>

              {product.reviewCount > 0 && (
                <button onClick={() => setActiveTab('reviews')} className="flex items-center gap-2 mb-3">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={13} className={i < Math.round(product.averageRating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'} />)}
                  </div>
                  <span className="text-xs text-gray-500 font-sans">{product.averageRating} ({product.reviewCount} reviews)</span>
                </button>
              )}

              {/* Price */}
              <div className="bg-gray-50 border border-gray-100 p-4 mb-5">
                <div className="flex items-end gap-5 flex-wrap">
                  {competitorPrice && (
                    <div>
                      <p className="text-[10px] font-sans text-gray-400 uppercase tracking-wider mb-0.5">High Street</p>
                      <p className="font-sans text-base text-gray-400 line-through">{formatPrice(competitorPrice)}</p>
                    </div>
                  )}
                  {(product.salePrice && !pricing.isLive) && (
                    <div>
                      <p className="text-[10px] font-sans text-gray-400 uppercase tracking-wider mb-0.5">Was</p>
                      <p className="font-sans text-base text-gray-400 line-through">{formatPrice(product.basePrice + (activeMetal?.priceModifier || 0))}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-[10px] font-sans text-gray-400 uppercase tracking-wider mb-0.5">Our Price</p>
                    <p className="font-serif text-3xl font-light text-charcoal">{formatPrice(finalPrice)}</p>
                  </div>
                </div>
                {saving && saving > 0 && (
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200">
                    <TrendingDown size={14} className="text-green-600" />
                    <span className="text-sm font-sans text-green-700">You save <strong>{formatPrice(saving)}</strong> vs high street</span>
                  </div>
                )}
                {product.certification && (
                  <div className={`flex items-center gap-1.5 ${saving && saving > 0 ? 'mt-2' : 'mt-3 pt-3 border-t border-gray-200'}`}>
                    <Award size={13} className="text-gold-500" />
                    <span className="text-xs font-sans text-gold-600">{product.certification} Certified</span>
                  </div>
                )}
                <SocialProof productId={product._id} variants={product.variants} className="mt-3 pt-3 border-t border-gray-100" />
              </div>

              {/* Metal selector */}
              {product.metalOptions.length > 0 && (
                <div className="mb-5">
                  <p className="text-xs font-sans font-semibold tracking-widest uppercase text-charcoal mb-3">
                    Metal: <span className="normal-case font-normal text-gray-600">
                      {activeMetal?.karat ? `${activeMetal.karat} ` : ''}{METAL_LABELS[activeMetal?.type || ''] || activeMetal?.type}
                    </span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {product.metalOptions.map((metal) => {
                      const key = metalKey(metal);
                      const active = (selectedMetalKey === key) || (!selectedMetalKey && metal.isDefault);
                      return (
                        <button key={key} onClick={() => setSelectedMetalKey(key)}
                          title={`${metal.karat || ''} ${METAL_LABELS[metal.type] || metal.type}`.trim()}
                          className={cn('flex flex-col items-center gap-1.5 p-2 border-2 rounded transition-all min-w-[56px]',
                            active ? 'border-charcoal bg-gray-50' : 'border-gray-100 hover:border-gray-300')}>
                          <div className="w-8 h-8 rounded-full border border-gray-200 shadow-sm"
                            style={{ background: METAL_COLOURS[metal.type] || '#ccc' }} />
                          <span className="text-[10px] font-sans font-medium text-gray-600 leading-tight text-center">
                            {metal.karat || (metal.type === 'platinum' ? 'plt' : metal.type.split('-')[0])}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Ring Size */}
              {product.variants.length > 0 && (
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-sans font-semibold tracking-widest uppercase text-charcoal">Ring Size</p>
                    <Link href="/size-guide" className="text-xs font-sans text-gold-600 hover:underline flex items-center gap-1">Ring Size Guide</Link>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.map((v) => (
                      <button key={v.size} disabled={v.stock === 0} onClick={() => setSelectedSize(v.size)}
                        className={cn('w-11 h-11 text-sm font-sans border-2 transition-all rounded',
                          selectedSize === v.size ? 'border-charcoal bg-charcoal text-white font-medium'
                          : v.stock === 0 ? 'border-gray-100 text-gray-300 cursor-not-allowed line-through'
                          : 'border-gray-200 text-gray-600 hover:border-charcoal')}>
                        {v.size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Engraving */}
              {product.isEngravable && (
                <div className="mb-5">
                  <button onClick={() => setEngravingOpen(!engravingOpen)}
                    className="flex items-center gap-2 text-xs font-sans font-semibold tracking-widest uppercase text-charcoal hover:text-gold-600 transition-colors">
                    Add Engraving (Free) <ChevronDown size={14} className={cn('transition-transform', engravingOpen && 'rotate-180')} />
                  </button>
                  {engravingOpen && (
                    <div className="mt-3">
                      <input type="text" maxLength={20} placeholder="Your message (max 20 chars)"
                        value={engraving} onChange={e => setEngraving(e.target.value)} className="input-field" />
                      <p className="text-xs text-gray-400 mt-1">{engraving.length}/20</p>
                    </div>
                  )}
                </div>
              )}

              {/* CTAs */}
              <div className="flex gap-3 mb-5">
                <button onClick={handleAddToCart} className="flex-1 bg-charcoal hover:bg-gold-600 text-white py-4 font-sans font-medium text-sm tracking-widest uppercase transition-colors flex items-center justify-center gap-2">
                  <ShoppingBag size={16} />
                  {selectedDiamond ? `Buy Now — ${formatPrice(finalPrice)}` : 'Buy Now'}
                </button>
                <button
                  onClick={() => { toggleItem(product); toast(isWishlisted(product._id) ? 'Removed from wishlist' : 'Saved to wishlist', { icon: '❤️' }); }}
                  className={cn('w-14 border-2 flex items-center justify-center transition-colors',
                    isWishlisted(product._id) ? 'border-red-300 text-red-400 bg-red-50' : 'border-gray-200 text-gray-500 hover:border-charcoal hover:text-charcoal')}>
                  <Heart size={18} fill={isWishlisted(product._id) ? 'currentColor' : 'none'} />
                </button>
              </div>

              {/* Trust badges */}
              <div className="border border-gray-100 divide-y divide-gray-100">
                {[
                  { icon: Truck,     text: `Free UK delivery in ${product.deliveryDays} working days` },
                  { icon: RefreshCw, text: '30-day hassle-free returns' },
                  { icon: Shield,    text: 'Lifetime craftsmanship guarantee' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-3 px-4 py-3">
                    <Icon size={14} className="text-gold-500 flex-shrink-0" />
                    <span className="text-xs font-sans text-gray-600">{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        )}

        {/* ── Tabs ── */}
        <div className="mt-16 border-t border-gray-200">
          <div className="flex border-b border-gray-200 overflow-x-auto">
            {([
              { id: 'description', label: 'Description' },
              { id: 'details',     label: 'Details' },
              { id: 'reviews',     label: `Reviews (${reviews.length})` },
              ...(product.model3dUrl ? [{ id: '3d', label: '3D View' }] : []),
            ] as { id: 'description' | 'details' | 'reviews' | '3d'; label: string }[]).map(({ id, label }) => (
              <button key={id} onClick={() => setActiveTab(id)}
                className={cn('flex-shrink-0 flex items-center gap-1.5 px-8 py-4 text-xs font-sans font-medium tracking-widest uppercase transition-colors',
                  activeTab === id ? 'border-b-2 border-gold-500 text-gold-600' : 'text-gray-500 hover:text-charcoal')}>
                {id === '3d' && <Box size={13} />}
                {label}
              </button>
            ))}
          </div>
          <div className="py-10">
            {activeTab === 'description' && (
              <div className="max-w-2xl prose prose-sm font-sans text-gray-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: product.description || product.shortDescription }} />
            )}
            {activeTab === 'details' && (
              <dl className="max-w-lg divide-y divide-gray-100">
                {[
                  { label: 'Style', value: product.style },
                  { label: 'Setting Type', value: product.settingType ? (SETTING_LABELS[product.settingType] || product.settingType) : undefined },
                  { label: 'Band Style', value: product.bandStyle ? (BAND_LABELS[product.bandStyle] || product.bandStyle) : undefined },
                  { label: 'Shank Width', value: product.shankWidth ? (SHANK_LABELS[product.shankWidth] || product.shankWidth) : undefined },
                  { label: 'Gemstone', value: product.gemstone },
                  { label: 'Weight', value: product.weight ? `${product.weight}g` : undefined },
                  { label: 'Engravable', value: product.isEngravable ? 'Yes, free of charge' : 'No' },
                  { label: 'Delivery', value: `${product.deliveryDays} working days` },
                ].filter(d => d.value).map(({ label, value }) => (
                  <div key={label} className="flex py-3">
                    <dt className="w-40 text-xs font-sans font-medium tracking-widest uppercase text-gray-400">{label}</dt>
                    <dd className="text-sm font-sans text-charcoal">{value}</dd>
                  </div>
                ))}
              </dl>
            )}
            {activeTab === 'reviews' && (
              <div className="space-y-6 max-w-2xl">
                {reviews.length === 0 ? <p className="text-sm font-sans text-gray-500">No reviews yet.</p> : reviews.map(r => (
                  <article key={r._id} className="border-b border-gray-100 pb-6">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-sans font-medium text-charcoal">{r.user.firstName} {r.user.lastName}</p>
                        <p className="text-xs text-gray-400">{formatDate(r.createdAt)}</p>
                      </div>
                      <div className="flex gap-0.5">{Array.from({ length: 5 }).map((_, i) => <Star key={i} size={12} className={i < r.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'} />)}</div>
                    </div>
                    <p className="font-sans font-medium text-sm text-charcoal mb-1">{r.title}</p>
                    <p className="text-sm font-sans text-gray-600">{r.body}</p>
                    {r.isVerifiedPurchase && <span className="text-xs text-green-600 mt-1 block">✓ Verified Purchase</span>}
                  </article>
                ))}
              </div>
            )}
            {activeTab === '3d' && product.model3dUrl && (
              <div className="max-w-2xl">
                <div className="bg-gray-50 border border-gray-100 overflow-hidden rounded-sm" style={{ height: 480 }}>
                  <Suspense fallback={<div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">Loading 3D model…</div>}>
                    <Ring3DViewer
                      modelUrl={product.model3dUrl}
                      metal={activeMetal?.type || 'yellow-gold'}
                      className="w-full h-full"
                    />
                  </Suspense>
                </div>
                <p className="mt-4 text-xs text-gray-500 font-sans">
                  Drag to rotate · Scroll to zoom · Metal selector above updates the 3D model in real time.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Styled On ── */}
        {product.lifestyleImageUrl && (
          <section className="mt-8 pt-12 border-t border-gray-200">
            <div className="text-center mb-8">
              <p className="section-subtitle mb-2">Worn in Real Life</p>
              <h2 className="section-title">See How It Looks</h2>
              <div className="gold-divider mt-3" />
            </div>
            <div className="max-w-lg mx-auto relative aspect-[3/4] overflow-hidden">
              <Image
                src={product.lifestyleImageUrl}
                alt={`${product.name} lifestyle photo`}
                fill
                className="object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-charcoal/60 to-transparent p-6">
                <p className="font-serif text-white text-lg font-light">{product.name}</p>
                <p className="text-xs font-sans text-gold-300 tracking-widest uppercase mt-1">AI-styled visualisation</p>
              </div>
            </div>
          </section>
        )}

        {/* ── Related ── */}
        {related.length > 0 && (
          <section className="mt-8 pt-12 border-t border-gray-200">
            <h2 className="section-title mb-2">You May Also Like</h2>
            <div className="gold-divider mt-2 mb-8 mx-0" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {related.map(p => <ProductCard key={p._id} product={p} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function ProductSkeleton() {
  return (
    <div className="py-10 page-container">
      <div className="grid lg:grid-cols-2 gap-12">
        <div className="flex gap-4">
          <div className="flex flex-col gap-2 w-20"><div className="skeleton w-20 h-20" /><div className="skeleton w-20 h-20" /></div>
          <div className="skeleton flex-1 aspect-square" />
        </div>
        <div className="space-y-4">
          <div className="skeleton h-8 w-3/4" /><div className="skeleton h-6 w-1/3" />
          <div className="skeleton h-28 w-full" /><div className="skeleton h-12 w-full" /><div className="skeleton h-40 w-full" />
        </div>
      </div>
    </div>
  );
}
