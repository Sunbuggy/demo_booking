'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { RefreshCw, AlertCircle, Loader2 } from 'lucide-react';
// import { cn } from '@/lib/utils'; 

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
      const url = `${NMI_ENDPOINT}?location=${location}&start_date=${todayStr}&end_date=${todayStr}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Gateway Error');
      
      const json = await res.json();
      if (json.error) throw new Error(json.error);

      // Do NOT use json.unsettledTotal (it includes failed txns).
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
    // THEME FIX: Use semantic 'bg-card', 'border-border', 'text-card-foreground'
    <div className="relative group min-w-[200px] p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-all shadow-sm">
      {/* Header: Label + Refresh Icon */}
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
        <button 
          onClick={fetchData} 
          disabled={loading}
          className="text-muted-foreground hover:text-foreground transition-colors disabled:animate-spin"
        >
          {loading ? <Loader2 className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" />}
        </button>
      </div>

      {/* Content: Value or Error */}
      <div className="flex items-baseline gap-2">
        {error ? (
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-tight">
              {error === 'Gateway Error' ? 'GATEWAY ERROR' : 'LOAD FAILED'}
            </span>
          </div>
        ) : (
          <div>
            <span className="text-xs text-muted-foreground mr-2 font-medium">UNSETTLED</span>
            {/* We keep yellow-500/600 explicitly for money visibility, but adaptable */}
            <span className={`text-2xl font-mono font-bold tracking-tighter ${loading ? 'opacity-50' : 'text-yellow-600 dark:text-yellow-400'}`}>
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