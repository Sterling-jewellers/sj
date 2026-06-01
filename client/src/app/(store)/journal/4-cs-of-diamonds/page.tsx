import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import Breadcrumb from '@/components/layout/Breadcrumb';
import { articles } from '../page';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://sterlingjewellers.co.uk';
const SLUG = '4-cs-of-diamonds';

export const metadata: Metadata = {
  title: 'The 4 Cs of Diamonds Explained',
  description:
    'Cut, Colour, Clarity and Carat — a plain-English guide to the grading system that determines a diamond\'s beauty and value. Everything you need to know before you buy.',
  alternates: {
    canonical: `${SITE_URL}/journal/${SLUG}`,
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'The 4 Cs of Diamonds Explained',
  description:
    'Cut, Colour, Clarity and Carat — a plain-English guide to the grading system that determines a diamond\'s beauty and value.',
  author: { '@type': 'Person', name: 'Sterling Jewellers Team' },
  publisher: {
    '@type': 'Organization',
    name: 'Sterling Jewellers',
    logo: { '@type': 'ImageObject', url: 'https://sterlingjewellers.co.uk/logo.png' },
  },
  datePublished: '2026-05-01',
  dateModified: '2026-05-01',
  image: 'https://images.unsplash.com/photo-1543294001-f7cd5d7fb516?w=1200&h=600&fit=crop',
};

const relatedArticles = articles.filter((a) => a.slug !== SLUG);

export default function FourCsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Breadcrumb
        items={[
          { label: 'Journal', href: '/journal' },
          { label: 'The 4 Cs of Diamonds Explained' },
        ]}
      />

      {/* Hero */}
      <div className="relative aspect-[21/9] w-full overflow-hidden bg-charcoal">
        <Image
          src="https://images.unsplash.com/photo-1543294001-f7cd5d7fb516?w=1200&h=600&fit=crop"
          alt="A brilliant-cut diamond viewed from above"
          fill
          priority
          className="object-cover opacity-60"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <span className="bg-navy text-white text-[9px] font-sans tracking-widest uppercase px-3 py-1 mb-4">
            Diamond Guide
          </span>
          <h1 className="font-serif text-4xl md:text-5xl font-light text-white max-w-2xl leading-tight mb-4">
            The 4 Cs of Diamonds Explained
          </h1>
          <div className="flex items-center gap-3 text-white/60 text-xs font-sans">
            <span>May 2026</span>
            <span>·</span>
            <span>8 min read</span>
            <span>·</span>
            <span>Sterling Jewellers Team</span>
          </div>
        </div>
      </div>

      {/* Article body */}
      <div className="bg-white py-16">
        <div className="max-w-3xl mx-auto px-6">

          <p className="font-sans text-base text-gray-700 leading-relaxed mb-8">
            Walk into any jeweller and you will hear the phrase "the 4 Cs" within the first thirty seconds. Cut, Colour, Clarity and Carat weight are the four internationally standardised criteria by which every diamond is graded — and understanding them properly is the single most effective thing you can do to get better value from your budget. This guide explains each one in practical terms, tells you which matters most, and shows you how to balance all four when making a real purchasing decision.
          </p>

          {/* Cut */}
          <h2 className="font-serif text-3xl font-light text-charcoal mt-12 mb-4">Cut: The Most Important of the Four</h2>
          <p className="font-sans text-base text-gray-700 leading-relaxed mb-4">
            Cut is not the shape of the diamond — that is a separate conversation. Cut refers to how precisely the facets have been proportioned, aligned and polished. A well-cut diamond reflects light back through the top, creating the brilliance and fire that makes a stone truly beautiful. A poorly cut diamond, regardless of its colour or clarity, will look dull and lifeless.
          </p>
          <p className="font-sans text-base text-gray-700 leading-relaxed mb-4">
            The GIA (Gemological Institute of America) grades round brilliant cut diamonds on a five-point scale: <strong>Excellent, Very Good, Good, Fair,</strong> and <strong>Poor</strong>. IGI uses similar language. For an engagement ring, we recommend stopping at nothing lower than <strong>Very Good</strong>, and where budget allows, choosing Excellent.
          </p>

          {/* Callout */}
          <div className="border-l-4 border-navy bg-gray-50 px-6 py-4 mb-8">
            <p className="font-sans text-sm text-charcoal font-medium">
              "An Excellent-cut stone will appear larger and more luminous than a higher-carat diamond with a Poor cut. Cut is the one factor that most directly reflects the skill of the craftsman."
            </p>
          </div>

          <p className="font-sans text-base text-gray-700 leading-relaxed mb-4">
            The difference between Excellent and Very Good cut is usually modest in price but significant in appearance under any kind of light. Very Good cut stones still look stunning and are a sensible choice when you want to allocate more of your budget to carat weight.
          </p>

          {/* Colour */}
          <h2 className="font-serif text-3xl font-light text-charcoal mt-12 mb-4">Colour: What the D–Z Scale Means</h2>
          <p className="font-sans text-base text-gray-700 leading-relaxed mb-4">
            GIA grades diamond colour on a scale from D (completely colourless) to Z (light yellow or brown tint). The grades are assessed by comparing the stone to a set of master stones under controlled lighting. In practice, the differences between adjacent grades are extremely subtle — even trained gemmologists sometimes disagree.
          </p>

          {/* Colour table */}
          <div className="overflow-x-auto mb-8">
            <table className="w-full text-sm font-sans border-collapse">
              <thead>
                <tr className="bg-navy text-white">
                  <th className="px-4 py-3 text-left font-medium tracking-wide">Grade Range</th>
                  <th className="px-4 py-3 text-left font-medium tracking-wide">Classification</th>
                  <th className="px-4 py-3 text-left font-medium tracking-wide">What You See</th>
                  <th className="px-4 py-3 text-left font-medium tracking-wide">Best Metal Pairing</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['D – F', 'Colourless', 'No colour detectable even under magnification', 'Platinum or white gold'],
                  ['G – H', 'Near Colourless', 'Effectively colourless to the naked eye; great value', 'Platinum, white gold, rose gold'],
                  ['I – J', 'Near Colourless', 'Slight warmth, usually invisible when mounted', 'Yellow gold or rose gold'],
                  ['K+', 'Faint to Light Yellow', 'Visible warmth; may appear yellowish in platinum settings', 'Yellow gold (if budget-led)'],
                ].map(([grade, classification, appearance, metal], i) => (
                  <tr key={grade} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3 border-b border-gray-100 font-medium text-charcoal">{grade}</td>
                    <td className="px-4 py-3 border-b border-gray-100 text-gray-700">{classification}</td>
                    <td className="px-4 py-3 border-b border-gray-100 text-gray-600">{appearance}</td>
                    <td className="px-4 py-3 border-b border-gray-100 text-gray-600">{metal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="font-sans text-base text-gray-700 leading-relaxed mb-4">
            Our recommendation for most buyers: <strong>G or H colour</strong>. These grades appear colourless to the naked eye and represent excellent value — a D-colour premium of 20–40% is rarely justified unless you are buying a collector's stone or setting in platinum with no prongs to influence the colour visually.
          </p>
          <p className="font-sans text-base text-gray-700 leading-relaxed mb-4">
            If you are setting in yellow gold, consider I or even J colour. The warm metal tone makes any slight tint in the diamond essentially invisible, and the saving can be redirected towards a larger carat weight or better cut.
          </p>

          {/* Clarity */}
          <h2 className="font-serif text-3xl font-light text-charcoal mt-12 mb-4">Clarity: Understanding Inclusions</h2>
          <p className="font-sans text-base text-gray-700 leading-relaxed mb-4">
            Clarity measures the presence of internal characteristics (inclusions) and surface blemishes (blemishes) within a diamond. These form during the crystal growth process deep in the earth and are entirely natural. GIA's clarity scale runs from Flawless (FL) at the top to Included (I1, I2, I3) at the bottom:
          </p>
          <ul className="list-none space-y-2 mb-6 font-sans text-sm text-gray-700">
            {[
              ['FL / IF', 'Flawless / Internally Flawless', 'No inclusions or blemishes visible under 10× magnification'],
              ['VVS1 / VVS2', 'Very Very Slightly Included', 'Inclusions extremely difficult to see under 10× magnification'],
              ['VS1 / VS2', 'Very Slightly Included', 'Minor inclusions visible under magnification but not to the naked eye'],
              ['SI1 / SI2', 'Slightly Included', 'Inclusions noticeable under magnification; may be eye-visible in SI2'],
              ['I1 – I3', 'Included', 'Inclusions obvious under magnification and potentially visible to the naked eye'],
            ].map(([code, name, desc]) => (
              <li key={code} className="flex gap-3">
                <span className="font-medium text-navy w-24 shrink-0">{code}</span>
                <span><strong>{name}</strong> — {desc}</span>
              </li>
            ))}
          </ul>

          <div className="border-l-4 border-navy bg-gray-50 px-6 py-4 mb-8">
            <p className="font-sans text-sm text-charcoal font-medium">
              The "eye-clean" concept is key: any stone graded VS2 or better will appear perfectly clean to the unaided eye in virtually all circumstances. Paying for FL or IF clarity on a standard engagement ring is buying peace of mind you cannot see.
            </p>
          </div>

          <p className="font-sans text-base text-gray-700 leading-relaxed mb-4">
            The <strong>VS1–VS2 sweet spot</strong> is our standard recommendation. These stones are eye-clean, well-documented on their certificates, and typically 20–40% less expensive than VVS grades. For exceptional value, a well-chosen SI1 from a reputable grader can also be eye-clean — though this requires more scrutiny of the actual stone, not just the grade.
          </p>

          {/* Carat */}
          <h2 className="font-serif text-3xl font-light text-charcoal mt-12 mb-4">Carat Weight: Weight, Not Size</h2>
          <p className="font-sans text-base text-gray-700 leading-relaxed mb-4">
            Carat is a unit of weight (1 carat = 0.2 grams), not a measure of size. Two one-carat diamonds can appear markedly different in face-up diameter depending on how they have been cut. A well-cut one-carat round brilliant will measure approximately 6.5 mm across the top; a deep or poorly proportioned stone of the same weight might measure 6.0 mm or less — appearing significantly smaller despite weighing identically.
          </p>
          <p className="font-sans text-base text-gray-700 leading-relaxed mb-4">
            This is why cut quality has such a direct impact on apparent size. Choosing an Excellent-cut 0.90ct stone often looks larger face-up than a Good-cut 1.00ct stone, and will typically cost less. Certain shapes — oval, elongated cushion, pear — also face up larger than round brilliants of equivalent weight, which is worth considering if size is a priority.
          </p>
          <p className="font-sans text-base text-gray-700 leading-relaxed mb-4">
            Diamond prices jump at so-called "magic sizes" — 0.50ct, 0.75ct, 1.00ct, 1.50ct, 2.00ct — because demand is concentrated there. A 0.97ct stone is visually indistinguishable from a 1.00ct stone and is typically priced noticeably lower. Similarly, 0.48ct versus 0.50ct. Buying just below these benchmarks is one of the most straightforward ways to stretch a budget.
          </p>

          {/* Balancing */}
          <h2 className="font-serif text-3xl font-light text-charcoal mt-12 mb-4">Balancing the 4 Cs on a Real Budget</h2>
          <p className="font-sans text-base text-gray-700 leading-relaxed mb-4">
            The practical question is always: where do I compromise? Our guidance, in order of importance:
          </p>
          <ol className="list-decimal list-outside pl-5 space-y-3 font-sans text-base text-gray-700 mb-8">
            <li><strong>Never compromise on cut.</strong> Excellent or Very Good only. Cut defines the visual character of the stone more than any other factor.</li>
            <li><strong>Colour: G–H is the pragmatic choice.</strong> If budget is tight and the setting is yellow gold, go to I–J.</li>
            <li><strong>Clarity: VS2 or SI1 (eye-clean confirmed).</strong> Unless you have an emotional attachment to perfection, there is no visible benefit to VVS or FL.</li>
            <li><strong>Carat: buy just below magic sizes.</strong> The eye cannot distinguish 0.97ct from 1.00ct. The price difference is real.</li>
          </ol>

          {/* GIA vs IGI */}
          <h2 className="font-serif text-3xl font-light text-charcoal mt-12 mb-4">GIA vs IGI: Which Certificate Should You Trust?</h2>
          <p className="font-sans text-base text-gray-700 leading-relaxed mb-4">
            Both the Gemological Institute of America (GIA) and the International Gemological Institute (IGI) are well-regarded independent laboratories. GIA is the older institution and is widely considered the most conservative grader — meaning a GIA G/VS2 stone may appear slightly better than an IGI stone of the same grade, because GIA tends to be stricter in its assessments.
          </p>
          <p className="font-sans text-base text-gray-700 leading-relaxed mb-4">
            IGI has grown rapidly as the primary laboratory for lab-grown diamonds and now certifies a significant volume of natural stones too. For lab-grown diamonds, IGI is generally accepted as the standard. For natural diamonds, both are reliable — though if comparing prices between GIA and IGI stones, factor in that GIA's stricter grading means their G/VS1 is typically a more conservative call.
          </p>
          <p className="font-sans text-base text-gray-700 leading-relaxed mb-4">
            At Sterling Jewellers, all diamonds we supply come with either a GIA or IGI certificate. We are happy to explain the differences in detail when you visit, or to source specific certifications on request.
          </p>

        </div>
      </div>

      {/* CTA */}
      <div className="bg-navy text-white py-16">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="section-subtitle text-white/60 mb-3">Ready to Find Your Diamond?</p>
          <h2 className="font-serif text-3xl font-light mb-4">Browse Our Certified Diamond Collection</h2>
          <p className="font-sans text-sm text-white/70 mb-8 max-w-lg mx-auto">
            Every diamond in our collection comes with a GIA or IGI certificate. Filter by cut, colour, clarity and carat to find the perfect stone for your ring.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/diamonds" className="btn-gold">
              Browse GIA &amp; IGI Certified Diamonds
            </Link>
            <Link href="/category/diamond-rings" className="btn-outline-gold">
              View Diamond Rings
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
