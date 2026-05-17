'use client';

import Link from 'next/link';
import Image from 'next/image';
import { RING_BUILDER_ENABLED } from '@/lib/features';

// ─── Diamond shape SVG icons ──────────────────────────────────────────────────
const ShapeIcon = ({ shape }: { shape: string }) => {
  const cls = 'fill-charcoal/70 group-hover:fill-gold-600 transition-colors duration-200';
  const s = shape.toLowerCase();
  if (s === 'round')    return <svg viewBox="0 0 36 36" className={`w-7 h-7 ${cls}`}><circle cx="18" cy="18" r="14" /><circle cx="18" cy="18" r="7" fill="none" stroke="white" strokeWidth="1.2" opacity="0.5" /></svg>;
  if (s === 'princess') return <svg viewBox="0 0 36 36" className={`w-7 h-7 ${cls}`}><rect x="5" y="5" width="26" height="26" /><rect x="11" y="11" width="14" height="14" fill="none" stroke="white" strokeWidth="1" opacity="0.5" /></svg>;
  if (s === 'cushion')  return <svg viewBox="0 0 36 36" className={`w-7 h-7 ${cls}`}><rect x="5" y="5" width="26" height="26" rx="7" /><rect x="11" y="11" width="14" height="14" rx="3" fill="none" stroke="white" strokeWidth="1" opacity="0.5" /></svg>;
  if (s === 'oval')     return <svg viewBox="0 0 36 36" className={`w-7 h-7 ${cls}`}><ellipse cx="18" cy="18" rx="11" ry="15" /></svg>;
  if (s === 'emerald')  return <svg viewBox="0 0 36 36" className={`w-7 h-7 ${cls}`}><rect x="8" y="4" width="20" height="28" rx="2.5" /></svg>;
  if (s === 'pear')     return <svg viewBox="0 0 36 36" className={`w-7 h-7 ${cls}`}><path d="M18 32C9 32 6 22 10 15 C13 9 18 6 18 6 C18 6 23 9 26 15 C30 22 27 32 18 32Z" /></svg>;
  if (s === 'radiant')  return <svg viewBox="0 0 36 36" className={`w-7 h-7 ${cls}`}><polygon points="9,5 27,5 31,9 31,27 27,31 9,31 5,27 5,9" /></svg>;
  if (s === 'asscher')  return <svg viewBox="0 0 36 36" className={`w-7 h-7 ${cls}`}><polygon points="11,4 25,4 32,11 32,25 25,32 11,32 4,25 4,11" /></svg>;
  if (s === 'marquise') return <svg viewBox="0 0 36 36" className={`w-7 h-7 ${cls}`}><path d="M18 4 C25 11 30 18 18 32 C6 18 11 11 18 4Z" /></svg>;
  if (s === 'heart')    return <svg viewBox="0 0 36 36" className={`w-7 h-7 ${cls}`}><path d="M18 30 C18 30 4 21 4 12 C4 8 7 5 11 5 C14 5 18 8 18 8 C18 8 22 5 25 5 C29 5 32 8 32 12 C32 21 18 30 18 30Z" /></svg>;
  return <svg viewBox="0 0 36 36" className={`w-7 h-7 ${cls}`}><circle cx="18" cy="18" r="14" /></svg>;
};

const SHAPES = [
  { label: 'Round',    shape: 'round' },
  { label: 'Princess', shape: 'princess' },
  { label: 'Cushion',  shape: 'cushion' },
  { label: 'Oval',     shape: 'oval' },
  { label: 'Emerald',  shape: 'emerald' },
  { label: 'Pear',     shape: 'pear' },
  { label: 'Radiant',  shape: 'radiant' },
  { label: 'Asscher',  shape: 'asscher' },
  { label: 'Marquise', shape: 'marquise' },
  { label: 'Heart',    shape: 'heart' },
];

// ─── Shared FeaturedTile ──────────────────────────────────────────────────────
function FeaturedTile({ title, sub, image, href }: { title: string; sub: string; image: string; href: string }) {
  return (
    <Link href={href} className="group block relative overflow-hidden">
      <div className="relative h-[160px] w-full overflow-hidden">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-600"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/75 via-charcoal/10 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <p className="text-[9px] font-sans tracking-[0.2em] uppercase text-gold-300 mb-0.5">{sub}</p>
          <p className="font-serif text-[15px] font-light text-white leading-tight">{title}</p>
        </div>
      </div>
    </Link>
  );
}

// ─── ENGAGEMENT RINGS ─────────────────────────────────────────────────────────
function EngagementMenu() {
  // When ring builder is disabled, show a simple category-only menu
  if (!RING_BUILDER_ENABLED) {
    return (
      <div className="page-container py-8">
        <div className="grid grid-cols-[240px_1fr_260px] gap-10">
          <div className="space-y-7">
            <div>
              <h4 className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase text-gold-600 mb-3">Engagement Rings</h4>
              <ul className="space-y-2.5">
                {[
                  { label: 'All Engagement Rings', href: '/category/engagement-rings',           desc: 'Full collection' },
                  { label: 'Solitaire Rings',      href: '/category/engagement-rings?style=solitaire', desc: 'Classic single stone' },
                  { label: 'Halo Rings',           href: '/category/engagement-rings?style=halo',      desc: 'Diamond-encircled centre' },
                  { label: 'Three Stone Rings',    href: '/category/engagement-rings?style=three-stone', desc: 'Past, present & future' },
                  { label: 'Pavé Rings',           href: '/category/engagement-rings?style=pave',       desc: 'Diamond-set band' },
                  { label: 'Vintage Rings',        href: '/category/engagement-rings?style=vintage',    desc: 'Intricate milgrain detail' },
                ].map(l => (
                  <li key={l.label}>
                    <Link href={l.href} className="group block py-0.5">
                      <span className="text-sm font-sans font-medium text-charcoal group-hover:text-gold-600 transition-colors">{l.label}</span>
                      <span className="block text-[11px] text-gray-400">{l.desc}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase text-gold-600 mb-2">By Metal</h4>
              <ul className="space-y-1.5">
                {[
                  { label: 'Platinum',         href: '/category/engagement-rings?metal=platinum',    color: '#A8A8BC' },
                  { label: '18ct Yellow Gold', href: '/category/engagement-rings?metal=yellow-gold', color: '#D4A843' },
                  { label: '18ct White Gold',  href: '/category/engagement-rings?metal=white-gold',  color: '#D8D8D8' },
                  { label: '18ct Rose Gold',   href: '/category/engagement-rings?metal=rose-gold',   color: '#E8A090' },
                  { label: '9ct Gold',         href: '/category/engagement-rings?karat=9ct',         color: '#C49A2A' },
                ].map(m => (
                  <li key={m.label}>
                    <Link href={m.href} className="group flex items-center gap-2 hover:text-gold-600 transition-colors">
                      <div className="w-3 h-3 rounded-full border border-gray-300 flex-shrink-0" style={{ backgroundColor: m.color }} />
                      <span className="text-xs font-sans text-charcoal group-hover:text-gold-600">{m.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div>
            <h4 className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase text-gold-600 mb-4">Browse by Diamond Shape</h4>
            <div className="grid grid-cols-5 gap-1">
              {SHAPES.map(({ label, shape }) => (
                <Link key={shape} href={`/category/engagement-rings?shape=${shape}`}
                  className="group flex flex-col items-center gap-1.5 p-2 hover:bg-champagne rounded transition-colors">
                  <ShapeIcon shape={shape} />
                  <span className="text-[10px] font-sans text-gray-500 group-hover:text-gold-600 transition-colors text-center leading-tight">{label}</span>
                </Link>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <FeaturedTile title="Shop Engagement Rings" sub="Handcrafted Collection"
              image="https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=520&h=320&fit=crop"
              href="/category/engagement-rings" />
            <FeaturedTile title="Find Your Diamond" sub="GIA & IGI Certified"
              image="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=520&h=320&fit=crop"
              href="/diamonds" />
          </div>
        </div>
      </div>
    );
  }

  // Full ring-builder menu
  return (
    <div className="page-container py-8">
      {/* Top banner: two hero paths (Blue Nile style) */}
      <div className="grid grid-cols-2 gap-3 mb-7 pb-7 border-b border-gray-100">
        <Link href="/custom-ring/settings" className="group relative overflow-hidden bg-charcoal flex items-center gap-5 px-6 py-4 hover:bg-gold-800 transition-colors">
          <div className="flex-shrink-0 w-10 h-10 border border-gold-400/50 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-gold-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" />
              <path d="M12 4v2M12 18v2M4 12h2M18 12h2" />
            </svg>
          </div>
          <div>
            <p className="text-[10px] font-sans tracking-[0.2em] uppercase text-gold-400 mb-0.5">Step 1</p>
            <p className="font-serif text-base font-light text-white leading-tight">Start With a Setting</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Browse our ring mounts — then add your diamond</p>
          </div>
          <span className="ml-auto text-gold-400 text-lg">→</span>
        </Link>
        <Link href="/custom-ring/diamonds" className="group relative overflow-hidden bg-ivory border border-gray-200 flex items-center gap-5 px-6 py-4 hover:border-charcoal transition-colors">
          <div className="flex-shrink-0 w-10 h-10 border border-charcoal/30 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-charcoal/60" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 3l-4 5 10 13L22 8l-4-5H6zm1.5 2h9l2.5 3.5L12 19.5 5 8.5 7.5 5z" opacity=".7"/>
            </svg>
          </div>
          <div>
            <p className="text-[10px] font-sans tracking-[0.2em] uppercase text-gray-400 mb-0.5">Step 1</p>
            <p className="font-serif text-base font-light text-charcoal leading-tight">Start With a Diamond</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Choose your stone first — then pick a setting</p>
          </div>
          <span className="ml-auto text-charcoal/40 text-lg">→</span>
        </Link>
      </div>

      <div className="grid grid-cols-[220px_1fr_260px] gap-10">

        {/* Col 1 */}
        <div className="space-y-7">
          {/* Ring Mounts from Hanron */}
          <div>
            <h4 className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase text-gold-600 mb-3">Ring Mounts</h4>
            <ul className="space-y-2.5">
              {[
                { label: 'All Ring Settings',  href: '/custom-ring/settings',                           desc: 'Full collection' },
                { label: 'Solitaire Mounts',   href: '/custom-ring/settings?style=solitaire',           desc: 'Classic single stone' },
                { label: 'Halo Settings',      href: '/custom-ring/settings?style=halo',                desc: 'Diamond-encircled centre' },
                { label: 'Three Stone Rings',  href: '/custom-ring/settings?style=three-stone',         desc: 'Past, present & future' },
                { label: 'Pavé Band Mounts',   href: '/custom-ring/settings?style=pave',                desc: 'Diamond-set band' },
                { label: 'Vintage Styles',     href: '/custom-ring/settings?style=vintage',             desc: 'Intricate milgrain detail' },
              ].map(l => (
                <li key={l.label}>
                  <Link href={l.href} className="group block py-0.5">
                    <span className="text-sm font-sans font-medium text-charcoal group-hover:text-gold-600 transition-colors">{l.label}</span>
                    <span className="block text-[11px] text-gray-400">{l.desc}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <Link href="/category/engagement-rings" className="inline-block mt-3 text-[11px] font-sans font-semibold text-gold-600 hover:underline">
              View All Engagement Ring Settings →
            </Link>
          </div>

          <div>
            <h4 className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase text-gold-600 mb-2">By Metal</h4>
            <ul className="space-y-1.5">
              {[
                { label: 'Platinum',         href: '/custom-ring/settings?metal=platinum',    color: '#A8A8BC' },
                { label: '18ct Yellow Gold', href: '/custom-ring/settings?metal=yellow-gold', color: '#D4A843' },
                { label: '18ct White Gold',  href: '/custom-ring/settings?metal=white-gold',  color: '#D8D8D8' },
                { label: '18ct Rose Gold',   href: '/custom-ring/settings?metal=rose-gold',   color: '#E8A090' },
                { label: '9ct Gold',         href: '/custom-ring/settings?karat=9ct',         color: '#C49A2A' },
              ].map(m => (
                <li key={m.label}>
                  <Link href={m.href} className="group flex items-center gap-2 hover:text-gold-600 transition-colors">
                    <div className="w-3 h-3 rounded-full border border-gray-300 flex-shrink-0" style={{ backgroundColor: m.color }} />
                    <span className="text-xs font-sans text-charcoal group-hover:text-gold-600">{m.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase text-gold-600 mb-2">Helpful Guides</h4>
            <ul className="space-y-1.5">
              {[
                { label: 'Ring Size Guide', href: '/size-guide' },
                { label: 'Diamond Guide',   href: '/faq' },
                { label: 'Contact an Expert', href: '/contact' },
              ].map(l => (
                <li key={l.label}>
                  <Link href={l.href} className="text-xs font-sans text-gray-500 hover:text-gold-600 transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Col 2: Diamond shape grid + how it works */}
        <div className="space-y-6">
          <div>
            <h4 className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase text-gold-600 mb-4">
              Select a Diamond Shape — Preview It in Any Setting
            </h4>
            <div className="grid grid-cols-5 gap-1">
              {SHAPES.map(({ label, shape }) => (
                <Link
                  key={shape}
                  href={`/custom-ring/settings?shape=${shape}`}
                  className="group flex flex-col items-center gap-1.5 p-2 hover:bg-champagne rounded transition-colors"
                >
                  <ShapeIcon shape={shape} />
                  <span className="text-[10px] font-sans text-gray-500 group-hover:text-gold-600 transition-colors text-center leading-tight">{label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* How it works — Blue Nile-style 3-step explainer */}
          <div className="bg-champagne/50 border border-gold-200/40 p-4">
            <h4 className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase text-gold-600 mb-3">How It Works</h4>
            <div className="grid grid-cols-3 gap-3">
              {[
                { n: '1', title: 'Pick a Setting', body: 'Browse ring mounts from Hanron. Preview any diamond shape in the ring live.' },
                { n: '2', title: 'Choose a Diamond', body: 'Browse GIA & IGI-certified diamonds. See 360° views and full grading reports.' },
                { n: '3', title: 'Complete Your Ring', body: 'Select your size, add engraving, and we set the diamond for you.' },
              ].map(s => (
                <div key={s.n} className="flex gap-2.5">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-charcoal text-white text-[10px] font-sans font-bold flex items-center justify-center">{s.n}</span>
                  <div>
                    <p className="text-xs font-sans font-semibold text-charcoal leading-tight mb-0.5">{s.title}</p>
                    <p className="text-[10px] font-sans text-gray-500 leading-tight">{s.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-4 pt-2 border-t border-gray-100">
            {[
              { label: 'All Ring Settings →',  href: '/custom-ring/settings' },
              { label: 'All Diamonds →',       href: '/custom-ring/diamonds' },
              { label: 'Complete Rings →',     href: '/category/engagement-rings' },
            ].map(l => (
              <Link key={l.label} href={l.href} className="text-xs font-sans font-medium text-gold-600 hover:text-gold-800 transition-colors">{l.label}</Link>
            ))}
          </div>
        </div>

        {/* Col 3: Two featured tiles */}
        <div className="space-y-3">
          <FeaturedTile
            title="Shop Ring Mounts"
            sub="Hanron Collection"
            image="https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=520&h=320&fit=crop"
            href="/custom-ring/settings"
          />
          <FeaturedTile
            title="Design Your Own Ring"
            sub="Start With a Diamond"
            image="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=520&h=320&fit=crop"
            href="/custom-ring/diamonds"
          />
        </div>
      </div>
    </div>
  );
}

// ─── DIAMONDS ────────────────────────────────────────────────────────────────
function DiamondsMenu() {
  return (
    <div className="page-container py-8">
      <div className="grid grid-cols-[200px_1fr_260px] gap-10">
        <div>
          <h4 className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase text-gold-600 mb-3">Browse Diamonds</h4>
          <ul className="space-y-2.5">
            {[
              { label: 'All Diamonds',       href: '/diamonds' },
              { label: 'Round Brilliant',    href: '/diamonds?shape=round' },
              { label: 'Oval Cut',           href: '/diamonds?shape=oval' },
              { label: 'Princess Cut',       href: '/diamonds?shape=princess' },
              { label: 'Cushion Cut',        href: '/diamonds?shape=cushion' },
              { label: 'Emerald Cut',        href: '/diamonds?shape=emerald' },
              { label: 'Pear Shape',         href: '/diamonds?shape=pear' },
            ].map(l => (
              <li key={l.label}>
                <Link href={l.href} className="text-sm font-sans text-charcoal hover:text-gold-600 transition-colors">{l.label}</Link>
              </li>
            ))}
          </ul>
          <div className="mt-5">
            <h4 className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase text-gold-600 mb-2">Learn More</h4>
            <ul className="space-y-1.5">
              {[
                { label: 'Diamond FAQ',     href: '/faq' },
                { label: 'Size Guide',       href: '/size-guide' },
                { label: 'Contact an Expert',href: '/contact' },
              ].map(l => (
                <li key={l.label}>
                  <Link href={l.href} className="text-xs font-sans text-gray-500 hover:text-gold-600">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div>
          <h4 className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase text-gold-600 mb-4">Shop by Shape</h4>
          <div className="grid grid-cols-5 gap-1">
            {SHAPES.map(({ label, shape }) => (
              <Link
                key={shape}
                href={`/diamonds?shape=${shape}`}
                className="group flex flex-col items-center gap-1.5 p-2 hover:bg-champagne rounded transition-colors"
              >
                <ShapeIcon shape={shape} />
                <span className="text-[10px] font-sans text-gray-500 group-hover:text-gold-600 transition-colors text-center">{label}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <FeaturedTile
            title="GIA & IGI Certified"
            sub="Our Diamonds"
            image="https://images.unsplash.com/photo-1518049362265-d5b2a6467637?w=520&h=320&fit=crop"
            href="/diamonds"
          />
          <FeaturedTile
            title="Build a Custom Ring"
            sub="Start With a Diamond"
            image="https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=520&h=320&fit=crop"
            href="/custom-ring"
          />
        </div>
      </div>
    </div>
  );
}

// ─── RINGS ────────────────────────────────────────────────────────────────────
function RingsMenu() {
  return (
    <div className="page-container py-8">
      <div className="grid grid-cols-[200px_1fr_260px] gap-10">
        <div>
          <h4 className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase text-gold-600 mb-3">By Type</h4>
          <ul className="space-y-2.5">
            {[
              { label: 'Engagement Rings', href: '/category/engagement-rings' },
              { label: 'Ladies Rings',     href: '/category/ladies-rings' },
              { label: 'Gents Rings',      href: '/category/gents-rings' },
              { label: 'Wedding Bands',    href: '/category/wedding-bands' },
              { label: 'Signet Rings',     href: '/category/signet-rings' },
              { label: 'Eternity Rings',   href: '/category/eternity-rings' },
              { label: 'Baby & Children',  href: '/category/baby-rings' },
              { label: 'Silver Rings',     href: '/category/silver-rings' },
            ].map(l => (
              <li key={l.label}>
                <Link href={l.href} className="text-sm font-sans text-charcoal hover:text-gold-600 transition-colors">{l.label}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase text-gold-600 mb-3">By Metal</h4>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Platinum',          href: '/products?metal=platinum',     color: '#A8A8BC' },
              { label: '18ct Yellow Gold',  href: '/products?metal=yellow-gold',  color: '#D4A843' },
              { label: '18ct White Gold',   href: '/products?metal=white-gold',   color: '#D8D8D8' },
              { label: '18ct Rose Gold',    href: '/products?metal=rose-gold',    color: '#E8A090' },
              { label: '9ct Gold',          href: '/products?karat=9ct',          color: '#C49A2A' },
              { label: 'Silver',            href: '/products?metal=silver',       color: '#C0C0C0' },
            ].map(m => (
              <Link key={m.label} href={m.href} className="group flex items-center gap-2 hover:text-gold-600 transition-colors">
                <div className="w-4 h-4 rounded-full border border-gray-200 flex-shrink-0" style={{ backgroundColor: m.color }} />
                <span className="text-sm font-sans text-charcoal group-hover:text-gold-600">{m.label}</span>
              </Link>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <FeaturedTile
            title="Engagement Rings"
            sub="Best Sellers"
            image="https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=520&h=320&fit=crop"
            href="/category/engagement-rings"
          />
          <FeaturedTile
            title="Wedding Bands"
            sub="His & Hers"
            image="https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=520&h=320&fit=crop"
            href="/category/wedding-rings"
          />
        </div>
      </div>
    </div>
  );
}

// ─── WEDDING RINGS ────────────────────────────────────────────────────────────
function WeddingMenu() {
  return (
    <div className="page-container py-8">
      <div className="grid grid-cols-[200px_1fr_260px] gap-10">
        <div>
          <h4 className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase text-gold-600 mb-3">Women's Bands</h4>
          <ul className="space-y-2.5">
            {[
              { label: 'Diamond Wedding Rings', href: '/products?category=wedding-rings&gemstone=diamond' },
              { label: 'Plain Wedding Rings',   href: '/products?category=wedding-rings&style=plain' },
              { label: 'Eternity Rings',        href: '/category/eternity-rings' },
              { label: 'Shaped Bands',          href: '/products?category=wedding-rings&style=shaped' },
            ].map(l => (
              <li key={l.label}>
                <Link href={l.href} className="text-sm font-sans text-charcoal hover:text-gold-600 transition-colors">{l.label}</Link>
              </li>
            ))}
          </ul>
          <h4 className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase text-gold-600 mb-3 mt-5">Men's Bands</h4>
          <ul className="space-y-2.5">
            {[
              { label: 'Classic Bands',  href: '/products?category=wedding-rings&gender=men&style=classic' },
              { label: 'Diamond Rings',  href: '/products?category=wedding-rings&gender=men&gemstone=diamond' },
              { label: 'Court Shaped',   href: '/products?category=wedding-rings&style=court' },
            ].map(l => (
              <li key={l.label}>
                <Link href={l.href} className="text-sm font-sans text-charcoal hover:text-gold-600 transition-colors">{l.label}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase text-gold-600 mb-3">By Metal</h4>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Platinum',       href: '/products?metal=platinum&category=wedding-rings',    color: '#A8A8BC' },
              { label: 'Yellow Gold',    href: '/products?metal=yellow-gold&category=wedding-rings', color: '#D4A843' },
              { label: 'White Gold',     href: '/products?metal=white-gold&category=wedding-rings',  color: '#D8D8D8' },
              { label: 'Rose Gold',      href: '/products?metal=rose-gold&category=wedding-rings',   color: '#E8A090' },
            ].map(m => (
              <Link key={m.label} href={m.href} className="group flex items-center gap-2 hover:text-gold-600 transition-colors">
                <div className="w-4 h-4 rounded-full border border-gray-200 flex-shrink-0" style={{ backgroundColor: m.color }} />
                <span className="text-sm font-sans text-charcoal group-hover:text-gold-600">{m.label}</span>
              </Link>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <FeaturedTile
            title="Wedding Ring Sets"
            sub="His & Hers"
            image="https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=520&h=320&fit=crop"
            href="/products?style=set"
          />
          <FeaturedTile
            title="Diamond Bands"
            sub="Eternity Rings"
            image="https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=520&h=320&fit=crop"
            href="/category/eternity-rings"
          />
        </div>
      </div>
    </div>
  );
}

// ─── JEWELLERY ────────────────────────────────────────────────────────────────
function JewelleryMenu() {
  return (
    <div className="page-container py-8">
      <div className="grid grid-cols-[200px_1fr_260px] gap-10">
        <div>
          <h4 className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase text-gold-600 mb-3">Earrings</h4>
          <ul className="space-y-2.5">
            {[
              { label: 'Gold Earrings',   href: '/category/gold-earrings' },
              { label: 'Silver Earrings', href: '/category/silver-earrings' },
            ].map(l => (
              <li key={l.label}>
                <Link href={l.href} className="text-sm font-sans text-charcoal hover:text-gold-600 transition-colors">{l.label}</Link>
              </li>
            ))}
          </ul>
          <h4 className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase text-gold-600 mb-3 mt-5">Pendants & Chains</h4>
          <ul className="space-y-2.5">
            {[
              { label: 'Gold Pendants',   href: '/category/gold-pendants' },
              { label: 'Silver Pendants', href: '/category/silver-pendants' },
              { label: 'Gold Chains',     href: '/category/gold-chains' },
            ].map(l => (
              <li key={l.label}>
                <Link href={l.href} className="text-sm font-sans text-charcoal hover:text-gold-600 transition-colors">{l.label}</Link>
              </li>
            ))}
          </ul>
          <h4 className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase text-gold-600 mb-3 mt-5">Bracelets & Bangles</h4>
          <ul className="space-y-2.5">
            {[
              { label: 'Gold Bracelets',    href: '/category/gold-bracelets' },
              { label: 'Gold Bangles',      href: '/category/gold-bangles' },
              { label: 'Silver Bracelets',  href: '/category/silver-bracelets' },
            ].map(l => (
              <li key={l.label}>
                <Link href={l.href} className="text-sm font-sans text-charcoal hover:text-gold-600 transition-colors">{l.label}</Link>
              </li>
            ))}
          </ul>
          <h4 className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase text-gold-600 mb-3 mt-5">Diamonds</h4>
          <ul className="space-y-2.5">
            {[
              { label: 'Diamond Jewellery',  href: '/category/diamond-jewellery' },
              { label: 'Lab Grown Diamonds', href: '/category/lab-grown-diamonds' },
            ].map(l => (
              <li key={l.label}>
                <Link href={l.href} className="text-sm font-sans text-charcoal hover:text-gold-600 transition-colors">{l.label}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase text-gold-600 mb-4">Shop by Category</h4>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Gold Earrings',   href: '/category/gold-earrings',   img: 'https://images.unsplash.com/photo-1630938916408-b0021e8ac59a?w=160&h=120&fit=crop' },
              { label: 'Gold Pendants',   href: '/category/gold-pendants',   img: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=160&h=120&fit=crop' },
              { label: 'Gold Bracelets',  href: '/category/gold-bracelets',  img: 'https://images.unsplash.com/photo-1573408301185-9519f94ae4d8?w=160&h=120&fit=crop' },
              { label: 'New Arrivals',    href: '/products?isNew=true',      img: 'https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=160&h=120&fit=crop' },
            ].map(c => (
              <Link key={c.label} href={c.href} className="group relative overflow-hidden">
                <div className="relative h-20 overflow-hidden rounded">
                  <Image src={c.img} alt={c.label} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-charcoal/30 group-hover:bg-charcoal/20 transition-colors" />
                  <div className="absolute inset-0 flex items-end p-2">
                    <span className="text-xs font-sans font-medium text-white">{c.label}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <FeaturedTile
            title="New Arrivals"
            sub="Just In"
            image="https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=520&h=320&fit=crop"
            href="/products?isNew=true"
          />
          <FeaturedTile
            title="Diamond Jewellery"
            sub="Ethically Sourced"
            image="https://images.unsplash.com/photo-1518049362265-d5b2a6467637?w=520&h=320&fit=crop"
            href="/category/diamond-jewellery"
          />
        </div>
      </div>
    </div>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────
export default function MegaMenu({ activeMenu }: { activeMenu: string }) {
  return (
    <div className="absolute top-full left-0 right-0 bg-ivory border-t border-gray-200 shadow-2xl z-50 animate-fade-in">
      {activeMenu === 'Engagement Rings' && <EngagementMenu />}
      {activeMenu === 'Diamonds'         && <DiamondsMenu />}
      {activeMenu === 'Rings'            && <RingsMenu />}
      {activeMenu === 'Wedding Rings'    && <WeddingMenu />}
      {activeMenu === 'Jewellery'        && <JewelleryMenu />}
    </div>
  );
}
