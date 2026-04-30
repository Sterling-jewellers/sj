import Link from 'next/link';
import Image from 'next/image';

export default function PromoBanner() {
  return (
    <section className="py-0">
      <div className="grid grid-cols-1 md:grid-cols-2">
        {/* Left - Diamond search */}
        <div className="relative h-80 md:h-96 group overflow-hidden">
          <Image
            src="https://images.unsplash.com/photo-1543294001-f7cd5d7fb516?w=800&h=600&fit=crop"
            alt="Diamond Search"
            fill className="object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-charcoal/50" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center p-8">
            <p className="section-subtitle text-gold-300 mb-3">Over 10,000 Stones</p>
            <h3 className="font-serif text-4xl font-light mb-4">Find Your Diamond</h3>
            <p className="text-sm font-sans text-gray-300 mb-6 max-w-xs">Search GIA & IGI certified diamonds by shape, carat, cut, colour and clarity.</p>
            <Link href="/diamonds" className="btn-gold">Search Diamonds</Link>
          </div>
        </div>

        {/* Right - Custom ring */}
        <div className="relative h-80 md:h-96 group overflow-hidden bg-champagne">
          <Image
            src="https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=800&h=600&fit=crop"
            alt="Custom Ring Builder"
            fill className="object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gold-500/30" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center p-8">
            <p className="section-subtitle text-white/80 mb-3">Made For You</p>
            <h3 className="font-serif text-4xl font-light mb-4">Create Your Ring</h3>
            <p className="text-sm font-sans text-white/80 mb-6 max-w-xs">Choose your setting, select your diamond, and create the ring of your dreams.</p>
            <Link href="/custom-ring" className="btn-dark">Start Building</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
