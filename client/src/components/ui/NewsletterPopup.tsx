'use client';

import { useEffect, useRef, useState } from 'react';
import { newsletterApi } from '@/lib/api';

const STORAGE_KEY = 'sj_newsletter_dismissed';
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const TIMER_DELAY_MS = 10_000; // 10 seconds

function shouldShow(): boolean {
  if (typeof window === 'undefined') return false;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return true;
  try {
    const ts = parseInt(raw, 10);
    return Date.now() - ts > DISMISS_DURATION_MS;
  } catch {
    return true;
  }
}

function dismiss() {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
  }
}

export default function NewsletterPopup() {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggered = useRef(false);

  function show() {
    if (triggered.current) return;
    if (!shouldShow()) return;
    triggered.current = true;
    setVisible(true);
  }

  function close() {
    dismiss();
    setVisible(false);
  }

  useEffect(() => {
    if (!shouldShow()) return;

    // 45-second timer
    timerRef.current = setTimeout(() => show(), TIMER_DELAY_MS);

    // Exit-intent: mouse leaving toward the top of the viewport
    function handleMouseOut(e: MouseEvent) {
      if (e.clientY <= 10) show();
    }

    document.addEventListener('mouseleave', handleMouseOut);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      document.removeEventListener('mouseleave', handleMouseOut);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError('');
    try {
      await newsletterApi.subscribe(email);
      setSuccess(true);
      dismiss();
      setTimeout(() => setVisible(false), 3000);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={(e) => { if (e.target === e.currentTarget) close(); }}
    >
      <div className="relative bg-white w-full max-w-md shadow-2xl">
        {/* Gold top bar */}
        <div className="h-1 w-full bg-gradient-to-r from-gold-500 via-[#E8C98A] to-gold-500" />

        {/* Close button */}
        <button
          onClick={close}
          aria-label="Close"
          className="absolute top-3 right-4 text-gray-400 hover:text-charcoal text-xl leading-none font-light transition-colors"
        >
          ×
        </button>

        <div className="px-8 py-8">
          {success ? (
            <div className="text-center py-4">
              <div className="text-3xl mb-3">✨</div>
              <p className="font-serif text-xl font-light text-charcoal leading-snug">
                Check your inbox!
              </p>
              <p className="text-sm font-sans text-gray-500 mt-2">
                Your discount code is on its way.
              </p>
            </div>
          ) : (
            <>
              {/* Heading */}
              <p className="font-serif text-2xl font-light text-charcoal leading-snug mb-2">
                Get 10% Off Your First Order
              </p>
              <p className="text-sm font-sans text-gray-500 leading-relaxed mb-6">
                Join the Sterling family — be first to discover new collections and exclusive offers.
              </p>

              {/* Form */}
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email address"
                  required
                  className="w-full border border-gray-200 px-4 py-3 text-sm font-sans text-charcoal placeholder:text-gray-400 outline-none focus:border-gold-500 transition-colors"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gold-500 text-white text-xs font-sans font-semibold tracking-widest uppercase py-3.5 hover:bg-gold-600 transition-colors disabled:opacity-60"
                >
                  {loading ? 'Claiming…' : 'Claim My Discount'}
                </button>
                {error && <p className="text-xs text-red-500 font-sans">{error}</p>}
              </form>

              {/* No thanks */}
              <div className="text-center mt-4">
                <button
                  onClick={close}
                  className="text-xs font-sans text-gray-400 hover:text-charcoal underline underline-offset-2 transition-colors"
                >
                  No thanks
                </button>
              </div>

              {/* Small print */}
              <p className="text-[10px] font-sans text-gray-300 text-center mt-4 leading-relaxed">
                By subscribing you agree to receive our newsletter. Unsubscribe anytime.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
