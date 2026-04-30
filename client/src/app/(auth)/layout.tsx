import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-champagne flex flex-col">
      <div className="py-6 text-center border-b border-gray-200 bg-ivory">
        <Link href="/" className="inline-flex flex-col items-center">
          <span className="font-serif text-2xl font-light tracking-[0.2em] text-charcoal uppercase">Sterling</span>
          <span className="font-sans text-[9px] tracking-[0.4em] uppercase text-gold-500 font-medium -mt-1">Jewellers</span>
        </Link>
      </div>
      <div className="flex-1 flex items-center justify-center py-12 px-4">
        {children}
      </div>
    </div>
  );
}
