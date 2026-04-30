import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Ring Size Guide', description: 'Find your perfect ring size with our comprehensive guide.' };

const ukSizes = [
  { uk: 'F', us: '3', eu: '46', mm: '14.7' }, { uk: 'G', us: '3.5', eu: '47', mm: '15.1' },
  { uk: 'H', us: '4', eu: '47.5', mm: '15.3' }, { uk: 'I', us: '4.25', eu: '48', mm: '15.5' },
  { uk: 'J', us: '4.5', eu: '49', mm: '15.7' }, { uk: 'K', us: '5', eu: '50', mm: '16.1' },
  { uk: 'L', us: '5.5', eu: '51', mm: '16.5' }, { uk: 'M', us: '6', eu: '52', mm: '16.9' },
  { uk: 'N', us: '6.5', eu: '53', mm: '17.3' }, { uk: 'O', us: '7', eu: '54', mm: '17.7' },
  { uk: 'P', us: '7.5', eu: '56', mm: '18.1' }, { uk: 'Q', us: '8', eu: '57', mm: '18.5' },
  { uk: 'R', us: '8.5', eu: '58', mm: '18.9' }, { uk: 'S', us: '9', eu: '59', mm: '19.4' },
  { uk: 'T', us: '9.5', eu: '60', mm: '19.8' }, { uk: 'U', us: '10', eu: '62', mm: '20.2' },
  { uk: 'V', us: '10.5', eu: '63', mm: '20.6' }, { uk: 'W', us: '11', eu: '64', mm: '21.0' },
];

export default function SizeGuidePage() {
  return (
    <div className="bg-ivory py-16">
      <div className="page-container max-w-4xl">
        <div className="text-center mb-14">
          <p className="section-subtitle mb-3">Find Your Fit</p>
          <h1 className="section-title">Ring Size Guide</h1>
          <div className="gold-divider mt-4" />
        </div>

        <div className="grid md:grid-cols-2 gap-12 mb-12">
          {/* Method 1 */}
          <div className="bg-white p-8">
            <h2 className="font-serif text-2xl text-charcoal mb-2">Method 1: Measure a Ring</h2>
            <div className="w-8 h-0.5 bg-gold-400 mb-5" />
            <ol className="space-y-3 text-sm font-sans text-gray-600">
              <li className="flex gap-3"><span className="font-serif text-gold-500 text-lg font-light flex-shrink-0">1.</span> Find a ring that fits your finger well.</li>
              <li className="flex gap-3"><span className="font-serif text-gold-500 text-lg font-light flex-shrink-0">2.</span> Place the ring on a ruler and measure the inside diameter in millimetres.</li>
              <li className="flex gap-3"><span className="font-serif text-gold-500 text-lg font-light flex-shrink-0">3.</span> Compare your measurement to the size chart below.</li>
            </ol>
          </div>

          {/* Method 2 */}
          <div className="bg-white p-8">
            <h2 className="font-serif text-2xl text-charcoal mb-2">Method 2: String Method</h2>
            <div className="w-8 h-0.5 bg-gold-400 mb-5" />
            <ol className="space-y-3 text-sm font-sans text-gray-600">
              <li className="flex gap-3"><span className="font-serif text-gold-500 text-lg font-light flex-shrink-0">1.</span> Wrap a thin strip of paper or string around your finger.</li>
              <li className="flex gap-3"><span className="font-serif text-gold-500 text-lg font-light flex-shrink-0">2.</span> Mark where the paper meets and measure the length in mm.</li>
              <li className="flex gap-3"><span className="font-serif text-gold-500 text-lg font-light flex-shrink-0">3.</span> Divide by 3.14 to get the diameter, then compare to the chart.</li>
            </ol>
          </div>
        </div>

        {/* Size chart */}
        <div className="bg-white overflow-hidden">
          <div className="bg-charcoal text-white px-6 py-4">
            <h2 className="font-sans font-semibold text-sm tracking-widest uppercase">International Size Conversion Chart</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm font-sans">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['UK Size', 'US Size', 'EU Size', 'Diameter (mm)'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold tracking-widest uppercase text-charcoal">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ukSizes.map((size) => (
                  <tr key={size.uk} className="hover:bg-gold-50 transition-colors">
                    <td className="px-5 py-3 font-semibold text-gold-600">{size.uk}</td>
                    <td className="px-5 py-3 text-gray-600">{size.us}</td>
                    <td className="px-5 py-3 text-gray-600">{size.eu}</td>
                    <td className="px-5 py-3 text-gray-600">{size.mm}mm</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-gold-50 border border-gold-200 p-6 mt-8 text-center">
          <p className="font-sans text-sm text-charcoal">
            <strong>Not sure of your size?</strong> Order our free ring sizer by post or visit our London boutique for a professional fitting.
          </p>
          <div className="flex justify-center gap-4 mt-4">
            <a href="/contact" className="btn-gold text-xs py-2">Request Free Sizer</a>
            <a href="/contact" className="btn-outline-gold text-xs py-2">Book In-Store Fitting</a>
          </div>
        </div>
      </div>
    </div>
  );
}
