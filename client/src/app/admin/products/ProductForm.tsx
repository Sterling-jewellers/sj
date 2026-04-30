'use client';

import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useQuery, useMutation } from '@tanstack/react-query';
import { adminApi, categoriesApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, X } from 'lucide-react';

interface ProductFormData {
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  category: string;
  subCategory?: string;
  basePrice: number;
  salePrice?: number;
  style?: string;
  gemstone?: string;
  settingType?: string;
  isEngravable: boolean;
  isFeatured: boolean;
  isBestseller: boolean;
  isNewArrival: boolean;
  isActive: boolean;
  deliveryDays: number;
  images: { url: string }[];
  metalOptions: {
    type: string;
    karat?: string;
    priceModifier: number;
    isDefault: boolean;
  }[];
  variants: {
    size: string;
    stock: number;
    sku: string;
  }[];
}

const METAL_TYPES = ['yellow-gold', 'white-gold', 'rose-gold', 'platinum', 'silver'];
const KARAT_OPTIONS = ['9ct', '14ct', '18ct'];
const RING_SIZES = ['D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];

export default function ProductForm({ productId }: { productId?: string }) {
  const router = useRouter();
  const isEdit = !!productId;

  const { data: catData } = useQuery({ queryKey: ['categories'], queryFn: () => categoriesApi.getAll() });
  const categories = catData?.data || [];

  const { data: prodData } = useQuery({
    queryKey: ['admin-product', productId],
    queryFn: () => adminApi.getProduct(productId!),
    enabled: isEdit,
  });

  const { register, control, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<ProductFormData>({
    defaultValues: {
      isEngravable: false, isFeatured: false, isBestseller: false, isNewArrival: true, isActive: true,
      deliveryDays: 7, basePrice: 0, images: [{ url: '' }],
      metalOptions: [{ type: 'platinum', karat: '18ct', priceModifier: 0, isDefault: true }],
      variants: [],
    },
  });

  const { fields: imgFields, append: addImg, remove: removeImg } = useFieldArray({ control, name: 'images' });
  const { fields: metalFields, append: addMetal, remove: removeMetal } = useFieldArray({ control, name: 'metalOptions' });
  const { fields: varFields, append: addVar, remove: removeVar } = useFieldArray({ control, name: 'variants' });

  const [sizesToAdd, setSizesToAdd] = useState<string[]>([]);

  useEffect(() => {
    const p = prodData?.data;
    if (p) {
      // Explicitly map only form fields — never spread the full DB document
      // (spreading would include _id, __v, createdAt, updatedAt which Mongoose rejects)
      reset({
        name: p.name,
        slug: p.slug,
        shortDescription: p.shortDescription,
        description: p.description || '',
        category: p.category?._id || p.category,
        subCategory: p.subCategory || '',
        basePrice: p.basePrice,
        salePrice: p.salePrice || undefined,
        style: p.style || '',
        gemstone: p.gemstone || '',
        settingType: p.settingType || '',
        isEngravable: !!p.isEngravable,
        isFeatured: !!p.isFeatured,
        isBestseller: !!p.isBestseller,
        isNewArrival: !!p.isNewArrival,
        isActive: p.isActive !== false,
        deliveryDays: p.deliveryDays || 7,
        images: (p.images || []).map((url: string) => ({ url })),
        // Strip _id from nested subdocuments so they don't reach the PUT body
        metalOptions: (p.metalOptions || []).map((m: { type: string; karat?: string; priceModifier: number; isDefault: boolean }) => ({
          type: m.type,
          karat: m.karat,
          priceModifier: m.priceModifier,
          isDefault: m.isDefault,
        })),
        variants: (p.variants || []).map((v: { size: string; stock: number; sku: string }) => ({
          size: v.size,
          stock: v.stock,
          sku: v.sku,
        })),
      });
    }
  }, [prodData, reset]);

  const nameVal = watch('name');
  useEffect(() => {
    if (!isEdit && nameVal) {
      setValue('slug', nameVal.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
    }
  }, [nameVal, isEdit, setValue]);

  const mutation = useMutation({
    mutationFn: (data: ProductFormData) => {
      const payload = {
        name: data.name,
        slug: data.slug,
        shortDescription: data.shortDescription,
        description: data.description,
        category: data.category,
        subCategory: data.subCategory,
        basePrice: data.basePrice,
        salePrice: data.salePrice || undefined,
        style: data.style,
        gemstone: data.gemstone,
        settingType: data.settingType,
        isEngravable: data.isEngravable,
        isFeatured: data.isFeatured,
        isBestseller: data.isBestseller,
        isNewArrival: data.isNewArrival,
        isActive: data.isActive,
        deliveryDays: data.deliveryDays,
        images: data.images.map((i) => i.url).filter(Boolean),
        // Ensure no _id leaks from field-array items
        metalOptions: data.metalOptions.map(({ type, karat, priceModifier, isDefault }) => ({ type, karat, priceModifier, isDefault })),
        variants: data.variants.map(({ size, stock, sku }) => ({ size, stock, sku })),
      };
      return isEdit ? adminApi.updateProduct(productId!, payload) : adminApi.createProduct(payload);
    },
    onSuccess: () => router.push('/admin/products'),
  });

  const addSizes = () => {
    sizesToAdd.forEach((s) => {
      addVar({ size: s, stock: 5, sku: `SJ-${Math.random().toString(36).slice(2,6).toUpperCase()}-${s}` });
    });
    setSizesToAdd([]);
  };

  const onSubmit = handleSubmit((data) => mutation.mutate(data));

  const inputCls = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400';
  const labelCls = 'block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide';

  return (
    <form onSubmit={onSubmit} className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Product' : 'New Product'}</h1>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={() => router.back()} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting || mutation.isPending} className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60">
            {mutation.isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Product'}
          </button>
        </div>
      </div>

      {mutation.isError && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {(mutation.error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to save product. Check all required fields and try again.'}
        </div>
      )}

      <div className="space-y-6">
        {/* Basic Info */}
        <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-5">Basic Information</h2>
          <div className="grid grid-cols-2 gap-5">
            <div className="col-span-2">
              <label className={labelCls}>Product Name *</label>
              <input {...register('name', { required: true })} className={inputCls} placeholder="e.g. Classic Round Brilliant Solitaire" />
            </div>
            <div>
              <label className={labelCls}>Slug *</label>
              <input {...register('slug', { required: true })} className={inputCls} placeholder="auto-generated from name" />
            </div>
            <div>
              <label className={labelCls}>Category *</label>
              <select {...register('category', { required: true })} className={inputCls}>
                <option value="">Select category…</option>
                {categories.map((c: { _id: string; name: string }) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Base Price (£) *</label>
              <input type="number" step="0.01" {...register('basePrice', { required: true, valueAsNumber: true })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Sale Price (£)</label>
              <input type="number" step="0.01" {...register('salePrice', { valueAsNumber: true })} className={inputCls} placeholder="Leave blank if no sale" />
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Short Description *</label>
              <input {...register('shortDescription', { required: true })} className={inputCls} placeholder="Brief product summary (shown in listings)" />
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Full Description</label>
              <textarea {...register('description')} rows={4} className={inputCls} placeholder="Detailed HTML description" />
            </div>
          </div>
        </section>

        {/* Images */}
        <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Images</h2>
            <button type="button" onClick={() => addImg({ url: '' })} className="text-xs text-amber-600 hover:underline flex items-center gap-1">
              <Plus size={13} /> Add image
            </button>
          </div>
          <div className="space-y-2">
            {imgFields.map((field, i) => (
              <div key={field.id} className="flex gap-2 items-center">
                <input {...register(`images.${i}.url`)} placeholder="https://images.unsplash.com/…" className={`${inputCls} flex-1`} />
                {imgFields.length > 1 && (
                  <button type="button" onClick={() => removeImg(i)} className="p-1.5 text-gray-400 hover:text-red-500">
                    <X size={15} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Details */}
        <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-5">Product Details</h2>
          <div className="grid grid-cols-3 gap-5">
            <div>
              <label className={labelCls}>Style</label>
              <input {...register('style')} className={inputCls} placeholder="solitaire, halo, vintage…" />
            </div>
            <div>
              <label className={labelCls}>Gemstone</label>
              <input {...register('gemstone')} className={inputCls} placeholder="round, oval, princess…" />
            </div>
            <div>
              <label className={labelCls}>Setting Type</label>
              <input {...register('settingType')} className={inputCls} placeholder="four-claw, bezel, pavé…" />
            </div>
            <div>
              <label className={labelCls}>Sub-Category</label>
              <input {...register('subCategory')} className={inputCls} placeholder="solitaire, halo…" />
            </div>
            <div>
              <label className={labelCls}>Delivery Days</label>
              <input type="number" {...register('deliveryDays', { valueAsNumber: true })} className={inputCls} />
            </div>
          </div>

          <div className="flex flex-wrap gap-5 mt-5">
            {[
              { name: 'isEngravable', label: 'Engravable' },
              { name: 'isFeatured', label: 'Featured' },
              { name: 'isBestseller', label: 'Bestseller' },
              { name: 'isNewArrival', label: 'New Arrival' },
              { name: 'isActive', label: 'Active / Visible' },
            ].map(({ name, label }) => (
              <label key={name} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" {...register(name as keyof ProductFormData)} className="w-4 h-4 accent-amber-500" />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>
        </section>

        {/* Metal Options */}
        <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Metal Options</h2>
            <button type="button" onClick={() => addMetal({ type: 'yellow-gold', karat: '18ct', priceModifier: 0, isDefault: false })} className="text-xs text-amber-600 hover:underline flex items-center gap-1">
              <Plus size={13} /> Add metal
            </button>
          </div>
          <div className="space-y-3">
            {metalFields.map((field, i) => (
              <div key={field.id} className="flex items-center gap-3">
                <select {...register(`metalOptions.${i}.type`)} className={`${inputCls} flex-1`}>
                  {METAL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <select {...register(`metalOptions.${i}.karat`)} className={`${inputCls} w-28`}>
                  <option value="">Karat</option>
                  {KARAT_OPTIONS.map((k) => <option key={k} value={k}>{k}</option>)}
                </select>
                <div className="relative w-32">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">£</span>
                  <input type="number" {...register(`metalOptions.${i}.priceModifier`, { valueAsNumber: true })} placeholder="0" className={`${inputCls} pl-7`} />
                </div>
                <label className="flex items-center gap-1.5 text-xs text-gray-600 whitespace-nowrap">
                  <input type="checkbox" {...register(`metalOptions.${i}.isDefault`)} className="accent-amber-500" />
                  Default
                </label>
                {metalFields.length > 1 && (
                  <button type="button" onClick={() => removeMetal(i)} className="p-1.5 text-gray-400 hover:text-red-500">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Size Variants */}
        <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-4">Size Variants</h2>

          {/* Quick-add ring sizes */}
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-2">Quick add ring sizes:</p>
            <div className="flex flex-wrap gap-1.5">
              {RING_SIZES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSizesToAdd((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s])}
                  className={`w-8 h-8 text-xs rounded border font-medium transition-colors ${
                    sizesToAdd.includes(s) ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-gray-600 border-gray-200 hover:border-amber-400'
                  }`}
                >
                  {s}
                </button>
              ))}
              {sizesToAdd.length > 0 && (
                <button type="button" onClick={addSizes} className="ml-2 px-3 py-1 bg-amber-500 text-white text-xs rounded hover:bg-amber-600">
                  Add {sizesToAdd.length} size{sizesToAdd.length > 1 ? 's' : ''}
                </button>
              )}
            </div>
          </div>

          {varFields.length > 0 && (
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-3 text-xs font-semibold text-gray-500 uppercase tracking-wide px-1">
                <span>Size</span><span>Stock</span><span>SKU</span>
              </div>
              {varFields.map((field, i) => (
                <div key={field.id} className="flex items-center gap-3">
                  <input {...register(`variants.${i}.size`)} className={`${inputCls} w-24`} />
                  <input type="number" {...register(`variants.${i}.stock`, { valueAsNumber: true })} className={`${inputCls} w-24`} />
                  <input {...register(`variants.${i}.sku`)} className={`${inputCls} flex-1`} />
                  <button type="button" onClick={() => removeVar(i)} className="p-1.5 text-gray-400 hover:text-red-500">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => addVar({ size: '', stock: 0, sku: '' })}
            className="mt-3 text-xs text-amber-600 hover:underline flex items-center gap-1"
          >
            <Plus size={13} /> Add custom size
          </button>
        </section>
      </div>
    </form>
  );
}
