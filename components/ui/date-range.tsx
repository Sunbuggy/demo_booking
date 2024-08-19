'use client';

import * as React from 'react';
import { addDays, format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { DateRange } from 'react-day-picker';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { cn } from '@/utils/cn';
interface DatePickerWithRangeProps
  extends React.HTMLAttributes<HTMLDivElement> {
  setHistoryDateRange: React.Dispatch<
    React.SetStateAction<DateRange | undefined>
  >;
  historyDateRange: DateRange | undefined;
}
export function DatePickerWithRange({
  className,
  setHistoryDateRange,
  historyDateRange
}: DatePickerWithRangeProps) {
  return (
    <div className={cn('grid gap-2', className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={'outline'}
            className={cn(
              'w-[300px] justify-start text-left font-normal',
              !historyDateRange && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {historyDateRange?.from ? (
              historyDateRange.to ? (
                <>
                  {format(historyDateRange.from, 'LLL dd, y')} -{' '}
                  {format(historyDateRange.to, 'LLL dd, y')}
                </>
              ) : (
                format(historyDateRange.from, 'LLL dd, y')
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={historyDateRange?.from}
            selected={historyDateRange}
            onSelect={setHistoryDateRange}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
