/**
 * Feature flags — controlled by environment variables baked at build time.
 *
 * Production build:  set NEXT_PUBLIC_ENABLE_RING_BUILDER=false  → ring builder hidden
 * Development:       leave unset (defaults to true)             → ring builder visible
 */
export const RING_BUILDER_ENABLED =
  process.env.NEXT_PUBLIC_ENABLE_RING_BUILDER !== 'false';
