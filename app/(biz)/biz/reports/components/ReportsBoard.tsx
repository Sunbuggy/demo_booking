'use client';

import { useState } from 'react';

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

const ReportsBoard: React.FC<ReportsBoardProps> = ({ tables }) => {
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | null>(
    null
  );
  const [showVisualization, setShowVisualization] = useState(false);

  const handleTableSelect = (table: Table) => {
    setSelectedTable(table);
    setShowVisualization(false);
  };

  const handleDateRangeSelect = (range: { from: Date; to: Date }) => {
    setDateRange(range);
  };

  const handleGenerateReport = () => {
    if (selectedTable && dateRange) {
      setShowVisualization(true);
    }
  };

  return (
    <div className="space-y-8">
      <TableSelector tables={tables} onSelect={handleTableSelect} />
      {selectedTable && (
        <>
          <DateRangePicker onSelect={handleDateRangeSelect} />
          <Button onClick={handleGenerateReport} disabled={!dateRange}>
            Generate Report
          </Button>
        </>
      )}
      {showVisualization && selectedTable && dateRange && (
        <DataVisualization
          data={selectedTable.data}
          dateRange={dateRange}
          tableName={selectedTable.name}
        />
      )}
    </div>
  );
};

export default ReportsBoard;
