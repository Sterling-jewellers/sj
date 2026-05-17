import Link from 'next/link';
import Image from 'next/image';

const steps = [
  { num: '01', title: 'Choose a Setting', desc: 'Browse 200+ ring settings in platinum, gold and more.' },
  { num: '02', title: 'Select a Diamond', desc: 'Pick from 10,000+ GIA & IGI certified diamonds.' },
  { num: '03', title: 'Personalise It', desc: 'Add engraving, choose metal and finalise your creation.' },
];

export default function RingBuilderCTA() {
  return (
    <section className="py-28 bg-charcoal text-white">
      <div className="page-container">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Image */}
          <div className="relative aspect-square max-w-lg mx-auto w-full">
            <Image
              src="https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=700&h=700&fit=crop"
              alt="Custom Ring Builder"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 border border-gold-500/30" />
            <div className="absolute -bottom-4 -right-4 w-24 h-24 border border-gold-500 bg-charcoal flex items-center justify-center">
              <div className="text-center">
                <p className="font-serif text-2xl text-gold-400">3</p>
                <p className="text-[8px] font-sans tracking-widest uppercase text-gray-400">Easy Steps</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div>
            <p className="section-subtitle text-gold-400 mb-4">Our Signature Experience</p>
            <h2 className="font-serif text-5xl font-light text-white mb-6">Build Your Dream Engagement Ring</h2>
            <p className="text-sm font-sans text-gray-400 leading-relaxed mb-10">
              Design a bespoke ring that tells your unique love story. Start with a setting, choose your diamond, and create something truly yours — all from the comfort of your home.
            </p>

            <div className="space-y-6 mb-10">
              {steps.map((step) => (
                <div key={step.num} className="flex gap-5">
                  <span className="font-serif text-3xl font-light text-gold-500 flex-shrink-0 leading-none">{step.num}</span>
                  <div>
                    <h4 className="font-sans font-medium text-white text-sm tracking-wide mb-1">{step.title}</h4>
                    <p className="text-xs font-sans text-gray-400 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-4 flex-wrap">
              <Link href="/custom-ring" className="btn-gold">Start Building Now</Link>
              <Link href="/diamonds" className="btn-outline-gold border-gray-500 text-gray-300 hover:border-gold-500 hover:text-gold-400">
                Browse Diamonds
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
