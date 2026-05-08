import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { IProduct, IDiamond } from '@/types';

export interface RingBuilderState {
  // selections
  setting: IProduct | null;
  diamond: IDiamond | null;
  // customisation
  selectedMetal: string;
  selectedHead: string;
  selectedBand: string;
  selectedSize: string;
  previewShape: string;
  previewCarat: string;
  // flow tracking
  entryPoint: 'setting' | 'diamond' | null; // how the user started

  // actions
  setSetting: (p: IProduct, metal?: string) => void;
  setDiamond: (d: IDiamond) => void;
  setMetal: (m: string) => void;
  setHead: (h: string) => void;
  setBand: (b: string) => void;
  setSize: (s: string) => void;
  setPreviewShape: (s: string) => void;
  setPreviewCarat: (c: string) => void;
  setEntryPoint: (e: 'setting' | 'diamond') => void;
  clearSetting: () => void;
  clearDiamond: () => void;
  reset: () => void;

  // derived helpers
  settingPrice: () => number;
  totalPrice: () => number;
}

const HEAD_MODS: Record<string, number> = {
  'four-claw': 0, 'six-claw': 45, bezel: 75, pave: 140,
  halo: 195, 'hidden-halo': 165, 'classic-halo': 175, plain: 0,
};
const BAND_MODS: Record<string, number> = {
  plain: 0, 'knife-edge': 35, pave: 110, 'half-pave': 65,
  channel: 80, twisted: 75,
};

const DEFAULTS = {
  setting: null,
  diamond: null,
  selectedMetal: '',
  selectedHead: 'four-claw',
  selectedBand: 'plain',
  selectedSize: '',
  previewShape: 'Round',
  previewCarat: '1',
  entryPoint: null,
};

export const useRingBuilder = create<RingBuilderState>()(
  persist(
    (set, get) => ({
      ...DEFAULTS,

      setSetting: (p, metal) => {
        const def = p.metalOptions?.find(m => m.isDefault) || p.metalOptions?.[0];
        set({ setting: p, selectedMetal: metal || def?.type || get().selectedMetal });
      },
      setDiamond:      (d) => set({ diamond: d }),
      setMetal:        (m) => set({ selectedMetal: m }),
      setHead:         (h) => set({ selectedHead: h }),
      setBand:         (b) => set({ selectedBand: b }),
      setSize:         (s) => set({ selectedSize: s }),
      setPreviewShape: (s) => set({ previewShape: s }),
      setPreviewCarat: (c) => set({ previewCarat: c }),
      setEntryPoint:   (e) => set({ entryPoint: e }),
      clearSetting:    ()  => set({ setting: null, selectedMetal: '', selectedHead: 'four-claw', selectedBand: 'plain' }),
      clearDiamond:    ()  => set({ diamond: null }),
      reset:           ()  => set(DEFAULTS),

      settingPrice: () => {
        const { setting, selectedMetal, selectedHead, selectedBand } = get();
        if (!setting) return 0;
        const base     = setting.salePrice ?? setting.basePrice;
        const metalMod = setting.metalOptions?.find(m => m.type === selectedMetal)?.priceModifier ?? 0;
        return base + (HEAD_MODS[selectedHead] || 0) + (BAND_MODS[selectedBand] || 0) + metalMod;
      },

      totalPrice: () => {
        const { diamond } = get();
        return get().settingPrice() + (diamond?.price ?? 0);
      },
    }),
    { name: 'sj-ring-builder' }
  )
);
