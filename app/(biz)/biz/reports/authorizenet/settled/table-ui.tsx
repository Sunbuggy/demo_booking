'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
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
import { CalendarIcon } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import dayjs from 'dayjs';
import { SettledCombinedData } from './page';

interface TableUIProps {
  data: SettledCombinedData[];
}

export default function TableUI({ data }: TableUIProps) {
  const router = useRouter();
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [singleDate, setSingleDate] = useState<Date | undefined>(undefined);

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    if (range?.from && range?.to) {
      const fromStr = dayjs(range.from).format('YYYY-MM-DD');
      const toStr = dayjs(range.to).format('YYYY-MM-DD');
      router.push(`?first_date=${fromStr}&last_date=${toStr}`);
    }
  };
  const formatDate = (date: Date) => {
    try {
      return dayjs(date).isValid()
        ? dayjs(date).format('YYYY-MM-DD HH:mm:ss')
        : '-';
    } catch {
      return '-';
    }
  };
  const handleSingleDateChange = (date: Date | undefined) => {
    setSingleDate(date);
    if (date) {
      const dateStr = dayjs(date).format('YYYY-MM-DD');
      router.push(`?first_date=${dateStr}&last_date=${dateStr}`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex space-x-4">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from && dateRange?.to ? (
                <>
                  {dayjs(dateRange.from).format('MMM DD, YYYY')} -{' '}
                  {dayjs(dateRange.to).format('MMM DD, YYYY')}
                </>
              ) : dateRange?.from ? (
                dayjs(dateRange.from).format('MMM DD, YYYY')
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
                ? dayjs(singleDate).format('MMM DD, YYYY')
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

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Trans ID</TableHead>
            <TableHead>Submit Time (UTC)</TableHead>
            <TableHead>Submit Time (Local)</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Invoice #</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Payment Method</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Market Type</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Reservation ID</TableHead>
            <TableHead>Book Name</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Reservation Date</TableHead>
            <TableHead>Reservation Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item, index) => (
            <TableRow key={index}>
              <TableCell>{item.transId}</TableCell>
              <TableCell>
                {item.submitTimeUTC
                  ? formatDate(new Date(item.submitTimeUTC))
                  : '-'}
              </TableCell>
              <TableCell>
                {item.submitTimeLocal
                  ? formatDate(new Date(item.submitTimeLocal))
                  : '-'}
              </TableCell>
              <TableCell>{item.transactionStatus}</TableCell>
              <TableCell>{item.invoiceNumber}</TableCell>
              <TableCell>{`${item.firstName || ''} ${item.lastName || ''}`}</TableCell>
              <TableCell>{`${item.accountType || ''}: ${item.accountNumber || ''}`}</TableCell>
              <TableCell>{item.settleAmount}</TableCell>
              <TableCell>{item.marketType}</TableCell>
              <TableCell>{item.product}</TableCell>
              <TableCell>{item.Res_ID || '-'}</TableCell>
              <TableCell>{item.Book_Name || '-'}</TableCell>
              <TableCell>{item.Location || '-'}</TableCell>
              <TableCell>
                {item.Res_Date ? formatDate(new Date(item.Res_Date)) : '-'}
              </TableCell>
              <TableCell>{item.Res_Time || '-'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
