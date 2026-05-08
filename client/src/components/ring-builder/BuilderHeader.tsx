'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Check, ChevronRight, Gem, Diamond, Sparkles } from 'lucide-react';
import { useRingBuilder } from '@/store/ringBuilderStore';
import { formatPrice } from '@/lib/utils';
import { cn } from '@/lib/utils';

const STEPS = [
  { id: 1, label: 'Choose a Setting', icon: Gem,      paths: ['/custom-ring/settings'] },
  { id: 2, label: 'Choose a Diamond', icon: Diamond,   paths: ['/custom-ring/diamonds'] },
  { id: 3, label: 'Complete Ring',    icon: Sparkles,  paths: ['/custom-ring/review'] },
];

export default function BuilderHeader() {
  const pathname = usePathname();
  const router   = useRouter();
  const { setting, diamond, settingPrice, totalPrice } = useRingBuilder();

  // Determine current step from URL
  const currentStep =
    pathname?.includes('/custom-ring/settings') ? 1 :
    pathname?.includes('/custom-ring/diamonds')  ? 2 :
    pathname?.includes('/custom-ring/review')    ? 3 : 1;

  const handleStepClick = (stepId: number) => {
    if (stepId === 1)                          router.push('/custom-ring/settings');
    else if (stepId === 2 && setting)          router.push('/custom-ring/diamonds');
    else if (stepId === 3 && setting && diamond) router.push('/custom-ring/review');
  };

  const stepComplete = (id: number) => {
    if (id === 1) return !!setting;
    if (id === 2) return !!diamond;
    return false;
  };

  return (
    <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex h-[52px]">
          {STEPS.map((step, idx) => {
            const done   = stepComplete(step.id);
            const active = currentStep === step.id;
            const locked = step.id === 2 && !setting || step.id === 3 && (!setting || !diamond);

            return (
              <button
                key={step.id}
                onClick={() => handleStepClick(step.id)}
                disabled={locked}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 border-r border-gray-200 last:border-r-0 text-sm font-sans transition-colors relative',
                  active  ? 'bg-charcoal text-white'
                  : done  ? 'bg-white text-emerald-700 hover:bg-emerald-50 cursor-pointer'
                  : locked ? 'bg-white text-gray-300 cursor-default'
                  : 'bg-white text-gray-500 hover:bg-gray-50 cursor-pointer'
                )}
              >
                {/* Step number / check */}
                <span className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors',
                  active  ? 'bg-white text-charcoal'
                  : done  ? 'bg-emerald-500 text-white'
                  : 'bg-gray-200 text-gray-400'
                )}>
                  {done && !active ? <Check size={12} /> : step.id}
                </span>

                {/* Label + summary */}
                <div className="hidden sm:block text-left">
                  <p className={cn('text-xs font-medium leading-tight',
                    active ? 'text-white' : done ? 'text-emerald-700' : 'text-gray-400'
                  )}>
                    {step.label}
                  </p>
                  {/* Compact summary of what's selected */}
                  {step.id === 1 && setting && (
                    <p className={cn('text-[10px] leading-tight truncate max-w-[140px]',
                      active ? 'text-gray-300' : 'text-emerald-600'
                    )}>
                      {setting.name} · {formatPrice(settingPrice())}
                    </p>
                  )}
                  {step.id === 2 && diamond && (
                    <p className={cn('text-[10px] leading-tight truncate max-w-[140px]',
                      active ? 'text-gray-300' : 'text-emerald-600'
                    )}>
                      {diamond.caratWeight.toFixed(2)}ct {diamond.shape} · {formatPrice(diamond.price)}
                    </p>
                  )}
                  {step.id === 3 && setting && diamond && (
                    <p className={cn('text-[10px] leading-tight',
                      active ? 'text-gray-300' : 'text-gray-400'
                    )}>
                      Total: {formatPrice(totalPrice())}
                    </p>
                  )}
                </div>

                {/* Arrow between steps */}
                {idx < STEPS.length - 1 && (
                  <ChevronRight size={14} className={cn(
                    'absolute right-0 translate-x-1/2 z-10',
                    active ? 'text-white' : 'text-gray-300'
                  )} />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
