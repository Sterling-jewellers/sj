'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, ShoppingBag, Star, Truck, RefreshCw, Shield, ChevronDown, ChevronLeft, ChevronRight, Award } from 'lucide-react';
import { productsApi, reviewsApi } from '@/lib/api';
import { IProduct, IReview, IDiamond } from '@/types';
import { formatPrice, formatDate } from '@/lib/utils';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';
import ProductCard from '@/components/product/ProductCard';
import DiamondPicker from '@/components/product/DiamondPicker';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

// JSON-LD structured data for rich search results
function ProductJsonLd({ product, price }: { product: IProduct; price: number }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.shortDescription,
    image: product.images,
    brand: { '@type': 'Brand', name: 'Sterling Jewellers' },
    offers: {
      '@type': 'Offer',
      price: price.toFixed(2),
      priceCurrency: 'GBP',
      availability: 'https://schema.org/InStock',
      seller: { '@type': 'Organization', name: 'Sterling Jewellers' },
    },
    ...(product.reviewCount > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.averageRating,
        reviewCount: product.reviewCount,
        bestRating: 5,
      },
    }),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

const metalLabels: Record<string, string> = {
  'yellow-gold': 'Yellow Gold',
  'white-gold': 'White Gold',
  'rose-gold': 'Rose Gold',
  platinum: 'Platinum',
  silver: 'Silver',
};

// Determine if this product is a ring / engagament ring (show diamond picker)
const DIAMOND_CATEGORIES = ['engagement-rings', 'rings', 'solitaire', 'engagement rings'];
const showsDiamondPicker = (product: IProduct) => {
  const catSlug = product.category?.slug?.toLowerCase() || '';
  const catName = product.category?.name?.toLowerCase() || '';
  return DIAMOND_CATEGORIES.some((k) => catSlug.includes(k) || catName.includes(k));
};

export default function ProductDetailClient({ slug }: { slug: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => productsApi.getBySlug(slug),
  });

  const product: IProduct | undefined = data?.data;

  const { data: reviewsData } = useQuery({
    queryKey: ['reviews', product?._id],
    queryFn: () => reviewsApi.getByProduct(product!._id),
    enabled: !!product?._id,
  });

  const { data: relatedData } = useQuery({
    queryKey: ['related', product?._id],
    queryFn: () => productsApi.getRelated(product!._id),
    enabled: !!product?._id,
  });

  const reviews: IReview[] = reviewsData?.data || [];
  const related: IProduct[] = relatedData?.data || [];

  const [activeImage, setActiveImage] = useState(0);
  const [selectedMetal, setSelectedMetal] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [engraving, setEngraving] = useState('');
  const [engravingOpen, setEngravingOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'description' | 'details' | 'reviews'>('description');
  const [selectedDiamond, setSelectedDiamond] = useState<IDiamond | null>(null);

  const { addItem } = useCartStore();
  const { toggleItem, isWishlisted } = useWishlistStore();

  if (isLoading) {
    return (
      <div className="py-10 page-container">
        <div className="grid lg:grid-cols-2 gap-16">
          <div className="space-y-3">
            <div className="skeleton aspect-square" />
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton w-20 h-20" />)}
            </div>
          </div>
          <div className="space-y-4">
            <div className="skeleton h-8 w-3/4" />
            <div className="skeleton h-6 w-1/3" />
            <div className="skeleton h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) return <div className="py-20 text-center"><p>Product not found.</p></div>;

  const activeMetal = product.metalOptions.find((m) => m.type === selectedMetal) || product.metalOptions.find((m) => m.isDefault) || product.metalOptions[0];
  const displayImages = activeMetal?.images?.length ? activeMetal.images : product.images;
  const ringPrice = (product.salePrice || product.basePrice) + (activeMetal?.priceModifier || 0);
  const finalPrice = ringPrice + (selectedDiamond?.price || 0);

  const handleAddToCart = () => {
    if (!selectedSize && product.variants.length > 0) {
      toast.error('Please select a ring size');
      return;
    }
    addItem(product, { selectedMetal: activeMetal?.type, selectedSize, engraving, diamond: selectedDiamond || undefined });
    toast.success(`${selectedDiamond ? 'Ring + diamond' : 'Item'} added to bag!`);
  };

  const isDiamondProduct = showsDiamondPicker(product);

  return (
    <div className="bg-ivory min-h-screen">
      {/* JSON-LD for rich search results */}
      <ProductJsonLd product={product} price={finalPrice} />

      {/* Breadcrumb — nav landmark helps SEO */}
      <div className="page-container py-4">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-sans text-gray-500">
          <Link href="/" className="hover:text-gold-600">Home</Link>
          <span aria-hidden>/</span>
          <Link href="/products" className="hover:text-gold-600">Jewellery</Link>
          <span aria-hidden>/</span>
          <Link href={`/category/${product.category?.slug}`} className="hover:text-gold-600">{product.category?.name}</Link>
          <span aria-hidden>/</span>
          <span className="text-charcoal" aria-current="page">{product.name}</span>
        </nav>
      </div>

      <div className="page-container pb-16">
        <div className="grid lg:grid-cols-2 gap-16">
          {/* Image Gallery */}
          <div>
            <div className="relative aspect-square bg-gray-50 mb-4 overflow-hidden group">
              <Image
                src={displayImages[activeImage] || displayImages[0]}
                alt={product.name}
                fill
                priority
                className="object-cover group-hover:scale-105 transition-transform duration-700"
              />
              {displayImages.length > 1 && (
                <>
                  <button aria-label="Previous image" onClick={() => setActiveImage((p) => (p - 1 + displayImages.length) % displayImages.length)} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 flex items-center justify-center hover:bg-white transition-colors shadow-md">
                    <ChevronLeft size={18} />
                  </button>
                  <button aria-label="Next image" onClick={() => setActiveImage((p) => (p + 1) % displayImages.length)} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 flex items-center justify-center hover:bg-white transition-colors shadow-md">
                    <ChevronRight size={18} />
                  </button>
                </>
              )}
              {product.isNewArrival && <span className="absolute top-4 left-4 px-3 py-1 bg-charcoal text-white text-[9px] font-sans tracking-widest uppercase">New</span>}
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1" role="list" aria-label="Product images">
              {displayImages.map((img, i) => (
                <button key={i} role="listitem" onClick={() => setActiveImage(i)} aria-label={`View image ${i + 1}`} className={cn('relative w-20 h-20 flex-shrink-0 overflow-hidden border-2 transition-colors', i === activeImage ? 'border-gold-500' : 'border-transparent hover:border-gray-300')}>
                  <Image src={img} alt={`${product.name} — view ${i + 1}`} fill className="object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div>
            <p className="section-subtitle mb-2">{product.category?.name}</p>
            <h1 className="font-serif text-3xl md:text-4xl font-light text-charcoal mb-3">{product.name}</h1>

            {/* Rating */}
            {product.reviewCount > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <div className="flex gap-0.5" aria-label={`Rated ${product.averageRating} out of 5`}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={13} className={i < Math.round(product.averageRating) ? 'text-gold-400 fill-gold-400' : 'text-gray-200 fill-gray-200'} />
                  ))}
                </div>
                <button onClick={() => setActiveTab('reviews')} className="text-xs font-sans text-gray-500 hover:text-gold-600">
                  {product.averageRating} ({product.reviewCount} reviews)
                </button>
              </div>
            )}

            {/* Price — updates live with diamond */}
            <div className="flex items-baseline gap-3 mb-2">
              <span className="font-serif text-3xl font-light text-charcoal">{formatPrice(finalPrice)}</span>
              {product.salePrice && (
                <span className="font-sans text-lg text-gray-400 line-through">{formatPrice(product.basePrice + (activeMetal?.priceModifier || 0))}</span>
              )}
              {product.certification && (
                <span className="flex items-center gap-1 text-xs font-sans text-gold-600 border border-gold-300 px-2 py-1">
                  <Award size={11} /> {product.certification}
                </span>
              )}
            </div>

            {/* Price breakdown when diamond selected */}
            {selectedDiamond && (
              <div className="flex gap-4 mb-4 text-xs text-gray-500 font-sans">
                <span>Ring: {formatPrice(ringPrice)}</span>
                <span>+</span>
                <span>Diamond: {formatPrice(selectedDiamond.price)}</span>
              </div>
            )}

            <div className="w-12 h-0.5 bg-gold-400 mb-6" />
            <p className="text-sm font-sans text-gray-600 leading-relaxed mb-6">{product.shortDescription}</p>

            {/* Metal options */}
            {product.metalOptions.length > 0 && (
              <div className="mb-6">
                <p className="text-xs font-sans font-semibold tracking-widest uppercase text-charcoal mb-3">
                  Metal: <span className="normal-case font-normal text-gray-600">{metalLabels[activeMetal?.type || ''] || activeMetal?.type}</span>
                </p>
                <div className="flex gap-2 flex-wrap">
                  {product.metalOptions.map((metal) => (
                    <button
                      key={metal.type}
                      onClick={() => setSelectedMetal(metal.type)}
                      className={cn('px-4 py-2 text-xs font-sans border transition-all', (selectedMetal === metal.type || (!selectedMetal && metal.isDefault)) ? 'border-gold-500 bg-gold-50 text-gold-700 font-medium' : 'border-gray-200 text-gray-600 hover:border-gold-300')}
                    >
                      {metalLabels[metal.type] || metal.type}
                      {metal.priceModifier > 0 && <span className="text-gray-400 ml-1">+{formatPrice(metal.priceModifier)}</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size selector */}
            {product.variants.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-sans font-semibold tracking-widest uppercase text-charcoal">Ring Size</p>
                  <Link href="/size-guide" className="text-xs font-sans text-gold-600 hover:underline">Size Guide</Link>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {product.variants.map((v) => (
                    <button
                      key={v.size}
                      disabled={v.stock === 0}
                      onClick={() => setSelectedSize(v.size)}
                      aria-label={`Size ${v.size}${v.stock === 0 ? ' — out of stock' : ''}`}
                      className={cn('w-12 h-12 text-sm font-sans border transition-all', selectedSize === v.size ? 'border-gold-500 bg-gold-50 text-gold-700 font-medium' : v.stock === 0 ? 'border-gray-100 text-gray-300 cursor-not-allowed line-through' : 'border-gray-200 text-gray-600 hover:border-gold-300')}
                    >
                      {v.size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Diamond Picker (engagement rings only) ── */}
            {isDiamondProduct && (
              <DiamondPicker
                selectedDiamond={selectedDiamond}
                onSelect={setSelectedDiamond}
              />
            )}

            {/* Engraving */}
            {product.isEngravable && (
              <div className="mb-6">
                <button
                  onClick={() => setEngravingOpen(!engravingOpen)}
                  className="flex items-center gap-2 text-xs font-sans font-semibold tracking-widest uppercase text-charcoal hover:text-gold-600 transition-colors"
                >
                  Add Engraving (Free) <ChevronDown size={14} className={cn('transition-transform', engravingOpen && 'rotate-180')} />
                </button>
                {engravingOpen && (
                  <div className="mt-3">
                    <input
                      type="text"
                      maxLength={20}
                      placeholder="Your personalised message (max 20 chars)"
                      value={engraving}
                      onChange={(e) => setEngraving(e.target.value)}
                      className="input-field"
                    />
                    <p className="text-xs font-sans text-gray-400 mt-1">{engraving.length}/20 characters</p>
                  </div>
                )}
              </div>
            )}

            {/* CTA Buttons */}
            <div className="flex gap-3 mb-8">
              <button onClick={handleAddToCart} className="btn-gold flex-1 flex items-center justify-center gap-2">
                <ShoppingBag size={16} />
                {selectedDiamond ? `Add Ring + Diamond — ${formatPrice(finalPrice)}` : 'Add to Bag'}
              </button>
              <button
                onClick={() => { toggleItem(product); toast(isWishlisted(product._id) ? 'Removed from wishlist' : 'Saved to wishlist', { icon: '❤️' }); }}
                aria-label={isWishlisted(product._id) ? 'Remove from wishlist' : 'Add to wishlist'}
                className={cn('w-12 h-12 border flex items-center justify-center transition-colors', isWishlisted(product._id) ? 'border-red-200 text-red-400 bg-red-50' : 'border-gray-200 text-gray-500 hover:border-gold-400 hover:text-gold-500')}
              >
                <Heart size={18} fill={isWishlisted(product._id) ? 'currentColor' : 'none'} />
              </button>
            </div>

            {/* Delivery / trust info */}
            <div className="border border-gray-100 divide-y divide-gray-100">
              {[
                { icon: Truck, text: `Free delivery in ${product.deliveryDays} working days` },
                { icon: RefreshCw, text: '30-day hassle-free returns' },
                { icon: Shield, text: 'Lifetime craftsmanship guarantee' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3 px-4 py-3">
                  <Icon size={15} className="text-gold-500 flex-shrink-0" aria-hidden />
                  <span className="text-xs font-sans text-gray-600">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-16 border-t border-gray-200">
          <div className="flex gap-0 border-b border-gray-200" role="tablist">
            {(['description', 'details', 'reviews'] as const).map((tab) => (
              <button
                key={tab}
                role="tab"
                aria-selected={activeTab === tab}
                onClick={() => setActiveTab(tab)}
                className={cn('px-8 py-4 text-xs font-sans font-medium tracking-widest uppercase transition-colors', activeTab === tab ? 'border-b-2 border-gold-500 text-gold-600' : 'text-gray-500 hover:text-charcoal')}
              >
                {tab} {tab === 'reviews' && `(${reviews.length})`}
              </button>
            ))}
          </div>

          <div className="py-10">
            {activeTab === 'description' && (
              <div className="max-w-2xl prose prose-sm font-sans text-gray-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: product.description }} />
            )}

            {activeTab === 'details' && (
              <div className="max-w-lg">
                <dl className="divide-y divide-gray-100">
                  {[
                    { label: 'Style', value: product.style },
                    { label: 'Setting Type', value: product.settingType },
                    { label: 'Gemstone', value: product.gemstone },
                    { label: 'Weight', value: product.weight ? `${product.weight}g` : undefined },
                    { label: 'Engravable', value: product.isEngravable ? 'Yes (free)' : 'No' },
                    { label: 'Delivery', value: `${product.deliveryDays} working days` },
                  ].filter((d) => d.value).map((detail) => (
                    <div key={detail.label} className="flex py-3">
                      <dt className="w-40 text-xs font-sans font-medium tracking-widest uppercase text-gray-500">{detail.label}</dt>
                      <dd className="text-sm font-sans text-charcoal">{detail.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-6 max-w-2xl">
                {reviews.length === 0 ? (
                  <p className="text-sm font-sans text-gray-500">No reviews yet. Be the first!</p>
                ) : (
                  reviews.map((review) => (
                    <article key={review._id} className="border-b border-gray-100 pb-6">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm font-sans font-medium text-charcoal">{review.user.firstName} {review.user.lastName}</p>
                          <p className="text-xs font-sans text-gray-400">{formatDate(review.createdAt)}</p>
                        </div>
                        <div className="flex gap-0.5" aria-label={`${review.rating} stars`}>
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} size={12} className={i < review.rating ? 'text-gold-400 fill-gold-400' : 'text-gray-200 fill-gray-200'} />
                          ))}
                        </div>
                      </div>
                      <p className="font-sans font-medium text-sm text-charcoal mb-1">{review.title}</p>
                      <p className="text-sm font-sans text-gray-600 leading-relaxed">{review.body}</p>
                      {review.isVerifiedPurchase && <span className="text-xs font-sans text-green-600 mt-2 block">✓ Verified Purchase</span>}
                    </article>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <section className="mt-8 pt-12 border-t border-gray-200" aria-label="Related products">
            <h2 className="section-title mb-2">You May Also Like</h2>
            <div className="gold-divider mt-2 mb-8 mx-0" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {related.map((p) => <ProductCard key={p._id} product={p} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
