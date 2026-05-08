'use client';

import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useQuery, useMutation } from '@tanstack/react-query';
import { adminApi, categoriesApi, goldPriceApi } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, X, Sparkles, Loader2, Wand2, Box, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

interface WeightBySize { size: string; weightGrams: number; }

interface ProductFormData {
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  category: string;
  subCategory?: string;
  basePrice: number;
  salePrice?: number;
  competitorPrice?: number;
  style?: string;
  gemstone?: string;
  settingType?: string;
  bandStyle?: string;
  shankWidth?: string;
  isEngravable: boolean;
  isFeatured: boolean;
  isBestseller: boolean;
  isNewArrival: boolean;
  isActive: boolean;
  deliveryDays: number;
  metaTitle?: string;
  metaDescription?: string;
  images: { url: string }[];
  metalOptions: { type: string; karat?: string; priceModifier: number; isDefault: boolean; }[];
  variants: { size: string; stock: number; sku: string; }[];
  weightBySize: WeightBySize[];
}

const METAL_TYPES = ['yellow-gold', 'white-gold', 'rose-gold', 'platinum', 'silver'];
const KARAT_OPTIONS = ['9ct', '14ct', '18ct'];
const RING_SIZES = ['D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];
const BAND_STYLES = ['plain', 'pave', 'half-pave', 'channel', 'twisted'];
const SHANK_WIDTHS = ['slim', 'standard', 'large'];

// Default weight table (grams) — admin can override per product
const DEFAULT_WEIGHT_TABLE: WeightBySize[] = RING_SIZES.map((size, i) => ({
  size,
  weightGrams: Math.round((2.8 + i * 0.12) * 100) / 100,
}));

export default function ProductForm({ productId }: { productId?: string }) {
  const router = useRouter();
  const isEdit = !!productId;
  const [aiLoading, setAiLoading] = useState(false);
  const [showWeightTable, setShowWeightTable] = useState(false);

  // ── AI Metal Image state ─────────────────────────────────────────────────
  const [metalImgLoading, setMetalImgLoading] = useState<Record<number, boolean>>({});
  const [metalImgDone, setMetalImgDone] = useState<Record<number, string>>({});  // idx → generated url

  // ── 3D Model state ───────────────────────────────────────────────────────
  const [gen3DLoading, setGen3DLoading] = useState(false);
  const [gen3DProgress, setGen3DProgress] = useState(0);
  const [gen3DStatus, setGen3DStatus] = useState<'idle' | 'processing' | 'completed' | 'failed'>('idle');
  const [gen3DModelUrl, setGen3DModelUrl] = useState('');
  const [gen3DPreviewUrl, setGen3DPreviewUrl] = useState('');

  const { data: catData } = useQuery({ queryKey: ['categories'], queryFn: () => categoriesApi.getAll() });
  const categories = catData?.data || [];

  // Live gold price — refreshes every 5 min, powers the auto-price preview
  const { data: goldData } = useQuery({
    queryKey: ['gold-price'],
    queryFn: () => goldPriceApi.getPrice(),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
  const goldPerGram: number | null = goldData?.data?.pricePerGram ?? null;

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
      weightBySize: [],
    },
  });

  const { fields: imgFields, append: addImg, remove: removeImg } = useFieldArray({ control, name: 'images' });
  const { fields: metalFields, append: addMetal, remove: removeMetal } = useFieldArray({ control, name: 'metalOptions' });
  const { fields: varFields, append: addVar, remove: removeVar } = useFieldArray({ control, name: 'variants' });
  const { fields: weightFields, replace: replaceWeights } = useFieldArray({ control, name: 'weightBySize' });

  const [sizesToAdd, setSizesToAdd] = useState<string[]>([]);

  // ── Computed auto-price preview (avoids calling watch() inside JSX) ─────────
  const watchedWeights      = watch('weightBySize') || [];
  const watchedMetalOptions = watch('metalOptions') || [];
  const midWeightGrams      = watchedWeights[Math.floor(watchedWeights.length / 2)]?.weightGrams ?? 0;

  // Apply karat purity factor — e.g. 18ct ring costs 75% of 24K gold price per gram
  const KARAT_PURITY: Record<string, number> = {
    '9ct': 9/24, '14ct': 14/24, '18ct': 18/24, '22ct': 22/24, '24ct': 1.0,
  };
  const primaryKarat      = watchedMetalOptions[0]?.karat;
  const primaryMetalType  = watchedMetalOptions[0]?.type;
  const purityFactor      = primaryMetalType === 'platinum' ? 1.05
                          : primaryMetalType === 'silver'   ? 0.018
                          : (KARAT_PURITY[primaryKarat ?? ''] ?? KARAT_PURITY['18ct']);

  const autoPreviewPrice = goldPerGram && showWeightTable && midWeightGrams > 0
    ? +(goldPerGram * purityFactor * midWeightGrams * 2).toFixed(2)
    : null;

  useEffect(() => {
    const p = prodData?.data;
    if (p) {
      reset({
        name: p.name,
        slug: p.slug,
        shortDescription: p.shortDescription,
        description: p.description || '',
        category: p.category?._id || p.category,
        subCategory: p.subCategory || '',
        basePrice: p.basePrice,
        salePrice: p.salePrice || undefined,
        competitorPrice: p.competitorPrice || undefined,
        style: p.style || '',
        gemstone: p.gemstone || '',
        settingType: p.settingType || '',
        bandStyle: p.bandStyle || '',
        shankWidth: p.shankWidth || '',
        isEngravable: !!p.isEngravable,
        isFeatured: !!p.isFeatured,
        isBestseller: !!p.isBestseller,
        isNewArrival: !!p.isNewArrival,
        isActive: p.isActive !== false,
        deliveryDays: p.deliveryDays || 7,
        metaTitle: p.metaTitle || '',
        metaDescription: p.metaDescription || '',
        images: (p.images || []).map((url: string) => ({ url })),
        metalOptions: (p.metalOptions || []).map((m: { type: string; karat?: string; priceModifier: number; isDefault: boolean }) => ({
          type: m.type, karat: m.karat, priceModifier: m.priceModifier, isDefault: m.isDefault,
        })),
        variants: (p.variants || []).map((v: { size: string; stock: number; sku: string }) => ({
          size: v.size, stock: v.stock, sku: v.sku,
        })),
        weightBySize: (p.weightBySize || []).map((w: WeightBySize) => ({ size: w.size, weightGrams: w.weightGrams })),
      });
      if (p.weightBySize?.length > 0) setShowWeightTable(true);
    }
  }, [prodData, reset]);

  const nameVal = watch('name');
  useEffect(() => {
    if (!isEdit && nameVal) {
      setValue('slug', nameVal.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
    }
  }, [nameVal, isEdit, setValue]);

  // ── AI Generation ────────────────────────────────────────────────────────
  const handleAiGenerate = async () => {
    const name = watch('name');
    if (!name) { toast.error('Enter a product name first'); return; }
    setAiLoading(true);
    try {
      const metals = watch('metalOptions');
      const catId = watch('category');
      const catName = categories.find((c: { _id: string; name: string }) => c._id === catId)?.name || '';
      const res = await adminApi.generateProduct({
        name, category: catName,
        metalOptions: metals,
        style: watch('style'),
        settingType: watch('settingType'),
        gemstone: watch('gemstone'),
      });
      const ai = res.data;
      if (ai.shortDescription) setValue('shortDescription', ai.shortDescription);
      if (ai.description) setValue('description', ai.description);
      if (ai.metaTitle) setValue('metaTitle', ai.metaTitle);
      if (ai.metaDescription) setValue('metaDescription', ai.metaDescription);
      toast.success('AI content generated!');
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'AI generation failed';
      toast.error(msg);
    } finally {
      setAiLoading(false);
    }
  };

  // ── AI: Generate metal-coloured image via Replicate ──────────────────────
  const handleGenerateMetalImage = async (metalIdx: number) => {
    if (!productId) { toast.error('Save the product first, then generate metal images'); return; }
    const baseImages = watch('images');
    const baseUrl = baseImages[0]?.url;
    if (!baseUrl) { toast.error('Add at least one product image URL first'); return; }
    const metal = watch(`metalOptions.${metalIdx}`);
    if (!metal?.type) { toast.error('Metal type not set'); return; }

    setMetalImgLoading(prev => ({ ...prev, [metalIdx]: true }));
    setMetalImgDone(prev => ({ ...prev, [metalIdx]: '' }));

    try {
      const startRes = await adminApi.generateMetalImage({ imageUrl: baseUrl, metalType: metal.type, karat: metal.karat });
      const { predictionId } = startRes.data as { predictionId: string };

      // Poll every 3 seconds until done or failed
      let attempts = 0;
      const pollInterval = setInterval(async () => {
        attempts++;
        if (attempts > 40) { clearInterval(pollInterval); toast.error('Generation timed out'); setMetalImgLoading(prev => ({ ...prev, [metalIdx]: false })); return; }
        try {
          const poll = await adminApi.checkGenerationStatus(predictionId);
          const { status, output } = poll.data as { status: string; output?: string[] };
          if (status === 'succeeded' && output?.[0]) {
            clearInterval(pollInterval);
            const imgUrl = output[0];
            // Save to product
            await adminApi.saveMetalImages(productId, { metalType: metal.type, imageUrl: imgUrl });
            setMetalImgDone(prev => ({ ...prev, [metalIdx]: imgUrl }));
            toast.success(`${metal.type} image generated and saved!`);
            setMetalImgLoading(prev => ({ ...prev, [metalIdx]: false }));
          } else if (status === 'failed') {
            clearInterval(pollInterval);
            toast.error('AI generation failed — try again');
            setMetalImgLoading(prev => ({ ...prev, [metalIdx]: false }));
          }
        } catch { /* ignore poll errors */ }
      }, 3000);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to start generation';
      toast.error(msg);
      setMetalImgLoading(prev => ({ ...prev, [metalIdx]: false }));
    }
  };

  // ── AI: Estimate competitor / high-street price ──────────────────────────
  const [competitorLoading, setCompetitorLoading] = useState(false);

  const handleEstimateCompetitorPrice = async () => {
    setCompetitorLoading(true);
    try {
      const formVals = watch();
      const res = await adminApi.estimateCompetitorPrice({
        name: formVals.name,
        metalType: formVals.metalOptions?.[0]?.type,
        karat: formVals.metalOptions?.[0]?.karat,
        settingType: formVals.settingType,
        bandStyle: formVals.bandStyle,
        shankWidth: formVals.shankWidth,
        gemstone: formVals.gemstone,
      });
      const { estimatedHighStreetPrice } = res.data as { estimatedHighStreetPrice: number; rationale: string };
      setValue('competitorPrice', estimatedHighStreetPrice);
      toast.success(`High street estimate: £${estimatedHighStreetPrice.toLocaleString()}`);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Estimation failed';
      toast.error(msg);
    } finally {
      setCompetitorLoading(false);
    }
  };

  // ── AI: Generate 3D model via Meshy.ai ───────────────────────────────────
  const handleGenerate3D = async () => {
    if (!productId) { toast.error('Save the product first, then generate a 3D model'); return; }
    const baseImages = watch('images');
    const imageUrl = baseImages[0]?.url;
    if (!imageUrl) { toast.error('Add at least one product image URL first'); return; }

    setGen3DLoading(true);
    setGen3DStatus('processing');
    setGen3DProgress(0);

    try {
      const startRes = await adminApi.generate3D({ imageUrl });
      const { taskId } = startRes.data as { taskId: string };

      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        if (attempts > 60) { clearInterval(poll); setGen3DLoading(false); setGen3DStatus('failed'); toast.error('3D generation timed out'); return; }
        try {
          const statusRes = await adminApi.check3DStatus(taskId);
          const d = statusRes.data as { status: string; progress?: number; modelUrl?: string; previewUrl?: string; error?: string };
          if (d.status === 'completed' && d.modelUrl) {
            clearInterval(poll);
            await adminApi.saveModel3D(productId, { model3dUrl: d.modelUrl, model3dPreview: d.previewUrl });
            setGen3DModelUrl(d.modelUrl);
            setGen3DPreviewUrl(d.previewUrl || '');
            setGen3DStatus('completed');
            setGen3DLoading(false);
            toast.success('3D model generated and saved!');
          } else if (d.status === 'failed') {
            clearInterval(poll);
            setGen3DStatus('failed');
            setGen3DLoading(false);
            toast.error(d.error || '3D generation failed');
          } else {
            setGen3DProgress(d.progress ?? 0);
          }
        } catch { /* ignore */ }
      }, 5000);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to start 3D generation';
      toast.error(msg);
      setGen3DLoading(false);
      setGen3DStatus('idle');
    }
  };

  // ── Weight table ─────────────────────────────────────────────────────────
  const handleEnableWeightTable = () => {
    if (weightFields.length === 0) {
      replaceWeights(DEFAULT_WEIGHT_TABLE);
    }
    setShowWeightTable(true);
  };

  const mutation = useMutation({
    mutationFn: (data: ProductFormData) => {
      const payload = {
        name: data.name, slug: data.slug, shortDescription: data.shortDescription,
        description: data.description, category: data.category, subCategory: data.subCategory,
        basePrice: data.basePrice, salePrice: data.salePrice || undefined,
        competitorPrice: data.competitorPrice || undefined,
        style: data.style, gemstone: data.gemstone, settingType: data.settingType,
        bandStyle: data.bandStyle || undefined, shankWidth: data.shankWidth || undefined,
        isEngravable: data.isEngravable, isFeatured: data.isFeatured,
        isBestseller: data.isBestseller, isNewArrival: data.isNewArrival,
        isActive: data.isActive, deliveryDays: data.deliveryDays,
        metaTitle: data.metaTitle, metaDescription: data.metaDescription,
        images: data.images.map((i) => i.url).filter(Boolean),
        metalOptions: data.metalOptions.map(({ type, karat, priceModifier, isDefault }) => ({ type, karat, priceModifier, isDefault })),
        variants: data.variants.map(({ size, stock, sku }) => ({ size, stock, sku })),
        weightBySize: showWeightTable ? data.weightBySize.filter((w) => w.size && w.weightGrams > 0) : [],
      };
      return isEdit ? adminApi.updateProduct(productId!, payload) : adminApi.createProduct(payload);
    },
    onSuccess: () => router.push('/admin/products'),
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to save product';
      toast.error(msg);
    },
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
        <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Product' : 'New Product'}</h1>
        <div className="flex gap-3">
          <button type="button" onClick={() => router.back()} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={isSubmitting || mutation.isPending} className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60">
            {mutation.isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Product'}
          </button>
        </div>
      </div>

      {mutation.isError && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {(mutation.error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to save product.'}
        </div>
      )}

      <div className="space-y-6">
        {/* ── Basic Info ── */}
        <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-900">Basic Information</h2>
            <button
              type="button"
              onClick={handleAiGenerate}
              disabled={aiLoading}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg hover:opacity-90 disabled:opacity-60 transition-opacity"
            >
              {aiLoading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
              {aiLoading ? 'Generating…' : 'Generate with AI'}
            </button>
          </div>
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
              <label className={labelCls}>
                Base Price (£)
                {showWeightTable
                  ? <span className="normal-case font-normal text-amber-600 ml-1">— auto-calculated from weight × live gold price</span>
                  : <span className="normal-case font-normal text-gray-400 ml-1">* required (or enable weight table below for auto-pricing)</span>}
              </label>
              {showWeightTable && goldPerGram ? (
                /* Auto-price preview — driven by weight table × live gold price */
                <div className="flex items-center gap-3">
                  <div className="flex-1 px-3 py-2 text-sm border border-amber-200 bg-amber-50 rounded-lg text-amber-800 font-medium">
                    {autoPreviewPrice
                      ? `£${autoPreviewPrice.toLocaleString('en-GB', { minimumFractionDigits: 2 })} (avg. size)`
                      : 'Set weights below to preview'}
                  </div>
                  <span className="text-[11px] text-gray-400 whitespace-nowrap">via live gold</span>
                </div>
              ) : (
                <input
                  type="number" step="0.01"
                  {...register('basePrice', { required: !showWeightTable, valueAsNumber: true })}
                  className={inputCls}
                  placeholder="e.g. 850"
                />
              )}
              {!showWeightTable && <p className="text-[11px] text-gray-400 mt-1">💡 Enable the <strong>Ring Weight by Size</strong> table below to have prices calculated automatically from live gold prices — no manual entry needed.</p>}
            </div>
            <div>
              <label className={labelCls}>Sale Price (£) <span className="normal-case font-normal text-gray-400">— leave blank if not on sale</span></label>
              <input type="number" step="0.01" {...register('salePrice', { valueAsNumber: true })} className={inputCls} placeholder="Leave blank if no sale" />
            </div>
            <div>
              <label className={labelCls}>High Street / Competitor Price (£) <span className="normal-case font-normal text-gray-400">— shown as crossed-out "High Street" price</span></label>
              <div className="flex gap-2">
                <input type="number" step="0.01" {...register('competitorPrice', { valueAsNumber: true })} className={`${inputCls} flex-1`} placeholder="e.g. 1200" />
                <button
                  type="button"
                  onClick={handleEstimateCompetitorPrice}
                  disabled={competitorLoading}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-amber-50 border border-amber-300 text-amber-700 text-xs font-medium rounded hover:bg-amber-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Use AI to estimate the typical UK high-street price for this product"
                >
                  {competitorLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                  {competitorLoading ? 'Estimating…' : 'AI Estimate'}
                </button>
              </div>
              <p className="text-[11px] text-gray-400 mt-1">💡 Click <strong>AI Estimate</strong> to auto-fill based on product specs (name, metal, setting style).</p>
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Short Description * <span className="normal-case font-normal text-gray-400">— shown in listings (AI-fillable)</span></label>
              <input {...register('shortDescription', { required: true })} className={inputCls} placeholder="Brief product summary" />
              {errors.shortDescription && <p className="text-xs text-red-500 mt-1">Required</p>}
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Full Description <span className="normal-case font-normal text-gray-400">— HTML supported (AI-fillable)</span></label>
              <textarea {...register('description')} rows={5} className={inputCls} placeholder="<p>Detailed description…</p>" />
            </div>
          </div>
        </section>

        {/* ── SEO ── */}
        <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-5">SEO <span className="text-xs font-normal text-gray-400 normal-case">(AI-fillable)</span></h2>
          <div className="grid grid-cols-2 gap-5">
            <div className="col-span-2">
              <label className={labelCls}>Meta Title</label>
              <input {...register('metaTitle')} className={inputCls} placeholder="Under 60 chars" />
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Meta Description</label>
              <textarea {...register('metaDescription')} rows={2} className={inputCls} placeholder="140–160 chars" />
            </div>
          </div>
        </section>

        {/* ── Images ── */}
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
                <input {...register(`images.${i}.url`)} placeholder="https://…" className={`${inputCls} flex-1`} />
                {imgFields.length > 1 && (
                  <button type="button" onClick={() => removeImg(i)} className="p-1.5 text-gray-400 hover:text-red-500"><X size={15} /></button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── Product Details ── */}
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
              <label className={labelCls}>Band Style</label>
              <select {...register('bandStyle')} className={inputCls}>
                <option value="">— None —</option>
                {BAND_STYLES.map((b) => <option key={b} value={b}>{b.replace(/-/g, ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Shank Width</label>
              <select {...register('shankWidth')} className={inputCls}>
                <option value="">— None —</option>
                {SHANK_WIDTHS.map((w) => <option key={w} value={w}>{w}</option>)}
              </select>
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

        {/* ── Metal Options ── */}
        <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Metal Options</h2>
            <button type="button" onClick={() => addMetal({ type: 'yellow-gold', karat: '18ct', priceModifier: 0, isDefault: false })} className="text-xs text-amber-600 hover:underline flex items-center gap-1">
              <Plus size={13} /> Add metal
            </button>
          </div>
          <div className="space-y-3">
            {metalFields.map((field, i) => (
              <div key={field.id} className="space-y-1">
                <div className="flex items-center gap-3">
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
                  {/* AI metal image button — edit mode only */}
                  {isEdit && (
                    <button type="button" onClick={() => handleGenerateMetalImage(i)}
                      disabled={metalImgLoading[i]}
                      title="Generate AI image for this metal using Replicate (requires REPLICATE_API_TOKEN)"
                      className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded hover:opacity-90 disabled:opacity-60 whitespace-nowrap transition-opacity">
                      {metalImgLoading[i] ? <Loader2 size={11} className="animate-spin" /> : <Wand2 size={11} />}
                      {metalImgLoading[i] ? 'Generating…' : 'AI Image'}
                    </button>
                  )}
                  {metalFields.length > 1 && (
                    <button type="button" onClick={() => removeMetal(i)} className="p-1.5 text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                  )}
                </div>
                {/* Show generated image preview */}
                {metalImgDone[i] && (
                  <div className="ml-2 flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded px-2 py-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={metalImgDone[i]} alt="" className="w-10 h-10 object-cover rounded border" />
                    <span>AI image saved to this metal option ✓</span>
                  </div>
                )}
              </div>
            ))}
          </div>
          {isEdit && (
            <p className="mt-3 text-[11px] text-gray-400">
              AI Image uses Replicate to recolour the base product photo to match each metal. Requires <code className="bg-gray-100 px-1 rounded">REPLICATE_API_TOKEN</code> in server/.env.
            </p>
          )}
        </section>

        {/* ── Size Variants ── */}
        <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-4">Size Variants</h2>
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-2">Quick add ring sizes:</p>
            <div className="flex flex-wrap gap-1.5">
              {RING_SIZES.map((s) => (
                <button
                  key={s} type="button"
                  onClick={() => setSizesToAdd((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s])}
                  className={`w-8 h-8 text-xs rounded border font-medium transition-colors ${sizesToAdd.includes(s) ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-gray-600 border-gray-200 hover:border-amber-400'}`}
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
                  <button type="button" onClick={() => removeVar(i)} className="p-1.5 text-gray-400 hover:text-red-500"><X size={14} /></button>
                </div>
              ))}
            </div>
          )}
          <button type="button" onClick={() => addVar({ size: '', stock: 0, sku: '' })} className="mt-3 text-xs text-amber-600 hover:underline flex items-center gap-1">
            <Plus size={13} /> Add custom size
          </button>
        </section>

        {/* ── Ring Weight by Size → Auto-Pricing ── */}
        <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                Ring Weight by Size
                {showWeightTable && goldPerGram && (
                  <span className="text-[11px] font-normal text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-0.5">
                    Live gold: £{goldPerGram}/g · auto-pricing active
                  </span>
                )}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Formula: <strong>Price = Gold (£/g) × Ring Weight (g) × 2</strong> — updates automatically whenever gold prices change
              </p>
            </div>
            {!showWeightTable && (
              <button type="button" onClick={handleEnableWeightTable}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-amber-500 hover:bg-amber-600 rounded-lg transition-colors">
                <Plus size={13} /> Enable Auto-Pricing
              </button>
            )}
          </div>

          {!showWeightTable && (
            <div className="mt-3 p-3 bg-gray-50 border border-dashed border-gray-200 rounded-lg text-xs text-gray-500 space-y-1">
              <p>Enable this table to have prices calculated <strong>automatically</strong> from live gold market prices.</p>
              <p>Once enabled, you no longer need to set a base price manually — just enter the ring weight for each size.</p>
            </div>
          )}

          {showWeightTable && weightFields.length > 0 && (
            <div className="mt-4">
              <div className="grid grid-cols-6 gap-2">
                {weightFields.map((field, i) => {
                  const wg = watch(`weightBySize.${i}.weightGrams`);
                  const livePrice = goldPerGram && wg > 0 ? +(goldPerGram * wg * 2) : null;
                  return (
                    <div key={field.id} className="text-center">
                      <div className="text-xs font-medium text-gray-600 mb-1">{field.size}</div>
                      <input
                        type="number" step="0.01"
                        {...register(`weightBySize.${i}.weightGrams`, { valueAsNumber: true })}
                        className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-amber-400 text-center"
                        placeholder="g"
                      />
                      {livePrice && (
                        <div className="text-[10px] text-amber-700 mt-0.5 font-medium">
                          £{livePrice.toLocaleString('en-GB', { maximumFractionDigits: 0 })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-gray-400 mt-3">
                Each cell shows the auto-calculated retail price below the weight. Values in grams — adjust to your actual ring weights.
              </p>
              <button type="button" onClick={() => { setShowWeightTable(false); replaceWeights([]); }} className="mt-2 text-xs text-gray-400 hover:text-red-500">
                Disable auto-pricing
              </button>
            </div>
          )}
        </section>

        {/* ── 3D Model Generator ── */}
        {isEdit && (
          <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Box size={16} className="text-indigo-500" />
                  3D Model
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Upload front/side/back photos and generate an interactive 3D model via Meshy.ai.
                  Customers can rotate it on the product page and view it in AR on mobile.
                </p>
              </div>
              <button
                type="button"
                onClick={handleGenerate3D}
                disabled={gen3DLoading}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-gradient-to-r from-indigo-500 to-blue-600 text-white rounded-lg hover:opacity-90 disabled:opacity-60 transition-opacity whitespace-nowrap"
              >
                {gen3DLoading
                  ? <><Loader2 size={14} className="animate-spin" /> Generating {gen3DProgress}%</>
                  : gen3DStatus === 'completed'
                  ? <><RefreshCw size={14} /> Regenerate 3D</>
                  : <><Box size={14} /> Generate 3D Model</>}
              </button>
            </div>

            {/* Progress bar */}
            {gen3DLoading && (
              <div className="mb-4">
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-400 to-blue-500 transition-all duration-500 rounded-full"
                    style={{ width: `${gen3DProgress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Processing your images with Meshy.ai — this typically takes 2–5 minutes…</p>
              </div>
            )}

            {/* Completed state */}
            {gen3DStatus === 'completed' && gen3DModelUrl && (
              <div className="flex items-start gap-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                {gen3DPreviewUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={gen3DPreviewUrl} alt="3D preview" className="w-20 h-20 object-cover rounded border border-green-300" />
                )}
                <div>
                  <p className="text-sm font-medium text-green-800">3D model generated and saved ✓</p>
                  <p className="text-xs text-green-600 mt-0.5 break-all">{gen3DModelUrl}</p>
                  <a href={gen3DModelUrl} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:underline mt-1 inline-block">
                    Preview GLB file ↗
                  </a>
                </div>
              </div>
            )}

            {gen3DStatus === 'failed' && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">
                3D generation failed. Check that <code className="bg-red-100 px-1 rounded">MESHY_API_KEY</code> is set in server/.env and the image URL is publicly accessible.
              </p>
            )}

            {gen3DStatus === 'idle' && (
              <div className="text-xs text-gray-400 space-y-1">
                <p>• Use the first product image URL as the base (front view recommended)</p>
                <p>• For best results use a clean studio photo on a white background</p>
                <p>• Requires <code className="bg-gray-100 px-1 rounded">MESHY_API_KEY</code> in server/.env — free tier available at meshy.ai</p>
              </div>
            )}
          </section>
        )}
      </div>
    </form>
  );
}
