'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useState } from 'react';
import CartDrawer from '@/components/cart/CartDrawer';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 1000 * 60 * 5, retry: 1 } },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <CartDrawer />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: { fontFamily: 'var(--font-montserrat)', fontSize: '13px' },
          success: { iconTheme: { primary: '#C9A84C', secondary: '#fff' } },
        }}
      />
    </QueryClientProvider>
  );
}
