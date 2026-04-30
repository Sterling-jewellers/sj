import Link from 'next/link';
import Image from 'next/image';

const categories = [
  { name: 'Engagement Rings', image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&h=700&fit=crop', href: '/category/engagement-rings', count: '200+ styles' },
  { name: 'Wedding Rings', image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&h=700&fit=crop', href: '/category/wedding-rings', count: '150+ styles' },
  { name: 'Eternity Rings', image: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=600&h=700&fit=crop', href: '/category/eternity-rings', count: '80+ styles' },
  { name: 'Fine Jewellery', image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&h=700&fit=crop', href: '/category/jewellery', count: '300+ pieces' },
];

export default function CategoryGrid() {
  return (
    <section className="py-20 bg-ivory">
      <div className="page-container">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="section-subtitle mb-3">Our Collections</p>
          <h2 className="section-title">Shop By Category</h2>
          <div className="gold-divider mt-4" />
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <Link key={cat.name} href={cat.href} className="group relative overflow-hidden aspect-[3/4] block">
              <Image
                src={cat.image}
                alt={cat.name}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                <h3 className="font-serif text-xl font-light">{cat.name}</h3>
                <p className="text-xs font-sans tracking-widest uppercase text-gold-300 mt-1">{cat.count}</p>
                <div className="h-0.5 bg-gold-400 mt-3 w-0 group-hover:w-full transition-all duration-500" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
