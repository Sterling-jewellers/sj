import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ICartItem, IProduct, IDiamond } from '@/types';

interface CartStore {
  items: ICartItem[];
  isOpen: boolean;
  addItem: (product: IProduct, options?: { quantity?: number; selectedMetal?: string; selectedSize?: string; engraving?: string; diamond?: IDiamond }) => void;
  removeItem: (productId: string, selectedMetal?: string, selectedSize?: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

const getItemPrice = (product: IProduct, selectedMetal?: string, diamond?: IDiamond): number => {
  let price = product.salePrice || product.basePrice;
  if (selectedMetal) {
    const metal = product.metalOptions.find((m) => m.type === selectedMetal);
    if (metal) price += metal.priceModifier;
  }
  if (diamond) price += diamond.price;
  return price;
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (product, options = {}) => {
        const { quantity = 1, selectedMetal, selectedSize, engraving, diamond } = options;
        const totalPrice = getItemPrice(product, selectedMetal, diamond);

        set((state) => {
          const existing = state.items.findIndex(
            (i) => i.product._id === product._id && i.selectedMetal === selectedMetal && i.selectedSize === selectedSize
          );
          if (existing > -1) {
            const updated = [...state.items];
            updated[existing].quantity += quantity;
            return { items: updated, isOpen: true };
          }
          return {
            items: [...state.items, { product, quantity, selectedMetal, selectedSize, engraving, diamond, totalPrice }],
            isOpen: true,
          };
        });
      },

      removeItem: (productId, selectedMetal, selectedSize) =>
        set((state) => ({
          items: state.items.filter(
            (i) => !(i.product._id === productId && i.selectedMetal === selectedMetal && i.selectedSize === selectedSize)
          ),
        })),

      updateQuantity: (productId, quantity) =>
        set((state) => ({
          items: quantity <= 0
            ? state.items.filter((i) => i.product._id !== productId)
            : state.items.map((i) => (i.product._id === productId ? { ...i, quantity } : i)),
        })),

      clearCart: () => set({ items: [] }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      getTotalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      getTotalPrice: () => get().items.reduce((sum, i) => sum + i.totalPrice * i.quantity, 0),
    }),
    { name: 'sj-cart' }
  )
);
