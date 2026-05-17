import Link from 'next/link';
import { Instagram, Facebook, Twitter, Youtube, MapPin, Phone, Mail, Shield, Truck, Award, RefreshCw } from 'lucide-react';
import { RING_BUILDER_ENABLED } from '@/lib/features';

const trustBadges = [
  { icon: Shield, label: 'Secure Payments', sub: 'SSL Encrypted' },
  { icon: Truck, label: 'Free UK Delivery', sub: 'Orders over £100' },
  { icon: Award, label: 'GIA Certified', sub: 'Authentic Diamonds' },
  { icon: RefreshCw, label: '30-Day Returns', sub: 'Easy returns' },
];

export default function Footer() {
  return (
    <footer className="bg-charcoal text-white">
      {/* Trust badges */}
      <div className="border-b border-white/10">
        <div className="page-container py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {trustBadges.map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex items-center gap-4">
                <div className="w-12 h-12 border border-gold-500 flex items-center justify-center flex-shrink-0">
                  <Icon size={22} className="text-gold-400" />
                </div>
                <div>
                  <p className="text-sm font-sans font-medium text-white">{label}</p>
                  <p className="text-xs font-sans text-gray-400 mt-0.5">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="page-container py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <span className="font-serif text-3xl font-light tracking-[0.2em] text-white uppercase">Sterling</span>
              <br />
              <span className="font-sans text-[9px] tracking-[0.4em] uppercase text-gold-400 font-medium">Jewellers Ltd</span>
            </div>
            <p className="text-sm font-sans text-gray-400 leading-relaxed mb-6">
              Crafting exquisite fine jewellery since 2026. Every piece tells a story of love, crafted with ethically sourced diamonds and precious metals.
            </p>
            <div className="flex gap-3">
              {[Instagram, Facebook, Youtube].map((Icon, i) => (
                <a key={i} href="#" className="w-9 h-9 border border-white/20 flex items-center justify-center hover:border-gold-400 hover:text-gold-400 transition-colors">
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-xs font-sans font-semibold tracking-widest uppercase text-gold-400 mb-5">Collections</h4>
            <ul className="space-y-3">
              {['Engagement Rings', 'Wedding Rings', 'Eternity Rings', 'Diamond Rings', 'Necklaces', 'Earrings', 'Bracelets'].map((item) => (
                <li key={item}>
                  <Link href={`/category/${item.toLowerCase().replace(/ /g, '-')}`} className="text-sm font-sans text-gray-400 hover:text-gold-400 transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-sans font-semibold tracking-widest uppercase text-gold-400 mb-5">Services</h4>
            <ul className="space-y-3">
              {[
                ...(RING_BUILDER_ENABLED ? [{ label: 'Create Your Ring', href: '/custom-ring' }] : []),
                { label: 'Diamond Search', href: '/diamonds' },
                { label: 'Ring Size Guide', href: '/size-guide' },
                { label: 'Jewellery Care', href: '/jewellery-care' },
                { label: 'Engraving Service', href: '/engraving' },
                { label: 'Valuations', href: '/valuations' },
              ].map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-sm font-sans text-gray-400 hover:text-gold-400 transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-sans font-semibold tracking-widest uppercase text-gold-400 mb-5">Help & Info</h4>
            <ul className="space-y-3">
              {[
                { label: 'About Us', href: '/about' },
                { label: 'Contact Us', href: '/contact' },
                { label: 'FAQ', href: '/faq' },
                { label: 'Shipping & Returns', href: '/shipping-returns' },
                { label: 'Privacy Policy', href: '/privacy' },
                { label: 'Terms & Conditions', href: '/terms' },
              ].map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-sm font-sans text-gray-400 hover:text-gold-400 transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Contact */}
            <div className="mt-8 space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Phone size={13} className="text-gold-400" />
                <span>+44 742 906 5954</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Mail size={13} className="text-gold-400" />
                <span>Sterlingjewellerslimited@gmail.com</span>
              </div>
              {/* <div className="flex items-start gap-2 text-sm text-gray-400">
                <MapPin size={13} className="text-gold-400 mt-0.5 flex-shrink-0" />
                <span>48 Bond Street, London, W1S 1RB</span>
              </div> */}
            </div>
          </div>
        </div>

        {/* Newsletter */}
        <div className="mt-12 pt-10 border-t border-white/10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <p className="font-serif text-xl font-light text-white">Join Our World</p>
              <p className="text-xs font-sans text-gray-400 mt-1">Exclusive offers, new collections & jewellery insights.</p>
            </div>
            <div className="flex gap-0 w-full md:w-auto">
              <input
                type="email"
                placeholder="Your email address"
                className="flex-1 md:w-72 bg-white/5 border border-white/20 px-4 py-3 text-sm font-sans text-white placeholder:text-gray-500 outline-none focus:border-gold-400"
              />
              <button className="btn-gold whitespace-nowrap">Subscribe</button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-white/10 py-5">
        <div className="page-container flex flex-col md:flex-row items-center justify-between gap-2 text-xs font-sans text-gray-500">
          <p>© {new Date().getFullYear()} Sterling Jewellers Ltd. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span>Company number: 17027352</span>
            <span className="text-gold-500">|</span>
            <span>Member of the National Association of Jewellers</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
