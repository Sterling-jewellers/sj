'use client';

import { useRef, useState } from 'react';
import { adminApi } from '@/lib/api';
import { Upload, Download, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2, Plus } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface ImportResult {
  message: string;
  inserted: number;
  validationErrors: string[];
  insertErrors: string[];
}

export default function ImportPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = (f: File) => {
    if (!f.name.match(/\.(xlsx|xls|csv)$/i)) {
      toast.error('Please upload an Excel (.xlsx/.xls) or CSV file');
      return;
    }
    setFile(f);
    setResult(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await adminApi.importProducts(file);
      setResult(res.data);
      if (res.data.inserted > 0) toast.success(`${res.data.inserted} products imported!`);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Import failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Bulk Import Products</h1>
        <p className="text-sm text-gray-500 mt-1">Upload an Excel file to import multiple products at once.</p>
      </div>

      {/* Instructions */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
        <h2 className="font-semibold text-amber-800 mb-3 text-sm">How it works</h2>
        <ol className="list-decimal list-inside space-y-1.5 text-sm text-amber-700">
          <li>Download the sample template below</li>
          <li>Fill in your products (required: <code className="bg-amber-100 px-1 rounded text-xs">name</code>, <code className="bg-amber-100 px-1 rounded text-xs">categoryId</code>, <code className="bg-amber-100 px-1 rounded text-xs">basePrice</code>)</li>
          <li>Upload your filled Excel file here</li>
          <li>Review the import report and manually edit any that failed</li>
        </ol>
        <div className="mt-3 flex items-center gap-3">
          <a
            href={adminApi.downloadImportTemplate()}
            className="flex items-center gap-2 text-xs font-medium text-amber-700 bg-white border border-amber-300 px-3 py-2 rounded-lg hover:bg-amber-50 transition-colors"
            download
          >
            <Download size={14} /> Download Sample Template
          </a>
          <span className="text-xs text-amber-600">sterling-import-template.xlsx</span>
        </div>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
          dragOver ? 'border-amber-400 bg-amber-50' : 'border-gray-200 hover:border-amber-300 hover:bg-gray-50'
        }`}
      >
        <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
        {file ? (
          <div className="flex flex-col items-center gap-2">
            <FileSpreadsheet size={40} className="text-amber-500" />
            <p className="font-medium text-gray-800">{file.name}</p>
            <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB · Click to change</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload size={40} className="text-gray-300" />
            <p className="font-medium text-gray-600">Drop your Excel file here</p>
            <p className="text-xs text-gray-400">or click to browse · .xlsx, .xls, .csv</p>
          </div>
        )}
      </div>

      {/* Import Button */}
      {file && !result && (
        <button
          onClick={handleImport}
          disabled={loading}
          className="mt-4 w-full flex items-center justify-center gap-2 py-3 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-xl transition-colors disabled:opacity-60"
        >
          {loading ? <><Loader2 size={18} className="animate-spin" /> Importing…</> : <><Upload size={18} /> Import Products</>}
        </button>
      )}

      {/* Result */}
      {result && (
        <div className="mt-6 space-y-4">
          <div className={`flex items-start gap-3 p-4 rounded-xl ${result.inserted > 0 ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
            {result.inserted > 0 ? <CheckCircle2 className="text-green-500 shrink-0 mt-0.5" size={18} /> : <AlertCircle className="text-gray-400 shrink-0 mt-0.5" size={18} />}
            <div>
              <p className="font-medium text-gray-900">{result.message}</p>
              <p className="text-sm text-gray-500 mt-0.5">{result.inserted} product{result.inserted !== 1 ? 's' : ''} successfully imported</p>
            </div>
          </div>

          {(result.validationErrors.length > 0 || result.insertErrors.length > 0) && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle size={16} className="text-red-500" />
                <p className="font-semibold text-red-700 text-sm">Errors ({result.validationErrors.length + result.insertErrors.length})</p>
              </div>
              <ul className="space-y-1">
                {[...result.validationErrors, ...result.insertErrors].map((e, i) => (
                  <li key={i} className="text-xs text-red-600 font-mono">• {e}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => { setFile(null); setResult(null); }} className="flex-1 py-2.5 border border-gray-200 text-sm text-gray-600 rounded-xl hover:bg-gray-50">
              Import Another File
            </button>
            <Link href="/admin/products" className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-xl text-center transition-colors">
              View Products
            </Link>
          </div>
        </div>
      )}

      {/* Manual entry link */}
      <div className="mt-8 pt-6 border-t border-gray-100 text-center">
        <p className="text-sm text-gray-500 mb-3">Or add products one by one:</p>
        <Link href="/admin/products/new" className="inline-flex items-center gap-2 text-sm font-medium text-amber-600 hover:underline">
          <Plus size={15} /> Add Product Manually
        </Link>
      </div>
    </div>
  );
}
