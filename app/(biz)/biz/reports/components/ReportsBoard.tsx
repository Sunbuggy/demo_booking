'use client';

import { useState } from 'react';
import { format } from 'date-fns';

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
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [selectedNmiReport, setSelectedNmiReport] = useState<NmiReportType | null>(null);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | null>(null);
  const [showVisualization, setShowVisualization] = useState(false);

  // NMI data and loading state
  const [nmiSettled, setNmiSettled] = useState<any[]>([]);
  const [nmiUnsettled, setNmiUnsettled] = useState<any[]>([]);
  const [nmiHolds, setNmiHolds] = useState<any[]>([]);
  
  // Totals State
  const [nmiSettledTotal, setNmiSettledTotal] = useState(0);
  const [nmiUnsettledTotal, setNmiUnsettledTotal] = useState(0);
  const [nmiHoldsTotal, setNmiHoldsTotal] = useState(0);
  
  const [nmiLoading, setNmiLoading] = useState(false);
  const [nmiError, setNmiError] = useState<string | null>(null);

  // Active tab within NMI reports
  const [activeNmiTab, setActiveNmiTab] = useState<'settled' | 'unsettled' | 'holds'>('settled');

  // --- HELPER: Strict Total Calculation ---
  // This ensures the header matches the footer by filtering out failed transactions
  const calculateSafeTotal = (transactions: any[]) => {
    if (!Array.isArray(transactions)) return 0;
    
    return transactions.reduce((acc, curr) => {
      // 1. Must be Approved
      if (curr.response_text !== 'Approved') return acc;
      
      // 2. Handle Refunds (Subtract if it's a refund, Add if it's a sale)
      const amount = parseFloat(curr.amount) || 0;
      
      // If the API returns positive numbers for refunds, we might need to subtract.
      // Assuming 'sale' adds to revenue and 'refund' subtracts:
      if (curr.action_type === 'refund') {
        return acc - amount;
      }
      
      return acc + amount;
    }, 0);
  };

  const handleTableSelect = (table: Table) => {
    setSelectedTable(table);
    setSelectedNmiReport(null);
    setShowVisualization(false);
    setNmiError(null);
  };

  const handleNmiReportSelect = (type: NmiReportType) => {
    setSelectedNmiReport(type);
    setSelectedTable(null);
    setShowVisualization(false);
    setNmiError(null);
  };

  const handleDateRangeSelect = (range: { from: Date; to: Date }) => {
    setDateRange(range);
  };

  const handleGenerateReport = async () => {
    if (!dateRange) return;

    if (selectedNmiReport) {
      // NMI Report - fetch live data
      const from = format(dateRange.from, 'yyyy-MM-dd');
      const to = format(dateRange.to, 'yyyy-MM-dd');

      setNmiLoading(true);
      setNmiError(null);

      try {
        const url = `${NMI_ENDPOINT}?location=${selectedNmiReport}&start_date=${from}&end_date=${to}`;
        const res = await fetch(url);

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Failed to fetch: ${res.status} ${text.substring(0, 200)}`);
        }

        const json = await res.json();

        if (json.error) throw new Error(json.error);

        const settledData = json.settled || [];
        const unsettledData = json.unsettled || [];
        const holdsData = json.holds || [];

        setNmiSettled(settledData);
        setNmiUnsettled(unsettledData);
        setNmiHolds(holdsData);

        // --- FIX: Calculate Totals Client-Side ---
        // We ignore json.settledTotal to avoid including failed transactions
        setNmiSettledTotal(calculateSafeTotal(settledData));
        setNmiUnsettledTotal(calculateSafeTotal(unsettledData));
        setNmiHoldsTotal(calculateSafeTotal(holdsData));

        // Auto-switch to Unsettled tab if Settled is empty but Unsettled has data
        if (settledData.length === 0 && unsettledData.length > 0) {
            setActiveNmiTab('unsettled');
        } else {
            setActiveNmiTab('settled');
        }

      } catch (err: any) {
        setNmiError(err.message || 'Failed to load NMI transactions');
        setNmiSettled([]);
        setNmiUnsettled([]);
        setNmiHolds([]);
        setNmiSettledTotal(0);
        setNmiUnsettledTotal(0);
        setNmiHoldsTotal(0);
      } finally {
        setNmiLoading(false);
        setShowVisualization(true);
      }
    } else if (selectedTable) {
      // Regular database report
      setShowVisualization(true);
    }
  };

  // Determine which data to show
  let visualizationData: any[] = [];
  let visualizationTableName = '';

  if (selectedNmiReport && showVisualization) {
    if (activeNmiTab === 'settled') {
      visualizationData = nmiSettled;
      visualizationTableName = `Settled Charges (${selectedNmiReport.toUpperCase()} - NMI)`;
    } else if (activeNmiTab === 'unsettled') {
      visualizationData = nmiUnsettled;
      visualizationTableName = `Unsettled Charges (${selectedNmiReport.toUpperCase()} - NMI)`;
    } else if (activeNmiTab === 'holds') {
      visualizationData = nmiHolds;
      visualizationTableName = `Holds / Damage Deposits (${selectedNmiReport.toUpperCase()} - NMI)`;
    }
  } else if (selectedTable) {
    visualizationData = selectedTable.data;
    visualizationTableName = selectedTable.name;
  }

  return (
    <div className="space-y-8">
      {/* Database Reports Section */}
      <div>
        <h2 className="text-2xl font-bold mb-4 text-zinc-100">Database Reports</h2>
        <TableSelector tables={tables} onSelect={handleTableSelect} />
      </div>

      {/* NMI Live Card Reports Section */}
      <div>
        <h2 className="text-2xl font-bold mb-4 text-zinc-100">Card Transactions</h2>
        <div className="flex flex-wrap gap-4 mb-6">
          <Button
            onClick={() => handleNmiReportSelect('pismo')}
            variant={selectedNmiReport === 'pismo' ? 'default' : 'outline'}
            className={selectedNmiReport === 'pismo' ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'border-zinc-700 hover:bg-zinc-800'}
          >
            Pismo Beach (NMI)
          </Button>
          <Button
            onClick={() => handleNmiReportSelect('vegas')}
            variant={selectedNmiReport === 'vegas' ? 'default' : 'outline'}
            className={selectedNmiReport === 'vegas' ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'border-zinc-700 hover:bg-zinc-800'}
          >
            Las Vegas (NMI)
          </Button>
          <Button
            onClick={() => handleNmiReportSelect('all')}
            variant={selectedNmiReport === 'all' ? 'default' : 'outline'}
            className={selectedNmiReport === 'all' ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'border-zinc-700 hover:bg-zinc-800'}
          >
            All Locations (NMI)
          </Button>
        </div>
      </div>

      {/* Date Range Picker and Generate Button */}
      {(selectedTable || selectedNmiReport) && (
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-zinc-900/50 p-6 rounded-lg border border-zinc-800">
          <DateRangePicker onSelect={handleDateRangeSelect} />
          <Button 
            onClick={handleGenerateReport} 
            disabled={!dateRange || nmiLoading}
            className="w-full sm:w-auto"
          >
            {nmiLoading ? 'Loading Transactions...' : 'Generate Report'}
          </Button>
        </div>
      )}

      {/* NMI Error Display */}
      {nmiError && (
        <div className="bg-red-950/30 border border-red-900 text-red-200 px-6 py-4 rounded mb-6">
          <strong className="text-red-100">Error:</strong> {nmiError}
        </div>
      )}

      {/* NMI Tabs with Totals */}
      {selectedNmiReport && showVisualization && !nmiLoading && (
        <div className="space-y-4">
          <div className="flex gap-6 border-b border-zinc-700">
            <button
              onClick={() => setActiveNmiTab('settled')}
              className={`pb-4 px-2 font-medium transition text-lg ${
                activeNmiTab === 'settled'
                  ? 'border-b-2 border-indigo-500 text-indigo-400'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Settled <span className="ml-2 text-sm bg-zinc-800 px-2 py-0.5 rounded text-zinc-300">${nmiSettledTotal.toFixed(2)}</span>
            </button>
            <button
              onClick={() => setActiveNmiTab('unsettled')}
              className={`pb-4 px-2 font-medium transition text-lg ${
                activeNmiTab === 'unsettled'
                  ? 'border-b-2 border-indigo-500 text-indigo-400'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Unsettled <span className="ml-2 text-sm bg-zinc-800 px-2 py-0.5 rounded text-zinc-300">${nmiUnsettledTotal.toFixed(2)}</span>
            </button>
            <button
              onClick={() => setActiveNmiTab('holds')}
              className={`pb-4 px-2 font-medium transition text-lg ${
                activeNmiTab === 'holds'
                  ? 'border-b-2 border-indigo-500 text-indigo-400'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Holds <span className="ml-2 text-sm bg-zinc-800 px-2 py-0.5 rounded text-zinc-300">${nmiHoldsTotal.toFixed(2)}</span>
            </button>
          </div>
        </div>
      )}

      {/* Visualization - Database or NMI */}
      {showVisualization && visualizationData.length > 0 && (
        <DataVisualization
          data={visualizationData}
          dateRange={dateRange!}
          tableName={visualizationTableName}
        />
      )}

      {showVisualization && visualizationData.length === 0 && !nmiError && (
        <div className="text-zinc-500 text-center py-16 bg-zinc-900/20 rounded-lg border border-zinc-800 border-dashed">
          <p className="text-lg">No transactions found for this period.</p>
        </div>
      )}
    </div>
  );
};

export default ReportsBoard;