'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { SettledCombinedData } from './page';
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

interface TableUIProps {
  data: SettledCombinedData[];
  isSettled?: boolean;
}

interface ColumnDef {
  key: string;
  label: string;
  visible: boolean;
}

export default function TableUI({ data, isSettled }: TableUIProps) {
  const router = useRouter();
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [singleDate, setSingleDate] = useState<Date | undefined>(undefined);
  const [filter, setFilter] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [columns, setColumns] = useState<ColumnDef[]>([
    { key: 'invoiceNumber', label: 'Invoice #', visible: true },
    { key: 'customer', label: 'Customer', visible: false },
    { key: 'Book_Name', label: 'Booked By', visible: true },
    { key: 'amount', label: 'Amount', visible: true },
    { key: 'Location', label: 'Location', visible: true },
    { key: 'Res_Time', label: 'Reservation Time', visible: false },
    { key: 'Res_Date', label: 'Reservation Date', visible: false },
    { key: 'accountType', label: 'Card Type', visible: true }
  ]);

  const filteredData = useMemo(() => {
    return data.filter((item) =>
      Object.values(item).some((value) =>
        String(value).toLowerCase().includes(filter.toLowerCase())
      )
    );
  }, [data, filter]);

  const totalAmount = useMemo(() => {
    return filteredData
      .reduce(
        (a, b) =>
          b.transactionStatus ===
          (isSettled ? 'settledSuccessfully' : 'capturedPendingSettlement')
            ? a + b.settleAmount
            : b.transactionStatus === 'refundPendingSettlement' ||
                b.transactionStatus === 'refundSettledSuccessfully'
              ? a - b.settleAmount
              : a,
        0
      )
      .toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD'
      });
  }, [filteredData, isSettled]);

  const handleDateRangeChange = async (range: DateRange | undefined) => {
    setIsLoading(true);
    setDateRange(range);
    setSingleDate(undefined);
    if (range?.from && range?.to) {
      const fromStr = dayjs(range.from).format('YYYY-MM-DD');
      const toStr = dayjs(range.to).format('YYYY-MM-DD');
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
      <Link href={'/biz/reports'}>
        <Button variant={'outline'}>
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

      {dateRange && dateRange.from && dateRange.to && (
        <div className="text-center text-2xl font-bold my-4">
          {singleDate ? (
            <span>{format(singleDate, 'LLL dd, y')}</span>
          ) : (
            <span>
              {format(dateRange.from, 'LLL dd, y')} -{' '}
              {format(dateRange.to, 'LLL dd, y')}
            </span>
          )}
        </div>
      )}

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

      <div className="w-full overflow-x-auto max-w-sm md:max-w-max mx-auto">
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
              {filteredData
                .sort((a, b) => {
                  if (a.submitTimeLocal && b.submitTimeLocal) {
                    return a.submitTimeLocal > b.submitTimeLocal ? -1 : 1;
                  }
                  return 0;
                })
                .map((item, index) => (
                  <TableRow key={index}>
                    {columns
                      .filter((col) => col.visible)
                      .map((column) => (
                        <TableCell key={column.key}>
                          {column.key === 'invoiceNumber' && (
                            <Link
                              href={`https://sunbuggy.biz/edt_res.php?id=${item.invoiceNumber}`}
                              target="_blank"
                              className="text-rose-400 underline"
                            >
                              {item.invoiceNumber}
                            </Link>
                          )}
                          {column.key === 'customer' &&
                            `${item.firstName || ''} ${item.lastName || ''}`}
                          {column.key === 'Book_Name' && item.Book_Name}
                          {column.key === 'amount' && (
                            <span
                              className={`${
                                item.transactionStatus ===
                                  'refundPendingSettlement' ||
                                item.transactionStatus ===
                                  'refundSettledSuccessfully'
                                  ? 'text-red-600'
                                  : item.transactionStatus ===
                                        'capturedPendingSettlement' ||
                                      item.transactionStatus ===
                                        'settledSuccessfully'
                                    ? 'text-green-600'
                                    : item.transactionStatus === 'declined'
                                      ? 'text-stone-400 line-through'
                                      : ''
                              }`}
                            >
                              ${item.settleAmount?.toFixed(2) || '-'}
                            </span>
                          )}
                          {column.key === 'Location' && (item.Location || '-')}
                          {column.key === 'Res_Time' && (item.Res_Time || '-')}
                          {column.key === 'Res_Date' &&
                            (item.Res_Date
                              ? dayjs(item.Res_Date).format('YYYY-MM-DD')
                              : '-')}
                          {column.key === 'accountType' && (item.accountType || '-')}
                        </TableCell>
                      ))}
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}