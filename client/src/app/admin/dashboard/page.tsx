'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import {
  ShoppingBag, Package, Users, TrendingUp,
  Diamond, ChevronRight, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import Link from 'next/link';
import {
  ComposedChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts';
import { cn } from '@/lib/utils';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  processing: 'bg-indigo-100 text-indigo-700',
  dispatched: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  returned: 'bg-gray-100 text-gray-600',
};

const PIE_COLORS = ['#4f46e5', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#6b7280', '#ec4899'];
const RANGE_OPTIONS = [
  { label: '7 days', value: 7 },
  { label: '30 days', value: 30 },
  { label: '90 days', value: 90 },
  { label: '1 year', value: 365 },
];

function DeltaBadge({ delta }: { delta: number }) {
  const up = delta >= 0;
  return (
    <span className={cn('flex items-center gap-0.5 text-xs font-medium', up ? 'text-green-600' : 'text-red-500')}>
      {up ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
      {Math.abs(delta)}%
    </span>
  );
}

export default function AdminDashboardPage() {
  const [range, setRange] = useState(30);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard', range],
    queryFn: () => adminApi.getDashboard(range),
    refetchInterval: 5 * 60_000,
  });

  const stats = data?.data;

  const kpis = [
    {
      icon: TrendingUp,
      label: 'Revenue',
      sublabel: `Last ${range}d`,
      value: stats ? formatPrice(stats.period?.revenue || 0) : '—',
      delta: stats?.period?.revenueDelta,
      color: 'text-amber-600 bg-amber-50',
    },
    {
      icon: ShoppingBag,
      label: 'Orders',
      sublabel: `Last ${range}d`,
      value: stats?.period?.orders?.toLocaleString() ?? '—',
      delta: stats?.period?.ordersDelta,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      icon: Users,
      label: 'New Customers',
      sublabel: `Last ${range}d`,
      value: stats?.period?.newUsers?.toLocaleString() ?? '—',
      delta: stats?.period?.newUsersDelta,
      color: 'text-green-600 bg-green-50',
    },
    {
      icon: Package,
      label: 'Total Revenue',
      sublabel: 'All time',
      value: stats ? formatPrice(stats.totalRevenue || 0) : '—',
      delta: undefined,
      color: 'text-purple-600 bg-purple-50',
    },
    {
      icon: ShoppingBag,
      label: 'Total Orders',
      sublabel: 'All time',
      value: stats?.totalOrders?.toLocaleString() ?? '—',
      delta: undefined,
      color: 'text-indigo-600 bg-indigo-50',
    },
    {
      icon: Users,
      label: 'Total Customers',
      sublabel: 'All time',
      value: stats?.totalUsers?.toLocaleString() ?? '—',
      delta: undefined,
      color: 'text-teal-600 bg-teal-50',
    },
    {
      icon: Package,
      label: 'Active Products',
      sublabel: 'In catalogue',
      value: stats?.totalProducts?.toLocaleString() ?? '—',
      delta: undefined,
      color: 'text-rose-600 bg-rose-50',
    },
    {
      icon: Diamond,
      label: 'Diamonds',
      sublabel: 'In inventory',
      value: stats?.totalDiamonds?.toLocaleString() ?? '—',
      delta: undefined,
      color: 'text-cyan-600 bg-cyan-50',
    },
  ];

  // Build revenue timeline with formatted labels
  const timeline = (stats?.revenueTimeline || []).map((d: { _id: string; revenue: number; orders: number }) => ({
    date: d._id.slice(5), // MM-DD
    revenue: d.revenue,
    orders: d.orders,
  }));

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Real-time overview of your store</p>
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setRange(opt.value)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                range === opt.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-4 gap-4">
        {kpis.map(({ icon: Icon, label, sublabel, value, delta, color }) => (
          <div key={label + sublabel} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between mb-3">
              <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', color)}>
                <Icon size={18} />
              </div>
              {delta !== undefined && <DeltaBadge delta={delta} />}
            </div>
            <p className={cn('text-2xl font-bold text-gray-900', isLoading && 'animate-pulse')}>{value}</p>
            <p className="text-sm font-medium text-gray-700 mt-0.5">{label}</p>
            <p className="text-xs text-gray-400">{sublabel}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-3 gap-6">
        {/* Revenue area chart */}
        <div className="col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-semibold text-gray-900">Revenue & Orders</h2>
            <span className="text-xs text-gray-400">Last {range} days</span>
          </div>
          {timeline.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={timeline}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C9A84C" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#C9A84C" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis yAxisId="rev" tick={{ fontSize: 10 }} tickFormatter={(v) => `£${(v / 1000).toFixed(0)}k`} />
                <YAxis yAxisId="ord" orientation="right" tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(value, name) =>
                    name === 'revenue' ? [formatPrice(value as number), 'Revenue'] : [value, 'Orders']
                  }
                />
                <Area yAxisId="rev" type="monotone" dataKey="revenue" stroke="#C9A84C" strokeWidth={2} fill="url(#rev)" />
                <Bar yAxisId="ord" dataKey="orders" fill="#e5d5a3" radius={[2, 2, 0, 0]} />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-sm text-gray-400">
              No paid orders in this period
            </div>
          )}
        </div>

        {/* Order status pie */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-4">Order Status</h2>
          {stats?.statusBreakdown?.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={stats.statusBreakdown}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                  >
                    {stats.statusBreakdown.map((_: unknown, i: number) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, n) => [v, n]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {stats.statusBreakdown.map((s: { status: string; count: number }, i: number) => (
                  <div key={s.status} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="capitalize text-gray-600">{s.status}</span>
                    </div>
                    <span className="font-semibold text-gray-800">{s.count}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-sm text-gray-400">No orders yet</div>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-3 gap-6">
        {/* Top products */}
        <div className="col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-900">Top Products by Revenue</h2>
            <span className="text-xs text-gray-400">Last {range} days</span>
          </div>
          {stats?.topProducts?.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={stats.topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => `£${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="_id" tick={{ fontSize: 10 }} width={140} />
                <Tooltip formatter={(v) => [formatPrice(v as number), 'Revenue']} />
                <Bar dataKey="revenue" fill="#C9A84C" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[180px] flex items-center justify-center text-sm text-gray-400">No sales data yet</div>
          )}
        </div>

        {/* Recent orders */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-900">Recent Orders</h2>
            <Link href="/admin/orders" className="text-xs text-amber-600 hover:underline flex items-center gap-0.5">
              View all <ChevronRight size={12} />
            </Link>
          </div>
          <div className="space-y-3">
            {(stats?.recentOrders || []).map((order: {
              _id: string; orderNumber: string;
              user?: { firstName: string; lastName: string };
              total: number; orderStatus: string;
            }) => (
              <Link key={order._id} href={`/admin/orders/${order._id}`} className="flex items-center justify-between group">
                <div>
                  <p className="text-xs font-semibold text-gray-800 group-hover:text-amber-600 transition-colors">
                    {order.orderNumber}
                  </p>
                  <p className="text-[11px] text-gray-400">
                    {order.user ? `${order.user.firstName} ${order.user.lastName}` : 'Guest'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold">{formatPrice(order.total)}</p>
                  <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium', STATUS_COLORS[order.orderStatus] || 'bg-gray-100 text-gray-600')}>
                    {order.orderStatus}
                  </span>
                </div>
              </Link>
            ))}
            {(!stats?.recentOrders || stats.recentOrders.length === 0) && (
              <p className="text-sm text-gray-400 text-center py-6">No orders yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Add Product', href: '/admin/products/new', desc: 'Create a new jewellery listing' },
          { label: 'Add Diamond', href: '/admin/diamonds/new', desc: 'Add to diamond inventory' },
          { label: 'View Orders', href: '/admin/orders', desc: 'Manage and fulfil orders' },
          { label: 'Create Coupon', href: '/admin/coupons', desc: 'Set up a discount code' },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:border-amber-200 hover:shadow-md transition-all flex items-center justify-between group"
          >
            <div>
              <p className="font-semibold text-sm text-gray-800 group-hover:text-amber-600 transition-colors">{item.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
            </div>
            <ChevronRight size={16} className="text-gray-300 group-hover:text-amber-500 transition-colors flex-shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}
