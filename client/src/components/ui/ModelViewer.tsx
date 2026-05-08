'use client';

import { useEffect, useRef } from 'react';
import { RotateCcw, Maximize2 } from 'lucide-react';

/* ── Teach TypeScript about the <model-viewer> web component ── */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          src?: string;
          alt?: string;
          poster?: string;
          'auto-rotate'?: boolean | string;
          'camera-controls'?: boolean | string;
          ar?: boolean | string;
          'ar-modes'?: string;
          'environment-image'?: string;
          'shadow-intensity'?: string;
          'shadow-softness'?: string;
          exposure?: string;
          'tone-mapping'?: string;
          style?: React.CSSProperties;
          loading?: string;
          reveal?: string;
        },
        HTMLElement
      >;
    }
  }
}

interface ModelViewerProps {
  src: string;
  poster?: string;
  alt?: string;
  className?: string;
}

export default function ModelViewer({ src, poster, alt = '3D product model', className = '' }: ModelViewerProps) {
  const scriptRef = useRef(false);

  useEffect(() => {
    if (scriptRef.current) return;
    scriptRef.current = true;

    // Only load once globally
    if (document.querySelector('script[data-model-viewer]')) return;

    const s = document.createElement('script');
    s.type = 'module';
    s.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js';
    s.setAttribute('data-model-viewer', '1');
    document.head.appendChild(s);
  }, []);

  return (
    <div className={`relative w-full h-full bg-gray-50 ${className}`}>
      {/* @ts-ignore - custom element, types declared above */}
      <model-viewer
        src={src}
        alt={alt}
        poster={poster}
        auto-rotate
        camera-controls
        ar
        ar-modes="webxr scene-viewer quick-look"
        environment-image="neutral"
        shadow-intensity="1"
        shadow-softness="0.8"
        exposure="1"
        tone-mapping="commerce"
        loading="eager"
        reveal="auto"
        style={{ width: '100%', height: '100%', minHeight: '380px', background: 'transparent' }}
      />

      {/* Hint badge */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full px-3 py-1.5 text-[11px] font-sans text-gray-500 pointer-events-none select-none">
        <RotateCcw size={11} />
        Drag to rotate · Pinch to zoom
        <Maximize2 size={11} className="ml-1" />
        AR view on mobile
      </div>
    </div>
  );
}
