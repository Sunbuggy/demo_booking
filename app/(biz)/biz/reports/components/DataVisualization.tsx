'use client';

import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DownloadIcon,
  Settings,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet';
import Pagination from './Pagination';
import { isWithinInterval, parseISO, endOfDay, startOfDay } from 'date-fns';

// --- CONFIGURATION ---
const COLUMN_LABELS: Record<string, string> = {
  amount: 'Total Charge ($)',
  response_text: 'Status',
  created_at: 'Timestamp',
  customer_name: 'Customer',
  auth_code: 'Auth Code',
  transaction_id: 'Trans ID',
  card_type: 'Card',
  date_local: 'Date (Local)',
  condition: 'Condition'
};

// --- TYPES ---
interface DataVisualizationProps {
  data: any[];
  dateRange: { from: Date; to: Date };
  tableName: string;
}

const DataVisualization: React.FC<DataVisualizationProps> = ({
  data,
  dateRange,
  tableName
}) => {
  // --- STATE ---
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // --- HELPERS ---
  // robust parser that handles numbers, strings "20.00", and currency "$20.00"
  const parseAmount = (value: any): number => {
    if (typeof value === 'number') return value;
    if (!value) return 0;
    const str = value.toString().replace(/[^0-9.-]+/g, '');
    return parseFloat(str) || 0;
  };

  // --- LOGIC: Column Extraction ---
  const columns = useMemo(() => {
    if (data.length === 0) return [];
    return Object.keys(data[0]).filter((col) => col !== 'id');
  }, [data]);

  // --- LOGIC: Default Visibility ---
  useMemo(() => {
    if (visibleColumns.length === 0 && columns.length > 0) {
      const priorityCols = ['date_local', 'created_at', 'customer_name', 'amount', 'response_text', 'auth_code', 'card_type'];
      const availablePriority = priorityCols.filter(c => columns.includes(c));
      
      if (availablePriority.length > 0) {
        const others = columns.filter(c => !priorityCols.includes(c)).slice(0, 10 - availablePriority.length);
        setVisibleColumns([...availablePriority, ...others]);
      } else {
        setVisibleColumns(columns.slice(0, 10));
      }
    }
  }, [columns]); // Intentionally ran once on mount/column change

  // --- LOGIC: Filtering & Sorting ---
  const filteredData = useMemo(() => {
    let filtered = data.filter((item) => {
      // 1. DATE RANGE FILTER (The Fix)
      // We look for common date fields: 'created_at' (DB) or 'date_local' (NMI)
      if (dateRange) {
        const dateVal = item.created_at || item.date_local;
        if (dateVal) {
          const itemDate = new Date(dateVal);
          // Check if date is valid
          if (!isNaN(itemDate.getTime())) {
            // Compare intervals (inclusive of full start/end days)
            if (
              itemDate < startOfDay(dateRange.from) || 
              itemDate > endOfDay(dateRange.to)
            ) {
              return false;
            }
          }
        }
      }

      // 2. Global Search
      const matchesSearch = Object.values(item).some((value) =>
        value?.toString()?.toLowerCase().includes(searchTerm?.toLowerCase() ?? '')
      );

      return matchesSearch;
    });

    // 3. Sorting
    if (sortColumn) {
      filtered = filtered.sort((a, b) => {
        const aValue = a[sortColumn];
        const bValue = b[sortColumn];

        // Date sorting
        if (sortColumn.includes('date') || sortColumn === 'created_at') {
           const dateA = new Date(aValue).getTime();
           const dateB = new Date(bValue).getTime();
           return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        }

        // Numeric sorting (Amount)
        if (sortColumn === 'amount') {
           const numA = parseAmount(aValue);
           const numB = parseAmount(bValue);
           return sortOrder === 'asc' ? numA - numB : numB - numA;
        }

        // String sorting
        if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [data, searchTerm, sortColumn, sortOrder, dateRange]);

  // --- LOGIC: Pagination ---
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredData.slice(startIndex, startIndex + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredData.length / pageSize);

  // --- LOGIC: Financial Calculation ---
  const calculateNetTotal = (items: any[]) => {
    return items.reduce((sum, row) => {
      // Use the helper to strip '$' if present
      const amount = parseAmount(row.amount);
      
      // If NMI data, check approval
      if (row.hasOwnProperty('response_text')) {
         if (row.response_text === 'Approved') {
           // Handle refunds if designated
           if (row.action_type === 'refund') return sum - amount;
           return sum + amount;
         }
         return sum;
      }
      return sum + amount;
    }, 0);
  };

  const netTotal = calculateNetTotal(filteredData);

  // --- RENDER HELPERS ---
  const toggleColumnVisibility = (column: string) => {
    setVisibleColumns((prev) =>
      prev.includes(column)
        ? prev.filter((c) => c !== column)
        : [...prev, column]
    );
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-6 w-full">
      
      {/* HEADER CONTROLS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-zinc-900/50 p-4 rounded-lg border border-zinc-800">
        <div className="flex items-center gap-2 w-full md:w-auto">
           <Input
            type="text"
            placeholder="Search visible data..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-80 bg-zinc-950 border-zinc-700"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="flex-1 md:flex-none border-zinc-700 hover:bg-zinc-800">
                <Settings className="mr-2 h-4 w-4" />
                Columns
              </Button>
            </SheetTrigger>
            <SheetContent className="bg-zinc-950 border-zinc-800 text-zinc-100">
              <SheetHeader>
                <SheetTitle className="text-zinc-100">Column Visibility</SheetTitle>
                <SheetDescription>Check columns to display.</SheetDescription>
              </SheetHeader>
              <div className="mt-4 grid grid-cols-1 gap-2 max-h-[80vh] overflow-y-auto">
                {columns.map((column) => (
                  <div key={column} className="flex items-center space-x-3 p-2 hover:bg-zinc-900 rounded">
                    <Checkbox
                      checked={visibleColumns.includes(column)}
                      onCheckedChange={() => toggleColumnVisibility(column)}
                      id={`col-${column}`}
                    />
                    <label htmlFor={`col-${column}`} className="text-sm cursor-pointer w-full">
                      {COLUMN_LABELS[column] || column.replace(/_/g, ' ')}
                    </label>
                  </div>
                ))}
              </div>
            </SheetContent>
          </Sheet>

          <Button variant="outline" className="flex-1 md:flex-none border-zinc-700 hover:bg-zinc-800">
            <DownloadIcon className="mr-2 h-4 w-4" /> Export
          </Button>
        </div>
      </div>

      {/* MAIN TABLE */}
      {/* Mobile Fix: Constrain max width to viewport */}
      <div className="border border-zinc-800 rounded-md bg-zinc-950 shadow-xl w-full max-w-[calc(100vw-3rem)] md:max-w-full mx-auto">
        <div className="overflow-x-auto w-full">
          <Table className="min-w-full">
            <TableHeader className="bg-zinc-900">
              <TableRow className="border-zinc-800 hover:bg-zinc-900">
                {visibleColumns.map((column) => (
                  <TableHead key={column} className="text-zinc-400 font-semibold whitespace-nowrap px-4">
                    <button 
                      onClick={() => handleSort(column)}
                      className="flex items-center gap-2 hover:text-white transition-colors"
                    >
                      {COLUMN_LABELS[column] || column.replace(/_/g, ' ')}
                      {sortColumn === column ? (
                        sortOrder === 'asc' ? <ArrowUp className="h-3 w-3 text-indigo-400" /> : <ArrowDown className="h-3 w-3 text-indigo-400" />
                      ) : (
                        <ArrowDown className="h-3 w-3 opacity-0 group-hover:opacity-30" />
                      )}
                    </button>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            
            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={visibleColumns.length} className="text-center py-12 text-zinc-500">
                    No records found for the selected date range.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((row, i) => {
                  const isDeclined = row.response_text && row.response_text !== 'Approved';
                  return (
                    <TableRow 
                      key={i} 
                      className={`border-zinc-800 ${isDeclined ? 'bg-red-950/20' : 'hover:bg-zinc-900'}`}
                    >
                      {visibleColumns.map((col) => (
                        <TableCell key={`${i}-${col}`} className="py-3 px-4 text-zinc-300 whitespace-nowrap">
                          {col === 'amount' ? (
                            <span className={`font-mono font-bold ${isDeclined ? 'text-zinc-600 line-through' : 'text-emerald-400'}`}>
                              ${parseAmount(row[col]).toFixed(2)}
                            </span>
                          ) : col === 'response_text' ? (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${row[col] === 'Approved' ? 'bg-emerald-950/50 text-emerald-400 border-emerald-900' : 'bg-red-950/50 text-red-400 border-red-900'}`}>
                              {row[col] || 'Unknown'}
                            </span>
                          ) : (
                            <span className="block truncate max-w-[200px]" title={row[col]}>
                               {row[col] ?? '-'}
                            </span>
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })
              )}
            </TableBody>

            {/* FOOTER TOTALS */}
            {filteredData.length > 0 && (
              <TableFooter className="bg-zinc-900/80 border-t border-zinc-700">
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={Math.max(1, visibleColumns.length - 1)} className="text-right pr-4">
                    <div className="flex flex-col items-end">
                      <span className="text-zinc-400 text-xs uppercase tracking-wider font-semibold">Total</span>
                      {filteredData[0].hasOwnProperty('response_text') && (
                        <span className="text-zinc-500 text-[10px]">(Approved Only)</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-left pl-4 whitespace-nowrap">
                     <span className="text-xl font-bold text-emerald-400 block">
                        ${netTotal.toFixed(2)}
                     </span>
                  </TableCell>
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </div>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  );
};

export default DataVisualization;