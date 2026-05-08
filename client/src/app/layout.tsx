import type { Metadata } from 'next';
import { Lora, Gantari } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

// Lora — serif brand font for headings and product titles
const lora = Lora({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-lora',
  display: 'swap',
});

// Gantari — geometric sans-serif for body copy, buttons, and labels
const gantari = Gantari({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-gantari',
  display: 'swap',
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://sterlingjewellers.co.uk';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Sterling Jewellers | Fine Jewellery & Engagement Rings',
    template: '%s | Sterling Jewellers',
  },
  description:
    'Discover exquisite engagement rings, wedding bands, and fine jewellery. Handcrafted in the UK with ethically sourced diamonds and precious metals.',
  keywords: [
    'engagement rings UK', 'diamond engagement rings', 'wedding rings', 'fine jewellery',
    'bespoke jewellery', 'GIA diamonds', 'platinum rings', 'gold rings', 'UK jeweller',
    'ethical diamonds', 'custom engagement ring', 'Sterling Jewellers',
  ],
  authors: [{ name: 'Sterling Jewellers', url: SITE_URL }],
  creator: 'Sterling Jewellers',
  publisher: 'Sterling Jewellers',
  category: 'Jewellery & Accessories',
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    url: SITE_URL,
    siteName: 'Sterling Jewellers',
    title: 'Sterling Jewellers | Fine Jewellery & Engagement Rings',
    description:
      'Discover exquisite engagement rings, wedding bands, and fine jewellery. Handcrafted in the UK.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Sterling Jewellers — Fine Jewellery & Engagement Rings',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@SterlingJewellers',
    creator: '@SterlingJewellers',
    title: 'Sterling Jewellers | Fine Jewellery & Engagement Rings',
    description: 'Exquisite engagement rings and fine jewellery. Ethically sourced, handcrafted in the UK.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
  },
  verification: {
    // Add your Google Search Console verification token here
    // google: 'your-google-site-verification-token',
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

// Organisation schema — helps Google show rich results in brand SERPs
const orgSchema = {
  '@context': 'https://schema.org',
  '@type': 'JewelryStore',
  name: 'Sterling Jewellers',
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  description: 'Fine jewellery and bespoke engagement rings. Ethically sourced, handcrafted in the UK.',
  address: {
    '@type': 'PostalAddress',
    addressCountry: 'GB',
  },
  sameAs: [
    'https://www.instagram.com/sterlingjewellers',
    'https://www.facebook.com/sterlingjewellers',
  ],
  priceRange: '£££',
  currenciesAccepted: 'GBP',
  paymentAccepted: 'Cash, Credit Card, Debit Card',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={`${lora.variable} ${gantari.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
