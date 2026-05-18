'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { Plus, Search, Edit2, Trash2, Eye, ChevronLeft, ChevronRight, Box, Camera, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function AdminProductsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [gen3dLoading,       setGen3dLoading]       = useState(false);
  const [genLifestyleLoading, setGenLifestyleLoading] = useState(false);

  async function handleGenerate3D() {
    setGen3dLoading(true);
    try {
      const res = await adminApi.generate3DBatch(20);
      toast.success(res.data?.message || '3D generation queued!');
    } catch { toast.error('Failed to start 3D generation'); }
    finally { setGen3dLoading(false); }
  }

  async function handleGenerateLifestyle() {
    setGenLifestyleLoading(true);
    try {
      const res = await adminApi.generateLifestyleBatch(20);
      toast.success(res.data?.message || 'Lifestyle photos queued!');
    } catch { toast.error('Failed to start lifestyle generation'); }
    finally { setGenLifestyleLoading(false); }
  }

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', page, search],
    queryFn: () => adminApi.getProducts({ page, limit: 20, search }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteProduct(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-products'] }),
  });

  const products = data?.data?.products || [];
  const total = data?.data?.total || 0;
  const pages = data?.data?.pages || 1;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Products</h1>
            <p className="text-sm text-gray-500">{total} total products</p>
          </div>
          <Link href="/admin/products/new" className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
            <Plus size={16} /> Add Product
          </Link>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleGenerate3D}
            disabled={gen3dLoading}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            {gen3dLoading ? <Loader2 size={15} className="animate-spin" /> : <Box size={15} />}
            Generate 3D Models
          </button>
          <button
            onClick={handleGenerateLifestyle}
            disabled={genLifestyleLoading}
            className="flex items-center gap-2 bg-pink-600 hover:bg-pink-700 disabled:opacity-60 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            {genLifestyleLoading ? <Loader2 size={15} className="animate-spin" /> : <Camera size={15} />}
            Generate Lifestyle Photos
          </button>
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search products…"
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
        <button type="submit" className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors">
          Search
        </button>
      </form>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Product</th>
              <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Category</th>
              <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Price</th>
              <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Stock</th>
              <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
              <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-4">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              : products.map((p: {
                  _id: string; name: string; images: string[];
                  category?: { name: string }; basePrice: number; salePrice?: number;
                  variants: { stock: number }[]; isActive: boolean; isFeatured: boolean;
                }) => {
                  const totalStock = p.variants.reduce((s: number, v: { stock: number }) => s + v.stock, 0);
                  return (
                    <tr key={p._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                            {p.images[0] && (
                              <Image src={p.images[0]} alt={p.name} width={40} height={40} className="object-cover w-full h-full" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 line-clamp-1">{p.name}</p>
                            {p.isFeatured && (
                              <span className="text-[10px] text-amber-600 font-medium">Featured</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-gray-600">{p.category?.name || '—'}</td>
                      <td className="px-4 py-4">
                        <span className="font-semibold text-gray-900">{formatPrice(p.basePrice)}</span>
                        {p.salePrice && (
                          <span className="ml-2 text-xs text-red-500 line-through">{formatPrice(p.salePrice)}</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className={cn('text-xs font-medium', totalStock > 5 ? 'text-green-600' : totalStock > 0 ? 'text-yellow-600' : 'text-red-500')}>
                          {p.variants.length > 0 ? `${totalStock} units` : 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={cn('text-xs px-2 py-1 rounded-full font-medium', p.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600')}>
                          {p.isActive ? 'Active' : 'Hidden'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/products/${p._id}`} target="_blank" className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors" title="View">
                            <Eye size={15} />
                          </Link>
                          <Link href={`/admin/products/${p._id}`} className="p-1.5 text-gray-400 hover:text-amber-600 transition-colors" title="Edit">
                            <Edit2 size={15} />
                          </Link>
                          <button
                            onClick={() => {
                              if (confirm(`Deactivate "${p.name}"?`)) deleteMutation.mutate(p._id);
                            }}
                            className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                            title="Deactivate"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
          </tbody>
        </table>

        {/* Pagination */}
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
