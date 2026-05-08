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
        // Dark Olive  #333D29  →  charcoal (primary brand dark)
        // Light Olive #C2C5AA  →  gold-300 (primary accent)
        // Text #000000  ·  Background #FFFFFF / ivory

        charcoal: '#333D29',   // Dark Olive

        // "gold" key kept so all existing utility classes
        // (bg-gold-500, text-gold-600 …) remap to olive tones automatically
        gold: {
          50:  '#F5F6F0',
          100: '#E8EADC',
          200: '#D5D9C4',
          300: '#C2C5AA',   // ← Light Olive — primary brand accent
          400: '#A8AC8A',
          500: '#8C9070',   // ← default accent weight
          600: '#717558',
          700: '#5A5E43',
          800: '#464932',
          900: '#333D29',   // ← Dark Olive
        },

        champagne: '#F0F1EC',  // Soft olive-white — panels / card backgrounds
        ivory:     '#F8F9F5',  // Near-white page base
        'brand-dark':  '#333D29',
        'brand-light': '#C2C5AA',
      },
      fontFamily: {
        // Lora    (serif)  → headings, product names, editorial copy
        serif: ['var(--font-lora)',    'Georgia',   'serif'],
        // Gantari (sans)   → body, buttons, labels, UI copy
        sans:  ['var(--font-gantari)', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'hero-gradient':  'linear-gradient(135deg, #333D29 0%, #4A5538 50%, #333D29 100%)',
        'olive-gradient': 'linear-gradient(135deg, #C2C5AA 0%, #E8EADC 50%, #C2C5AA 100%)',
        'gold-gradient':  'linear-gradient(135deg, #C2C5AA 0%, #E8EADC 50%, #C2C5AA 100%)',
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
