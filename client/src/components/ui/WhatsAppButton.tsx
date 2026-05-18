'use client';

export default function WhatsAppButton() {
  const waUrl =
    'https://wa.me/447429065954?text=Hi%20Sterling%20Jewellers%2C%20I%27d%20like%20to%20enquire%20about%20your%20jewellery';

  return (
    <div className="fixed bottom-6 right-6 z-50 group">
      {/* Pulse ring */}
      <span className="absolute inset-0 rounded-full bg-[#25D366] opacity-40 animate-ping" />

      {/* Tooltip */}
      <span className="absolute bottom-full right-0 mb-2 whitespace-nowrap rounded bg-charcoal px-3 py-1.5 text-xs font-sans text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
        Chat with us on WhatsApp
      </span>

      {/* Button */}
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with us on WhatsApp"
        className="relative flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] shadow-lg hover:bg-[#1ebe5d] transition-colors duration-200"
      >
        {/* Official WhatsApp logo SVG */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 48 48"
          width="28"
          height="28"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M24 4C13 4 4 13 4 24c0 3.6 1 7 2.7 9.9L4 44l10.4-2.7A20 20 0 0 0 24 44c11 0 20-9 20-20S35 4 24 4z"
            fill="#fff"
          />
          <path
            d="M24 6.4A17.6 17.6 0 0 0 6.4 24c0 3.2.87 6.2 2.4 8.8l.3.5-1.7 6.3 6.5-1.7.5.3A17.6 17.6 0 1 0 24 6.4zm10.3 24.9c-.4 1.1-2.3 2.1-3.2 2.2-.8.1-1.9.1-3-.2-1.8-.5-4.1-1.6-5.9-3.4C19.9 27.5 18.5 24 18.5 21.8c0-2.3 1.2-3.4 1.6-3.9.4-.4.9-.5 1.2-.5h.9c.3 0 .6.1.9.7.3.7 1 2.5 1.1 2.7.1.2.2.4 0 .7-.1.3-.2.5-.4.7l-.6.7c-.2.2-.4.5-.2.9.2.5.9 1.6 2 2.6 1.4 1.2 2.6 1.6 3 1.8.4.2.6.1.9-.1.3-.3 1.1-1.2 1.4-1.7.3-.4.6-.4 1-.2.4.2 2.4 1.1 2.8 1.3.4.2.7.3.8.5.1.3.1 1.4-.3 2.5z"
            fill="#25D366"
          />
        </svg>
      </a>
    </div>
  );
}
