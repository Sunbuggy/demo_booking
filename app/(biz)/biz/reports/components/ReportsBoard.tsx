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
  const [nmiSettledTotal, setNmiSettledTotal] = useState(0);
  const [nmiUnsettledTotal, setNmiUnsettledTotal] = useState(0);
  const [nmiHoldsTotal, setNmiHoldsTotal] = useState(0);
  const [nmiLoading, setNmiLoading] = useState(false);
  const [nmiError, setNmiError] = useState<string | null>(null);

  // Active tab within NMI reports
  const [activeNmiTab, setActiveNmiTab] = useState<'settled' | 'unsettled' | 'holds'>('settled');

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

        setNmiSettled(json.settled || []);
        setNmiUnsettled(json.unsettled || []);
        setNmiHolds(json.holds || []);
        setNmiSettledTotal(json.settledTotal || 0);
        setNmiUnsettledTotal(json.unsettledTotal || 0);
        setNmiHoldsTotal(json.holdsTotal || 0);

        setActiveNmiTab('settled'); // default to settled tab
      } catch (err: any) {
        setNmiError(err.message || 'Failed to load NMI transactions');
        setNmiSettled([]);
        setNmiUnsettled([]);
        setNmiHolds([]);
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
        <h2 className="text-2xl font-bold mb-4 text-yellow-400">Database Reports</h2>
        <TableSelector tables={tables} onSelect={handleTableSelect} />
      </div>

      {/* NMI Live Card Reports Section */}
      <div>
        <h2 className="text-2xl font-bold mb-4 text-yellow-400">Card</h2>
        <div className="flex flex-wrap gap-4 mb-6">
          <Button
            onClick={() => handleNmiReportSelect('pismo')}
            variant={selectedNmiReport === 'pismo' ? 'default' : 'outline'}
            className={selectedNmiReport === 'pismo' ? 'bg-indigo-600' : ''}
          >
            Pismo Charges (NMI)
          </Button>
          <Button
            onClick={() => handleNmiReportSelect('vegas')}
            variant={selectedNmiReport === 'vegas' ? 'default' : 'outline'}
            className={selectedNmiReport === 'vegas' ? 'bg-indigo-600' : ''}
          >
            Vegas Charges (NMI)
          </Button>
          <Button
            onClick={() => handleNmiReportSelect('all')}
            variant={selectedNmiReport === 'all' ? 'default' : 'outline'}
            className={selectedNmiReport === 'all' ? 'bg-indigo-600' : ''}
          >
            All Charges (NMI)
          </Button>
        </div>
      </div>

      {/* Date Range Picker and Generate Button */}
      {(selectedTable || selectedNmiReport) && (
        <>
          <DateRangePicker onSelect={handleDateRangeSelect} />
          <Button 
            onClick={handleGenerateReport} 
            disabled={!dateRange || nmiLoading}
          >
            {nmiLoading ? 'Loading Transactions...' : 'Generate Report'}
          </Button>
        </>
      )}

      {/* NMI Error Display */}
      {nmiError && (
        <div className="bg-red-900 border border-red-700 text-red-100 px-6 py-4 rounded mb-6">
          <strong>NMI Error:</strong> {nmiError}
          <p className="text-sm mt-2 opacity-80">
            Check browser console for details.
          </p>
        </div>
      )}

      {/* NMI Tabs with Totals */}
      {selectedNmiReport && showVisualization && !nmiLoading && (
        <div className="space-y-4">
          <div className="flex gap-4 border-b border-gray-700">
            <button
              onClick={() => setActiveNmiTab('settled')}
              className={`pb-2 px-4 font-medium transition ${
                activeNmiTab === 'settled'
                  ? 'border-b-2 border-indigo-500 text-indigo-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Settled (${nmiSettledTotal.toFixed(2)})
            </button>
            <button
              onClick={() => setActiveNmiTab('unsettled')}
              className={`pb-2 px-4 font-medium transition ${
                activeNmiTab === 'unsettled'
                  ? 'border-b-2 border-indigo-500 text-indigo-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Unsettled (${nmiUnsettledTotal.toFixed(2)})
            </button>
            <button
              onClick={() => setActiveNmiTab('holds')}
              className={`pb-2 px-4 font-medium transition ${
                activeNmiTab === 'holds'
                  ? 'border-b-2 border-indigo-500 text-indigo-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Holds (${nmiHoldsTotal.toFixed(2)})
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
        <p className="text-gray-400 text-lg text-center py-12">
          No transactions found for the selected date range and category.
        </p>
      )}
    </div>
  );
};

export default ReportsBoard;