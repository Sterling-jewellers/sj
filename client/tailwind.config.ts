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

        // Navy scale — buttons, accents, dividers, hover states
        gold: {
          50:  '#F0F4F8',
          100: '#E8EFF5',
          200: '#C5D5E5',
          300: '#6B8FB3',
          400: '#2D5F8A',
          500: '#042241',   // ← THE navy — primary accent
          600: '#031B35',
          700: '#021428',
          800: '#010D1C',
          900: '#000710',
        },

        champagne: '#F5F7FA',  // Near-white — section backgrounds, cards
        ivory:     '#FFFFFF',  // Pure white — page base
        navy:      '#042241',  // Deep navy — boxes, banners, CTAs
        'brand-dark':  '#000000',
        'brand-light': '#042241',
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
