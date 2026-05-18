import Link from 'next/link';

interface Category {
  _id: string;
  name: string;
  slug: string;
  image: string;
}

/* ── Curated luxury Unsplash images per category slug ────────────────────── */
const CATEGORY_IMAGES: Record<string, string> = {
  'engagement-rings':  'https://images.unsplash.com/photo-1586105251261-72a756497a11?w=600&h=800&fit=crop&q=85',
  'wedding-rings':     'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=600&h=800&fit=crop&q=85',
  'wedding-bands':     'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&h=800&fit=crop&q=85',
  'eternity-rings':    'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&h=800&fit=crop&q=85',
  'ladies-rings':      'https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?w=600&h=800&fit=crop&q=85',
  'gents-rings':       'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&h=800&fit=crop&q=85',
  'signet-rings':      'https://images.unsplash.com/photo-1603974372039-adc49044b6bd?w=600&h=800&fit=crop&q=85',
  'baby-rings':        'https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?w=600&h=800&fit=crop&q=85',
  'necklaces':         'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&h=800&fit=crop&q=85',
  'gold-earrings':     'https://images.unsplash.com/photo-1630938916408-b0021e8ac59a?w=600&h=800&fit=crop&q=85',
  'silver-earrings':   'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=600&h=800&fit=crop&q=85',
  'earrings':          'https://images.unsplash.com/photo-1630938916408-b0021e8ac59a?w=600&h=800&fit=crop&q=85',
  'gold-pendants':     'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&h=800&fit=crop&q=85',
  'silver-pendants':   'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=600&h=800&fit=crop&q=85',
  'pendants':          'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&h=800&fit=crop&q=85',
  'gold-bracelets':    'https://images.unsplash.com/photo-1573408301185-9519f94ae4d8?w=600&h=800&fit=crop&q=85',
  'silver-bracelets':  'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=600&h=800&fit=crop&q=85',
  'bracelets':         'https://images.unsplash.com/photo-1573408301185-9519f94ae4d8?w=600&h=800&fit=crop&q=85',
  'gold-bangles':      'https://images.unsplash.com/photo-1573408301185-9519f94ae4d8?w=600&h=800&fit=crop&q=85',
  'bangles':           'https://images.unsplash.com/photo-1573408301185-9519f94ae4d8?w=600&h=800&fit=crop&q=85',
  'gold-chains':       'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=600&h=800&fit=crop&q=85',
  'chains':            'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=600&h=800&fit=crop&q=85',
  'silver-rings':      'https://images.unsplash.com/photo-1608042314453-ae338d682c93?w=600&h=800&fit=crop&q=85',
  'diamond-jewellery': 'https://images.unsplash.com/photo-1518049362265-d5b2a6467637?w=600&h=800&fit=crop&q=85',
  'jewellery':         'https://images.unsplash.com/photo-1601121141461-9d6647bef0a1?w=600&h=800&fit=crop&q=85',
  'rings':             'https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?w=600&h=800&fit=crop&q=85',
};

const FALLBACK = 'https://images.unsplash.com/photo-1601121141461-9d6647bef0a1?w=600&h=800&fit=crop&q=85';

async function fetchCategories(): Promise<Category[]> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/categories`,
      { next: { revalidate: 300 } },
    );
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export default async function CategoryGrid() {
  const categories = await fetchCategories();
  const display    = categories.slice(0, 8);

  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="page-container">
        <div className="text-center mb-12">
          <p className="section-subtitle mb-3">Our World</p>
          <h2 className="section-title">Collections</h2>
          <div className="gold-divider mt-4" />
        </div>
      </div>

      {/* Horizontal scroll on mobile / 4-col grid on desktop */}
      <div className="px-4 sm:px-6 lg:page-container">
        <div
          className="flex gap-4 overflow-x-auto pb-4 lg:pb-0 snap-x snap-mandatory
                     lg:overflow-visible lg:grid lg:grid-cols-4 lg:gap-5"
          style={{ scrollbarWidth: 'none' }}
        >
          {display.map((cat) => {
            /* Always use our curated map — DB images vary in quality/domain */
            const img = CATEGORY_IMAGES[cat.slug] || FALLBACK;

            return (
              <Link
                key={cat._id}
                href={`/category/${cat.slug}`}
                className="block flex-shrink-0 w-56 sm:w-64 lg:w-auto snap-start group"
              >
                {/* Image — using plain <img> so Unsplash URLs always load */}
                <div className="relative overflow-hidden bg-gray-100" style={{ aspectRatio: '3/4' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img}
                    alt={cat.name}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-charcoal/0 group-hover:bg-charcoal/15 transition-colors duration-500" />
                </div>

                {/* Name strip — ivory, below image */}
                <div className="bg-[#F5F3EE] px-3 pt-4 pb-5 text-center">
                  <p className="font-serif text-base font-light text-charcoal tracking-wide">
                    {cat.name}
                  </p>
                  <div className="h-px bg-gold-400 mt-2 mx-auto w-0 group-hover:w-8 transition-all duration-500" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* CTA */}
      <div className="text-center mt-10 page-container">
        <Link href="/products" className="btn-outline-gold text-xs tracking-widest uppercase">
          View All Collections
        </Link>
      </div>
    </section>
  );
}
