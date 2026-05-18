/**
 * Feature flags — controlled by environment variables baked at build time.
 *
 * Production build:  set NEXT_PUBLIC_ENABLE_RING_BUILDER=false  → ring builder hidden
 *                    set NEXT_PUBLIC_SHOW_DIAMONDS=false         → diamonds section hidden
 * Development:       leave unset (defaults to true)             → everything visible
 */
export const RING_BUILDER_ENABLED =
  process.env.NEXT_PUBLIC_ENABLE_RING_BUILDER !== 'false';

export const DIAMONDS_ENABLED =
  process.env.NEXT_PUBLIC_SHOW_DIAMONDS !== 'false';
