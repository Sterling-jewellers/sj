import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import Breadcrumb from '@/components/layout/Breadcrumb';
import { articles } from '../page';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://sterlingjewellers.co.uk';
const SLUG = 'lab-grown-vs-natural-diamonds';

export const metadata: Metadata = {
  title: 'Lab-Grown vs Natural Diamonds: An Honest Comparison',
  description:
    'Are lab-grown diamonds real? We compare lab-grown and natural diamonds honestly — covering chemistry, certification, price, resale value, and who should choose which.',
  alternates: {
    canonical: `${SITE_URL}/journal/${SLUG}`,
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Lab-Grown vs Natural Diamonds: An Honest Comparison',
  description:
    'Are lab-grown diamonds real? We compare lab-grown and natural diamonds honestly — covering chemistry, certification, price, resale value, and who should choose which.',
  author: { '@type': 'Person', name: 'Sterling Jewellers Team' },
  publisher: {
    '@type': 'Organization',
    name: 'Sterling Jewellers',
    logo: { '@type': 'ImageObject', url: 'https://sterlingjewellers.co.uk/logo.png' },
  },
  datePublished: '2026-05-01',
  dateModified: '2026-05-01',
  image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1200&h=600&fit=crop',
};

const relatedArticles = articles.filter((a) => a.slug !== SLUG);

export default function LabGrownPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Breadcrumb
        items={[
          { label: 'Journal', href: '/journal' },
          { label: 'Lab-Grown vs Natural Diamonds: An Honest Comparison' },
        ]}
      />

      {/* Hero */}
      <div className="relative aspect-[21/9] w-full overflow-hidden bg-charcoal">
        <Image
          src="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1200&h=600&fit=crop"
          alt="Two diamonds side by side on a reflective surface"
          fill
          priority
          className="object-cover opacity-60"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <span className="bg-navy text-white text-[9px] font-sans tracking-widest uppercase px-3 py-1 mb-4">
            Diamond Guide
          </span>
          <h1 className="font-serif text-4xl md:text-5xl font-light text-white max-w-2xl leading-tight mb-4">
            Lab-Grown vs Natural Diamonds: An Honest Comparison
          </h1>
          <div className="flex items-center gap-3 text-white/60 text-xs font-sans">
            <span>May 2026</span>
            <span>·</span>
            <span>10 min read</span>
            <span>·</span>
            <span>Sterling Jewellers Team</span>
          </div>
        </div>
      </div>

      {/* Article body */}
      <div className="bg-white py-16">
        <div className="max-w-3xl mx-auto px-6">

          <p className="font-sans text-base text-gray-700 leading-relaxed mb-8">
            Few topics in the jewellery industry generate more confusion — or more polarised opinion — than lab-grown diamonds. Marketing on both sides tends towards the extreme: natural diamond brands emphasise rarity and romance; lab-grown brands emphasise ethics and value. The truth, as ever, is more nuanced than either camp suggests. This guide sets out the facts plainly so that you can make a genuinely informed choice.
          </p>

          {/* What are lab-grown */}
          <h2 className="font-serif text-3xl font-light text-charcoal mt-12 mb-4">What Lab-Grown Diamonds Actually Are</h2>
          <p className="font-sans text-base text-gray-700 leading-relaxed mb-4">
            Lab-grown diamonds are diamonds. They are not simulants (such as cubic zirconia or moissanite), and they are not coatings or composites. They are pure crystallised carbon arranged in the same cubic structure as a natural diamond. The only difference between a lab-grown diamond and a natural one is where the crystal growth process took place.
          </p>
          <p className="font-sans text-base text-gray-700 leading-relaxed mb-4">
            Two methods are used to grow diamonds in laboratory conditions:
          </p>
          <ul className="list-none space-y-4 mb-8 font-sans text-base text-gray-700">
            <li>
              <strong className="text-charcoal">HPHT (High Pressure, High Temperature)</strong> — A small diamond seed is placed in a press with carbon and subjected to temperatures of roughly 1,500°C and pressures exceeding 1.5 million pounds per square inch. The carbon melts and crystallises around the seed over days or weeks. This mimics, in accelerated form, the conditions under which natural diamonds form deep within the earth.
            </li>
            <li>
              <strong className="text-charcoal">CVD (Chemical Vapour Deposition)</strong> — A diamond seed is placed in a vacuum chamber filled with carbon-rich gas (typically methane). Microwave energy ionises the gas, causing carbon atoms to deposit onto the seed and build up, layer by layer, into a diamond crystal. CVD is the method most commonly used for larger, gem-quality stones.
            </li>
          </ul>

          {/* Are they real */}
          <h2 className="font-serif text-3xl font-light text-charcoal mt-12 mb-4">Are Lab-Grown Diamonds "Real" Diamonds?</h2>

          <div className="border-l-4 border-navy bg-gray-50 px-6 py-4 mb-8">
            <p className="font-sans text-sm text-charcoal font-medium">
              Yes — unequivocally. The GIA defines a diamond as a "natural mineral consisting essentially of pure carbon crystallised in the isometric system." Lab-grown diamonds meet that definition in every way. Even the most sophisticated professional gemological equipment cannot distinguish a well-grown lab diamond from a natural one without specific testing for growth patterns.
            </p>
          </div>

          <p className="font-sans text-base text-gray-700 leading-relaxed mb-4">
            Both GIA and IGI grade lab-grown diamonds using identical 4 Cs criteria — Cut, Colour, Clarity and Carat — applied through the same assessment process used for natural diamonds. The only practical difference on a certificate is that lab-grown stones are noted as "laboratory-grown" alongside their grades. GIA uses laser inscription on the girdle of every lab-grown stone it certifies.
          </p>

          {/* Price */}
          <h2 className="font-serif text-3xl font-light text-charcoal mt-12 mb-4">Price: Where the Difference Becomes Significant</h2>
          <p className="font-sans text-base text-gray-700 leading-relaxed mb-4">
            This is where the practical case for lab-grown diamonds is strongest. At the time of writing, lab-grown diamonds of comparable grade are typically <strong>50–70% less expensive</strong> than their natural counterparts. A 1.50ct G/VS1 Excellent-cut natural diamond might retail for £8,000–£10,000; the same specification in lab-grown would be £2,500–£4,000 depending on the supplier.
          </p>
          <p className="font-sans text-base text-gray-700 leading-relaxed mb-4">
            That differential has widened significantly over the past few years as lab-grown production has scaled. The price of lab-grown diamonds has fallen considerably, and it is unlikely to stabilise — production capacity continues to increase. This has implications for resale value (see below) that any buyer should understand before purchasing.
          </p>

          {/* Resale */}
          <h2 className="font-serif text-3xl font-light text-charcoal mt-12 mb-4">Resale Value: An Honest View of Both</h2>
          <p className="font-sans text-base text-gray-700 leading-relaxed mb-4">
            A common argument for natural diamonds is that they "hold their value." This deserves scrutiny. Most natural diamonds purchased at retail lose 20–40% of their value the moment they leave the shop — they are priced at retail, not at wholesale. Exceptional stones (D/IF, over 3ct, rare shapes or fancy colours) can appreciate, but the average engagement ring diamond does not.
          </p>
          <p className="font-sans text-base text-gray-700 leading-relaxed mb-4">
            Lab-grown diamonds are in a worse position. Because they are produced in industrial quantities and prices continue to fall, a lab-grown diamond purchased today may be worth considerably less in secondary markets in five years' time. This is not a reason to avoid them — most people do not buy engagement rings as investments — but it is important to understand before spending.
          </p>
          <p className="font-sans text-base text-gray-700 leading-relaxed mb-4">
            Our view: neither natural nor lab-grown diamonds are reliable financial investments. Buy the diamond because of what it represents, not what you expect it to return.
          </p>

          {/* Environmental */}
          <h2 className="font-serif text-3xl font-light text-charcoal mt-12 mb-4">Environmental Considerations: More Nuanced Than You Might Think</h2>
          <p className="font-sans text-base text-gray-700 leading-relaxed mb-4">
            Lab-grown diamonds are frequently marketed as the "ethical" or "sustainable" choice. This is partially true but requires context. CVD and HPHT processes are extremely energy-intensive — growing a single gem-quality diamond in a laboratory requires significant electricity, often from carbon-heavy grids in China and India where much of the production takes place.
          </p>
          <p className="font-sans text-base text-gray-700 leading-relaxed mb-4">
            Certified natural diamond mining, meanwhile, has improved substantially under schemes such as the Kimberley Process and individual company sustainability programmes. Responsibly sourced natural diamonds from Canadian or Botswana mines often have a lower total carbon footprint per carat than lab-grown stones produced with coal-heavy electricity.
          </p>
          <p className="font-sans text-base text-gray-700 leading-relaxed mb-4">
            The picture is genuinely complex, and any absolute statement in either direction should be viewed sceptically. If environmental credentials matter to you, ask specifically about the energy source used in production (some lab-grown producers do use renewable energy) or about country-of-origin certification for natural diamonds.
          </p>

          {/* Comparison table */}
          <h2 className="font-serif text-3xl font-light text-charcoal mt-12 mb-4">Side-by-Side Comparison</h2>
          <div className="overflow-x-auto mb-8">
            <table className="w-full text-sm font-sans border-collapse">
              <thead>
                <tr className="bg-navy text-white">
                  <th className="px-4 py-3 text-left font-medium tracking-wide">Dimension</th>
                  <th className="px-4 py-3 text-left font-medium tracking-wide">Natural Diamond</th>
                  <th className="px-4 py-3 text-left font-medium tracking-wide">Lab-Grown Diamond</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Chemical composition', 'Pure crystallised carbon (cubic)', 'Identical — pure crystallised carbon (cubic)'],
                  ['Certificate', 'GIA or IGI (standard)', 'GIA or IGI — noted as "laboratory-grown"'],
                  ['Price (typical)', 'Full market rate', '50–70% less than natural equivalent'],
                  ['Resale value', 'Modest; depreciates from retail', 'Lower; falling market prices compound losses'],
                  ['Origin traceability', 'Available via certified programmes', 'Known production facility; no mining provenance'],
                  ['Availability', 'Limited by geological supply', 'Unlimited; production continues to increase'],
                ].map(([dim, natural, lab], i) => (
                  <tr key={dim} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3 border-b border-gray-100 font-medium text-charcoal">{dim}</td>
                    <td className="px-4 py-3 border-b border-gray-100 text-gray-700">{natural}</td>
                    <td className="px-4 py-3 border-b border-gray-100 text-gray-700">{lab}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Who should choose */}
          <h2 className="font-serif text-3xl font-light text-charcoal mt-12 mb-4">Who Should Choose Lab-Grown vs Natural?</h2>
          <p className="font-sans text-base text-gray-700 leading-relaxed mb-4">
            <strong className="text-charcoal">Choose lab-grown if:</strong> budget is a priority and you want the largest, best-quality stone possible for the money; you have no strong attachment to the idea of geological rarity; or you are buying jewellery that you plan to enjoy and do not expect to sell.
          </p>
          <p className="font-sans text-base text-gray-700 leading-relaxed mb-4">
            <strong className="text-charcoal">Choose natural if:</strong> the story of the stone matters to you or your partner — the idea that it formed over billions of years; you value geological rarity as part of what makes the gift meaningful; or you anticipate that the ring may eventually be passed down as a heirloom.
          </p>
          <p className="font-sans text-base text-gray-700 leading-relaxed mb-4">
            Both are valid positions. The choice is personal, not technical. Whatever you choose, ensure it comes with a GIA or IGI certificate so that the grade is independently verified and transparent.
          </p>

        </div>
      </div>

      {/* CTA */}
      <div className="bg-navy text-white py-16">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="section-subtitle text-white/60 mb-3">Explore Both Options</p>
          <h2 className="font-serif text-3xl font-light mb-4">Natural &amp; Lab-Grown Diamonds Available</h2>
          <p className="font-sans text-sm text-white/70 mb-8 max-w-lg mx-auto">
            We offer both certified natural and certified lab-grown diamonds across our engagement ring collections. Speak to our team to explore which is right for you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/category/engagement-rings" className="btn-gold">
              Browse Engagement Rings
            </Link>
            <Link href="/diamonds" className="btn-outline-gold">
              View All Certified Diamonds
            </Link>
          </div>
        </div>
      </div>

      {/* Related articles */}
      <div className="bg-white py-16">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-10">
            <p className="section-subtitle mb-2">Continue Reading</p>
            <h2 className="font-serif text-2xl font-light text-charcoal">Related Guides</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {relatedArticles.map((article) => (
              <Link
                key={article.slug}
                href={`/journal/${article.slug}`}
                className="group block border border-gray-100 hover:border-navy transition-colors"
              >
                <div className="relative aspect-[16/9] overflow-hidden">
                  <Image
                    src={article.image}
                    alt={article.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="bg-navy text-white text-[9px] font-sans tracking-widest uppercase px-2 py-1">
                      {article.category}
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-sans text-gray-400">{article.date}</span>
                    <span className="text-gray-200">·</span>
                    <span className="text-[10px] font-sans text-gray-400">{article.readTime}</span>
                  </div>
                  <h3 className="font-serif text-base font-light text-charcoal group-hover:text-navy transition-colors leading-snug mb-2">
                    {article.title}
                  </h3>
                  <span className="text-xs font-sans font-medium text-navy flex items-center gap-1">
                    Read Guide <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
