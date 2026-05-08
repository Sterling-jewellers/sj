'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, Gem, Diamond, Sparkles } from 'lucide-react';
import { useRingBuilder } from '@/store/ringBuilderStore';

export default function CustomRingLanding() {
  const { setEntryPoint } = useRingBuilder();

  return (
    <div className="bg-white min-h-screen">

      {/* ── Hero header ──────────────────────────────────────────────── */}
      <div className="bg-charcoal text-white py-14 text-center">
        <p className="text-[10px] font-sans tracking-[0.35em] uppercase text-gold-400 mb-3">Sterling Jewellers</p>
        <h1 className="font-serif text-5xl font-light mb-4">Design Your Own Ring</h1>
        <p className="font-sans text-gray-300 text-sm max-w-md mx-auto leading-relaxed">
          Create the engagement ring of your dreams — choose your setting, select your diamond, and we'll craft it to perfection.
        </p>
        <div className="w-12 h-px bg-gold-500 mx-auto mt-6" />
      </div>

      {/* ── 3 steps strip ────────────────────────────────────────────── */}
      <div className="border-b border-gray-100 bg-gray-50">
        <div className="max-w-3xl mx-auto px-6 py-6 grid grid-cols-3 gap-4">
          {[
            { n: '1', label: 'Choose a Setting',  desc: 'Pick your ring design & style' },
            { n: '2', label: 'Choose a Diamond',  desc: 'Select a certified loose diamond' },
            { n: '3', label: 'Complete Your Ring', desc: 'Review, size & add to bag' },
          ].map((s, i) => (
            <div key={s.n} className="flex items-start gap-3">
              <span className="w-7 h-7 rounded-full bg-charcoal text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {s.n}
              </span>
              <div>
                <p className="text-xs font-sans font-semibold text-charcoal">{s.label}</p>
                <p className="text-[11px] font-sans text-gray-400 mt-0.5">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Two main paths ───────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-8">

        {/* Start With a Setting */}
        <div className="group relative overflow-hidden border border-gray-200 hover:border-gray-400 hover:shadow-xl transition-all duration-300">
          <div className="relative h-72 overflow-hidden">
            <Image
              src="https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&h=600&fit=crop"
              alt="Engagement ring settings"
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <div className="flex items-center gap-2 mb-2">
                <Gem size={16} className="text-gold-400" />
                <p className="text-[10px] font-sans tracking-widest uppercase text-gold-400">Most Popular</p>
              </div>
              <h2 className="font-serif text-2xl font-light mb-1">Start With a Setting</h2>
              <p className="text-sm font-sans text-gray-300 leading-relaxed">
                Browse our collection of ring settings — solitaire, halo, pavé and more. Then add your perfect diamond.
              </p>
            </div>
          </div>

          <div className="p-5 bg-white">
            <div className="flex flex-wrap gap-2 mb-5">
              {['Solitaire', 'Halo', 'Three Stone', 'Pavé', 'Vintage'].map(style => (
                <span key={style} className="text-[10px] font-sans border border-gray-200 text-gray-500 px-2 py-1">{style}</span>
              ))}
            </div>
            <Link
              href="/custom-ring/settings"
              onClick={() => setEntryPoint('setting')}
              className="flex items-center justify-between w-full py-3.5 px-5 bg-charcoal text-white text-sm font-sans font-medium tracking-wider hover:bg-black transition-colors group/btn"
            >
              BROWSE SETTINGS
              <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Start With a Diamond */}
        <div className="group relative overflow-hidden border border-gray-200 hover:border-gray-400 hover:shadow-xl transition-all duration-300">
          <div className="relative h-72 overflow-hidden">
            <Image
              src="https://images.unsplash.com/photo-1518049362265-d5b2a6467637?w=800&h=600&fit=crop"
              alt="Loose certified diamonds"
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <div className="flex items-center gap-2 mb-2">
                <Diamond size={16} className="text-gold-400" />
                <p className="text-[10px] font-sans tracking-widest uppercase text-gold-400">GIA & IGI Certified</p>
              </div>
              <h2 className="font-serif text-2xl font-light mb-1">Start With a Diamond</h2>
              <p className="text-sm font-sans text-gray-300 leading-relaxed">
                Choose your certified diamond first — round, oval, princess and more — then find the perfect setting for it.
              </p>
            </div>
          </div>

          <div className="p-5 bg-white">
            <div className="flex flex-wrap gap-2 mb-5">
              {['Round', 'Oval', 'Princess', 'Cushion', 'Emerald'].map(shape => (
                <span key={shape} className="text-[10px] font-sans border border-gray-200 text-gray-500 px-2 py-1">{shape}</span>
              ))}
            </div>
            <Link
              href="/custom-ring/diamonds"
              onClick={() => setEntryPoint('diamond')}
              className="flex items-center justify-between w-full py-3.5 px-5 bg-white border border-charcoal text-charcoal text-sm font-sans font-medium tracking-wider hover:bg-charcoal hover:text-white transition-colors group/btn"
            >
              BROWSE DIAMONDS
              <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>

      {/* ── Why choose us strip ──────────────────────────────────────── */}
      <div className="bg-gray-50 border-t border-gray-100 py-12">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { title: 'GIA & IGI Certified',  sub: 'Every diamond certified' },
            { title: 'Free UK Delivery',      sub: 'Insured & tracked' },
            { title: 'Lifetime Warranty',     sub: 'Complimentary care' },
            { title: 'Expert Guidance',       sub: 'Chat with our team' },
          ].map(item => (
            <div key={item.title}>
              <p className="font-sans font-semibold text-xs text-charcoal tracking-wide">{item.title}</p>
              <p className="text-[11px] font-sans text-gray-400 mt-1">{item.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
