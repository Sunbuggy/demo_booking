import { Button } from '@/components/ui/button';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { cn } from '@/utils/cn';
import { CalendarIcon } from 'lucide-react';
import React, { Dispatch, SetStateAction } from 'react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';

const DatePicker = ({
  form,
  title,
  isCalendarOpen,
  setIsCalendarOpen,
  buttonTitle = 'Select a date'
}: {
  form: any;
  title: string;
  isCalendarOpen: boolean;
  setIsCalendarOpen: Dispatch<SetStateAction<boolean>>;
  buttonTitle?: string;
}) => {
  return (
    <>
      <FormField
        control={form.control}
        name="bookingDate"
        render={({ field }) => (
          <FormItem className="flex gap-2 items-baseline">
            <FormLabel className="sr-only">{title}</FormLabel>
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant={'outline'}
                    className={cn(
                      'w-screen md:w-[350px] pl-3 text-left font-normal',
                      !field.value && 'text-muted-foreground'
                    )}
                  >
                    {field.value ? (
                      format(field.value, 'PPP')
                    ) : (
                      <span>{buttonTitle}</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  showOutsideDays={false}
                  selected={field.value}
                  onSelect={(date) => {
                    field.onChange(date);
                    setIsCalendarOpen(false);
                  }}
                  disabled={(date) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0); // Set today's date time to start of the day
                    return date < today || date < new Date('1900-01-01');
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
};

export default DatePicker;
