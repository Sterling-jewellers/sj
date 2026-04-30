'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { Plus, Search, Edit2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

const SHAPE_ICONS: Record<string, string> = {
  round: '⬤', oval: '⬭', princess: '◼', cushion: '▪', emerald: '▬', pear: '💧', marquise: '◇', heart: '♥',
};

export default function AdminDiamondsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-diamonds', page, search],
    queryFn: () => adminApi.getDiamonds({ page, limit: 20, search }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteDiamond(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-diamonds'] }),
  });

  const diamonds = data?.data?.diamonds || [];
  const total = data?.data?.total || 0;
  const pages = data?.data?.pages || 1;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Diamonds</h1>
          <p className="text-sm text-gray-500">{total} stones in inventory</p>
        </div>
        <Link href="/admin/diamonds/new" className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
          <Plus size={16} /> Add Diamond
        </Link>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by SKU…"
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
        <button type="submit" className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors">Search</button>
      </form>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">SKU</th>
              <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Shape</th>
              <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Carat</th>
              <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cut</th>
              <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Color</th>
              <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Clarity</th>
              <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Lab</th>
              <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Price</th>
              <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              : diamonds.map((d: {
                  _id: string; sku: string; shape: string; caratWeight: number;
                  cut: string; color: string; clarity: string;
                  certificate: { lab: string; number: string };
                  price: number;
                }) => (
                  <tr key={d._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs text-gray-600">{d.sku}</td>
                    <td className="px-4 py-3">
                      <span className="capitalize flex items-center gap-1.5">
                        <span className="text-base">{SHAPE_ICONS[d.shape] || '◆'}</span>
                        {d.shape}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{d.caratWeight.toFixed(2)}ct</td>
                    <td className="px-4 py-3 text-gray-700">{d.cut}</td>
                    <td className="px-4 py-3">
                      <span className="w-6 h-6 inline-flex items-center justify-center rounded-full bg-amber-50 text-amber-700 font-bold text-xs">
                        {d.color}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{d.clarity}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded font-medium">{d.certificate?.lab}</span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{formatPrice(d.price)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/diamonds/${d._id}`} className="p-1.5 text-gray-400 hover:text-amber-600 transition-colors">
                          <Edit2 size={15} />
                        </Link>
                        <button
                          onClick={() => { if (confirm(`Delete diamond ${d.sku}?`)) deleteMutation.mutate(d._id); }}
                          className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>

        {pages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
            <p className="text-xs text-gray-500">Page {page} of {pages}</p>
            <div className="flex gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40">
                <ChevronLeft size={16} />
              </button>
              <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages} className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-40">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
