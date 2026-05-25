/**
 * Lightweight GA4 analytics utility.
 *
 * SETUP:
 *  1. Add your GA4 Measurement ID to .env.local:
 *       NEXT_PUBLIC_GA4_ID=G-XXXXXXXXXX
 *  2. The <GoogleAnalytics> component in layout.tsx auto-loads the gtag
 *     script when the env var is present (no-op in development if not set).
 *
 * Usage:
 *   import { trackEvent } from '@/lib/analytics';
 *   trackEvent('whatsapp_click', { source: 'floating_button' });
 */

declare global {
  interface Window {
    gtag?: (
      command: 'event' | 'config' | 'set' | 'js',
      target: string | Date,
      params?: Record<string, unknown>
    ) => void;
    dataLayer?: unknown[];
  }
}

/** Fire a GA4 custom event. Safe to call even if gtag hasn't loaded yet. */
export function trackEvent(
  eventName: string,
  params?: Record<string, unknown>
): void {
  if (typeof window === 'undefined') return;
  if (typeof window.gtag !== 'function') return;
  window.gtag('event', eventName, params);
}

/** Pre-defined events for type safety and consistent naming across the app. */
export const Events = {
  WHATSAPP_CLICK:      'whatsapp_click',
  NEWSLETTER_SIGNUP:   'newsletter_signup',
  ADD_TO_CART:         'add_to_cart',
  BEGIN_CHECKOUT:      'begin_checkout',
  RING_BUILDER_START:  'ring_builder_start',
  DIAMOND_SEARCH:      'diamond_search',
  PRODUCT_VIEW:        'view_item',
  CATEGORY_VIEW:       'view_item_list',
} as const;
