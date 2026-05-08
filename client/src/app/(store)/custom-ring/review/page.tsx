'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Check, Shield, Truck, Award, RotateCcw, ChevronRight, Pencil } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { useRingBuilder } from '@/store/ringBuilderStore';
import { useCartStore } from '@/store/cartStore';
import BuilderHeader from '@/components/ring-builder/BuilderHeader';
import { cn } from '@/lib/utils';

const METAL_FILTERS: Record<string, string> = {
  'yellow-gold':  'none',
  'white-gold':   'grayscale(0.78) brightness(1.18) contrast(1.06)',
  'rose-gold':    'sepia(0.28) saturate(1.55) hue-rotate(-12deg) brightness(1.04)',
  platinum:       'grayscale(0.92) brightness(1.22) contrast(1.10)',
  silver:         'grayscale(0.72) brightness(1.12) saturate(0.35)',
};

const METAL_LABELS: Record<string, string> = {
  'yellow-gold':  '18ct Yellow Gold',
  'white-gold':   '18ct White Gold',
  'rose-gold':    '18ct Rose Gold',
  platinum:       'Platinum',
  silver:         'Silver',
};

const SHAPE_PHOTOS: Record<string, string> = {
  Round:    'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&h=600&fit=crop&q=85',
  Oval:     'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&h=600&fit=crop&q=85',
  Princess: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&h=600&fit=crop&q=85',
  Cushion:  'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=600&h=600&fit=crop&q=85',
  Emerald:  'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&h=600&fit=crop&q=85',
  Pear:     'https://images.unsplash.com/photo-1601121141418-728cf5bdbcae?w=600&h=600&fit=crop&q=85',
  Radiant:  'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&h=600&fit=crop&q=85',
  Marquise: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&h=600&fit=crop&q=85',
  Asscher:  'https://images.unsplash.com/photo-1573408301185-9519f94816b5?w=600&h=600&fit=crop&q=85',
  Heart:    'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=600&h=600&fit=crop&q=85',
};

const SIZES = ['G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];

const FALLBACK_DIAMOND = 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&h=600&fit=crop';
const FALLBACK_SETTING = 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&h=600&fit=crop';

export default function ReviewPage() {
  const router = useRouter();
  const {
    setting, diamond, selectedMetal, selectedHead, selectedBand, selectedSize,
    setSize, settingPrice, totalPrice, reset,
  } = useRingBuilder();

  const addItem = useCartStore(s => s.addItem);

  const [size, setSizeLocal] = useState(selectedSize || '');
  const [engravingText, setEngravingText] = useState('');
  const [added, setAdded] = useState(false);

  const handleSizeSelect = (s: string) => {
    setSizeLocal(s);
    setSize(s);
  };

  const handleAddToCart = () => {
    if (!setting || !diamond || !size) return;
    addItem(setting, {
      selectedMetal,
      selectedSize: size,
      diamond,
      engraving: engravingText || undefined,
    });
    setAdded(true);
    setTimeout(() => router.push('/cart'), 1200);
  };

  if (!setting || !diamond) {
    return (
      <div className="bg-white min-h-screen">
        <BuilderHeader />
        <div className="max-w-xl mx-auto px-6 py-24 text-center">
          <p className="font-serif text-xl text-charcoal mb-2">Your ring isn't ready yet</p>
          <p className="text-sm font-sans text-gray-400 mb-8">Please choose a setting and a diamond before reviewing.</p>
          <button
            onClick={() => router.push('/custom-ring/settings')}
            className="px-8 py-3 bg-charcoal text-white text-sm font-sans font-medium tracking-wider hover:bg-black transition-colors"
          >
            START BUILDING
          </button>
        </div>
      </div>
    );
  }

  const metalFilter = METAL_FILTERS[selectedMetal] || 'none';
  const metalLabel  = METAL_LABELS[selectedMetal] || selectedMetal;
  const settingImg  = setting.images?.[0] || FALLBACK_SETTING;
  const diamondImg  = diamond.imageUrl || SHAPE_PHOTOS[diamond.shape] || FALLBACK_DIAMOND;
  const ringTotal   = totalPrice();
  const canAddToCart = !!size;

  return (
    <div className="bg-white min-h-screen pb-24">
      <BuilderHeader />

      {/* Page title */}
      <div className="border-b border-gray-100 bg-gray-50 py-5 text-center">
        <p className="text-[10px] font-sans tracking-[0.3em] uppercase text-gold-500 mb-1">Step 3 of 3</p>
        <h1 className="font-serif text-2xl font-light text-charcoal">Review Your Ring</h1>
        <p className="text-xs font-sans text-gray-400 mt-1">Confirm your choices and add to bag</p>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 grid lg:grid-cols-[1fr_380px] gap-8">

        {/* ── Left: ring summary cards ── */}
        <div className="space-y-5">

          {/* Combined ring preview */}
          <div className="border border-gray-100 bg-white overflow-hidden">
            <div className="grid grid-cols-2 divide-x divide-gray-100">
              {/* Setting */}
              <div className="relative group">
                <div className="relative aspect-square overflow-hidden">
                  <Image
                    src={settingImg}
                    alt={setting.name}
                    fill
                    className="object-cover"
                    style={{ filter: metalFilter }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                    <p className="text-[9px] font-sans tracking-widest uppercase text-gold-400 mb-0.5">Setting</p>
                    <p className="text-xs font-sans font-medium leading-tight line-clamp-2">{setting.name}</p>
                    <p className="text-[10px] text-gray-300 mt-0.5">{metalLabel}</p>
                  </div>
                </div>
                <button
                  onClick={() => router.push(`/custom-ring/settings/${setting.slug}`)}
                  className="absolute top-2 right-2 w-7 h-7 bg-white/80 hover:bg-white rounded-full flex items-center justify-center transition-colors"
                  title="Change setting"
                >
                  <Pencil size={12} className="text-charcoal" />
                </button>
              </div>

              {/* Diamond */}
              <div className="relative group">
                <div className="relative aspect-square overflow-hidden bg-gray-900">
                  <Image
                    src={diamondImg}
                    alt={`${diamond.caratWeight}ct ${diamond.shape}`}
                    fill
                    className="object-cover opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                    <p className="text-[9px] font-sans tracking-widest uppercase text-gold-400 mb-0.5">Diamond</p>
                    <p className="text-xs font-sans font-medium">{diamond.caratWeight.toFixed(2)}ct {diamond.shape}</p>
                    <p className="text-[10px] text-gray-300 mt-0.5">{diamond.color} / {diamond.clarity} · {diamond.certificate?.lab}</p>
                  </div>
                </div>
                <button
                  onClick={() => router.push('/custom-ring/diamonds')}
                  className="absolute top-2 right-2 w-7 h-7 bg-white/80 hover:bg-white rounded-full flex items-center justify-center transition-colors"
                  title="Change diamond"
                >
                  <Pencil size={12} className="text-charcoal" />
                </button>
              </div>
            </div>
          </div>

          {/* Setting spec row */}
          <div className="border border-gray-100 p-4">
            <p className="text-[10px] font-sans font-bold tracking-widest uppercase text-gray-400 mb-3">Setting Details</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Metal',      value: metalLabel },
                { label: 'Head Style', value: selectedHead?.replace(/-/g, ' ') || '—' },
                { label: 'Band Style', value: selectedBand?.replace(/-/g, ' ') || '—' },
                { label: 'Collection', value: setting.style || setting.category?.name || '—' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-[9px] font-sans tracking-widest uppercase text-gray-400">{label}</p>
                  <p className="text-xs font-sans font-medium text-charcoal mt-0.5 capitalize">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Diamond spec row */}
          <div className="border border-gray-100 p-4">
            <p className="text-[10px] font-sans font-bold tracking-widest uppercase text-gray-400 mb-3">Diamond Details</p>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {[
                { label: 'Shape',       value: diamond.shape },
                { label: 'Carat',       value: `${diamond.caratWeight.toFixed(2)}ct` },
                { label: 'Colour',      value: diamond.color },
                { label: 'Clarity',     value: diamond.clarity },
                { label: 'Cut',         value: diamond.cut },
                { label: 'Certificate', value: diamond.certificate?.lab },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-[9px] font-sans tracking-widest uppercase text-gray-400">{label}</p>
                  <p className="text-xs font-sans font-medium text-charcoal mt-0.5">{value || '—'}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Ring size selector */}
          <div className="border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-sans font-bold tracking-widest uppercase text-gray-400">Ring Size (UK)</p>
              <a href="/size-guide" target="_blank" className="text-[10px] font-sans text-charcoal underline">Size guide</a>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {SIZES.map(s => (
                <button
                  key={s}
                  onClick={() => handleSizeSelect(s)}
                  className={cn(
                    'w-9 h-9 text-xs font-sans border-2 transition-colors font-medium',
                    size === s ? 'border-charcoal bg-charcoal text-white' : 'border-gray-200 text-gray-600 hover:border-gray-400'
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
            {!size && (
              <p className="text-[10px] font-sans text-amber-600 mt-2">Please select a ring size to continue.</p>
            )}
          </div>

          {/* Engraving */}
          <div className="border border-gray-100 p-4">
            <p className="text-[10px] font-sans font-bold tracking-widest uppercase text-gray-400 mb-2">
              Personalised Engraving <span className="normal-case font-normal text-gray-400">(optional)</span>
            </p>
            <input
              type="text"
              maxLength={25}
              value={engravingText}
              onChange={e => setEngravingText(e.target.value)}
              placeholder="E.g. Forever & Always · 14.09.24"
              className="w-full border border-gray-200 px-3 py-2.5 text-xs font-sans focus:outline-none focus:border-charcoal placeholder:text-gray-300"
            />
            <p className="text-[10px] text-gray-400 mt-1">{engravingText.length}/25 characters</p>
          </div>
        </div>

        {/* ── Right: order summary + CTA ── */}
        <div>
          <div className="sticky top-[104px] space-y-4">

            {/* Price breakdown */}
            <div className="border border-gray-200 p-5">
              <p className="font-serif text-base text-charcoal mb-4">Order Summary</p>

              <div className="space-y-2.5 text-sm font-sans">
                <div className="flex justify-between">
                  <span className="text-gray-500">Setting ({metalLabel})</span>
                  <span className="text-charcoal font-medium">{formatPrice(settingPrice())}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">
                    Diamond ({diamond.caratWeight.toFixed(2)}ct {diamond.shape})
                  </span>
                  <span className="text-charcoal font-medium">{formatPrice(diamond.price)}</span>
                </div>
                {engravingText && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Engraving</span>
                    <span className="text-charcoal">Complimentary</span>
                  </div>
                )}
                <div className="border-t border-gray-100 pt-2.5 flex justify-between text-base font-semibold">
                  <span className="text-charcoal">Total</span>
                  <span className="text-charcoal">{formatPrice(ringTotal)}</span>
                </div>
                <p className="text-[10px] text-gray-400">Includes VAT · Free insured delivery</p>
              </div>

              {/* Add to bag */}
              <button
                onClick={handleAddToCart}
                disabled={!canAddToCart || added}
                className={cn(
                  'w-full mt-5 py-4 text-sm font-sans font-medium tracking-wider transition-all duration-300 flex items-center justify-center gap-2',
                  added
                    ? 'bg-emerald-600 text-white'
                    : canAddToCart
                      ? 'bg-charcoal text-white hover:bg-black'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                )}
              >
                {added ? (
                  <><Check size={16} /> ADDED — GOING TO BAG</>
                ) : canAddToCart ? (
                  <>ADD TO BAG · {formatPrice(ringTotal)}</>
                ) : (
                  'SELECT A RING SIZE FIRST'
                )}
              </button>

              {/* Financing note */}
              <p className="text-[10px] font-sans text-gray-400 text-center mt-3">
                From {formatPrice(Math.ceil(ringTotal / 12))}/month with 0% finance · <a href="/faq" className="underline">Learn more</a>
              </p>
            </div>

            {/* Trust badges */}
            <div className="border border-gray-100 p-4 space-y-3">
              {[
                { icon: Award,   text: 'GIA & IGI certified diamond' },
                { icon: Shield,  text: 'Lifetime warranty included' },
                { icon: Truck,   text: 'Free insured UK delivery' },
                { icon: RotateCcw, text: '30-day returns policy' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <div className="w-7 h-7 bg-gray-50 border border-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Icon size={13} className="text-charcoal" />
                  </div>
                  <p className="text-[11px] font-sans text-gray-600">{text}</p>
                </div>
              ))}
            </div>

            {/* Book appointment */}
            <div className="bg-gray-50 border border-gray-100 p-4 text-center">
              <p className="text-xs font-sans font-semibold text-charcoal mb-1">Need help deciding?</p>
              <p className="text-[11px] font-sans text-gray-400 mb-3">Book a free virtual or in-store appointment with one of our diamond specialists.</p>
              <a href="/contact" className="text-[11px] font-sans font-medium text-charcoal underline hover:no-underline">
                Book an appointment →
              </a>
            </div>

            {/* Start over */}
            <button
              onClick={() => { reset(); router.push('/custom-ring'); }}
              className="w-full py-2 text-[11px] font-sans text-gray-400 hover:text-charcoal transition-colors"
            >
              ↺ Start over
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
