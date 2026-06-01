import type { Metadata } from 'next';
import { Lora, Gantari } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { Providers } from './providers';
import WhatsAppButton from '@/components/ui/WhatsAppButton';
import NewsletterPopup from '@/components/ui/NewsletterPopup';
import StickyMobileBar from '@/components/ui/StickyMobileBar';

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
    // hreflang — add per-page overrides in child layouts/pages as you expand regions.
    // en-US / en-AU / en-IE can be added here when needed; x-default stays as GB.
    languages: {
      'en-GB': SITE_URL,
      'x-default': SITE_URL,
    },
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

// WebSite schema — enables the Sitelinks Search Box in Google SERPs
const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Sterling Jewellers',
  url: SITE_URL,
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${SITE_URL}/products?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
};

// Organisation / LocalBusiness schema — helps Google show rich results
const orgSchema = {
  '@context': 'https://schema.org',
  '@type': ['JewelryStore', 'LocalBusiness'],
  name: 'Sterling Jewellers',
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  image: `${SITE_URL}/og-image.jpg`,
  description: 'Fine jewellery and bespoke engagement rings. Ethically sourced, handcrafted in the UK.',
  foundingDate: '2018',
  address: {
    '@type': 'PostalAddress',
    streetAddress: '48 Bond Street',
    addressLocality: 'London',
    postalCode: 'W1S 1RB',
    addressCountry: 'GB',
  },
  telephone: '+447429065954',
  email: 'hello@sterlingjewellers.co.uk',
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      opens: '09:00',
      closes: '18:00',
    },
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: 'Sunday',
      opens: '11:00',
      closes: '17:00',
    },
  ],
  sameAs: [
    'https://www.instagram.com/sterlingjewellers',
    'https://www.facebook.com/sterlingjewellers',
  ],
  priceRange: '£££',
  currenciesAccepted: 'GBP',
  paymentAccepted: 'Cash, Credit Card, Debit Card',
  hasMap: 'https://maps.google.com/?q=48+Bond+Street,London,W1S+1RB',
};

const GA4_ID = 'G-74J7PQ8E6W';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={`${lora.variable} ${gantari.variable}`}>
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }} />
      </head>
      <body>
        {/* Google Analytics 4 */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`}
          strategy="afterInteractive"
        />
        <Script id="ga4-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA4_ID}', {
              page_path: window.location.pathname,
              anonymize_ip: true
            });
          `}
        </Script>

        <Providers>{children}</Providers>
        <WhatsAppButton />
        <NewsletterPopup />
        <StickyMobileBar />
      </body>
    </html>
  );
}
