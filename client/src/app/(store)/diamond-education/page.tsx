'use client';

import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { RING_BUILDER_ENABLED } from '@/lib/features';
import { useState } from 'react';

const CUTS = [
  { grade: 'Ideal / Excellent', desc: 'Maximum brilliance. Light enters and exits through the crown at optimal angles. Rare — <3% of all diamonds.' },
  { grade: 'Very Good',         desc: 'Outstanding brilliance, slightly less refined cut proportions. Excellent value.' },
  { grade: 'Good',              desc: 'Well-cut stone, good brilliance. Represents ~15% of diamonds.' },
  { grade: 'Fair',              desc: 'Light leaks from the sides/bottom. Noticeably less sparkle.' },
];
const COLORS = ['D','E','F','G','H','I','J','K','L','M'];
const CLARITIES = [
  { grade: 'FL / IF',        desc: 'Flawless / Internally Flawless. Extremely rare — no inclusions visible under 10× magnification.' },
  { grade: 'VVS1 / VVS2',   desc: 'Very Very Slightly Included. Inclusions visible only to a skilled grader under magnification.' },
  { grade: 'VS1 / VS2',     desc: 'Very Slightly Included. Minor inclusions, invisible to the naked eye. Excellent value.' },
  { grade: 'SI1 / SI2',     desc: 'Slightly Included. Inclusions visible under 10× loupe; usually clean to the naked eye in SI1.' },
  { grade: 'I1 / I2 / I3',  desc: 'Included. Inclusions visible to the naked eye. Not recommended for engagement rings.' },
];
const CARATS = [0.5, 0.75, 1, 1.5, 2, 3, 4, 5];

export default function DiamondEducationPage() {
  const [activeC, setActiveC] = useState<'cut'|'color'|'clarity'|'carat'>('cut');

  return (
    <div className="bg-white min-h-screen">

      {/* Hero */}
      <div className="bg-charcoal text-white py-16 text-center">
        <p className="text-[10px] font-sans tracking-[0.35em] uppercase text-gold-300 mb-3">Diamond Guide</p>
        <h1 className="font-serif text-4xl font-light mb-4">The 4 Cs of Diamonds</h1>
        <p className="font-sans text-gray-300 text-sm max-w-lg mx-auto leading-relaxed">
          Everything you need to know to choose a diamond with confidence — cut, colour, clarity, and carat weight.
        </p>
        <div className="w-12 h-px bg-gold-300 mx-auto mt-6" />
      </div>

      {/* 4Cs tab nav */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto flex">
          {(['cut','color','clarity','carat'] as const).map(c => (
            <button
              key={c}
              onClick={() => setActiveC(c)}
              className={cn(
                'flex-1 py-4 text-xs font-sans font-medium tracking-widest uppercase transition-colors border-b-2',
                activeC === c
                  ? 'border-charcoal text-charcoal bg-gray-50'
                  : 'border-transparent text-gray-400 hover:text-charcoal'
              )}
            >
              {c === 'color' ? 'Colour' : c.charAt(0).toUpperCase() + c.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-16">

        {/* ── CUT ── */}
        {activeC === 'cut' && (
          <section>
            <h2 className="font-serif text-3xl font-light text-charcoal mb-2">Cut</h2>
            <p className="text-gray-400 font-sans text-sm leading-relaxed mb-8 max-w-2xl">
              Cut is the most important of the 4 Cs. It determines how well a diamond reflects light — its brilliance, fire, and scintillation. Cut grade refers to the diamond's proportions, symmetry, and polish, not its shape.
            </p>

            <div className="space-y-3">
              {CUTS.map((c, i) => (
                <div key={i} className={cn(
                  'border p-5 flex items-start gap-5',
                  i === 0 ? 'border-charcoal bg-charcoal/5' : 'border-gray-100'
                )}>
                  {/* Sparkle indicator */}
                  <div className="flex gap-0.5 flex-shrink-0 mt-0.5">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <div key={j} className={cn(
                        'w-2.5 h-2.5 rounded-full',
                        j < 5 - i ? 'bg-charcoal' : 'bg-gray-200'
                      )} />
                    ))}
                  </div>
                  <div>
                    <p className="text-sm font-sans font-semibold text-charcoal">{c.grade}</p>
                    <p className="text-xs font-sans text-gray-500 mt-1 leading-relaxed">{c.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 bg-gold-50 border border-gold-200 p-5">
              <p className="text-xs font-sans font-semibold text-charcoal mb-1">Our Recommendation</p>
              <p className="text-xs font-sans text-gray-600 leading-relaxed">
                Always choose <strong>Excellent or Ideal cut</strong> for round brilliants. For fancy shapes (oval, cushion, pear), look for GIA-graded polish and symmetry of Very Good or better.
              </p>
            </div>
          </section>
        )}

        {/* ── COLOUR ── */}
        {activeC === 'color' && (
          <section>
            <h2 className="font-serif text-3xl font-light text-charcoal mb-2">Colour</h2>
            <p className="text-gray-400 font-sans text-sm leading-relaxed mb-8 max-w-2xl">
              The GIA colour scale runs from D (completely colourless) to Z (noticeable yellow/brown tint). In white metal settings, colour differences above J are usually invisible to the naked eye.
            </p>

            {/* Colour gradient bar */}
            <div className="mb-6">
              <div className="flex gap-0" style={{ height: 40 }}>
                {COLORS.map((c, i) => (
                  <div
                    key={c}
                    className="flex-1 flex items-end justify-center pb-1 text-[9px] font-sans font-bold"
                    style={{
                      background: `hsl(48, ${Math.max(0, i * 8)}%, ${Math.min(98, 98 - i * 4)}%)`,
                      color: i > 5 ? '#000000' : '#666',
                    }}
                  >
                    {c}
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-[9px] font-sans text-gray-400 mt-1">
                <span>Colourless</span>
                <span>Near colourless</span>
                <span>Faint yellow</span>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { range: 'D – F', label: 'Colourless',       rec: true,  desc: 'The finest colour grade. Virtually no colour detectable even under magnification.' },
                { range: 'G – H', label: 'Near Colourless',  rec: true,  desc: 'Excellent value. Slight warmth visible only when compared to D-F stones side by side.' },
                { range: 'I – J', label: 'Near Colourless',  rec: false, desc: 'Very slight warmth. Hard to detect in a well-cut round brilliant. Great budget choice.' },
                { range: 'K +',   label: 'Faint Yellow',     rec: false, desc: 'Noticeable warmth. Not recommended for white gold or platinum settings.' },
              ].map(row => (
                <div key={row.range} className={cn('border p-4', row.rec ? 'border-charcoal' : 'border-gray-100')}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-serif text-xl font-light text-charcoal">{row.range}</span>
                    <span className="text-[10px] font-sans text-gray-400">{row.label}</span>
                    {row.rec && <span className="ml-auto text-[9px] font-sans bg-charcoal text-white px-1.5 py-0.5">Recommended</span>}
                  </div>
                  <p className="text-xs font-sans text-gray-500 leading-relaxed">{row.desc}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── CLARITY ── */}
        {activeC === 'clarity' && (
          <section>
            <h2 className="font-serif text-3xl font-light text-charcoal mb-2">Clarity</h2>
            <p className="text-gray-400 font-sans text-sm leading-relaxed mb-8 max-w-2xl">
              Clarity measures the number and visibility of natural inclusions (internal) and blemishes (surface). The GIA scale has 11 grades from FL to I3.
            </p>

            <div className="space-y-3">
              {CLARITIES.map((c, i) => (
                <div key={i} className={cn(
                  'border p-5',
                  i <= 1 ? 'border-charcoal bg-charcoal/5' : 'border-gray-100'
                )}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-sans font-semibold text-charcoal">{c.grade}</p>
                      <p className="text-xs font-sans text-gray-500 mt-1 leading-relaxed">{c.desc}</p>
                    </div>
                    {i >= 1 && i <= 3 && (
                      <span className="text-[9px] font-sans bg-gold-200 text-charcoal px-2 py-0.5 flex-shrink-0">Best Value</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── CARAT ── */}
        {activeC === 'carat' && (
          <section>
            <h2 className="font-serif text-3xl font-light text-charcoal mb-2">Carat Weight</h2>
            <p className="text-gray-400 font-sans text-sm leading-relaxed mb-8 max-w-2xl">
              Carat is the unit of weight for diamonds (1 carat = 0.2 grams). Larger diamonds are exponentially rarer and more expensive — a 2ct diamond costs more than twice a 1ct of equal quality.
            </p>

            {/* Carat size comparison */}
            <div className="flex items-end gap-4 flex-wrap mb-8">
              {CARATS.map(ct => {
                const diameter = Math.round((6.5 * Math.pow(ct, 1 / 3)) * 10) / 10;
                const px = Math.max(16, Math.min(72, diameter * 8));
                return (
                  <div key={ct} className="flex flex-col items-center gap-2">
                    <div
                      className="rounded-full bg-gradient-to-br from-gray-100 to-gray-300 border border-gray-200 shadow-inner"
                      style={{ width: px, height: px }}
                    />
                    <p className="text-[10px] font-sans text-charcoal font-semibold">{ct}ct</p>
                    <p className="text-[9px] font-sans text-gray-400">{diameter}mm</p>
                  </div>
                );
              })}
            </div>

            <div className="bg-gold-50 border border-gold-200 p-5">
              <p className="text-xs font-sans font-semibold text-charcoal mb-1">Tip: "Magic Sizes"</p>
              <p className="text-xs font-sans text-gray-600 leading-relaxed">
                Diamonds priced at 0.90ct look nearly identical to 1.00ct but cost significantly less. Similarly, 1.45ct vs 1.50ct. These "just-below" sizes offer outstanding value without any visible compromise.
              </p>
            </div>
          </section>
        )}

        {/* CTA */}
        <div className="border-t border-gray-100 pt-12 text-center">
          <p className="font-serif text-2xl font-light text-charcoal mb-2">Ready to find your diamond?</p>
          <p className="text-xs font-sans text-gray-400 mb-6">Browse our GIA & IGI certified inventory with complete grading reports</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/diamonds" className="px-8 py-3 bg-charcoal text-white text-xs font-sans font-medium tracking-widest uppercase hover:bg-black transition-colors">
              Browse Diamonds
            </Link>
            {RING_BUILDER_ENABLED && (
              <Link href="/custom-ring" className="px-8 py-3 border border-charcoal text-charcoal text-xs font-sans font-medium tracking-widest uppercase hover:bg-charcoal hover:text-white transition-colors">
                Build Your Ring
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
