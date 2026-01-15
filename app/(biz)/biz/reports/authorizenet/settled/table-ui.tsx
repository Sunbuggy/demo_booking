'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Loader2, Settings } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { Input } from '@/components/ui/input';
import dayjs from 'dayjs';
import Link from 'next/link';
import { BackwardFilled } from '@ant-design/icons';

// Accept any data array — TableUI dynamically reads columns
interface TableUIProps {
  data: any[];
  isSettled?: boolean;
}

interface ColumnDef {
  key: string;
  label: string;
  visible: boolean;
}

export default function TableUI({ data, isSettled = true }: TableUIProps) {
  const router = useRouter();
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [singleDate, setSingleDate] = useState<Date | undefined>(undefined);
  const [filter, setFilter] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [columns, setColumns] = useState<ColumnDef[]>([
    { key: 'batchId', label: 'Batch ID', visible: true },
    { key: 'settlementTimeUTC', label: 'Settlement Date', visible: true },
    { key: 'accountType', label: 'Card Type', visible: true },
    { key: 'chargeAmount', label: 'Total Amount', visible: true },
    { key: 'chargeCount', label: 'Transaction Count', visible: true },
  ]);

  const filteredData = useMemo(() => {
    return data.filter((item: any) => {
      const searchLower = filter.toLowerCase();
      return Object.values(item).some((value: any) =>
        String(value || '').toLowerCase().includes(searchLower)
      );
    });
  }, [data, filter]);

  const totalAmount = useMemo(() => {
    return filteredData
      .reduce((sum: number, item: any) => {
        const amount = parseFloat(
          item.statistics?.statistic?.[0]?.chargeAmount ||
          item.chargeAmount ||
          '0'
        );
        return sum + amount;
      }, 0)
      .toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  }, [filteredData]);

  const handleDateRangeChange = async (range: DateRange | undefined) => {
    setIsLoading(true);
    setDateRange(range);
    setSingleDate(undefined);
    if (range?.from && range?.to) {
      const fromStr = format(range.from, 'yyyy-MM-dd');
      const toStr = format(range.to, 'yyyy-MM-dd');
      router.push(`?first_date=${fromStr}&last_date=${toStr}`);
    }
    setIsLoading(false);
  };

  const handleSingleDateChange = (date: Date | undefined) => {
    setSingleDate(date);
    setDateRange(undefined);
    if (date) {
      const dateStr = format(date, 'yyyy-MM-dd');
      router.push(`?first_date=${dateStr}&last_date=${dateStr}`);
    }
  };

  const toggleColumnVisibility = (columnKey: string) => {
    setColumns(
      columns.map((col) =>
        col.key === columnKey ? { ...col, visible: !col.visible } : col
      )
    );
  };

  return (
    <div className="space-y-4">
      <Link href="/biz/reports">
        <Button variant="outline">
          <BackwardFilled /> Back To Reports Page
        </Button>
      </Link>

      {isLoading && (
        <div className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded-lg shadow-lg flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading...</span>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, 'LLL dd, y')} -{' '}
                      {format(dateRange.to, 'LLL dd, y')}
                    </>
                  ) : (
                    format(dateRange.from, 'LLL dd, y')
                  )
                ) : (
                  'Pick a date range'
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={handleDateRangeChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {singleDate
                  ? format(singleDate, 'LLL dd, y')
                  : 'Pick a single date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={singleDate}
                onSelect={handleSingleDateChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex flex-col items-end">
          <p className="text-green-600 text-2xl font-bold">
            Total: {totalAmount}
          </p>
          <Input
            type="text"
            placeholder="Filter..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="max-w-sm mt-2"
          />
        </div>
      </div>

      <div className="flex justify-end mb-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              <Settings className="mr-2 h-4 w-4" />
              Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {columns.map((column) => (
              <DropdownMenuCheckboxItem
                key={column.key}
                checked={column.visible}
                onCheckedChange={() => toggleColumnVisibility(column.key)}
              >
                {column.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="w-full overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns
                .filter((col) => col.visible)
                .map((column) => (
                  <TableHead key={column.key} className="whitespace-nowrap">
                    {column.label}
                  </TableHead>
                ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.filter((c) => c.visible).length}
                  className="text-center py-8 text-gray-500"
                >
                  No batches found for the selected date range.
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((batch: any, index) => (
                <TableRow key={index}>
                  {columns
                    .filter((col) => col.visible)
                    .map((column) => (
                      <TableCell key={column.key}>
                        {column.key === 'batchId' && batch.batchId}
                        {column.key === 'settlementTimeUTC' &&
                          new Date(batch.settlementTimeUTC).toLocaleDateString()}
                        {column.key === 'accountType' && (batch.accountType || '—')}
                        {column.key === 'chargeAmount' && (
                          <span className="text-green-600 font-medium">
                            $
                            {parseFloat(
                              batch.statistics?.statistic?.[0]?.chargeAmount || '0'
                            ).toFixed(2)}
                          </span>
                        )}
                        {column.key === 'chargeCount' &&
                          batch.statistics?.statistic?.[0]?.chargeCount}
                      </TableCell>
                    ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}