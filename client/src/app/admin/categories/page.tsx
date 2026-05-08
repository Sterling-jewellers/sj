'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { adminApi } from '@/lib/api';
import { Plus, Pencil, Trash2, X, Tag, Store } from 'lucide-react';
import toast from 'react-hot-toast';

interface CategoryForm {
  name: string;
  slug: string;
  description?: string;
  image: string;
  sortOrder: number;
  isActive: boolean;
  sourceStore?: string;
  metaTitle?: string;
  metaDescription?: string;
}

interface ICategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image: string;
  sortOrder: number;
  isActive: boolean;
  sourceStore?: string;
  metaTitle?: string;
  metaDescription?: string;
}

export default function AdminCategoriesPage() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<ICategory | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => adminApi.getCategories(),
  });
  const categories: ICategory[] = data?.data || [];

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<CategoryForm>({
    defaultValues: { isActive: true, sortOrder: 0 },
  });

  const nameVal = watch('name');

  const openCreate = () => {
    setEditingCat(null);
    reset({ name: '', slug: '', description: '', image: '', sortOrder: 0, isActive: true, sourceStore: '', metaTitle: '', metaDescription: '' });
    setModalOpen(true);
  };

  const openEdit = (cat: ICategory) => {
    setEditingCat(cat);
    reset({
      name: cat.name, slug: cat.slug, description: cat.description || '', image: cat.image,
      sortOrder: cat.sortOrder, isActive: cat.isActive, sourceStore: cat.sourceStore || '',
      metaTitle: cat.metaTitle || '', metaDescription: cat.metaDescription || '',
    });
    setModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: (data: CategoryForm) => {
      const payload = {
        ...data,
        slug: data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      };
      return editingCat
        ? adminApi.updateCategory(editingCat._id, payload)
        : adminApi.createCategory(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-categories'] });
      toast.success(editingCat ? 'Category updated' : 'Category created');
      setModalOpen(false);
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Save failed';
      toast.error(msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteCategory(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-categories'] });
      toast.success('Category deleted');
    },
  });

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingCat) {
      setValue('slug', e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
    }
  };

  const inputCls = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400';
  const labelCls = 'block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide';

  const storeGroups: Record<string, ICategory[]> = {};
  const noStore: ICategory[] = [];
  for (const cat of categories) {
    if (cat.sourceStore) {
      storeGroups[cat.sourceStore] = storeGroups[cat.sourceStore] || [];
      storeGroups[cat.sourceStore].push(cat);
    } else {
      noStore.push(cat);
    }
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-sm text-gray-500 mt-1">{categories.length} total</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors">
          <Plus size={16} /> New Category
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-8">
          {/* Sterling own categories */}
          {noStore.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Tag size={16} className="text-amber-500" />
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Sterling Jewellers</h2>
                <span className="text-xs text-gray-400">({noStore.length})</span>
              </div>
              <CatTable cats={noStore} onEdit={openEdit} onDelete={(id) => { if (confirm('Delete this category?')) deleteMutation.mutate(id); }} />
            </div>
          )}

          {/* External store groups */}
          {Object.entries(storeGroups).map(([store, cats]) => (
            <div key={store}>
              <div className="flex items-center gap-2 mb-3">
                <Store size={16} className="text-blue-500" />
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{store}</h2>
                <span className="text-xs text-gray-400">({cats.length})</span>
              </div>
              <CatTable cats={cats} onEdit={openEdit} onDelete={(id) => { if (confirm('Delete this category?')) deleteMutation.mutate(id); }} />
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">{editingCat ? 'Edit Category' : 'New Category'}</h2>
              <button onClick={() => setModalOpen(false)}><X size={18} className="text-gray-400 hover:text-gray-700" /></button>
            </div>

            <form onSubmit={handleSubmit((data) => saveMutation.mutate(data))} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className={labelCls}>Category Name *</label>
                  <input {...register('name', { required: true })} className={inputCls} placeholder="e.g. Engagement Rings" onChange={(e) => { register('name').onChange(e); handleNameChange(e); }} />
                  {errors.name && <p className="text-xs text-red-500 mt-1">Name is required</p>}
                </div>
                <div>
                  <label className={labelCls}>Slug *</label>
                  <input {...register('slug', { required: true })} className={inputCls} placeholder="engagement-rings" />
                </div>
                <div>
                  <label className={labelCls}>Sort Order</label>
                  <input type="number" {...register('sortOrder', { valueAsNumber: true })} className={inputCls} />
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Image URL *</label>
                  <input {...register('image', { required: true })} className={inputCls} placeholder="https://…" />
                  {errors.image && <p className="text-xs text-red-500 mt-1">Image URL is required</p>}
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Description</label>
                  <textarea {...register('description')} rows={2} className={inputCls} />
                </div>
                <div className="col-span-2">
                  <label className={labelCls}>Source Store <span className="normal-case font-normal text-gray-400">(leave blank for own products)</span></label>
                  <input {...register('sourceStore')} className={inputCls} placeholder="e.g. Hanroon Jewellery, JN Jewellery" />
                  <p className="text-xs text-gray-400 mt-1">Set this to group imported jewellery under a separate store brand.</p>
                </div>
                <div>
                  <label className={labelCls}>Meta Title</label>
                  <input {...register('metaTitle')} className={inputCls} placeholder="SEO title" />
                </div>
                <div>
                  <label className={labelCls}>Meta Description</label>
                  <input {...register('metaDescription')} className={inputCls} placeholder="SEO description" />
                </div>
                <div className="col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" {...register('isActive')} className="w-4 h-4 accent-amber-500" />
                    <span className="text-sm text-gray-700">Active / Visible on site</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 px-4 py-2 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={saveMutation.isPending} className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60">
                  {saveMutation.isPending ? 'Saving…' : editingCat ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function CatTable({ cats, onEdit, onDelete }: { cats: ICategory[]; onEdit: (c: ICategory) => void; onDelete: (id: string) => void }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            <th className="text-left px-4 py-3">Name</th>
            <th className="text-left px-4 py-3">Slug</th>
            <th className="text-left px-4 py-3">Status</th>
            <th className="text-right px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {cats.map((cat) => (
            <tr key={cat._id} className="hover:bg-gray-50/50 transition-colors">
              <td className="px-4 py-3 font-medium text-gray-900">{cat.name}</td>
              <td className="px-4 py-3 text-gray-400 font-mono text-xs">{cat.slug}</td>
              <td className="px-4 py-3">
                <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${cat.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {cat.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center justify-end gap-1">
                  <button onClick={() => onEdit(cat)} className="p-1.5 text-gray-400 hover:text-amber-600 rounded hover:bg-amber-50 transition-colors">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => onDelete(cat._id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded hover:bg-red-50 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
