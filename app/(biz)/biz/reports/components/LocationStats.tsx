'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import { RefreshCw, AlertCircle, Loader2 } from 'lucide-react';

const NMI_ENDPOINT = 'https://bookings.sunbuggy.com/functions/v1/nmi-charges';

interface LocationStatProps {
  location: 'vegas' | 'pismo';
  label: string;
}

const LocationStat: React.FC<LocationStatProps> = ({ location, label }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const todayStr = format(new Date(), 'yyyy-MM-dd');

    try {
      // Fetch ONLY today's data for the "Live Unsettled" button
      // (Or fetch a wider range if you want this button to summarize more)
      const url = `${NMI_ENDPOINT}?location=${location}&start_date=${todayStr}&end_date=${todayStr}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Gateway Error');
      
      const json = await res.json();
      if (json.error) throw new Error(json.error);

      setData(json.transactions || []);
    } catch (err: any) {
      console.error(`Error fetching ${location}:`, err);
      setError(err.message || 'Failed');
    } finally {
      setLoading(false);
    }
  }, [location]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // --- CLIENT-SIDE FILTERING LOGIC ---
  const unsettledTotal = useMemo(() => {
    if (!data.length) return 0;

    return data.reduce((acc, curr) => {
      // LOGIC: Unsettled = Approved Sales awaiting settlement
      // 1. Must be a 'sale' (not auth, not settle)
      if (curr.action_type !== 'sale') return acc;
      
      // 2. Must be approved/pending settlement
      // NMI usually uses 'pendingsettlement' or 'complete' for immediate captures
      if (curr.condition !== 'pendingsettlement') return acc;

      // 3. Must be Approved (sanity check)
      if (curr.response_text !== 'Approved') return acc;

      return acc + (parseFloat(curr.amount) || 0);
    }, 0);
  }, [data]);

  return (
    <div className="relative group min-w-[200px] p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-all shadow-sm">
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

      <div className="flex items-baseline gap-2">
        {error ? (
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-tight">ERROR</span>
          </div>
        ) : (
          <div>
            <span className="text-xs text-muted-foreground mr-2 font-medium">UNSETTLED</span>
            <span className={`text-2xl font-mono font-bold tracking-tighter ${loading ? 'opacity-50' : 'text-yellow-600 dark:text-yellow-400'}`}>
              {`$${unsettledTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationStat;