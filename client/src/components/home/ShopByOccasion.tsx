import Link from 'next/link';

const OCCASIONS = [
  {
    label: 'Engagement',
    href:  '/category/engagement-rings',
    image: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=400&h=500&fit=crop',
  },
  {
    label: 'Wedding',
    href:  '/category/wedding-rings',
    image: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=400&h=500&fit=crop',
  },
  {
    label: 'Gifts',
    href:  '/products',
    image: 'https://images.unsplash.com/photo-1630938916408-b0021e8ac59a?w=400&h=500&fit=crop',
  },
  {
    label: 'Fine Jewellery',
    href:  '/category/jewellery',
    image: 'https://images.unsplash.com/photo-1573408301185-9519f94ae4d8?w=400&h=500&fit=crop',
  },
];

export default function ShopByOccasion() {
  return (
    <section className="py-20 bg-white">
      <div className="page-container">
        <div className="text-center mb-12">
          <h2 className="section-title">Shop By Occasion</h2>
          <div className="gold-divider mt-4" />
        </div>
      </div>

      <div className="page-container">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {OCCASIONS.map(({ label, href, image }) => (
            <Link
              key={label}
              href={href}
              className="group block overflow-hidden"
            >
              {/* Image — 4/5 of tile height */}
              <div className="relative overflow-hidden bg-gray-100" style={{ aspectRatio: '4/5' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image}
                  alt={label}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>

              {/* Text strip */}
              <div className="bg-white px-3 py-4 text-center border-t border-gray-100">
                <p className="font-serif text-base font-light text-black tracking-wide">
                  {label}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
