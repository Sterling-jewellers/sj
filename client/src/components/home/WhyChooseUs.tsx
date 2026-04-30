import { Shield, Award, Sparkles, RefreshCw, Truck, Clock } from 'lucide-react';

const features = [
  { icon: Award, title: 'GIA & IGI Certified', desc: 'Every diamond comes with a grading certificate from the world\'s most trusted labs.' },
  { icon: Shield, title: 'Ethically Sourced', desc: 'All our diamonds and precious metals are responsibly and ethically sourced.' },
  { icon: Sparkles, title: 'Lifetime Guarantee', desc: 'We stand behind every piece with our comprehensive lifetime craftsmanship guarantee.' },
  { icon: RefreshCw, title: '30-Day Returns', desc: 'Not entirely in love? Return or exchange within 30 days, hassle-free.' },
  { icon: Truck, title: 'Free UK Delivery', desc: 'Complimentary insured delivery on all UK orders over £100 within 7 working days.' },
  { icon: Clock, title: 'Expert Consultation', desc: 'Our gemologists are available 7 days a week to guide your purchase.' },
];

export default function WhyChooseUs() {
  return (
    <section className="py-20 bg-ivory">
      <div className="page-container">
        <div className="text-center mb-14">
          <p className="section-subtitle mb-3">The Sterling Difference</p>
          <h2 className="section-title">Why Choose Us</h2>
          <div className="gold-divider mt-4" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="text-center group">
              <div className="w-16 h-16 border border-gold-300 flex items-center justify-center mx-auto mb-5 group-hover:bg-gold-50 group-hover:border-gold-500 transition-colors">
                <Icon size={24} className="text-gold-500" />
              </div>
              <h3 className="font-sans font-semibold text-sm tracking-wide text-charcoal mb-2">{title}</h3>
              <p className="text-xs font-sans text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
