'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { RefreshCw, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming you have a utils file, otherwise remove cn

const NMI_ENDPOINT = 'https://bookings.sunbuggy.com/functions/v1/nmi-charges';

interface LocationStatProps {
  location: 'vegas' | 'pismo';
  label: string;
}

const LocationStat: React.FC<LocationStatProps> = ({ location, label }) => {
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- HELPER: Strict Total Calculation ---
  // Identical logic to ReportsBoard to ensure numbers match exactly
  const calculateSafeTotal = (transactions: any[]) => {
    if (!Array.isArray(transactions)) return 0;

    return transactions.reduce((acc, curr) => {
      // 1. Must be Approved
      if (curr.response_text !== 'Approved') return acc;

      // 2. Handle Refunds (Subtract refund, Add sale)
      const amount = parseFloat(curr.amount) || 0;
      if (curr.action_type === 'refund') {
        return acc - amount;
      }

      return acc + amount;
    }, 0);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    // Default to "Today" for current live charges
    const todayStr = format(new Date(), 'yyyy-MM-dd');

    try {
      // We must request the same data range to get the granular list
      const url = `${NMI_ENDPOINT}?location=${location}&start_date=${todayStr}&end_date=${todayStr}`;
      
      const res = await fetch(url);
      if (!res.ok) throw new Error('Gateway Error');
      
      const json = await res.json();
      if (json.error) throw new Error(json.error);

      // --- CRITICAL FIX ---
      // Do NOT use json.unsettledTotal (it includes failed txns).
      // Calculate it manually from the list.
      const safeTotal = calculateSafeTotal(json.unsettled || []);
      
      setTotal(safeTotal);
    } catch (err: any) {
      console.error(`Error fetching ${location} stats:`, err);
      setError(err.message || 'Failed to load');
      setTotal(null);
    } finally {
      setLoading(false);
    }
  }, [location]);

  // Initial Fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="relative group min-w-[200px] p-4 rounded-lg border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 transition-all">
      {/* Header: Label + Refresh Icon */}
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
          {label}
        </span>
        <button 
          onClick={fetchData} 
          disabled={loading}
          className="text-zinc-600 hover:text-white transition-colors disabled:animate-spin"
        >
          {loading ? <Loader2 className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" />}
        </button>
      </div>

      {/* Content: Value or Error */}
      <div className="flex items-baseline gap-2">
        {error ? (
          <div className="flex items-center gap-2 text-red-500">
            <AlertCircle className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-tight">
              {error === 'Gateway Error' ? 'GATEWAY ERROR' : 'LOAD FAILED'}
            </span>
          </div>
        ) : (
          <div>
            <span className="text-xs text-zinc-400 mr-2 font-medium">UNSETTLED</span>
            <span className={`text-2xl font-mono font-bold tracking-tighter ${loading ? 'opacity-50' : 'text-yellow-400'}`}>
              {total !== null 
                ? `$${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                : '$0.00'
              }
            </span>
          </div>
        )}
      </div>
      
      {/* Background Glow Effect for Vegas (Optional polish) */}
      {location === 'vegas' && !error && (
        <div className="absolute inset-0 bg-yellow-500/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      )}
    </div>
  );
};

export default LocationStat;