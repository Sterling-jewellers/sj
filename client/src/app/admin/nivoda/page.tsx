'use client';

import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '@/lib/api';
import {
  CheckCircle2, XCircle, AlertCircle, Loader2,
  Gem, Database, RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface NivodaStatus {
  configured: boolean;
  status: 'ok' | 'auth_failed' | 'query_failed' | 'not_configured';
  error?: string;
  diamondCount?: number;
}

interface SyncResult {
  success: boolean;
  message: string;
  saved: number;
  skipped: number;
  total: number;
  errors: string[];
}

export default function NivodaPage() {
  const [status, setStatus]             = useState<NivodaStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [syncing, setSyncing]           = useState(false);
  const [syncResult, setSyncResult]     = useState<SyncResult | null>(null);
  const [showErrors, setShowErrors]     = useState(false);

  const checkStatus = useCallback(async () => {
    setStatusLoading(true);
    try {
      const res = await adminApi.nivodaStatus();
      setStatus(res.data as NivodaStatus);
    } catch {
      toast.error('Could not reach server');
    } finally {
      setStatusLoading(false);
    }
  }, []);

  useEffect(() => { checkStatus(); }, [checkStatus]);

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await adminApi.nivodaSync();
      const d = res.data as SyncResult;
      setSyncResult(d);
      toast.success(`Nivoda sync complete — ${d.saved} diamonds saved`);
      checkStatus();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Sync failed';
      toast.error(msg);
    } finally {
      setSyncing(false);
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

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Nivoda Diamond Sync</h1>
        <p className="text-sm text-gray-500 mt-1">
          Import all diamonds from your Nivoda account into the Sterling Jewellers diamond inventory
        </p>
      </div>

      {/* Status card */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Gem className="w-5 h-5 text-gray-400" />
          <div>
            <p className="text-sm font-medium text-gray-700">integrations.nivoda.net</p>
            <p className={`text-xs font-semibold mt-0.5 ${statusColour}`}>
              {!status ? 'Checking…'
                : status.status === 'ok'             ? `Connected · ${status.diamondCount?.toLocaleString() ?? 0} diamonds available`
                : status.status === 'not_configured' ? 'Not configured — add NIVODA_USERNAME / NIVODA_PASSWORD to .env'
                : status.status === 'auth_failed'    ? `Auth failed: ${status.error}`
                : `Query failed: ${status.error}`}
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

      {/* Info panel */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800 space-y-1">
        <p className="font-medium">What this sync does</p>
        <ul className="list-disc list-inside text-xs space-y-0.5 text-blue-700">
          <li>Iterates <strong>140 buckets</strong> (10 shapes × 7 carat ranges × natural + lab-grown) to work around Nivoda&apos;s per-query cap</li>
          <li>Upserts each diamond by cert number — no duplicates created</li>
          <li>Only imports diamonds with a valid GIA, IGI, HRD or AGS certificate</li>
          <li>Prices are converted from USD cents to GBP automatically</li>
          <li>Skips diamonds missing required fields (shape, color, clarity, price)</li>
        </ul>
      </div>

      {/* Sync button */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <p className="text-sm text-gray-600 mb-4">
          This iterates 140 shape/carat buckets to pull the full Nivoda catalogue. Expect <strong>5–15 minutes</strong> for a large inventory. The page will update when the sync completes.
        </p>
        <button
          onClick={handleSync}
          disabled={syncing || status?.status !== 'ok'}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {syncing
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Syncing diamonds…</>
            : <><Database className="w-4 h-4" /> Sync All Diamonds</>}
        </button>
      </div>

      {/* Result */}
      {syncResult && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <p className="text-sm font-semibold text-gray-800">{syncResult.message}</p>

          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 rounded-lg px-4 py-2">
              <Database className="w-4 h-4" />
              <span className="text-sm font-semibold">{syncResult.saved.toLocaleString()} saved</span>
            </div>
            <div className="flex items-center gap-2 bg-gray-50 text-gray-600 rounded-lg px-4 py-2">
              <RefreshCw className="w-4 h-4" />
              <span className="text-sm font-semibold">{syncResult.total.toLocaleString()} total from Nivoda</span>
            </div>
            {syncResult.skipped > 0 && (
              <div className="flex items-center gap-2 bg-amber-50 text-amber-700 rounded-lg px-4 py-2">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-semibold">{syncResult.skipped.toLocaleString()} skipped</span>
              </div>
            )}
            {syncResult.errors.length > 0 && (
              <div className="flex items-center gap-2 bg-red-50 text-red-600 rounded-lg px-4 py-2">
                <XCircle className="w-4 h-4" />
                <span className="text-sm font-semibold">{syncResult.errors.length} errors</span>
              </div>
            )}
          </div>

          {syncResult.errors.length > 0 && (
            <div>
              <button
                onClick={() => setShowErrors(v => !v)}
                className="text-xs text-red-500 hover:text-red-700 underline"
              >
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
        </div>
      )}
    </div>
  );
}
