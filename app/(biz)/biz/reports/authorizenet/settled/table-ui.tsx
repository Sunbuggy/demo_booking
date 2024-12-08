'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SettledCombinedData } from './page';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Loader2 } from 'lucide-react';
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
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { useMemo } from 'react';
import { Input } from '@/components/ui/input';
import dayjs from 'dayjs';
import Link from 'next/link';

interface TableUIProps {
  data: SettledCombinedData[];
}

export default function TableUI({ data }: TableUIProps) {
  const router = useRouter();
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [singleDate, setSingleDate] = useState<Date | undefined>(undefined);
  const [filter, setFilter] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const filteredData = useMemo(() => {
    return data.filter((item) =>
      Object.values(item).some((value) =>
        String(value).toLowerCase().includes(filter.toLowerCase())
      )
    );
  }, [data, filter]);

  const total = useMemo(() => {
    return filteredData.reduce(
      (sum, item) => sum + (item.settleAmount || 0),
      0
    );
  }, [filteredData]);

  const handleDateRangeChange = async (range: DateRange | undefined) => {
    setIsLoading(true);
    setDateRange(range);
    if (range?.from && range?.to) {
      const fromStr = dayjs(range.from).format('YYYY-MM-DD');
      const toStr = dayjs(range.to).format('YYYY-MM-DD');
      await router.push(`?first_date=${fromStr}&last_date=${toStr}`);
    }
    setIsLoading(false);
  };
  const handleSingleDateChange = (date: Date | undefined) => {
    setSingleDate(date);
    if (date) {
      const dateStr = format(date, 'yyyy-MM-dd');
      router.push(`?first_date=${dateStr}&last_date=${dateStr}`);
    }
  };

  const formatDate = (date: Date) => format(date, 'LLL dd, y');

  return (
    <div className="space-y-4">
      {isLoading && (
        <div className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded-lg shadow-lg flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading...</span>
          </div>
        </div>
      )}
      <div className="flex space-x-4">
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

      <div>
        <div className="my-4">
          <Input
            type="text"
            placeholder="Filter..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="max-w-sm"
          />
          <p className="text-green-600 text-2xl font-bold mt-2 text-end">
            Total: $
            {total.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Reservation Time</TableHead>
              <TableHead>Reservation Date</TableHead>
              <TableHead>Card</TableHead>
              <TableHead>Amount</TableHead>
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
                  <TableCell>
                    <Link
                      href={`https://sunbuggy.biz/edt_res.php?id=${item.invoiceNumber}`}
                      target="_blank"
                      className="text-rose-400 underline"
                    >
                      {item.invoiceNumber}
                    </Link>
                  </TableCell>
                  <TableCell>{`${item.firstName || ''} ${item.lastName || ''}`}</TableCell>
                  <TableCell>{item.Location || '-'}</TableCell>
                  <TableCell>{item.Res_Time || '-'}</TableCell>
                  <TableCell>
                    {item.Res_Date
                      ? dayjs(item.Res_Date).format('YYYY-MM-DD')
                      : '-'}
                  </TableCell>
                  <TableCell>{item.accountType || '-'}</TableCell>
                  <TableCell>${item.settleAmount?.toFixed(2) || '-'}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
