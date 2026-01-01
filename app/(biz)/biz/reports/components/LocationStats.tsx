// app/biz/reports/components/LocationStat.tsx
'use client';

import { useState, useEffect } from 'react';
import { getLiveUnsettledByLocation } from '../actions';
import { CheckCircle2, AlertCircle, Loader2, RefreshCw } from 'lucide-react';

interface Props {
  location: 'vegas' | 'pismo';
  label: string;
}

export default function LocationStat({ location, label }: Props) {
  const [data, setData] = useState<{ unsettled: number; holds: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    const result = await getLiveUnsettledByLocation(location);
    
    if (result.success) {
      setData({ unsettled: result.unsettledTotal, holds: result.holdsTotal });
    } else {
      setError(result.error || 'Failed to load');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="flex flex-col bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl min-w-[220px] shadow-xl">
      <div className="flex justify-between items-center mb-3">
        <p className="text-[10px] uppercase text-zinc-500 font-black tracking-widest">{label}</p>
        <button onClick={loadData} disabled={loading} className="text-zinc-500 hover:text-yellow-500 transition-colors">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-2">
          <Loader2 className="w-4 h-4 animate-spin text-yellow-500" />
          <span className="text-xs text-zinc-500 font-medium">Syncing NMI...</span>
        </div>
      ) : error ? (
        <div className="flex flex-col gap-1 py-1">
          <div className="flex items-center gap-2 text-red-400">
            <AlertCircle className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-tight">Gateway Error</span>
          </div>
          <p className="text-[9px] text-zinc-600 italic">Verify {location} key</p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex justify-between items-baseline">
            <span className="text-[10px] font-bold text-zinc-400 uppercase">Unsettled</span>
            <span className="text-xl font-mono font-bold text-yellow-500">
              ${data?.unsettled.toFixed(2)}
            </span>
          </div>
          {/* Status Confirmation: Shows when connected but total is $0 */}
          {data?.unsettled === 0 && (
            <div className="flex items-center gap-1.5 text-[9px] text-emerald-500/80 font-bold uppercase tracking-tighter border-t border-zinc-800/50 pt-2">
              <CheckCircle2 className="w-3 h-3" />
              Connected • No Charges Today
            </div>
          )}
        </div>
      )}
    </div>
  );
}