// components/reports/QuickNmiStats.tsx
'use client'

import { useState } from 'react';
import { getTodayUnsettledBalance } from '../actions';
import { DollarSign, Loader2 } from 'lucide-react';

export default function QuickNmiStats() {
  const [stats, setStats] = useState<{ unsettled: number; holds: number } | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    const result = await getTodayUnsettledBalance();
    if (result.success) {
      setStats({ unsettled: result.unsettledTotal, holds: result.holdsTotal });
    }
    setLoading(false);
  };

  return (
    <div className="flex gap-4 items-center">
      {stats && (
        <div className="flex gap-4 animate-in fade-in slide-in-from-right-4">
          <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg">
             <p className="text-[10px] uppercase text-zinc-500 font-bold">Unsettled (Today)</p>
             <p className="text-xl font-mono text-yellow-500">${stats.unsettled.toFixed(2)}</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg">
             <p className="text-[10px] uppercase text-zinc-500 font-bold">Active Holds</p>
             <p className="text-xl font-mono text-blue-400">${stats.holds.toFixed(2)}</p>
          </div>
        </div>
      )}

      <button
        onClick={fetchStats}
        disabled={loading}
        className="h-full px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-black rounded-lg transition-all flex items-center gap-2"
      >
        {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <DollarSign className="w-5 h-5" />}
        {stats ? "REFRESH" : "CHECK LIVE NMI"}
      </button>
    </div>
  );
}