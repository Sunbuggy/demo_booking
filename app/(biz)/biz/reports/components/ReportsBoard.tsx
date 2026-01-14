'use client';

import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Loader2, AlertCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import TableSelector from './TableSelector';
import DateRangePicker from './DateRangePicker';
import DataVisualization from './DataVisualization';

interface Table {
  name: string;
  data: any[];
}

interface ReportsBoardProps {
  tables: Table[];
}

const NMI_ENDPOINT = 'https://bookings.sunbuggy.com/functions/v1/nmi-charges';

type NmiReportType = 'pismo' | 'vegas' | 'all';

const ReportsBoard: React.FC<ReportsBoardProps> = ({ tables }) => {
  // --- UI STATE ---
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [selectedNmiReport, setSelectedNmiReport] = useState<NmiReportType | null>(null);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | null>(null);
  const [showVisualization, setShowVisualization] = useState(false);

  // --- NMI DATA STATE ---
  // We store the raw master list here and filter it on the fly
  const [nmiTransactions, setNmiTransactions] = useState<any[]>([]);
  const [nmiLoading, setNmiLoading] = useState(false);
  const [nmiError, setNmiError] = useState<string | null>(null);

  // Active tab for NMI view
  const [activeNmiTab, setActiveNmiTab] = useState<'settled' | 'unsettled' | 'holds'>('unsettled');

  // --- HANDLERS ---
  const handleTableSelect = (table: Table) => {
    setSelectedTable(table);
    setSelectedNmiReport(null);
    setShowVisualization(false);
    setNmiError(null);
  };

  const handleNmiReportSelect = (type: NmiReportType) => {
    setSelectedNmiReport(type);
    setSelectedTable(null);
    setShowVisualization(false); // Hide until they click Generate
    setNmiError(null);
    setNmiTransactions([]); // Clear old data to prevent confusion
  };

  const handleDateRangeSelect = (range: { from: Date; to: Date }) => {
    setDateRange(range);
  };

  // --- FETCHING LOGIC ---
  const handleGenerateReport = async () => {
    if (!dateRange) return;

    // 1. If NMI Report Selected
    if (selectedNmiReport) {
      setNmiLoading(true);
      setNmiError(null);
      setShowVisualization(false);

      try {
        const from = format(dateRange.from, 'yyyy-MM-dd');
        const to = format(dateRange.to, 'yyyy-MM-dd');
        const url = `${NMI_ENDPOINT}?location=${selectedNmiReport}&start_date=${from}&end_date=${to}`;

        const res = await fetch(url);
        if (!res.ok) throw new Error(`Gateway Error: ${res.status}`);

        const json = await res.json();
        if (json.error) throw new Error(json.error);

        // Handle both data formats (Legacy vs New)
        let combined = json.transactions || [];
        if (!json.transactions) {
          combined = [...(json.settled || []), ...(json.unsettled || []), ...(json.holds || [])];
        }
        setNmiTransactions(combined);
        
      } catch (err: any) {
        setNmiError(err.message || 'Failed to load transactions');
        setNmiTransactions([]);
      } finally {
        setNmiLoading(false);
        setShowVisualization(true);
      }
    } 
    // 2. If Database Table Selected
    else if (selectedTable) {
      setShowVisualization(true);
    }
  };

  // --- CLIENT-SIDE FILTERING (The Core Logic) ---
  const nmiData = useMemo(() => {
    // 1. UNSETTLED (Live Batches)
    // Approved Sales/Captures waiting to be sent to bank
    const unsettled = nmiTransactions.filter(txn => 
      txn.condition === 'pendingsettlement' && 
      (txn.action_type === 'sale' || txn.action_type === 'capture')
    );

    // 2. SETTLED (Money in Bank)
    // We count:
    // A) Transactions specifically marked 'settle' (Historical Deposits)
    // B) Completed Sales (Historical Sales that didn't get a 'settle' event yet)
    // We exclude $0.00 system rows.
    const settled = nmiTransactions.filter(txn => 
      (txn.action_type === 'settle' || 
       (txn.action_type === 'sale' && txn.condition === 'complete')) &&
      txn.amount > 0
    );

    // 3. HOLDS (Pending Auths)
    const holds = nmiTransactions.filter(txn => 
      txn.action_type === 'auth' && 
      txn.condition === 'pending'
    );

    return { settled, unsettled, holds };
  }, [nmiTransactions]);

  // Calculate Totals
  const nmiSettledTotal = nmiData.settled.reduce((acc, t) => acc + (t.amount || 0), 0);
  const nmiUnsettledTotal = nmiData.unsettled.reduce((acc, t) => acc + (t.amount || 0), 0);
  const nmiHoldsTotal = nmiData.holds.reduce((acc, t) => acc + (t.amount || 0), 0);

  // Determine what to pass to DataVisualization
  let displayData: any[] = [];
  let tableName = '';

  if (selectedNmiReport && showVisualization) {
    if (activeNmiTab === 'settled') {
      displayData = nmiData.settled;
      tableName = `Settled (${selectedNmiReport.toUpperCase()}) - $${nmiSettledTotal.toLocaleString()}`;
    } else if (activeNmiTab === 'unsettled') {
      displayData = nmiData.unsettled;
      tableName = `Unsettled (${selectedNmiReport.toUpperCase()}) - $${nmiUnsettledTotal.toLocaleString()}`;
    } else if (activeNmiTab === 'holds') {
      displayData = nmiData.holds;
      tableName = `Holds (${selectedNmiReport.toUpperCase()}) - $${nmiHoldsTotal.toLocaleString()}`;
    }
  } else if (selectedTable) {
    displayData = selectedTable.data;
    tableName = selectedTable.name;
  }

  return (
    <div className="space-y-8">
      
      {/* 1. Database Reports Section */}
      <div>
        <h2 className="text-xl font-bold mb-4 text-zinc-100">Database Reports</h2>
        <TableSelector tables={tables} onSelect={handleTableSelect} />
      </div>

      {/* 2. Card Transactions Section (Restored Position) */}
      <div>
        <h2 className="text-xl font-bold mb-4 text-zinc-100">Card Transactions</h2>
        <div className="flex flex-wrap gap-4 mb-6">
          {(['pismo', 'vegas', 'all'] as NmiReportType[]).map((type) => (
            <Button
              key={type}
              onClick={() => handleNmiReportSelect(type)}
              variant={selectedNmiReport === type ? 'default' : 'outline'}
              className={`capitalize ${
                selectedNmiReport === type 
                  ? 'bg-indigo-600 hover:bg-indigo-500 border-indigo-500 text-white' 
                  : 'border-zinc-700 text-zinc-300 hover:bg-zinc-800'
              }`}
            >
              {type === 'all' ? 'All Locations' : type} (NMI)
            </Button>
          ))}
        </div>
      </div>

      {/* 3. Controls Bar (Date & Generate) */}
      {(selectedTable || selectedNmiReport) && (
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-zinc-900/50 p-6 rounded-lg border border-zinc-800">
          <DateRangePicker onSelect={handleDateRangeSelect} />
          
          <Button 
            onClick={handleGenerateReport} 
            disabled={!dateRange || nmiLoading}
            className="w-full sm:w-auto min-w-[140px]"
          >
            {nmiLoading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...</>
            ) : (
              'Generate Report'
            )}
          </Button>
        </div>
      )}

      {/* 4. Error Message */}
      {nmiError && (
        <div className="bg-red-950/30 border border-red-900 text-red-200 px-6 py-4 rounded flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <span>{nmiError}</span>
        </div>
      )}

      {/* 5. NMI Tabs (Only show if NMI is active & report generated) */}
      {selectedNmiReport && showVisualization && !nmiLoading && (
        <div className="space-y-4 pt-4">
          <div className="flex gap-6 border-b border-zinc-700">
            <button
              onClick={() => setActiveNmiTab('settled')}
              className={`pb-4 px-2 font-medium transition text-lg ${
                activeNmiTab === 'settled'
                  ? 'border-b-2 border-indigo-500 text-indigo-400'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Settled <span className="ml-2 text-sm bg-zinc-800 px-2 py-0.5 rounded text-zinc-300 font-mono">${nmiSettledTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </button>
            <button
              onClick={() => setActiveNmiTab('unsettled')}
              className={`pb-4 px-2 font-medium transition text-lg ${
                activeNmiTab === 'unsettled'
                  ? 'border-b-2 border-indigo-500 text-indigo-400'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Unsettled <span className="ml-2 text-sm bg-zinc-800 px-2 py-0.5 rounded text-zinc-300 font-mono">${nmiUnsettledTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </button>
            <button
              onClick={() => setActiveNmiTab('holds')}
              className={`pb-4 px-2 font-medium transition text-lg ${
                activeNmiTab === 'holds'
                  ? 'border-b-2 border-indigo-500 text-indigo-400'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Holds <span className="ml-2 text-sm bg-zinc-800 px-2 py-0.5 rounded text-zinc-300 font-mono">${nmiHoldsTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </button>
          </div>
        </div>
      )}

      {/* 6. Visualization Component (Restored!) */}
      {showVisualization && (
        <div className="mt-6">
          {displayData.length > 0 ? (
            <DataVisualization
              data={displayData}
              dateRange={dateRange!}
              tableName={tableName}
            />
          ) : (
            !nmiLoading && (
              <div className="text-zinc-500 text-center py-16 bg-zinc-900/20 rounded-lg border border-zinc-800 border-dashed">
                <p className="text-lg">No transactions found for this period.</p>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default ReportsBoard;