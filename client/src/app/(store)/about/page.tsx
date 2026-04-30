import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'About Us', description: 'The story behind Sterling Jewellers Ltd — crafting fine jewellery since 1987.' };

export default function AboutPage() {
  return (
    <div className="bg-ivory">
      {/* Hero */}
      <div className="relative h-72 md:h-96 overflow-hidden">
        <Image src="https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=1600&h=600&fit=crop" alt="About Sterling Jewellers" fill className="object-cover" />
        <div className="absolute inset-0 bg-charcoal/60" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center">
          <p className="section-subtitle text-gold-300 mb-3">Our Story</p>
          <h1 className="font-serif text-5xl font-light">About Sterling Jewellers</h1>
        </div>
      </div>

      <div className="page-container py-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center mb-20">
          <div>
            <p className="section-subtitle mb-4">Est. 1987</p>
            <h2 className="section-title mb-6">A Legacy of Craftsmanship</h2>
            <div className="w-12 h-0.5 bg-gold-400 mb-6" />
            <p className="text-sm font-sans text-gray-600 leading-relaxed mb-4">
              Sterling Jewellers was founded in 1987 on Bond Street, London, with a simple belief: that every piece of jewellery should tell a story. For over 35 years, we've been creating exquisite pieces that mark life's most precious moments.
            </p>
            <p className="text-sm font-sans text-gray-600 leading-relaxed mb-6">
              From our flagship boutique in London's jewellery quarter, our master craftsmen handcraft each piece using ethically sourced diamonds, platinum, and precious gold. Every ring, necklace, and bracelet is a work of art designed to be cherished for generations.
            </p>
            <Link href="/products" className="btn-outline-gold inline-block">Explore Our Collections</Link>
          </div>
          <div className="relative h-96">
            <Image src="https://images.unsplash.com/photo-1543294001-f7cd5d7fb516?w=700&h=600&fit=crop" alt="Our Craftsmen" fill className="object-cover" />
          </div>
        </div>

        {/* Values */}
        <div className="text-center mb-14">
          <h2 className="section-title">Our Values</h2>
          <div className="gold-divider mt-4" />
        </div>
        <div className="grid md:grid-cols-3 gap-10 mb-20">
          {[
            { title: 'Ethical Sourcing', body: 'All our diamonds are conflict-free, certified by the Kimberley Process. We work exclusively with suppliers who meet the highest ethical and environmental standards.' },
            { title: 'Master Craftsmanship', body: 'Our jewellers are third-generation craftsmen who have trained for decades. Every piece is handcrafted and quality-checked before it leaves our workshop.' },
            { title: 'Lifetime Guarantee', body: 'We stand behind everything we create. Every piece comes with our comprehensive lifetime guarantee covering craftsmanship and manufacturing defects.' },
          ].map((v) => (
            <div key={v.title} className="text-center">
              <div className="w-12 h-0.5 bg-gold-400 mx-auto mb-5" />
              <h3 className="font-serif text-xl text-charcoal mb-3">{v.title}</h3>
              <p className="text-sm font-sans text-gray-600 leading-relaxed">{v.body}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="bg-charcoal text-white text-center py-16 px-8">
          <h2 className="font-serif text-4xl font-light mb-4">Visit Our London Boutique</h2>
          <p className="text-sm font-sans text-gray-300 mb-6">48 Bond Street, London, W1S 1RB · Mon–Sat 9am–6pm · Sun 11am–5pm</p>
          <Link href="/contact" className="btn-gold inline-block">Book a Consultation</Link>
        </div>
      </div>
    </div>
  );
}
