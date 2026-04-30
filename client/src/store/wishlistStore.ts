import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { IProduct } from '@/types';

interface WishlistStore {
  items: IProduct[];
  addItem: (product: IProduct) => void;
  removeItem: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;
  toggleItem: (product: IProduct) => void;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product) => set((state) => ({ items: [...state.items, product] })),
      removeItem: (productId) => set((state) => ({ items: state.items.filter((i) => i._id !== productId) })),
      isWishlisted: (productId) => get().items.some((i) => i._id === productId),
      toggleItem: (product) => {
        const { isWishlisted, addItem, removeItem } = get();
        isWishlisted(product._id) ? removeItem(product._id) : addItem(product);
      },
    }),
    { name: 'sj-wishlist' }
  )
);
