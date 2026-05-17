import Link from 'next/link';
import Image from 'next/image';

interface Category {
  _id: string;
  name: string;
  slug: string;
  image: string;
  description?: string;
}

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&h=700&fit=crop';

const CATEGORY_IMAGES: Record<string, string> = {
  'engagement-rings':  'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&h=700&fit=crop',
  'wedding-rings':     'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&h=700&fit=crop',
  'wedding-bands':     'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=600&h=700&fit=crop',
  'eternity-rings':    'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=600&h=700&fit=crop',
  'ladies-rings':      'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&h=700&fit=crop',
  'gents-rings':       'https://images.unsplash.com/photo-1603974372039-adc49044b6bd?w=600&h=700&fit=crop',
  'signet-rings':      'https://images.unsplash.com/photo-1603974372039-adc49044b6bd?w=600&h=700&fit=crop',
  'baby-rings':        'https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?w=600&h=700&fit=crop',
  'gold-earrings':     'https://images.unsplash.com/photo-1630938916408-b0021e8ac59a?w=600&h=700&fit=crop',
  'silver-earrings':   'https://images.unsplash.com/photo-1630938916408-b0021e8ac59a?w=600&h=700&fit=crop',
  'gold-pendants':     'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&h=700&fit=crop',
  'silver-pendants':   'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&h=700&fit=crop',
  'gold-bracelets':    'https://images.unsplash.com/photo-1573408301185-9519f94ae4d8?w=600&h=700&fit=crop',
  'silver-bracelets':  'https://images.unsplash.com/photo-1573408301185-9519f94ae4d8?w=600&h=700&fit=crop',
  'gold-bangles':      'https://images.unsplash.com/photo-1573408301185-9519f94ae4d8?w=600&h=700&fit=crop',
  'gold-chains':       'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=600&h=700&fit=crop',
  'silver-rings':      'https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?w=600&h=700&fit=crop',
  'diamond-jewellery': 'https://images.unsplash.com/photo-1518049362265-d5b2a6467637?w=600&h=700&fit=crop',
  'lab-grown-diamonds':'https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=600&h=700&fit=crop',
  'jewellery':         'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&h=700&fit=crop',
};

async function fetchCategories(): Promise<Category[]> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/categories`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export default async function CategoryGrid() {
  const categories = await fetchCategories();

  // Show first 8 active categories sorted by sortOrder
  const display = categories.slice(0, 8);

  // Grid layout: first 4 large, rest small — or all equal if fewer than 5
  const large = display.slice(0, 4);
  const small = display.slice(4);

  return (
    <section className="py-28 bg-white">
      <div className="page-container">
        <div className="text-center mb-12">
          <p className="section-subtitle mb-3">Our Collections</p>
          <h2 className="section-title">Shop By Category</h2>
          <div className="gold-divider mt-4" />
        </div>

        {/* Primary 4-column row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {large.map((cat) => {
            const img = (cat.image && !cat.image.startsWith('/images/')) ? cat.image : (CATEGORY_IMAGES[cat.slug] || FALLBACK_IMAGE);
            return (
              <Link key={cat._id} href={`/category/${cat.slug}`} className="group relative overflow-hidden aspect-[3/4] block">
                <Image src={img} alt={cat.name} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                  <h3 className="font-serif text-xl font-light">{cat.name}</h3>
                  <div className="h-0.5 bg-gold-400 mt-3 w-0 group-hover:w-full transition-all duration-500" />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Secondary row for extra categories */}
        {small.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
            {small.map((cat) => {
              const img = (cat.image && !cat.image.startsWith('/images/')) ? cat.image : (CATEGORY_IMAGES[cat.slug] || FALLBACK_IMAGE);
              return (
                <Link key={cat._id} href={`/category/${cat.slug}`} className="group relative overflow-hidden aspect-[4/3] block">
                  <Image src={img} alt={cat.name} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <h3 className="font-serif text-base font-light">{cat.name}</h3>
                    <div className="h-0.5 bg-gold-400 mt-2 w-0 group-hover:w-full transition-all duration-500" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <div className="text-center mt-8">
          <Link href="/products" className="btn-outline-gold text-xs tracking-widest uppercase">
            View All Collections
          </Link>
        </div>
      </div>
    </section>
  );
}
