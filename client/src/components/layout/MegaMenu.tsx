import Link from 'next/link';
import Image from 'next/image';

const menuData: Record<string, { columns: { title: string; links: { label: string; href: string }[] }[]; featured: { title: string; image: string; href: string } }> = {
  'Engagement Rings': {
    columns: [
      {
        title: 'By Style',
        links: [
          { label: 'Solitaire Rings', href: '/products?style=solitaire' },
          { label: 'Halo Rings', href: '/products?style=halo' },
          { label: 'Three Stone Rings', href: '/products?style=three-stone' },
          { label: 'Vintage Rings', href: '/products?style=vintage' },
          { label: 'Cluster Rings', href: '/products?style=cluster' },
          { label: 'Pavé Rings', href: '/products?style=pave' },
        ],
      },
      {
        title: 'By Metal',
        links: [
          { label: 'Platinum', href: '/products?metal=platinum' },
          { label: '18ct Yellow Gold', href: '/products?metal=yellow-gold&karat=18ct' },
          { label: '18ct White Gold', href: '/products?metal=white-gold&karat=18ct' },
          { label: '18ct Rose Gold', href: '/products?metal=rose-gold&karat=18ct' },
          { label: '9ct Gold', href: '/products?metal=yellow-gold&karat=9ct' },
        ],
      },
      {
        title: 'By Diamond Shape',
        links: [
          { label: 'Round Brilliant', href: '/products?gemstone=round' },
          { label: 'Oval Cut', href: '/products?gemstone=oval' },
          { label: 'Princess Cut', href: '/products?gemstone=princess' },
          { label: 'Cushion Cut', href: '/products?gemstone=cushion' },
          { label: 'Emerald Cut', href: '/products?gemstone=emerald' },
          { label: 'Pear Shape', href: '/products?gemstone=pear' },
        ],
      },
    ],
    featured: {
      title: 'Create Your Own Ring',
      image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400&h=300&fit=crop',
      href: '/custom-ring',
    },
  },
  'Wedding Rings': {
    columns: [
      {
        title: 'Women\'s Wedding Rings',
        links: [
          { label: 'Diamond Wedding Rings', href: '/products?category=wedding-rings&gender=women&gemstone=diamond' },
          { label: 'Plain Wedding Rings', href: '/products?category=wedding-rings&gender=women&style=plain' },
          { label: 'Eternity Rings', href: '/category/eternity-rings' },
          { label: 'Shaped Wedding Rings', href: '/products?category=wedding-rings&style=shaped' },
        ],
      },
      {
        title: 'Men\'s Wedding Rings',
        links: [
          { label: 'Classic Bands', href: '/products?category=wedding-rings&gender=men&style=classic' },
          { label: 'Diamond Rings', href: '/products?category=wedding-rings&gender=men&gemstone=diamond' },
          { label: 'Court Shaped', href: '/products?category=wedding-rings&style=court' },
          { label: 'Flat Shaped', href: '/products?category=wedding-rings&style=flat' },
        ],
      },
    ],
    featured: {
      title: 'Wedding Ring Sets',
      image: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=400&h=300&fit=crop',
      href: '/products?style=set',
    },
  },
  Jewellery: {
    columns: [
      {
        title: 'Necklaces & Pendants',
        links: [
          { label: 'Diamond Necklaces', href: '/products?category=necklaces' },
          { label: 'Gold Necklaces', href: '/products?category=necklaces&metal=yellow-gold' },
          { label: 'Pendants', href: '/products?category=pendants' },
        ],
      },
      {
        title: 'Earrings',
        links: [
          { label: 'Diamond Earrings', href: '/products?category=earrings' },
          { label: 'Stud Earrings', href: '/products?category=earrings&style=studs' },
          { label: 'Hoop Earrings', href: '/products?category=earrings&style=hoops' },
        ],
      },
      {
        title: 'Bracelets',
        links: [
          { label: 'Tennis Bracelets', href: '/products?category=bracelets&style=tennis' },
          { label: 'Bangles', href: '/products?category=bracelets&style=bangle' },
          { label: 'Chain Bracelets', href: '/products?category=bracelets&style=chain' },
        ],
      },
    ],
    featured: {
      title: 'New Arrivals',
      image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&h=300&fit=crop',
      href: '/products?isNew=true',
    },
  },
};

export default function MegaMenu({ activeMenu }: { activeMenu: string }) {
  const data = menuData[activeMenu];
  if (!data) return null;

  return (
    <div className="absolute top-full left-0 right-0 bg-ivory border-t border-gray-200 shadow-2xl z-50 animate-fade-in">
      <div className="page-container py-10">
        <div className="flex gap-12">
          {/* Columns */}
          <div className="flex gap-12 flex-1">
            {data.columns.map((col) => (
              <div key={col.title}>
                <h4 className="text-xs font-sans font-semibold tracking-widest uppercase text-gold-600 mb-4">{col.title}</h4>
                <ul className="space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link href={link.href} className="text-sm font-sans text-charcoal hover:text-gold-600 transition-colors">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Featured image */}
          <div className="w-72 flex-shrink-0">
            <Link href={data.featured.href} className="group block relative overflow-hidden">
              <div className="relative h-48 w-full overflow-hidden">
                <Image
                  src={data.featured.image}
                  alt={data.featured.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-charcoal/30 group-hover:bg-charcoal/20 transition-colors" />
                <div className="absolute bottom-4 left-4 text-white">
                  <p className="font-serif text-xl font-light">{data.featured.title}</p>
                  <p className="text-xs font-sans tracking-widest uppercase mt-1 text-gold-300">Shop Now →</p>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Bottom link */}
        <div className="mt-6 pt-6 border-t border-gray-200 flex justify-between items-center">
          <Link href={`/category/${activeMenu.toLowerCase().replace(/ /g, '-')}`} className="text-xs font-sans tracking-widest uppercase text-gold-600 hover:text-gold-700 font-medium">
            View All {activeMenu} →
          </Link>
        </div>
      </div>
    </div>
  );
}
