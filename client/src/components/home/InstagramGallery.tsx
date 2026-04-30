import Image from 'next/image';
import { Instagram } from 'lucide-react';

const posts = [
  'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1543294001-f7cd5d7fb516?w=400&h=400&fit=crop',
];

export default function InstagramGallery() {
  return (
    <section className="py-0">
      <div className="text-center py-10 bg-champagne">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Instagram size={20} className="text-gold-500" />
          <a href="#" className="font-sans text-sm font-medium tracking-widest uppercase text-gold-600 hover:text-gold-700">@sterlingjewellers</a>
        </div>
        <p className="text-xs font-sans text-gray-500">Follow us for daily inspiration</p>
      </div>
      <div className="grid grid-cols-3 md:grid-cols-6">
        {posts.map((src, i) => (
          <a key={i} href="#" className="relative aspect-square block group overflow-hidden">
            <Image src={src} alt={`Instagram post ${i + 1}`} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
            <div className="absolute inset-0 bg-charcoal/0 group-hover:bg-charcoal/40 transition-colors flex items-center justify-center">
              <Instagram size={24} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
