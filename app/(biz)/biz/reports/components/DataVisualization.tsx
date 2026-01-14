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
import { endOfDay, startOfDay } from 'date-fns';

// --- CONFIGURATION ---
const COLUMN_LABELS: Record<string, string> = {
  // NMI Specific Fields
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
  
  // Database Report Fields (Legacy)
  created_at: 'Timestamp',
  card_type: 'Card'
};

// Internal fields to hide from the "Columns" selector
const HIDDEN_FIELDS = ['id', 'date_obj', 'first_name', 'last_name'];

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
  const parseAmount = (value: any): number => {
    if (typeof value === 'number') return value;
    if (!value) return 0;
    const str = value.toString().replace(/[^0-9.-]+/g, '');
    return parseFloat(str) || 0;
  };

  // --- LOGIC: Column Extraction ---
  const columns = useMemo(() => {
    if (data.length === 0) return [];
    // Extract keys from first row, excluding hidden fields
    return Object.keys(data[0]).filter((col) => !HIDDEN_FIELDS.includes(col));
  }, [data]);

  // --- LOGIC: Default Visibility ---
  useMemo(() => {
    if (visibleColumns.length === 0 && columns.length > 0) {
      // Priority columns to show by default
      const priorityCols = ['date_local', 'customer_name', 'email', 'location', 'response_text', 'amount'];
      const availablePriority = priorityCols.filter(c => columns.includes(c));
      
      // If we found priority columns, use them. Otherwise, grab the first 6.
      if (availablePriority.length > 0) {
        // Fill remaining slots with other columns up to 8 total
        const others = columns.filter(c => !priorityCols.includes(c)).slice(0, 8 - availablePriority.length);
        setVisibleColumns([...availablePriority, ...others]);
      } else {
        setVisibleColumns(columns.slice(0, 8));
      }
    }
  }, [columns]); // Intentionally omitting visibleColumns to run only on data load

  // --- LOGIC: Filtering & Sorting ---
  const filteredData = useMemo(() => {
    let filtered = data.filter((item) => {
      
      // 1. Date Range Filter
      if (dateRange) {
        // FIX: Prefer 'date_obj' (ISO String from backend) for accurate comparison
        // Fallback to 'created_at' or 'date_local' only if necessary
        const dateVal = item.date_obj || item.created_at || item.date_local;
        
        if (dateVal) {
          const itemDate = new Date(dateVal);
          if (!isNaN(itemDate.getTime())) {
            // Compare strictly against start/end of day to include full range
            if (itemDate < startOfDay(dateRange.from) || itemDate > endOfDay(dateRange.to)) {
              return false;
            }
          }
        }
      }

      // 2. Search Filter
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return Object.values(item).some((value) =>
        value?.toString()?.toLowerCase().includes(term)
      );
    });

    // 3. Sorting
    if (sortColumn) {
      filtered = filtered.sort((a, b) => {
        const aValue = a[sortColumn];
        const bValue = b[sortColumn];

        // Date Sort
        if (sortColumn.includes('date') || sortColumn === 'created_at') {
           // Use date_obj if available for cleaner sorting
           const dateA = new Date(a['date_obj'] || aValue).getTime();
           const dateB = new Date(b['date_obj'] || bValue).getTime();
           return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        }
        
        // Number Sort
        if (sortColumn === 'amount') {
           const numA = parseAmount(aValue);
           const numB = parseAmount(bValue);
           return sortOrder === 'asc' ? numA - numB : numB - numA;
        }
        
        // String Sort
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

  // --- LOGIC: Totals ---
  // Calculates total of CURRENT FILTERED VIEW
  const netTotal = useMemo(() => {
    return filteredData.reduce((sum, row) => {
      const amount = parseAmount(row.amount);
      
      // If Status exists, ensure it's approved
      if (row.response_text) {
         if (row.response_text !== 'Approved') return sum;
      }
      
      // Handle Refunds
      if (row.action_type === 'refund') {
        return sum - amount;
      }
      
      return sum + amount;
    }, 0);
  }, [filteredData]);

  // --- LOGIC: CSV Export ---
  const downloadData = () => {
    const headers = visibleColumns.map(col => `"${COLUMN_LABELS[col] || col}"`).join(',');
    const rows = filteredData.map(row => {
      return visibleColumns.map(col => {
        let val = row[col];
        if (col === 'amount') val = parseAmount(val).toFixed(2);
        if (val === null || val === undefined) val = '';
        // Escape quotes
        const stringVal = String(val).replace(/"/g, '""');
        return `"${stringVal}"`;
      }).join(',');
    });
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${tableName.replace(/\s+/g, '_')}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- VIEW HANDLERS ---
  const toggleColumnVisibility = (column: string) => {
    setVisibleColumns((prev) =>
      prev.includes(column) ? prev.filter((c) => c !== column) : [...prev, column]
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
    <div className="space-y-6 w-full mt-6 animate-in fade-in duration-500">
      
      {/* 1. HEADER CONTROLS */}
      {/* THEME: bg-card, border-border */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-4 rounded-lg border border-border shadow-sm">
        
        <div className="flex items-center gap-2 w-full md:w-auto">
           <Input
            type="text"
            placeholder="Search visible data..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            // THEME: bg-background, text-foreground, border-input
            className="w-full md:w-80 bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-primary"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="flex-1 md:flex-none border-input bg-background hover:bg-accent hover:text-accent-foreground">
                <Settings className="mr-2 h-4 w-4" />
                Columns
              </Button>
            </SheetTrigger>
            {/* THEME: SheetContent inherits global theme, so standard background is applied automatically */}
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Column Visibility</SheetTitle>
                <SheetDescription>Select columns to display in the table.</SheetDescription>
              </SheetHeader>
              <div className="mt-6 grid grid-cols-1 gap-3 max-h-[80vh] overflow-y-auto pr-2">
                {columns.map((column) => (
                  <div key={column} className="flex items-center space-x-3 p-2 hover:bg-muted rounded border border-transparent hover:border-border transition-colors">
                    <Checkbox
                      checked={visibleColumns.includes(column)}
                      onCheckedChange={() => toggleColumnVisibility(column)}
                      id={`col-${column}`}
                    />
                    <label htmlFor={`col-${column}`} className="text-sm cursor-pointer w-full font-medium text-foreground">
                      {COLUMN_LABELS[column] || column.replace(/_/g, ' ')}
                    </label>
                  </div>
                ))}
              </div>
            </SheetContent>
          </Sheet>

          <Button onClick={downloadData} variant="outline" className="flex-1 md:flex-none border-input bg-background hover:bg-accent hover:text-accent-foreground">
            <DownloadIcon className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      {/* 2. MAIN TABLE */}
      {/* THEME: bg-card, border-border, shadow-sm */}
      <div className="border border-border rounded-md bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto w-full">
          <Table className="min-w-full">
            {/* THEME: bg-muted/50 for headers */}
            <TableHeader className="bg-muted/50">
              <TableRow className="border-border hover:bg-transparent">
                {visibleColumns.map((column) => (
                  <TableHead key={column} className="text-muted-foreground font-semibold whitespace-nowrap px-4 h-12">
                    <button 
                      onClick={() => handleSort(column)}
                      className="flex items-center gap-2 hover:text-foreground transition-colors"
                    >
                      {COLUMN_LABELS[column] || column.replace(/_/g, ' ')}
                      {sortColumn === column ? (
                        sortOrder === 'asc' ? <ArrowUp className="h-3 w-3 text-primary" /> : <ArrowDown className="h-3 w-3 text-primary" />
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
                <TableRow className="border-border hover:bg-transparent">
                  <TableCell colSpan={visibleColumns.length} className="text-center py-24 text-muted-foreground">
                    No records found for the selected date range.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((row, i) => {
                  const isDeclined = row.response_text && row.response_text !== 'Approved';
                  return (
                    <TableRow 
                      key={i} 
                      // THEME: hover:bg-muted/50 for interactions
                      // ERROR STATE: Use destructive/10 background
                      className={`border-border transition-colors ${
                        isDeclined 
                          ? 'bg-destructive/5 hover:bg-destructive/10' 
                          : 'hover:bg-muted/50'
                      }`}
                    >
                      {visibleColumns.map((col) => (
                        <TableCell key={`${i}-${col}`} className="py-3 px-4 text-foreground whitespace-nowrap text-sm">
                          {col === 'amount' ? (
                            <span className={`font-mono font-medium ${
                              isDeclined ? 'text-muted-foreground line-through' : 'text-green-600 dark:text-green-400'
                            }`}>
                              ${parseAmount(row[col]).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                          ) : col === 'response_text' ? (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border ${
                              row[col] === 'Approved' 
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

            {/* 3. FOOTER TOTALS */}
            {filteredData.length > 0 && (
              <TableFooter className="bg-muted/50 border-t border-border">
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={Math.max(1, visibleColumns.length - 1)} className="text-right pr-4 py-4">
                    <div className="flex flex-col items-end">
                      <span className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Page Total</span>
                      <span className="text-muted-foreground text-[10px]">(Approved Only)</span>
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

      {/* 4. PAGINATION */}
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