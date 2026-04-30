'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface DiamondFormData {
  sku: string;
  shape: string;
  caratWeight: number;
  cut: string;
  color: string;
  clarity: string;
  price: number;
  fluorescence: string;
  polish: string;
  symmetry: string;
  imageUrl?: string;
  videoUrl?: string;
  certificate: { lab: string; number: string; pdfUrl?: string };
  measurements: { length: number; width: number; depth: number; depthPercent: number; tablePercent: number };
}

const SHAPES = ['round', 'oval', 'princess', 'cushion', 'emerald', 'pear', 'marquise', 'heart', 'radiant', 'asscher'];
const CUTS = ['Ideal', 'Excellent', 'Very Good', 'Good', 'Fair'];
const COLORS = ['D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'];
const CLARITIES = ['FL', 'IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2', 'I1', 'I2'];
const FLUORESCENCE = ['None', 'Faint', 'Medium', 'Strong', 'Very Strong'];
const POLISH_SYM = ['Excellent', 'Very Good', 'Good', 'Fair'];
const LABS = ['GIA', 'IGI', 'HRD', 'AGS'];

export default function DiamondForm({ diamondId }: { diamondId?: string }) {
  const router = useRouter();
  const isEdit = !!diamondId;

  const { data } = useQuery({
    queryKey: ['admin-diamond', diamondId],
    queryFn: () => adminApi.getDiamond(diamondId!),
    enabled: isEdit,
  });

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<DiamondFormData>({
    defaultValues: {
      fluorescence: 'None', polish: 'Excellent', symmetry: 'Excellent',
      certificate: { lab: 'GIA', number: '' },
      measurements: { length: 0, width: 0, depth: 0, depthPercent: 0, tablePercent: 0 },
    },
  });

  useEffect(() => {
    const d = data?.data;
    if (d) {
      // Explicitly map only form fields — never spread the full DB document
      reset({
        sku: d.sku,
        shape: d.shape,
        caratWeight: d.caratWeight,
        cut: d.cut,
        color: d.color,
        clarity: d.clarity,
        price: d.price,
        fluorescence: d.fluorescence || 'None',
        polish: d.polish || 'Excellent',
        symmetry: d.symmetry || 'Excellent',
        imageUrl: d.imageUrl || '',
        videoUrl: d.videoUrl || '',
        certificate: {
          lab: d.certificate?.lab || 'GIA',
          number: d.certificate?.number || '',
          pdfUrl: d.certificate?.pdfUrl || '',
        },
        measurements: {
          length: d.measurements?.length || 0,
          width: d.measurements?.width || 0,
          depth: d.measurements?.depth || 0,
          depthPercent: d.measurements?.depthPercent || 0,
          tablePercent: d.measurements?.tablePercent || 0,
        },
      });
    }
  }, [data, reset]);

  const mutation = useMutation({
    mutationFn: ({ sku, shape, caratWeight, cut, color, clarity, price, fluorescence, polish, symmetry, imageUrl, videoUrl, certificate, measurements }: DiamondFormData) => {
      const payload = { sku, shape, caratWeight, cut, color, clarity, price, fluorescence, polish, symmetry, imageUrl, videoUrl, certificate, measurements };
      return isEdit ? adminApi.updateDiamond(diamondId!, payload) : adminApi.createDiamond(payload);
    },
    onSuccess: () => router.push('/admin/diamonds'),
  });

  const onSubmit = handleSubmit((d) => mutation.mutate(d));
  const inputCls = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400';
  const labelCls = 'block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide';

  return (
    <form onSubmit={onSubmit} className="p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Diamond' : 'New Diamond'}</h1>
        <div className="flex gap-3">
          <button type="button" onClick={() => router.back()} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={isSubmitting || mutation.isPending} className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg disabled:opacity-60">
            {mutation.isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Diamond'}
          </button>
        </div>
      </div>

      {mutation.isError && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {(mutation.error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to save diamond. Check all required fields and try again.'}
        </div>
      )}

      <div className="space-y-6">
        {/* Identity */}
        <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-5">Identity</h2>
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className={labelCls}>SKU *</label>
              <input {...register('sku', { required: true })} className={inputCls} placeholder="DIA-0001" />
            </div>
            <div>
              <label className={labelCls}>Shape *</label>
              <select {...register('shape', { required: true })} className={inputCls}>
                {SHAPES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Carat Weight *</label>
              <input type="number" step="0.01" {...register('caratWeight', { required: true, valueAsNumber: true })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Price (£) *</label>
              <input type="number" {...register('price', { required: true, valueAsNumber: true })} className={inputCls} />
            </div>
          </div>
        </section>

        {/* 4Cs */}
        <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-5">The 4Cs</h2>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className={labelCls}>Cut</label>
              <select {...register('cut')} className={inputCls}>
                {CUTS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Color</label>
              <select {...register('color')} className={inputCls}>
                {COLORS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Clarity</label>
              <select {...register('clarity')} className={inputCls}>
                {CLARITIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Fluorescence</label>
              <select {...register('fluorescence')} className={inputCls}>
                {FLUORESCENCE.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>
        </section>

        {/* Certificate */}
        <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-5">Certificate</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Lab</label>
              <select {...register('certificate.lab')} className={inputCls}>
                {LABS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Certificate Number</label>
              <input {...register('certificate.number')} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>PDF URL</label>
              <input {...register('certificate.pdfUrl')} className={inputCls} placeholder="https://…" />
            </div>
          </div>
        </section>

        {/* Grading */}
        <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-5">Grading & Measurements</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className={labelCls}>Polish</label>
              <select {...register('polish')} className={inputCls}>
                {POLISH_SYM.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Symmetry</label>
              <select {...register('symmetry')} className={inputCls}>
                {POLISH_SYM.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-5 gap-3">
            {(['length', 'width', 'depth'] as const).map((f) => (
              <div key={f}>
                <label className={labelCls}>{f} (mm)</label>
                <input type="number" step="0.01" {...register(`measurements.${f}`, { valueAsNumber: true })} className={inputCls} />
              </div>
            ))}
            <div>
              <label className={labelCls}>Depth %</label>
              <input type="number" step="0.1" {...register('measurements.depthPercent', { valueAsNumber: true })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Table %</label>
              <input type="number" step="0.1" {...register('measurements.tablePercent', { valueAsNumber: true })} className={inputCls} />
            </div>
          </div>
        </section>

        {/* Media */}
        <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-semibold text-gray-900 mb-4">Media</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Image URL</label>
              <input {...register('imageUrl')} className={inputCls} placeholder="https://…" />
            </div>
            <div>
              <label className={labelCls}>Video URL</label>
              <input {...register('videoUrl')} className={inputCls} placeholder="https://…" />
            </div>
          </div>
        </section>
      </div>
    </form>
  );
}
