'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import { Check, ChevronRight, Diamond, Ring, Sparkles } from 'lucide-react';
import { productsApi, diamondsApi } from '@/lib/api';
import { IProduct, IDiamond } from '@/types';
import { formatPrice } from '@/lib/utils';
import { useCartStore } from '@/store/cartStore';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const steps = [
  { id: 1, label: 'Choose Setting', icon: Ring },
  { id: 2, label: 'Select Diamond', icon: Diamond },
  { id: 3, label: 'Review & Add', icon: Sparkles },
];

export default function CustomRingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedSetting, setSelectedSetting] = useState<IProduct | null>(null);
  const [selectedDiamond, setSelectedDiamond] = useState<IDiamond | null>(null);
  const [selectedMetal, setSelectedMetal] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const { addItem } = useCartStore();

  const { data: settingsData, isLoading: settingsLoading } = useQuery({
    queryKey: ['ring-settings'],
    queryFn: () => productsApi.getAll({ category: 'engagement-rings', limit: 12 }),
  });

  const { data: diamondsData, isLoading: diamondsLoading } = useQuery({
    queryKey: ['diamonds-builder'],
    queryFn: () => diamondsApi.getAll({ limit: 20, sort: 'price-asc' }),
    enabled: currentStep >= 2,
  });

  const settings: IProduct[] = settingsData?.data?.products || [];
  const diamonds: IDiamond[] = diamondsData?.data?.diamonds || [];

  const totalPrice = (selectedSetting ? (selectedSetting.salePrice || selectedSetting.basePrice) : 0) + (selectedDiamond?.price || 0);

  const handleAddToCart = () => {
    if (!selectedSetting || !selectedDiamond) return;
    addItem(selectedSetting, { selectedMetal, selectedSize, diamond: selectedDiamond });
    toast.success('Custom ring added to bag!');
  };

  return (
    <div className="bg-ivory min-h-screen">
      {/* Header */}
      <div className="bg-charcoal text-white py-12">
        <div className="page-container text-center">
          <p className="section-subtitle text-gold-400 mb-3">Design Your Perfect Ring</p>
          <h1 className="font-serif text-5xl font-light text-white">Create Your Ring</h1>
          <div className="gold-divider mt-4" />
        </div>
      </div>

      {/* Step indicators */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="page-container">
          <div className="flex items-center justify-center py-4">
            {steps.map((step, idx) => (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => { if (step.id < currentStep || (step.id === 2 && selectedSetting)) setCurrentStep(step.id); }}
                  className={cn('flex items-center gap-3 px-5 py-2 transition-colors', currentStep === step.id ? 'text-gold-600' : step.id < currentStep ? 'text-green-600 cursor-pointer hover:text-green-700' : 'text-gray-400 cursor-default')}
                >
                  <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium', currentStep === step.id ? 'bg-gold-500 text-white' : step.id < currentStep ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500')}>
                    {step.id < currentStep ? <Check size={14} /> : step.id}
                  </div>
                  <span className="font-sans text-sm font-medium hidden md:block">{step.label}</span>
                </button>
                {idx < steps.length - 1 && <ChevronRight size={16} className="text-gray-300 mx-2" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="page-container py-10">
        {/* Step 1: Choose Setting */}
        {currentStep === 1 && (
          <div>
            <h2 className="font-serif text-3xl font-light text-charcoal mb-2">Choose Your Setting</h2>
            <p className="text-sm font-sans text-gray-500 mb-8">Select a ring setting style. The diamond will be selected in the next step.</p>
            {settingsLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton aspect-square" />)}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                {settings.map((setting) => (
                  <div
                    key={setting._id}
                    onClick={() => setSelectedSetting(setting)}
                    className={cn('cursor-pointer border-2 transition-all group', selectedSetting?._id === setting._id ? 'border-gold-500 shadow-lg' : 'border-transparent hover:border-gold-200')}
                  >
                    <div className="relative aspect-square bg-gray-50 overflow-hidden">
                      <Image src={setting.images[0]} alt={setting.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                      {selectedSetting?._id === setting._id && (
                        <div className="absolute top-3 right-3 w-7 h-7 bg-gold-500 rounded-full flex items-center justify-center">
                          <Check size={14} className="text-white" />
                        </div>
                      )}
                    </div>
                    <div className="p-3 bg-white">
                      <p className="text-sm font-sans font-medium text-charcoal truncate">{setting.name}</p>
                      <p className="text-sm font-sans text-gold-600 mt-1">{formatPrice(setting.salePrice || setting.basePrice)} <span className="text-xs text-gray-400">(setting only)</span></p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {selectedSetting && (
              <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex items-center justify-between z-40">
                <div className="flex items-center gap-4">
                  <div className="relative w-14 h-14">
                    <Image src={selectedSetting.images[0]} alt={selectedSetting.name} fill className="object-cover" />
                  </div>
                  <div>
                    <p className="text-sm font-sans font-medium">{selectedSetting.name}</p>
                    <p className="text-sm font-sans text-gold-600">{formatPrice(selectedSetting.salePrice || selectedSetting.basePrice)}</p>
                  </div>
                </div>
                <button onClick={() => setCurrentStep(2)} className="btn-gold flex items-center gap-2">
                  Next: Choose Diamond <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Select Diamond */}
        {currentStep === 2 && (
          <div className="pb-24">
            <h2 className="font-serif text-3xl font-light text-charcoal mb-2">Select Your Diamond</h2>
            <p className="text-sm font-sans text-gray-500 mb-8">Choose a GIA or IGI certified diamond to complete your ring.</p>

            {diamondsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-16 w-full" />)}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {diamonds.map((diamond) => (
                  <div
                    key={diamond._id}
                    onClick={() => setSelectedDiamond(diamond)}
                    className={cn('cursor-pointer border-2 p-4 bg-white transition-all', selectedDiamond?._id === diamond._id ? 'border-gold-500 shadow-md' : 'border-gray-100 hover:border-gold-200')}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-sans font-semibold text-sm text-charcoal capitalize">{diamond.caratWeight.toFixed(2)}ct {diamond.shape}</p>
                        <p className="text-xs font-sans text-gray-500 mt-1">{diamond.cut} Cut · Color {diamond.color} · {diamond.clarity}</p>
                        <p className="text-xs font-sans text-gray-400 mt-1">{diamond.certificate.lab} Certified</p>
                      </div>
                      {selectedDiamond?._id === diamond._id && (
                        <div className="w-6 h-6 bg-gold-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <Check size={12} className="text-white" />
                        </div>
                      )}
                    </div>
                    <p className="font-sans font-bold text-gold-600 mt-3 text-base">{formatPrice(diamond.price)}</p>
                  </div>
                ))}
              </div>
            )}

            {selectedDiamond && (
              <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 flex items-center justify-between z-40">
                <div>
                  <p className="text-sm font-sans font-medium">{selectedDiamond.caratWeight.toFixed(2)}ct {selectedDiamond.shape} Diamond</p>
                  <p className="text-xs font-sans text-gray-500">{selectedDiamond.cut} Cut · {selectedDiamond.color} · {selectedDiamond.clarity}</p>
                </div>
                <button onClick={() => setCurrentStep(3)} className="btn-gold flex items-center gap-2">
                  Review Ring <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Review */}
        {currentStep === 3 && selectedSetting && selectedDiamond && (
          <div className="max-w-2xl mx-auto">
            <h2 className="font-serif text-3xl font-light text-charcoal mb-8">Review Your Custom Ring</h2>

            <div className="bg-white p-8 space-y-6">
              {/* Setting */}
              <div className="flex gap-6 pb-6 border-b border-gray-100">
                <div className="relative w-24 h-24 flex-shrink-0">
                  <Image src={selectedSetting.images[0]} alt={selectedSetting.name} fill className="object-cover" />
                </div>
                <div>
                  <p className="text-xs font-sans text-gray-400 tracking-widest uppercase mb-1">Setting</p>
                  <p className="font-sans font-semibold text-charcoal">{selectedSetting.name}</p>
                  <p className="text-sm font-sans text-gold-600 mt-1">{formatPrice(selectedSetting.salePrice || selectedSetting.basePrice)}</p>
                  {selectedSetting.metalOptions.length > 0 && (
                    <div className="flex gap-2 mt-2">
                      {selectedSetting.metalOptions.map((m) => (
                        <button key={m.type} onClick={() => setSelectedMetal(m.type)} className={cn('px-2.5 py-1 text-[10px] font-sans border capitalize', selectedMetal === m.type || (!selectedMetal && m.isDefault) ? 'border-gold-500 bg-gold-50 text-gold-700' : 'border-gray-200 text-gray-500')}>
                          {m.type.replace(/-/g, ' ')}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Diamond */}
              <div className="flex gap-6 pb-6 border-b border-gray-100">
                <div className="w-24 h-24 bg-gray-50 flex items-center justify-center flex-shrink-0">
                  <Diamond size={32} className="text-gold-300" />
                </div>
                <div>
                  <p className="text-xs font-sans text-gray-400 tracking-widest uppercase mb-1">Diamond</p>
                  <p className="font-sans font-semibold text-charcoal">{selectedDiamond.caratWeight.toFixed(2)}ct {selectedDiamond.shape} Diamond</p>
                  <p className="text-sm font-sans text-gray-500 mt-1">{selectedDiamond.cut} Cut · Color {selectedDiamond.color} · {selectedDiamond.clarity}</p>
                  <p className="text-xs font-sans text-gray-400">{selectedDiamond.certificate.lab} #{selectedDiamond.certificate.number}</p>
                  <p className="text-sm font-sans text-gold-600 mt-1">{formatPrice(selectedDiamond.price)}</p>
                </div>
              </div>

              {/* Size */}
              {selectedSetting.variants.length > 0 && (
                <div>
                  <p className="text-xs font-sans font-semibold tracking-widest uppercase text-charcoal mb-3">Ring Size</p>
                  <div className="flex gap-2 flex-wrap">
                    {selectedSetting.variants.map((v) => (
                      <button key={v.size} onClick={() => setSelectedSize(v.size)} className={cn('w-11 h-11 text-sm font-sans border', selectedSize === v.size ? 'border-gold-500 bg-gold-50 text-gold-700 font-medium' : 'border-gray-200 text-gray-600 hover:border-gold-300')}>
                        {v.size}
                      </button>
                    ))}
                  </div>
                  <Link href="/size-guide" className="text-xs font-sans text-gold-600 hover:underline mt-2 inline-block">Size Guide</Link>
                </div>
              )}

              {/* Total */}
              <div className="bg-champagne p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-sans text-gray-500 tracking-widest uppercase">Total Price</p>
                  <p className="font-serif text-3xl font-light text-charcoal mt-1">{formatPrice(totalPrice)}</p>
                </div>
                <button onClick={handleAddToCart} className="btn-gold">Add to Bag</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
