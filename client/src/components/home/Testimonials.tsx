'use client';

import { Star, Quote } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const testimonials = [
  { name: 'Sarah & James', location: 'London', rating: 5, text: 'Sterling Jewellers made our engagement ring dreams a reality. The custom builder was so easy to use, and the ring arrived beautifully packaged. Absolutely stunning quality.', ring: 'Round Brilliant Solitaire, Platinum' },
  { name: 'Emily Thompson', location: 'Manchester', rating: 5, text: 'I used the diamond search and found the perfect stone within minutes. The service was exceptional — they even helped me choose the best setting to complement my diamond.', ring: 'Oval Diamond Halo, 18ct White Gold' },
  { name: 'Michael & Claire', location: 'Edinburgh', rating: 5, text: 'Our matching wedding bands are absolutely perfect. The engraving was done beautifully and the packaging made it feel extra special. Will definitely be coming back.', ring: 'Court Shaped Wedding Bands, Platinum' },
  { name: 'Rachel Davies', location: 'Bristol', rating: 5, text: 'Bought a diamond necklace as a gift and it was beyond perfect. The quality is outstanding for the price. Free delivery was a bonus. 10/10 experience!', ring: 'Diamond Pendant, 18ct Yellow Gold' },
];

export default function Testimonials() {
  const [active, setActive] = useState(0);

  return (
    <section className="py-28 bg-white">
      <div className="page-container">
        <div className="text-center mb-14">
          <p className="section-subtitle mb-3">Customer Stories</p>
          <h2 className="section-title">What Our Customers Say</h2>
          <div className="gold-divider mt-4" />
        </div>

        <div className="max-w-3xl mx-auto">
          {/* Active testimonial */}
          <div className="text-center px-6 md:px-12">
            <Quote size={40} className="text-gold-200 mx-auto mb-6" />
            <div className="flex justify-center gap-1 mb-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={16} className="text-gold-400 fill-gold-400" />
              ))}
            </div>
            <p className="font-serif text-xl font-light text-charcoal leading-relaxed mb-6 italic">
              "{testimonials[active].text}"
            </p>
            <p className="font-sans font-medium text-charcoal text-sm">{testimonials[active].name}</p>
            <p className="font-sans text-xs text-gray-500 mt-1">{testimonials[active].location}</p>
            <p className="font-sans text-xs text-gold-600 mt-1 italic">{testimonials[active].ring}</p>
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={cn('transition-all duration-300', i === active ? 'w-8 h-1 bg-gold-500' : 'w-2 h-1 bg-gray-200 hover:bg-gold-300')}
              />
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-8 mt-16 pt-12 border-t border-gray-100">
          {[
            { num: '4.9/5', label: 'Average Rating', sub: 'Based on 2,400+ reviews' },
            { num: '98%', label: 'Would Recommend', sub: 'To friends & family' },
            { num: '15,000+', label: 'Happy Customers', sub: 'Across the UK' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="font-serif text-4xl font-light text-gold-600">{stat.num}</p>
              <p className="font-sans font-medium text-sm text-charcoal mt-2">{stat.label}</p>
              <p className="font-sans text-xs text-gray-400 mt-1">{stat.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
