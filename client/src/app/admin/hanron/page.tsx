'use client';

import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '@/lib/api';
import {
  RefreshCw, CheckCircle2, XCircle, AlertCircle, Loader2,
  Globe, Download, Database, Eye, ChevronDown, ChevronUp, Package, FolderPlus, ImageIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';

const HANRON_CATEGORIES = [
  'Gold Ladies Rings', 'Gold Gents Rings', 'Gold Baby Rings', 'Gold Signet Rings',
  'Gold Earrings', 'Gold Pendants', 'Gold Bracelets', 'Gold Bangles', 'Gold Chains',
  'Silver Rings', 'Silver Earrings', 'Silver Pendants', 'Silver Bracelets',
  'Diamonds', 'Wedding Bands', 'Lab Grown Diamonds',
];

interface StatusResult {
  configured: boolean;
  status: 'ok' | 'auth_failed' | 'scrape_failed' | 'not_configured';
  error?: string;
  productCount?: number;
}

interface PreviewProduct {
  sku: string;
  name: string;
  price: number;
  metal: string;
  images: string[];
  availability: string;
  category: string;
  sourceUrl: string;
}

interface SyncResult {
  success: boolean;
  total?: number;
  created?: number;
  updated?: number;
  errors: string[];
  preview?: PreviewProduct[];
}

interface FixImagesResult {
  success: boolean;
  total: number;
  fixed: number;
  failed: number;
}

export default function HanronPage() {
  const [status, setStatus]           = useState<StatusResult | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);

  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [saveToDb, setSaveToDb]         = useState(true);
  const [categoryId, setCategoryId]     = useState('');
  const [seeding, setSeeding]           = useState(false);
  const [syncing, setSyncing]           = useState(false);
  const [syncResult, setSyncResult]     = useState<SyncResult | null>(null);
  const [showErrors, setShowErrors]     = useState(false);
  const [showPreview, setShowPreview]   = useState(false);
  const [fixingImages, setFixingImages] = useState(false);
  const [fixImagesResult, setFixImagesResult] = useState<FixImagesResult | null>(null);

  const checkStatus = useCallback(async () => {
    setStatusLoading(true);
    try {
      const res = await adminApi.hanronStatus();
      setStatus(res.data as StatusResult);
    } catch {
      toast.error('Could not reach server');
    } finally {
      setStatusLoading(false);
    }
  }, []);

  useEffect(() => { checkStatus(); }, [checkStatus]);

  const toggleCat = (cat: string) =>
    setSelectedCats(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await adminApi.hanronSync({
        categories:        selectedCats.length ? selectedCats : undefined,
        saveToDb,
        defaultCategoryId: categoryId || undefined,
      });
      setSyncResult(res.data as SyncResult);
      if (saveToDb) {
        const d = res.data as SyncResult;
        toast.success(`Saved ${d.created} new + ${d.updated} updated products`);
      } else {
        toast.success(`Preview ready — ${(res.data as SyncResult).total} products found`);
      }
    } catch (err: unknown) {
      const errData = (err as { response?: { data?: { message?: string; fix?: string } } })?.response?.data;
      const msg = errData?.message || 'Sync failed';
      const fix = errData?.fix;
      toast.error(fix ? `${msg}\n${fix}` : msg, { duration: 8000 });
      setSyncResult({ success: false, errors: [msg, ...(fix ? [fix] : [])] });
    } finally {
      setSyncing(false);
    }
  };

  const handleSeedCategories = async () => {
    setSeeding(true);
    try {
      const res = await adminApi.hanronSeedCategories();
      const d = res.data as { created: number; existing: number; total: number };
      toast.success(`Categories ready: ${d.created} created, ${d.existing} already existed`);
    } catch {
      toast.error('Failed to seed categories');
    } finally {
      setSeeding(false);
    }
  };

  const handleInvalidate = async () => {
    await adminApi.hanronInvalidate();
    toast.success('Session cleared — next sync will re-authenticate');
    checkStatus();
  };

  const handleFixImages = async () => {
    setFixingImages(true);
    setFixImagesResult(null);
    try {
      const res = await adminApi.hanronFixImages();
      const d = res.data as FixImagesResult;
      setFixImagesResult(d);
      toast.success(`Images fixed: ${d.fixed} uploaded to Cloudinary${d.failed ? `, ${d.failed} failed` : ''}`);
    } catch (err: unknown) {
      const errData = (err as { response?: { data?: { message?: string; fix?: string } } })?.response?.data;
      const msg = errData?.message || 'Image fix failed';
      const fix = errData?.fix;
      toast.error(fix ? `${msg}\n${fix}` : msg, { duration: 8000 });
    } finally {
      setFixingImages(false);
    }
  };

  const statusColour = !status ? 'text-gray-400'
    : status.status === 'ok'             ? 'text-emerald-600'
    : status.status === 'not_configured' ? 'text-amber-500'
    : 'text-red-500';

  const StatusIcon = !status ? Loader2
    : status.status === 'ok'             ? CheckCircle2
    : status.status === 'not_configured' ? AlertCircle
    : XCircle;

  const isProduction = process.env.NEXT_PUBLIC_API_URL?.includes('render.com') ||
    (typeof window !== 'undefined' && !window.location.hostname.includes('localhost'));

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">

      {/* Cloudflare warning banner — shown on production */}
      {isProduction && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-amber-800">Hanron sync must run from your local machine</p>
            <p className="text-amber-700 mt-1">
              Hanron&apos;s website uses Cloudflare, which blocks requests from cloud servers like Render.
              Your local machine has a residential IP that Cloudflare allows through.
            </p>
            <div className="mt-3 bg-amber-100 rounded-lg p-3 font-mono text-xs text-amber-900 space-y-2">
              <p className="font-semibold">Run these from your computer:</p>
              <p>1. Start local server: <code>npm run dev:server</code></p>
              <p className="font-semibold mt-1">2. Sync products:</p>
              <p className="select-all">curl -X POST http://localhost:5001/api/admin/hanron/sync \</p>
              <p className="select-all ml-4">-H &quot;Authorization: Bearer YOUR_ADMIN_TOKEN&quot; \</p>
              <p className="select-all ml-4">-H &quot;Content-Type: application/json&quot; \</p>
              <p className="select-all ml-4">-d &apos;&#123;&quot;saveToDb&quot;: true&#125;&apos;</p>
              <p className="font-semibold mt-1">3. Upload images to Cloudinary (fixes blank images on live site):</p>
              <p className="select-all">curl -X POST http://localhost:5001/api/admin/hanron/fix-images \</p>
              <p className="select-all ml-4">-H &quot;Authorization: Bearer YOUR_ADMIN_TOKEN&quot;</p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Hanron Jewellery Sync</h1>
          <p className="text-sm text-gray-500 mt-1">
            Scrape the full Hanron product catalogue and import into Sterling Jewellers
          </p>
        </div>
        <button
          onClick={handleInvalidate}
          className="text-xs text-gray-400 hover:text-gray-600 underline"
        >
          Reset session
        </button>
      </div>

      {/* Status card */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Globe className="w-5 h-5 text-gray-400" />
          <div>
            <p className="text-sm font-medium text-gray-700">hanronjewellery.com</p>
            <p className={`text-xs font-semibold mt-0.5 ${statusColour}`}>
              {!status ? 'Checking…'
                : status.status === 'ok'             ? `Connected · ${status.productCount ?? 0} products in first category`
                : status.status === 'not_configured' ? 'Not configured — add HANRON_EMAIL / HANRON_PASSWORD to .env'
                : status.status === 'auth_failed'    ? `Auth failed: ${status.error}`
                : `Scrape failed: ${status.error}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusIcon className={`w-5 h-5 ${statusColour} ${statusLoading ? 'animate-spin' : ''}`} />
          <button
            onClick={checkStatus}
            disabled={statusLoading}
            className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
          >
            {statusLoading ? 'Checking…' : 'Re-check'}
          </button>
        </div>
      </div>

      {/* Config */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-5">
        <h2 className="text-sm font-semibold text-gray-700">Sync Settings</h2>

        {/* Category picker */}
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2">
            Categories to sync&nbsp;
            <span className="text-gray-400 font-normal">(leave all unselected to sync everything)</span>
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {HANRON_CATEGORIES.map(cat => (
              <label key={cat} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedCats.includes(cat)}
                  onChange={() => toggleCat(cat)}
                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-xs text-gray-700">{cat}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Options */}
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={saveToDb}
              onChange={e => setSaveToDb(e.target.checked)}
              className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-sm text-gray-700">
              Save to database
              <span className="text-gray-400 text-xs ml-1">(uncheck for dry-run preview)</span>
            </span>
          </label>
        </div>

        {saveToDb && (
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              MongoDB Category ID <span className="text-gray-400 font-normal">(optional — assigns products to a category)</span>
            </label>
            <input
              type="text"
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
              placeholder="e.g. 6650abc123def456..."
              className="w-full max-w-sm text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleSeedCategories}
            disabled={seeding}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <FolderPlus className="w-4 h-4" />}
            {seeding ? 'Creating…' : 'Create Categories'}
          </button>

          <button
            onClick={handleSync}
            disabled={syncing || status?.status !== 'ok'}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : saveToDb ? <Database className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {syncing ? 'Syncing…' : saveToDb ? 'Sync & Save to Database' : 'Dry Run (Preview Only)'}
          </button>
        </div>
      </div>

      {/* Fix Images card */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-gray-700">Fix Product Images</h2>
          <p className="text-xs text-gray-500 mt-1">
            Re-uploads all Hanron product images from <code className="bg-gray-100 px-1 rounded">hanronjewellery.com</code> to{' '}
            Cloudinary so they load correctly on the live site. Run this once from your local machine after each sync.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleFixImages}
            disabled={fixingImages}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {fixingImages ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
            {fixingImages ? 'Uploading images…' : 'Upload Images to Cloudinary'}
          </button>
          {fixImagesResult && (
            <div className="flex gap-3 text-sm">
              <span className="text-emerald-700 font-semibold">{fixImagesResult.fixed} uploaded</span>
              {fixImagesResult.failed > 0 && (
                <span className="text-red-500 font-semibold">{fixImagesResult.failed} failed</span>
              )}
              <span className="text-gray-400">of {fixImagesResult.total} total</span>
            </div>
          )}
        </div>
      </div>

      {/* Result */}
      {syncResult && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">

          {/* Summary */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 rounded-lg px-4 py-2">
              <Package className="w-4 h-4" />
              <span className="text-sm font-semibold">{syncResult.total ?? syncResult.preview?.length} products</span>
            </div>
            {syncResult.created !== undefined && (
              <div className="flex items-center gap-2 bg-blue-50 text-blue-700 rounded-lg px-4 py-2">
                <Download className="w-4 h-4" />
                <span className="text-sm font-semibold">{syncResult.created} created</span>
              </div>
            )}
            {syncResult.updated !== undefined && (
              <div className="flex items-center gap-2 bg-gray-50 text-gray-600 rounded-lg px-4 py-2">
                <RefreshCw className="w-4 h-4" />
                <span className="text-sm font-semibold">{syncResult.updated} updated</span>
              </div>
            )}
            {syncResult.errors.length > 0 && (
              <div className="flex items-center gap-2 bg-red-50 text-red-600 rounded-lg px-4 py-2">
                <XCircle className="w-4 h-4" />
                <span className="text-sm font-semibold">{syncResult.errors.length} errors</span>
              </div>
            )}
          </div>

          {/* Errors */}
          {syncResult.errors.length > 0 && (
            <div>
              <button
                onClick={() => setShowErrors(v => !v)}
                className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700"
              >
                {showErrors ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {showErrors ? 'Hide' : 'Show'} errors
              </button>
              {showErrors && (
                <ul className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                  {syncResult.errors.map((e, i) => (
                    <li key={i} className="text-xs text-red-600 bg-red-50 rounded px-2 py-1">{e}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Preview table */}
          {syncResult.preview && (
            <div>
              <button
                onClick={() => setShowPreview(v => !v)}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 font-medium"
              >
                {showPreview ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {showPreview ? 'Hide' : 'Show'} preview ({syncResult.preview.length} shown)
              </button>
              {showPreview && (
                <div className="mt-3 overflow-x-auto rounded-lg border border-gray-100">
                  <table className="min-w-full text-xs">
                    <thead className="bg-gray-50 text-gray-500 uppercase tracking-wide">
                      <tr>
                        {['Image', 'SKU', 'Name', 'Metal', 'Price', 'Availability', 'Category'].map(h => (
                          <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {syncResult.preview.map(p => (
                        <tr key={p.sku} className="hover:bg-gray-50">
                          <td className="px-3 py-2">
                            {p.images?.[0]
                              ? <img src={p.images[0]} alt={p.name} className="w-10 h-10 object-cover rounded" />
                              : <div className="w-10 h-10 bg-gray-100 rounded" />}
                          </td>
                          <td className="px-3 py-2 font-mono text-gray-500">{p.sku}</td>
                          <td className="px-3 py-2 font-medium text-gray-800 max-w-[200px] truncate">{p.name}</td>
                          <td className="px-3 py-2 text-gray-600">{p.metal}</td>
                          <td className="px-3 py-2 text-gray-800">
                            {p.price ? `£${p.price.toFixed(2)}` : '—'}
                          </td>
                          <td className="px-3 py-2">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                              p.availability === 'In Stock'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-red-50 text-red-600'
                            }`}>
                              {p.availability}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-gray-500">{p.category}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
