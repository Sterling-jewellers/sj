import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ── Sterling Jewellers Brand Palette ──────────────────────────────────
        // Text       #000000  →  charcoal (pure black)
        // Accent     #B08D57  →  antique gold (gold-500)
        // Background #FFFFFF  →  pure white

        charcoal: '#000000',   // Pure black — all primary text & UI

        // Warm antique gold scale — buttons, accents, dividers, hover states
        gold: {
          50:  '#FAF7F2',   // barely-there warm white
          100: '#F2E8D5',   // very light gold tint — subtle section bg
          200: '#E4CFA8',   // light gold
          300: '#D4B47A',   // medium-light gold
          400: '#C29B5A',   // medium gold
          500: '#B08D57',   // ← antique gold — primary accent
          600: '#957446',   // darker gold — hover / text accents
          700: '#785B34',   // deep gold
          800: '#5A4226',   // very deep
          900: '#3C2C19',   // near-black gold
        },

        champagne: '#FAF7F2',  // Warm near-white — section backgrounds, cards
        ivory:     '#FFFFFF',  // Pure white — page base
        'brand-dark':  '#000000',
        'brand-light': '#B08D57',
      },
      fontFamily: {
        // Lora    (serif)  → headings, product names, editorial copy
        serif: ['var(--font-lora)',    'Georgia',   'serif'],
        // Gantari (sans)   → body, buttons, labels, UI copy
        sans:  ['var(--font-gantari)', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'hero-gradient':  'linear-gradient(135deg, #0A0A0A 0%, #1A1A1A 50%, #0A0A0A 100%)',
        'gold-gradient':  'linear-gradient(135deg, #B08D57 0%, #D4B47A 50%, #B08D57 100%)',
        'warm-gradient':  'linear-gradient(180deg, #FFFFFF 0%, #FAF7F2 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'shimmer': 'shimmer 1.5s infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { transform: 'translateY(20px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
