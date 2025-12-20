'use client';

import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DownloadIcon,
  FilterIcon,
  PlusCircle,
  X,
  Settings,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import TableDescription from './TableDescription';
import Pagination from './Pagination';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet';

interface DataVisualizationProps {
  data: any[];
  dateRange: { from: Date; to: Date };
  tableName: string;
}

type ColumnType = 'string' | 'number' | 'boolean' | 'date';

interface ColumnFilter {
  id: string;
  column: string;
  type: ColumnType;
  value: string | number | boolean | Date | null;
}

const DataVisualization: React.FC<DataVisualizationProps> = ({
  data,
  dateRange,
  tableName
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [columnFilters, setColumnFilters] = useState<ColumnFilter[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Extract column names from first row (exclude internal 'id' if present)
  const columns = useMemo(() => {
    if (data.length === 0) return [];
    return Object.keys(data[0]).filter((col) => col !== 'id');
  }, [data]);

  // Show first 15 columns by default
  useMemo(() => {
    setVisibleColumns(columns.slice(0, 15));
  }, [columns]);

  // Determine column types for filtering
  const columnTypes: Record<string, ColumnType> = useMemo(() => {
    if (data.length === 0) return {};
    const types: Record<string, ColumnType> = {};
    columns.forEach((col) => {
      const value = data[0][col];
      if (col === 'amount') {
        types[col] = 'number';
      } else if (col.includes('date') || col === 'date_local') {
        types[col] = 'string'; // formatted string
      } else if (typeof value === 'string') {
        types[col] = 'string';
      } else if (typeof value === 'number') {
        types[col] = 'number';
      } else if (typeof value === 'boolean') {
        types[col] = 'boolean';
      } else {
        types[col] = 'string';
      }
    });
    return types;
  }, [data, columns]);

  // Unique values per column for dropdown filters
  const uniqueValues = useMemo(() => {
    const values: Record<string, Set<any>> = {};
    columns.forEach((col) => {
      values[col] = new Set(data.map((item) => item[col]));
    });
    return values;
  }, [data, columns]);

  // Apply search, column filters, and sorting
  const filteredData = useMemo(() => {
    let filtered = data.filter((item) => {
      // Global search
      const matchesSearch = Object.values(item).some((value) =>
        value?.toString()?.toLowerCase().includes(searchTerm?.toLowerCase() ?? '')
      );

      // Column filters
      const matchesColumnFilters = columnFilters.every((filter) => {
        const itemValue = item[filter.column];
        switch (filter.type) {
          case 'string':
            return itemValue
              ?.toString()
              .toLowerCase()
              .includes(filter.value?.toString()?.toLowerCase() ?? '');
          case 'number':
            return itemValue === Number(filter.value);
          case 'boolean':
            return itemValue === filter.value;
          default:
            return true;
        }
      });

      return matchesSearch && matchesColumnFilters;
    });

    // Sorting
    if (sortColumn) {
      filtered = filtered.sort((a, b) => {
        const aValue = a[sortColumn];
        const bValue = b[sortColumn];

        // Special sorting for date_local (formatted string)
        if (sortColumn === 'date_local') {
          const aDate = new Date(aValue.replace(' PM', 'PM').replace(' AM', 'AM'));
          const bDate = new Date(bValue.replace(' PM', 'PM').replace(' AM', 'AM'));
          return sortOrder === 'asc'
            ? aDate.getTime() - bDate.getTime()
            : bDate.getTime() - aDate.getTime();
        }

        if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [data, searchTerm, columnFilters, sortColumn, sortOrder]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredData.slice(startIndex, startIndex + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredData.length / pageSize);

  // CSV/JSON download
  const downloadData = (format: 'csv' | 'json') => {
    let content: string;
    let mimeType: string;
    let fileExtension: string;

    switch (format) {
      case 'csv':
        content = convertToCSV(filteredData);
        mimeType = 'text/csv';
        fileExtension = 'csv';
        break;
      case 'json':
        content = JSON.stringify(filteredData, null, 2);
        mimeType = 'application/json';
        fileExtension = 'json';
        break;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tableName.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().slice(0, 10)}.${fileExtension}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const convertToCSV = (data: any[]) => {
    const header = visibleColumns.join(',');
    const rows = data.map((row) =>
      visibleColumns.map((col) => JSON.stringify(row[col] ?? '')).join(',')
    );
    return [header, ...rows].join('\n');
  };

  // Filter UI helpers
  const renderFilterInput = (filter: ColumnFilter) => {
    const uniqueColumnValues = Array.from(uniqueValues[filter.column]);

    if (uniqueColumnValues.length < 20) {
      return (
        <Select
          value={filter.value?.toString() ?? ''}
          onValueChange={(value) => updateFilter(filter.id, value)}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder={`Filter ${filter.column}...`} />
          </SelectTrigger>
          <SelectContent>
            {uniqueColumnValues.map((value) => (
              <SelectItem key={value?.toString()} value={value?.toString()}>
                {value?.toString()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    return (
      <Input
        type="text"
        value={(filter.value as string) || ''}
        onChange={(e) => updateFilter(filter.id, e.target.value)}
        placeholder={`Filter ${filter.column}...`}
      />
    );
  };

  const addFilter = () => {
    const newFilter: ColumnFilter = {
      id: Date.now().toString(),
      column: columns[0],
      type: columnTypes[columns[0]],
      value: null
    };
    setColumnFilters([...columnFilters, newFilter]);
  };

  const removeFilter = (id: string) => {
    setColumnFilters(columnFilters.filter((f) => f.id !== id));
  };

  const updateFilter = (id: string, value: any) => {
    setColumnFilters(
      columnFilters.map((f) =>
        f.id === id ? { ...f, value } : f
      )
    );
  };

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
    <div className="space-y-8 md:w-full max-w-7xl mx-auto">
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1">
          <AccordionTrigger>View Table Description</AccordionTrigger>
          <AccordionContent>
            <TableDescription data={data} columns={columns} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="flex flex-col space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <Input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-64"
          />
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline">
                <Settings className="mr-2 h-4 w-4" />
                Column Settings
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Column Settings</SheetTitle>
                <SheetDescription>Select visible columns</SheetDescription>
              </SheetHeader>
              <div className="mt-4 space-y-2 max-h-96 overflow-y-auto">
                {columns.map((column) => (
                  <div key={column} className="flex items-center space-x-2">
                    <Checkbox
                      checked={visibleColumns.includes(column)}
                      onCheckedChange={() => toggleColumnVisibility(column)}
                    />
                    <label>{column.replace(/_/g, ' ')}</label>
                  </div>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="flex flex-wrap gap-4">
          {columnFilters.map((filter) => (
            <div key={filter.id} className="flex items-center space-x-2">
              <Select
                value={filter.column}
                onValueChange={(value) =>
                  setColumnFilters(
                    columnFilters.map((f) =>
                      f.id === filter.id
                        ? { ...f, column: value, type: columnTypes[value], value: null }
                        : f
                    )
                  )
                }
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {columns.map((col) => (
                    <SelectItem key={col} value={col}>
                      {col.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {renderFilterInput(filter)}
              <Button variant="ghost" size="icon" onClick={() => removeFilter(filter.id)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button onClick={addFilter} variant="outline">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Filter
          </Button>
        </div>

        <div className="flex gap-4">
          <Button onClick={() => downloadData('csv')} variant="outline">
            <DownloadIcon className="mr-2 h-4 w-4" /> CSV
          </Button>
          <Button onClick={() => downloadData('json')} variant="outline">
            <DownloadIcon className="mr-2 h-4 w-4" /> JSON
          </Button>
        </div>
      </div>

      <div className="border rounded-md overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {visibleColumns.map((column) => (
                <TableHead key={column}>
                  <div className="flex items-center space-x-2">
                    <span>{column.replace(/_/g, ' ')}</span>
                    <Button variant="ghost" size="sm" onClick={() => handleSort(column)}>
                      {sortColumn === column ? (
                        sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />
                      ) : (
                        <ArrowDown className="h-4 w-4 opacity-30" />
                      )}
                    </Button>
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={visibleColumns.length} className="text-center py-8 text-gray-500">
                  No transactions found for the selected date range.
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row, i) => (
                <TableRow key={i} className="hover:bg-gray-800/50">
                  {visibleColumns.map((col) => (
                    <TableCell key={col}>
                      {col === 'amount' ? (
                        <span className="font-bold text-green-400">
                          ${parseFloat(row[col] || '0').toFixed(2)}
                        </span>
                      ) : col === 'condition' ? (
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            row[col] === 'complete'
                              ? 'bg-green-900/50 text-green-300'
                              : 'bg-red-900/50 text-red-300'
                          }`}
                        >
                          {row[col] || 'unknown'}
                        </span>
                      ) : col === 'location' ? (
                        <span className="px-3 py-1 bg-gray-700 rounded-full text-sm">
                          {row[col] || '—'}
                        </span>
                      ) : col === 'customer_name' ? (
                        row[col] || <span className="text-gray-500 italic">Not provided</span>
                      ) : col === 'date_local' ? (
                        row[col] || <span className="text-gray-500 italic">Not available</span>
                      ) : (
                        row[col] || '—'
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>

          {/* Totals Row - Fixed nesting: placed inside TableBody as a TableRow */}
          {filteredData.length > 0 && (
            <tfoot>
              <TableRow className="bg-gray-900 font-bold border-t-4 border-gray-700">
                <TableCell
                  colSpan={visibleColumns.length - 1}
                  className="text-right text-gray-300 pr-8"
                >
                  Total ({filteredData.length} transactions):
                </TableCell>
                <TableCell className="text-green-400 text-right font-bold">
                  ${filteredData
                    .reduce((sum, row) => sum + (parseFloat(row.amount || '0') || 0), 0)
                    .toFixed(2)}
                </TableCell>
              </TableRow>
            </tfoot>
          )}
        </Table>
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