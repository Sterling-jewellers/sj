import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import Breadcrumb from '@/components/layout/Breadcrumb';
import { articles } from '@/lib/journal-articles';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://sterlingjewellers.co.uk';
const SLUG = 'how-to-measure-ring-size';

export const metadata: Metadata = {
  title: 'How to Measure Ring Size at Home',
  description:
    'An accurate ring size is essential — especially for a surprise proposal. Our step-by-step guide covers three reliable methods, plus tips on the UK ring size chart.',
  alternates: {
    canonical: `${SITE_URL}/journal/${SLUG}`,
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'How to Measure Ring Size at Home',
  description:
    'An accurate ring size is essential — especially for a surprise proposal. Our step-by-step guide covers three reliable methods.',
  author: { '@type': 'Person', name: 'Sterling Jewellers Team' },
  publisher: {
    '@type': 'Organization',
    name: 'Sterling Jewellers',
    logo: { '@type': 'ImageObject', url: 'https://sterlingjewellers.co.uk/logo.png' },
  },
  datePublished: '2026-05-01',
  dateModified: '2026-05-01',
  image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=1200&h=600&fit=crop',
};

const relatedArticles = articles.filter((a) => a.slug !== SLUG);

const ukSizes = [
  ['J', '15.9'],
  ['K', '16.3'],
  ['L', '16.7'],
  ['M', '17.1'],
  ['N', '17.5'],
  ['O', '17.9'],
  ['P', '18.3'],
  ['Q', '18.7'],
  ['R', '19.1'],
  ['S', '19.5'],
  ['T', '19.9'],
];

export default function RingSizePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Breadcrumb
        items={[
          { label: 'Journal', href: '/journal' },
          { label: 'How to Measure Ring Size at Home' },
        ]}
      />

      {/* Hero */}
      <div className="relative aspect-[21/9] w-full overflow-hidden bg-charcoal">
        <Image
          src="https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=1200&h=600&fit=crop"
          alt="A hand with rings on the fingers"
          fill
          priority
          className="object-cover opacity-60"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <span className="bg-navy text-white text-[9px] font-sans tracking-widest uppercase px-3 py-1 mb-4">
            Buying Guide
          </span>
          <h1 className="font-serif text-4xl md:text-5xl font-light text-white max-w-2xl leading-tight mb-4">
            How to Measure Ring Size at Home
          </h1>
          <div className="flex items-center gap-3 text-white/60 text-xs font-sans">
            <span>May 2026</span>
            <span>·</span>
            <span>5 min read</span>
            <span>·</span>
            <span>Sterling Jewellers Team</span>
          </div>
        </div>
      </div>

      {/* Article body */}
      <div className="bg-white py-16">
        <div className="max-w-3xl mx-auto px-6">

          <p className="font-sans text-base text-gray-700 leading-relaxed mb-8">
            Getting the ring size right matters more than most people realise. Resizing is possible for most styles, but it is not always straightforward — channel-set eternity rings, for example, cannot be resized at all, and even a standard solitaire may need to go back to the workshop for several days. For a surprise proposal, an accurately sized ring makes the moment complete. Here are three reliable methods you can use at home, along with a UK size chart and some advice on what to do if you end up between sizes.
          </p>

          {/* Why size matters */}
          <div className="border-l-4 border-navy bg-gray-50 px-6 py-4 mb-10">
            <p className="font-sans text-sm text-charcoal font-medium">
              Most standard solitaires and plain bands can be resized up or down by 1–2 sizes. However, intricate settings, full-eternity rings, and rings with stones set around the entire band cannot be resized at all. Getting close on the first attempt saves time, money and anxiety.
            </p>
          </div>

          {/* Method 1 */}
          <h2 className="font-serif text-3xl font-light text-charcoal mt-12 mb-4">Method 1: The String or Paper Strip Method</h2>
          <p className="font-sans text-base text-gray-700 leading-relaxed mb-4">
            This is the most accessible method and accurate enough for most purposes. You will need a thin strip of paper (about 1 cm wide), a pen, and a ruler.
          </p>
          <ol className="list-decimal list-outside pl-5 space-y-3 font-sans text-base text-gray-700 mb-8">
            <li>Cut a strip of paper approximately 10 cm long and 1 cm wide. Make sure it is thin enough to lie flat when wrapped around a finger.</li>
            <li>Wrap it snugly around the base of the finger you intend to wear the ring on. Snug — not tight. You should still be able to slide it off easily.</li>
            <li>Mark the point where the paper overlaps with a pen.</li>
            <li>Lay the strip flat and measure the distance from the end to your mark in millimetres. This is the <strong>circumference</strong> of your finger.</li>
            <li>Divide that measurement by π (3.1416) to get the <strong>diameter</strong>. Or use the chart below to convert directly.</li>
          </ol>
          <p className="font-sans text-sm text-gray-500 leading-relaxed mb-8">
            Tip: measure three times and take the average. Finger size changes slightly with temperature and time of day, so a single measurement can mislead.
          </p>

          {/* Method 2 */}
          <h2 className="font-serif text-3xl font-light text-charcoal mt-12 mb-4">Method 2: Measuring an Existing Ring</h2>
          <p className="font-sans text-base text-gray-700 leading-relaxed mb-4">
            If the person you are buying for already wears rings on that finger, this method is usually more accurate than the strip method. Borrow one of their existing rings (try to choose one worn on the correct finger, though the adjacent finger can work as a guide).
          </p>
          <ol className="list-decimal list-outside pl-5 space-y-3 font-sans text-base text-gray-700 mb-8">
            <li>Place the ring flat on a white sheet of paper and trace the inside edge with a pencil.</li>
            <li>Measure the diameter of the circle you have drawn — from one inner edge directly across to the other, through the centre — in millimetres.</li>
            <li>Use the chart below to convert inner diameter to a UK ring size.</li>
          </ol>
          <p className="font-sans text-sm text-gray-500 leading-relaxed mb-8">
            If the ring rocks slightly when placed flat, it may be slightly oval-shaped from wear — measure at the widest point and the narrowest point and average the two.
          </p>

          {/* Method 3 */}
          <h2 className="font-serif text-3xl font-light text-charcoal mt-12 mb-4">Method 3: Request a Free Ring Sizer by Post</h2>
          <p className="font-sans text-base text-gray-700 leading-relaxed mb-4">
            If you have a little time before the proposal, the most accurate approach is to use a proper ring sizer — a set of metal or plastic rings in incremental sizes. We send these free of charge to any UK address on request. Simply wear the sizer on the intended finger for a few minutes at different times of day and note which size feels comfortable.
          </p>
          <p className="font-sans text-base text-gray-700 leading-relaxed mb-4">
            Ring sizers feel different to paper strips because they have a consistent width and heft similar to an actual ring. For wide-band rings (6 mm or above), you may find you need to go half a size larger than a narrow sizer suggests — wider bands feel tighter on the finger.
          </p>

          {/* Tips */}
          <h2 className="font-serif text-3xl font-light text-charcoal mt-12 mb-4">Tips for Getting an Accurate Measurement</h2>
          <ul className="list-disc list-outside pl-5 space-y-3 font-sans text-base text-gray-700 mb-8">
            <li><strong>Measure in the evening.</strong> Fingers are slightly larger later in the day than in the morning, and the ring needs to fit comfortably at both extremes.</li>
            <li><strong>Avoid cold days.</strong> Cold fingers shrink. If it is winter, measure at room temperature or after warming your hands.</li>
            <li><strong>Account for the knuckle.</strong> The ring needs to pass over the knuckle as well as sit at the base. If your knuckle is significantly wider than the finger base, size for the knuckle and have the band fitted with a sizing bead by a jeweller.</li>
            <li><strong>Dominant hand is usually larger.</strong> Most people's dominant hand is fractionally bigger. If the ring is for the right hand, size for the right hand.</li>
          </ul>

          {/* UK Ring Size Chart */}
          <h2 className="font-serif text-3xl font-light text-charcoal mt-12 mb-4">UK Ring Size Chart (Most Common Sizes)</h2>
          <p className="font-sans text-sm text-gray-600 mb-4">
            The most frequently purchased sizes in the UK are J through T. The full UK scale runs from A to Z+6, but these eleven sizes account for the vast majority of rings sold.
          </p>
          <div className="overflow-x-auto mb-8">
            <table className="w-full text-sm font-sans border-collapse">
              <thead>
                <tr className="bg-navy text-white">
                  <th className="px-4 py-3 text-left font-medium tracking-wide">UK Size</th>
                  <th className="px-4 py-3 text-left font-medium tracking-wide">Inner Diameter (mm)</th>
                </tr>
              </thead>
              <tbody>
                {ukSizes.map(([size, mm], i) => (
                  <tr key={size} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3 border-b border-gray-100 font-medium text-charcoal">{size}</td>
                    <td className="px-4 py-3 border-b border-gray-100 text-gray-700">{mm} mm</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Between sizes */}
          <h2 className="font-serif text-3xl font-light text-charcoal mt-12 mb-4">What to Do If You Are Between Sizes</h2>
          <p className="font-sans text-base text-gray-700 leading-relaxed mb-4">
            UK ring sizes increase in approximately 0.4 mm increments. If your measurement puts you exactly between two sizes, go up rather than down — a ring that is fractionally too large can be adjusted; one that is too tight is more uncomfortable to wear and harder to remove safely.
          </p>
          <p className="font-sans text-base text-gray-700 leading-relaxed mb-4">
            Wide-band rings (5 mm and above) should also be sized up by half a size, as the greater surface area makes them feel tighter on the finger than a narrow band of the same diameter.
          </p>

          {/* Proposal tips */}
          <h2 className="font-serif text-3xl font-light text-charcoal mt-12 mb-4">Secret Sizing Tips for Proposals</h2>
          <p className="font-sans text-base text-gray-700 leading-relaxed mb-4">
            Buying a ring as a surprise is one of the most common scenarios we handle. Here are the approaches that work best:
          </p>
          <ul className="list-disc list-outside pl-5 space-y-3 font-sans text-base text-gray-700 mb-8">
            <li><strong>Ask a close friend or family member.</strong> Someone who shops with your partner may already know their ring size, or can ask casually in conversation.</li>
            <li><strong>Borrow an existing ring for an hour.</strong> If they have rings they wear on that finger, slipping one away briefly to trace it is the most reliable method.</li>
            <li><strong>Use their other rings as a guide.</strong> Bring one into the showroom and we can measure it for you.</li>
            <li><strong>Check jewellery they already own.</strong> Many people already know their ring size — it may be written somewhere or mentioned in passing.</li>
            <li><strong>When in doubt, size up slightly.</strong> We can resize the ring after the proposal. A ring that slips on in an emotional moment is better than one that does not fit at all.</li>
          </ul>

        </div>
      </div>

      {/* CTA */}
      <div className="bg-navy text-white py-16">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="section-subtitle text-white/60 mb-3">Not Sure of Your Size?</p>
          <h2 className="font-serif text-3xl font-light mb-4">We Can Help</h2>
          <p className="font-sans text-sm text-white/70 mb-8 max-w-lg mx-auto">
            Visit our detailed size guide or contact us to request a free ring sizer posted directly to your door — no purchase necessary.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/size-guide" className="btn-gold">
              View Full Size Guide
            </Link>
            <Link href="/contact" className="btn-outline-gold">
              Request a Free Ring Sizer
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
