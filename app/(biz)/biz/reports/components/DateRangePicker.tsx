'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';

// Add 'className' for styling flexibility
// Add 'date' prop to sync with parent state
interface DateRangePickerProps {
  date?: { from: Date; to: Date }; 
  onSelect: (range: { from: Date; to: Date }) => void;
  className?: string;
}

export function DateRangePicker({ date, onSelect, className }: DateRangePickerProps) {
  // We use internal state to handle the selection process (clicking 'Start' then 'End')
  // We initialize it with the parent's 'date' so the button is never empty on load.
  const [internalDate, setInternalDate] = useState<DateRange | undefined>(date);

  // Sync with parent if the report resets (e.g. switching views)
  useEffect(() => {
    if (date) {
      setInternalDate(date);
    }
  }, [date]);

  const handleSelect = (selectedRange: DateRange | undefined) => {
    setInternalDate(selectedRange);
    
    // Only update the parent (and trigger a fetch) if we have a COMPLETE range.
    if (selectedRange?.from && selectedRange?.to) {
      onSelect({ from: selectedRange.from, to: selectedRange.to });
    }
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={'outline'}
            className={cn(
              'w-[300px] justify-start text-left font-normal bg-background border-input hover:bg-accent',
              !internalDate && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
            {internalDate?.from ? (
              internalDate.to ? (
                <span className="text-foreground">
                  {format(internalDate.from, 'LLL dd, y')} -{' '}
                  {format(internalDate.to, 'LLL dd, y')}
                </span>
              ) : (
                <span className="text-foreground">
                  {format(internalDate.from, 'LLL dd, y')}
                </span>
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={internalDate?.from}
            selected={internalDate}
            onSelect={handleSelect}
            numberOfMonths={2}
            className="p-3 pointer-events-auto" 
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default DateRangePicker;