import Link from 'next/link';
import { MapPin, Phone, Mail, Clock, CalendarDays, Train, Car, Star } from 'lucide-react';
import Breadcrumb from '@/components/layout/Breadcrumb';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://sterlingjewellers.co.uk';

const localBusinessSchema = {
  '@context': 'https://schema.org',
  '@type': ['JewelryStore', 'LocalBusiness'],
  name: 'Sterling Jewellers',
  url: SITE_URL,
  image: `${SITE_URL}/og-image.jpg`,
  priceRange: '£££',
  address: {
    '@type': 'PostalAddress',
    streetAddress: '48 Bond Street',
    addressLocality: 'London',
    postalCode: 'W1S 1RB',
    addressCountry: 'GB',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 51.5136,
    longitude: -0.1455,
  },
  telephone: '+447429065954',
  email: 'hello@sterlingjewellers.co.uk',
  openingHoursSpecification: [
    { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'], opens: '09:00', closes: '18:00' },
    { '@type': 'OpeningHoursSpecification', dayOfWeek: 'Sunday', opens: '11:00', closes: '17:00' },
  ],
  hasMap: 'https://maps.google.com/?q=48+Bond+Street,London,W1S+1RB',
  sameAs: [
    'https://www.instagram.com/sterlingjewellers',
    'https://www.facebook.com/sterlingjewellers',
  ],
};

export default function VisitPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }} />

      <Breadcrumb items={[{ label: 'Visit Us' }]} />

      {/* Hero */}
      <div className="bg-navy text-white py-14 text-center">
        <p className="section-subtitle text-white/60 mb-3">Our London Boutique</p>
        <h1 className="font-serif text-4xl md:text-5xl font-light mb-4">Visit Sterling Jewellers</h1>
        <p className="text-sm font-sans text-white/70 max-w-lg mx-auto leading-relaxed">
          Experience our collection in person. Our expert gemmologists are on hand to help you find the perfect piece — no appointment necessary, though we recommend booking for engagement ring consultations.
        </p>
      </div>

      <div className="bg-white">
        <div className="page-container py-16">
          <div className="grid lg:grid-cols-2 gap-16">

            {/* Left — info */}
            <div className="space-y-10">

              {/* Address */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-navy flex items-center justify-center flex-shrink-0">
                    <MapPin size={18} className="text-white" />
                  </div>
                  <h2 className="font-serif text-xl font-light text-charcoal">Find Us</h2>
                </div>
                <div className="pl-[52px] space-y-1">
                  <p className="font-sans font-medium text-sm text-charcoal">Sterling Jewellers Ltd</p>
                  <p className="font-sans text-sm text-gray-500">48 Bond Street</p>
                  <p className="font-sans text-sm text-gray-500">London</p>
                  <p className="font-sans text-sm text-gray-500">W1S 1RB</p>
                  <a
                    href="https://maps.google.com/?q=48+Bond+Street,London,W1S+1RB"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-3 text-xs font-sans font-medium text-navy underline underline-offset-2 hover:text-charcoal transition-colors"
                  >
                    Open in Google Maps →
                  </a>
                </div>
              </div>

              {/* Opening hours */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-navy flex items-center justify-center flex-shrink-0">
                    <Clock size={18} className="text-white" />
                  </div>
                  <h2 className="font-serif text-xl font-light text-charcoal">Opening Hours</h2>
                </div>
                <div className="pl-[52px]">
                  <table className="text-sm font-sans w-full max-w-xs">
                    <tbody className="divide-y divide-gray-100">
                      {[
                        { day: 'Monday – Friday', hours: '9:00am – 6:00pm' },
                        { day: 'Saturday',         hours: '9:00am – 6:00pm' },
                        { day: 'Sunday',           hours: '11:00am – 5:00pm' },
                      ].map(({ day, hours }) => (
                        <tr key={day}>
                          <td className="py-2.5 pr-8 text-gray-600">{day}</td>
                          <td className="py-2.5 font-medium text-charcoal">{hours}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="mt-3 text-xs font-sans text-gray-400">Bank Holidays: 11:00am – 4:00pm (selected dates only — call ahead to confirm).</p>
                </div>
              </div>

              {/* Contact */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-navy flex items-center justify-center flex-shrink-0">
                    <Phone size={18} className="text-white" />
                  </div>
                  <h2 className="font-serif text-xl font-light text-charcoal">Contact</h2>
                </div>
                <div className="pl-[52px] space-y-2">
                  <a href="tel:+447429065954" className="flex items-center gap-2 text-sm font-sans text-gray-600 hover:text-charcoal transition-colors">
                    <Phone size={13} className="text-navy" />
                    +44 742 906 5954
                  </a>
                  <a href="mailto:hello@sterlingjewellers.co.uk" className="flex items-center gap-2 text-sm font-sans text-gray-600 hover:text-charcoal transition-colors">
                    <Mail size={13} className="text-navy" />
                    hello@sterlingjewellers.co.uk
                  </a>
                </div>
              </div>

              {/* Getting here */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-navy flex items-center justify-center flex-shrink-0">
                    <Train size={18} className="text-white" />
                  </div>
                  <h2 className="font-serif text-xl font-light text-charcoal">Getting Here</h2>
                </div>
                <div className="pl-[52px] space-y-3 text-sm font-sans text-gray-600">
                  <p><span className="font-medium text-charcoal">By Tube:</span> Bond Street station (Central &amp; Jubilee lines) — 2 minute walk.</p>
                  <p><span className="font-medium text-charcoal">By Bus:</span> Routes 6, 13, 15, 23, 94 stop on Oxford Street (1 min walk).</p>
                  <div className="flex items-start gap-2">
                    <Car size={13} className="mt-0.5 text-navy flex-shrink-0" />
                    <p>Nearest parking: NCP Marble Arch, W1H 7EJ (10 min walk). We recommend public transport on weekdays due to congestion charges in this zone.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right — map + CTA */}
            <div className="space-y-8">
              {/* Embedded map */}
              <div className="aspect-video w-full overflow-hidden border border-gray-100">
                <iframe
                  title="Sterling Jewellers location — 48 Bond Street, London"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2482.9887!2d-0.1477!3d51.5136!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x48761ad2c35!2s48+Bond+St%2C+London+W1S+1RB!5e0!3m2!1sen!2suk!4v1"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>

              {/* Book consultation CTA */}
              <div className="bg-navy text-white p-8">
                <div className="flex items-center gap-3 mb-4">
                  <CalendarDays size={20} className="text-white/70" />
                  <h3 className="font-serif text-xl font-light">Book a Free Consultation</h3>
                </div>
                <p className="text-sm font-sans text-white/70 leading-relaxed mb-6">
                  Spend up to an hour with one of our expert gemmologists. Try rings in person, explore your diamond options, and get honest advice — completely free and with no pressure to buy.
                </p>
                <ul className="space-y-2 mb-6">
                  {['In-store or video call', '45–60 minutes', 'Bring your partner — most do!', 'Complimentary ring sizing'].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm font-sans text-white/70">
                      <Star size={10} className="text-white/40 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link href="/book-appointment" className="inline-block bg-white text-navy text-xs font-sans font-semibold tracking-widest uppercase px-8 py-3.5 hover:bg-gray-100 transition-colors">
                  Book Appointment
                </Link>
              </div>

              {/* Reviews snippet */}
              <div className="border border-gray-100 p-6 text-center">
                <div className="flex items-center justify-center gap-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} fill="#042241" className="text-navy" />
                  ))}
                </div>
                <p className="font-serif text-lg font-light text-charcoal mb-1">4.9 / 5</p>
                <p className="text-xs font-sans text-gray-400">Based on 2,400+ verified customer reviews</p>
                <Link href="/products" className="inline-block mt-4 text-xs font-sans text-navy underline underline-offset-2 hover:text-charcoal transition-colors">
                  Read reviews →
                </Link>
              </div>
            </div>
          </div>

          {/* Services offered in-store */}
          <div className="mt-20 pt-16 border-t border-gray-100">
            <div className="text-center mb-12">
              <p className="section-subtitle mb-3">What We Offer In-Store</p>
              <h2 className="section-title">The Full Boutique Experience</h2>
              <div className="gold-divider mt-4" />
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { title: 'Engagement Ring Consultations', body: 'Try our full range of solitaire, halo and three-stone engagement rings. Our gemmologist will walk you through diamond shapes, metals and settings with no time pressure.' },
                { title: 'Bespoke & Custom Design', body: 'From a sketch to a finished piece. Bring your ideas, a reference image, or even an heirloom stone you would like re-set. We handle the entire design and manufacturing process.' },
                { title: 'Diamond Viewing', body: 'View GIA and IGI certified loose diamonds under magnification. Our experts will explain what the certificate means and help you choose the best stone for your budget.' },
                { title: 'Ring Sizing & Resizing', body: 'Accurate finger measurement and professional resizing service. Free sizing included with every purchase, and free resize within 12 months.' },
                { title: 'Valuations & Insurance', body: 'Professional jewellery valuations for insurance purposes, conducted by our qualified gemmologists. Certificates accepted by all major UK insurers.' },
                { title: 'Cleaning & Servicing', body: 'Bring in any piece for a complimentary professional clean and polish. Our workshop offers full servicing, stone-tightening and refurbishment.' },
              ].map((s) => (
                <div key={s.title} className="border border-gray-100 p-6 hover:border-navy transition-colors">
                  <div className="w-8 h-px bg-navy mb-4" />
                  <h3 className="font-sans font-semibold text-sm text-charcoal mb-2">{s.title}</h3>
                  <p className="text-xs font-sans text-gray-500 leading-relaxed">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
