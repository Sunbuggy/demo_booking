'use client';

import { useState, useMemo, useEffect } from 'react';
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

// --- CONFIGURATION ---
const STORAGE_KEY = 'sunbuggy-nmi-table-columns';

const COLUMN_LABELS: Record<string, string> = {
  // Financial
  amount: 'Amount ($)',
  response_text: 'Status',
  customer_name: 'Customer',
  date_local: 'Date',
  transaction_id: 'Trans ID',
  auth_code: 'Auth Code',
  location: 'Location',
  email: 'Email',
  zip: 'Zip Code',
  phone: 'Phone',
  order_id: 'Order ID',
  condition: 'Condition',
  action_type: 'Type',
  
  // Generic Database Fields
  created_at: 'Timestamp',
  vehicle_id: 'Vehicle ID',
  created_by: 'Created By',
  updated_by: 'Updated By',
  closed_by: 'Closed By',
  scanned_at: 'Scanned At',
  notes: 'Notes',
  tag_id: 'Tag ID'
};

const HIDDEN_FIELDS = ['id', 'date_obj', 'first_name', 'last_name'];

interface DataVisualizationProps {
  data: any[];
  dateRange: { from: Date; to: Date };
  tableName: string;
  isFinancial?: boolean;
}

const DataVisualization: React.FC<DataVisualizationProps> = ({
  data,
  tableName,
  isFinancial = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // --- HELPERS ---
  const parseAmount = (value: any): number => {
    if (typeof value === 'number') return value;
    if (!value) return 0;
    const str = value.toString().replace(/[^0-9.-]+/g, '');
    return parseFloat(str) || 0;
  };

  const isSuccessStatus = (status: string) => {
    if (!status) return false;
    const s = status.toUpperCase();
    return s === 'APPROVED' || s === 'ACCEPTED' || s === 'COMPLETED';
  };

  // --- LOGIC: Column Extraction ---
  const columns = useMemo(() => {
    if (data.length === 0) return [];
    return Object.keys(data[0]).filter((col) => !HIDDEN_FIELDS.includes(col));
  }, [data]);

  // --- LOGIC: Load / Default Visibility ---
  useEffect(() => {
    if (columns.length === 0) return;

    // 1. Try Loading User Preferences
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure saved columns actually exist in current data
        const valid = parsed.filter((c: string) => columns.includes(c));
        if (valid.length > 0) {
          setVisibleColumns(valid);
          return;
        }
      } catch (e) { console.error(e); }
    }

    // 2. Default: Show ALL columns if no preference saved
    if (visibleColumns.length === 0) {
      setVisibleColumns(columns);
    }
  }, [columns]);

  // --- LOGIC: Filtering & Sorting ---
  const filteredData = useMemo(() => {
    let filtered = data.filter((item) => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return Object.values(item).some((value) =>
        value?.toString()?.toLowerCase().includes(term)
      );
    });

    if (sortColumn) {
      filtered = filtered.sort((a, b) => {
        const aValue = a[sortColumn];
        const bValue = b[sortColumn];

        if (sortColumn.includes('date') || sortColumn === 'created_at' || sortColumn.includes('timestamp')) {
           const dateA = new Date(a['date_obj'] || aValue).getTime();
           const dateB = new Date(b['date_obj'] || bValue).getTime();
           return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        }
        if (sortColumn === 'amount' && isFinancial) {
           const numA = parseAmount(aValue);
           const numB = parseAmount(bValue);
           return sortOrder === 'asc' ? numA - numB : numB - numA;
        }
        if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return filtered;
  }, [data, searchTerm, sortColumn, sortOrder, isFinancial]);

  // --- LOGIC: Pagination ---
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredData.slice(startIndex, startIndex + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredData.length / pageSize);

  // --- LOGIC: Totals (Financial Only) ---
  const netTotal = useMemo(() => {
    if (!isFinancial) return 0;
    return filteredData.reduce((sum, row) => {
      const amount = parseAmount(row.amount);
      const status = row.response_text;
      if (status && !isSuccessStatus(status)) return sum; 
      if (row.action_type === 'refund') return sum - amount;
      return sum + amount;
    }, 0);
  }, [filteredData, isFinancial]);

  // --- VIEW HANDLERS ---
  const toggleColumnVisibility = (col: string) => {
    setVisibleColumns(prev => {
      const next = prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col];
      // Save preference to LocalStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const handleSort = (col: string) => {
    if (sortColumn === col) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(col);
      setSortOrder('desc');
    }
  };

  const downloadData = () => {
    const headers = visibleColumns.map(col => `"${COLUMN_LABELS[col] || col}"`).join(',');
    const rows = filteredData.map(row => {
      return visibleColumns.map(col => {
        let val = row[col];
        if (isFinancial && col === 'amount') val = parseAmount(val).toFixed(2);
        if (val === null || val === undefined) val = '';
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(',');
    });
    const blob = new Blob([[headers, ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${tableName.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 w-full mt-6 animate-in fade-in duration-500">
      
      {/* HEADER CONTROLS */}
      <div className="flex flex-col md:flex-row justify-between gap-4 bg-card p-4 rounded-lg border border-border shadow-sm">
        <div className="flex items-center gap-2 w-full md:w-auto">
           <Input
            type="text"
            placeholder="Search visible data..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-80 bg-background border-input text-foreground focus:border-primary"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="flex-1 border-input bg-background hover:bg-accent">
                <Settings className="mr-2 h-4 w-4" /> Columns
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Column Visibility</SheetTitle>
                <SheetDescription>Select columns to display.</SheetDescription>
              </SheetHeader>
              <div className="mt-6 grid grid-cols-1 gap-3 max-h-[80vh] overflow-y-auto">
                {columns.map((col) => (
                  <div key={col} className="flex items-center space-x-3 p-2 hover:bg-muted rounded border border-transparent hover:border-border">
                    <Checkbox
                      checked={visibleColumns.includes(col)}
                      onCheckedChange={() => toggleColumnVisibility(col)}
                      id={`col-${col}`}
                    />
                    <label htmlFor={`col-${col}`} className="text-sm cursor-pointer w-full font-medium text-foreground">
                      {COLUMN_LABELS[col] || col.replace(/_/g, ' ')}
                    </label>
                  </div>
                ))}
              </div>
            </SheetContent>
          </Sheet>
          <Button onClick={downloadData} variant="outline" className="flex-1 border-input bg-background hover:bg-accent">
            <DownloadIcon className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      {/* TABLE */}
      <div className="border border-border rounded-md bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto w-full">
          <Table className="min-w-full">
            <TableHeader className="bg-muted/50">
              <TableRow className="border-border hover:bg-transparent">
                {visibleColumns.map((col) => (
                  <TableHead key={col} className="text-muted-foreground font-semibold whitespace-nowrap px-4 h-12">
                    <button onClick={() => handleSort(col)} className="flex items-center gap-2 hover:text-foreground transition-colors">
                      {COLUMN_LABELS[col] || col.replace(/_/g, ' ')}
                      {sortColumn === col ? (
                        sortOrder === 'asc' ? <ArrowUp className="h-3 w-3 text-primary" /> : <ArrowDown className="h-3 w-3 text-primary" />
                      ) : <ArrowDown className="h-3 w-3 opacity-0 group-hover:opacity-30" />}
                    </button>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length === 0 ? (
                <TableRow><TableCell colSpan={visibleColumns.length} className="text-center py-24 text-muted-foreground">No records found.</TableCell></TableRow>
              ) : (
                paginatedData.map((row, i) => {
                  
                  // --- FINANCIAL FORMATTING LOGIC ---
                  let isDeclined = false;
                  if (isFinancial) {
                    const status = row.response_text || '';
                    isDeclined = !isSuccessStatus(status);
                  }

                  return (
                    <TableRow 
                      key={i} 
                      className={`border-border transition-colors ${
                        isDeclined ? 'bg-destructive/5 hover:bg-destructive/10' : 'hover:bg-muted/50'
                      }`}
                    >
                      {visibleColumns.map((col) => (
                        <TableCell key={`${i}-${col}`} className="py-3 px-4 text-foreground whitespace-nowrap text-sm">
                          {isFinancial && col === 'amount' ? (
                            <span className={`font-mono font-medium ${isDeclined ? 'text-muted-foreground line-through' : 'text-green-600 dark:text-green-400'}`}>
                              ${parseAmount(row[col]).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                          ) : isFinancial && col === 'response_text' ? (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border ${
                              !isDeclined 
                                ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' 
                                : 'bg-destructive/10 text-destructive border-destructive/20'
                            }`}>
                              {row[col] || 'Unknown'}
                            </span>
                          ) : col === 'location' ? (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                                row[col]?.toLowerCase() === 'vegas' 
                                ? 'bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800' 
                                : 'bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'
                            }`}>
                                {row[col]}
                            </span>
                          ) : (
                            <span className="block truncate max-w-[240px]" title={String(row[col])}>
                               {row[col] ?? '—'}
                            </span>
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })
              )}
            </TableBody>

            {/* FOOTER - ONLY SHOW FOR FINANCIAL REPORTS */}
            {filteredData.length > 0 && isFinancial && (
              <TableFooter className="bg-muted/50 border-t border-border">
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={Math.max(1, visibleColumns.length - 1)} className="text-right pr-4 py-4">
                    <div className="flex flex-col items-end">
                      <span className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Total (Approved)</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-left pl-4 py-4 whitespace-nowrap">
                     <span className="text-xl font-bold text-green-600 dark:text-green-400 font-mono block">
                        ${netTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
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