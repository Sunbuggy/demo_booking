'use client';

import { useState, useEffect } from 'react';
// Corrected relative path to actions.ts (up one level)
import { getLiveUnsettledByLocation } from '../actions';
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';

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
        <button 
          onClick={loadData} 
          disabled={loading} 
          className="text-zinc-500 hover:text-yellow-500 transition-colors p-1"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-2">
          <Loader2 className="w-4 h-4 animate-spin text-yellow-500" />
          <span className="text-xs text-zinc-500 animate-pulse font-medium">Syncing NMI...</span>
        </div>
      ) : error ? (
        <div className="flex flex-col gap-1 py-1">
          <div className="flex items-center gap-2 text-red-400">
            <AlertCircle className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase">NMI Gateway Error</span>
          </div>
          <p className="text-[9px] text-zinc-600 truncate italic">Check Pismo Security Key</p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex justify-between items-baseline">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">Unsettled</span>
            <span className="text-xl font-mono font-bold text-yellow-500">
              ${data?.unsettled.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">Holds</span>
            <span className="text-sm font-mono text-blue-400">
              ${data?.holds.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}