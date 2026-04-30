'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Package, Diamond, ShoppingBag, Users, UserCog, Tag, Settings, LogOut, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/admin/dashboard' },
  { icon: Package, label: 'Products', href: '/admin/products' },
  { icon: Diamond, label: 'Diamonds', href: '/admin/diamonds' },
  { icon: ShoppingBag, label: 'Orders', href: '/admin/orders' },
  { icon: Users, label: 'Customers', href: '/admin/customers' },
  { icon: UserCog, label: 'Users', href: '/admin/users' },
  { icon: Tag, label: 'Coupons', href: '/admin/coupons' },
  { icon: Settings, label: 'Settings', href: '/admin/settings' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  useEffect(() => {
    if (!user) {
      router.replace('/sign-in?redirect=/admin/dashboard');
    } else if (user.role !== 'admin') {
      router.replace('/');
    }
  }, [user, router]);

  const handleLogout = () => { logout(); router.push('/sign-in'); };

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-amber-500" size={32} />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-charcoal text-white flex flex-col flex-shrink-0">
        <div className="p-6 border-b border-white/10">
          <span className="font-serif text-xl font-light tracking-[0.2em] uppercase">Sterling</span>
          <span className="block text-[9px] tracking-[0.4em] uppercase text-gold-400 font-medium -mt-0.5">Admin Panel</span>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ icon: Icon, label, href }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors rounded-sm',
                pathname?.startsWith(href) ? 'bg-gold-500 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'
              )}
            >
              <Icon size={17} />
              {label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-8 h-8 bg-gold-500 rounded-full flex items-center justify-center text-xs font-bold">
              {user?.firstName?.[0]}
            </div>
            <div>
              <p className="text-sm font-medium text-white">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-gray-400">Administrator</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 w-full px-4 py-2 text-xs text-gray-400 hover:text-red-400 transition-colors">
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
