'use client';

import Link from 'next/link';
import Image from 'next/image';

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
  return (
    <div className="page-container py-8">
      <div className="grid grid-cols-[200px_1fr_260px] gap-10">

        {/* Col 1 */}
        <div className="space-y-7">
          <div>
            <h4 className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase text-gold-600 mb-3">Design Your Own Ring</h4>
            <ul className="space-y-2.5">
              {[
                { label: 'Start With a Setting', href: '/custom-ring',  desc: 'Pick a style first' },
                { label: 'Start With a Diamond', href: '/diamonds',      desc: 'Choose your stone first' },
                { label: 'Creative Studio',       href: '/custom-ring',  desc: 'Full customisation' },
              ].map(l => (
                <li key={l.label}>
                  <Link href={l.href} className="group block py-1">
                    <span className="text-sm font-sans font-medium text-charcoal group-hover:text-gold-600 transition-colors">{l.label}</span>
                    <span className="block text-[11px] text-gray-400">{l.desc}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase text-gold-600 mb-3">By Metal</h4>
            <ul className="space-y-2">
              {[
                { label: 'Platinum',          href: '/products?metal=platinum' },
                { label: '18ct Yellow Gold',  href: '/products?metal=yellow-gold' },
                { label: '18ct White Gold',   href: '/products?metal=white-gold' },
                { label: '18ct Rose Gold',    href: '/products?metal=rose-gold' },
                { label: '9ct Gold',          href: '/products?metal=yellow-gold&karat=9ct' },
              ].map(l => (
                <li key={l.label}>
                  <Link href={l.href} className="text-sm font-sans text-charcoal hover:text-gold-600 transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase text-gold-600 mb-2">Helpful Guides</h4>
            <ul className="space-y-1.5">
              {[
                { label: 'Ring Size Guide', href: '/size-guide' },
                { label: 'FAQs',            href: '/faq' },
                { label: 'Contact Us',      href: '/contact' },
              ].map(l => (
                <li key={l.label}>
                  <Link href={l.href} className="text-xs font-sans text-gray-500 hover:text-gold-600 transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Col 2: Shape grid + style links */}
        <div className="space-y-6">
          <div>
            <h4 className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase text-gold-600 mb-4">Shop by Diamond Shape</h4>
            <div className="grid grid-cols-5 gap-1">
              {SHAPES.map(({ label, shape }) => (
                <Link
                  key={shape}
                  href={`/diamonds?shape=${shape}`}
                  className="group flex flex-col items-center gap-1.5 p-2 hover:bg-champagne rounded transition-colors"
                >
                  <ShapeIcon shape={shape} />
                  <span className="text-[10px] font-sans text-gray-500 group-hover:text-gold-600 transition-colors text-center leading-tight">{label}</span>
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase text-gold-600 mb-3">Shop by Style</h4>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Solitaire',    href: '/products?style=solitaire',   img: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=120&h=80&fit=crop' },
                { label: 'Halo',         href: '/products?style=halo',        img: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=120&h=80&fit=crop' },
                { label: 'Three Stone',  href: '/products?style=three-stone', img: 'https://images.unsplash.com/photo-1603974372039-adc49044b6bd?w=120&h=80&fit=crop' },
                { label: 'Vintage',      href: '/products?style=vintage',     img: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=120&h=80&fit=crop' },
                { label: 'Pavé',         href: '/products?style=pave',        img: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=120&h=80&fit=crop' },
                { label: 'Cluster',      href: '/products?style=cluster',     img: 'https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=120&h=80&fit=crop' },
              ].map(s => (
                <Link key={s.label} href={s.href} className="group flex items-center gap-2 p-1.5 hover:bg-champagne rounded transition-colors">
                  <div className="relative w-10 h-10 flex-shrink-0 overflow-hidden rounded">
                    <Image src={s.img} alt={s.label} fill className="object-cover group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <span className="text-xs font-sans font-medium text-charcoal group-hover:text-gold-600 transition-colors">{s.label}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="flex gap-4 pt-2 border-t border-gray-100">
            {[
              { label: 'Best Sellers →',  href: '/products?sort=bestsellers' },
              { label: 'New Arrivals →',  href: '/products?isNew=true' },
              { label: 'View All →',      href: '/category/engagement-rings' },
            ].map(l => (
              <Link key={l.label} href={l.href} className="text-xs font-sans font-medium text-gold-600 hover:text-gold-800 transition-colors">{l.label}</Link>
            ))}
          </div>
        </div>

        {/* Col 3: Two featured tiles */}
        <div className="space-y-3">
          <FeaturedTile
            title="Top Engagement Rings"
            sub="Explore"
            image="https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=520&h=320&fit=crop"
            href="/category/engagement-rings"
          />
          <FeaturedTile
            title="Design Your Own Ring"
            sub="Creative Studio"
            image="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=520&h=320&fit=crop"
            href="/custom-ring"
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
              { label: 'Wedding Rings',    href: '/category/wedding-rings' },
              { label: 'Eternity Rings',   href: '/category/eternity-rings' },
              { label: 'Dress Rings',      href: '/products?category=dress-rings' },
              { label: "Men's Rings",      href: '/products?gender=men' },
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
          <h4 className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase text-gold-600 mb-3">Necklaces</h4>
          <ul className="space-y-2.5">
            {[
              { label: 'Diamond Necklaces',  href: '/products?category=necklaces' },
              { label: 'Gold Necklaces',     href: '/products?category=necklaces&metal=yellow-gold' },
              { label: 'Pendants',           href: '/products?category=pendants' },
            ].map(l => (
              <li key={l.label}>
                <Link href={l.href} className="text-sm font-sans text-charcoal hover:text-gold-600 transition-colors">{l.label}</Link>
              </li>
            ))}
          </ul>
          <h4 className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase text-gold-600 mb-3 mt-5">Earrings</h4>
          <ul className="space-y-2.5">
            {[
              { label: 'Diamond Studs',  href: '/products?category=earrings&style=studs' },
              { label: 'Hoops',          href: '/products?category=earrings&style=hoops' },
              { label: 'Drop Earrings',  href: '/products?category=earrings&style=drop' },
            ].map(l => (
              <li key={l.label}>
                <Link href={l.href} className="text-sm font-sans text-charcoal hover:text-gold-600 transition-colors">{l.label}</Link>
              </li>
            ))}
          </ul>
          <h4 className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase text-gold-600 mb-3 mt-5">Bracelets</h4>
          <ul className="space-y-2.5">
            {[
              { label: 'Tennis Bracelets', href: '/products?category=bracelets&style=tennis' },
              { label: 'Bangles',          href: '/products?category=bracelets&style=bangle' },
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
              { label: 'Necklaces',   href: '/products?category=necklaces',  img: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=160&h=120&fit=crop' },
              { label: 'Earrings',    href: '/products?category=earrings',   img: 'https://images.unsplash.com/photo-1630938916408-b0021e8ac59a?w=160&h=120&fit=crop' },
              { label: 'Bracelets',   href: '/products?category=bracelets',  img: 'https://images.unsplash.com/photo-1573408301185-9519f94ae4d8?w=160&h=120&fit=crop' },
              { label: 'New Arrivals',href: '/products?isNew=true',          img: 'https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=160&h=120&fit=crop' },
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
            title="Gifts"
            sub="For Her"
            image="https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=520&h=320&fit=crop"
            href="/category/gifts"
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
