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
import { DownloadIcon, FilterIcon, PlusCircle, X } from 'lucide-react';
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

  const columns = useMemo(() => {
    if (data.length === 0) return [];
    return Object.keys(data[0]).filter((col) => col !== 'id');
  }, [data]);

  const columnTypes: Record<string, ColumnType> = useMemo(() => {
    if (data.length === 0) return {};
    const types: Record<string, ColumnType> = {};
    columns.forEach((col) => {
      const value = data[0][col];
      if (typeof value === 'string') {
        types[col] = 'string';
      } else if (typeof value === 'number') {
        types[col] = 'number';
      } else if (typeof value === 'boolean') {
        types[col] = 'boolean';
      } else if (value instanceof Date) {
        types[col] = 'date';
      } else {
        types[col] = 'string'; // Default to string for unknown types
      }
    });
    return types;
  }, [data, columns]);

  const uniqueValues = useMemo(() => {
    const values: Record<string, Set<any>> = {};
    columns.forEach((col) => {
      values[col] = new Set(data.map((item) => item[col]));
    });
    return values;
  }, [data, columns]);

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const itemDate = new Date(item.created_at);
      const isInDateRange =
        itemDate >= dateRange.from && itemDate <= dateRange.to;

      const matchesSearch = Object.values(item).some(
        (value) =>
          value &&
          value?.toString()?.toLowerCase().includes(searchTerm?.toLowerCase())
      );

      const matchesColumnFilters = columnFilters.every((filter) => {
        const itemValue = item[filter.column];
        switch (filter.type) {
          case 'string':
            return itemValue
              ?.toLowerCase()
              .includes(filter.value?.toString()?.toLowerCase() ?? '');
          case 'number':
            return itemValue === Number(filter.value);
          case 'boolean':
            return itemValue === filter.value;
          case 'date':
            const filterDate = new Date(filter.value as string | number | Date);
            const itemDate = new Date(itemValue);
            return itemDate.toDateString() === filterDate.toDateString();
          default:
            return true;
        }
      });

      return isInDateRange && matchesSearch && matchesColumnFilters;
    });
  }, [data, dateRange, searchTerm, columnFilters]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return (
      date.toLocaleDateString() +
      ' ' +
      date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    );
  };

  const downloadData = (format: 'csv' | 'json' | 'xlsx') => {
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
      case 'xlsx':
        alert(
          'XLSX download is not implemented in this example. You would need to use a library like xlsx.js to generate the file.'
        );
        return;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tableName}_${format}.${fileExtension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const convertToCSV = (data: any[]) => {
    const header = columns.join(',');
    const rows = data.map((row) =>
      columns.map((col) => JSON.stringify(row[col] ?? '')).join(',')
    );
    return [header, ...rows].join('\n');
  };

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
              <SelectItem key={value} value={value?.toString()}>
                {value?.toString()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    switch (filter.type) {
      case 'string':
        return (
          <Input
            type="text"
            value={(filter.value as string) || ''}
            onChange={(e) => updateFilter(filter.id, e.target.value)}
            placeholder={`Filter ${filter.column}...`}
          />
        );
      case 'number':
        return (
          <Input
            type="number"
            value={(filter.value as number) || ''}
            onChange={(e) => updateFilter(filter.id, Number(e.target.value))}
            placeholder={`Filter ${filter.column}...`}
          />
        );
      case 'boolean':
        return (
          <Checkbox
            checked={(filter.value as boolean) || false}
            onCheckedChange={(checked) => updateFilter(filter.id, checked)}
          />
        );
      case 'date':
        return (
          <DatePicker
            date={(filter.value as Date) || null}
            setDate={(date) => updateFilter(filter.id, date)}
          />
        );
      default:
        return null;
    }
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
    setColumnFilters(columnFilters.filter((filter) => filter.id !== id));
  };

  const updateFilter = (id: string, value: any) => {
    setColumnFilters(
      columnFilters.map((filter) =>
        filter.id === id ? { ...filter, value } : filter
      )
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-4">
        <Input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
        />
        <div className="flex flex-wrap gap-4">
          {columnFilters.map((filter) => (
            <div
              key={filter.id}
              className="flex flex-col space-y-2 w-full sm:w-auto"
            >
              <Select
                value={filter.column}
                onValueChange={(value) =>
                  setColumnFilters(
                    columnFilters.map((f) =>
                      f.id === filter.id
                        ? {
                            ...f,
                            column: value,
                            type: columnTypes[value],
                            value: null
                          }
                        : f
                    )
                  )
                }
              >
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {columns.map((column) => (
                    <SelectItem key={column} value={column}>
                      {column.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center space-x-2">
                {renderFilterInput(filter)}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFilter(filter.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-4">
          <Button onClick={addFilter} variant="outline">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Filter
          </Button>
          <Button onClick={() => downloadData('csv')} variant="outline">
            <DownloadIcon className="mr-2 h-4 w-4" />
            CSV
          </Button>
          <Button onClick={() => downloadData('json')} variant="outline">
            <DownloadIcon className="mr-2 h-4 w-4" />
            JSON
          </Button>
          <Button onClick={() => downloadData('xlsx')} variant="outline">
            <DownloadIcon className="mr-2 h-4 w-4" />
            XLSX
          </Button>
        </div>
      </div>
      <div className="border rounded-md overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column}>
                  <div className="flex items-center space-x-2">
                    <span>{column.replace(/_/g, ' ')}</span>
                    {uniqueValues[column].size < 20 && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <FilterIcon className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48">
                          <div className="space-y-2">
                            {Array.from(uniqueValues[column]).map((value) => (
                              <div
                                key={value}
                                className="flex items-center space-x-2"
                              >
                                <Checkbox
                                  id={`${column}-${value}`}
                                  checked={columnFilters.some(
                                    (filter) =>
                                      filter.column === column &&
                                      filter.value === value
                                  )}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      const newFilter: ColumnFilter = {
                                        id: Date.now().toString(),
                                        column,
                                        type: columnTypes[column],
                                        value
                                      };
                                      setColumnFilters([
                                        ...columnFilters,
                                        newFilter
                                      ]);
                                    } else {
                                      setColumnFilters(
                                        columnFilters.filter(
                                          (filter) =>
                                            !(
                                              filter.column === column &&
                                              filter.value === value
                                            )
                                        )
                                      );
                                    }
                                  }}
                                />
                                <label htmlFor={`${column}-${value}`}>
                                  {value}
                                </label>
                              </div>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((row, index) => (
              <TableRow key={index}>
                {columns.map((column) => (
                  <TableCell key={column}>
                    {column === 'created_at' || column === 'updated_at'
                      ? formatDate(row[column])
                      : row[column] === null || row[column] === ''
                        ? '-'
                        : String(row[column])}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default DataVisualization;
