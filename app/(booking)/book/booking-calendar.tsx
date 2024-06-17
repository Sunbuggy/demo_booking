'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { CalendarIcon, CheckIcon, ChevronsUpDown } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem
} from '@/components/ui/command';
import {
  Form,
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { timeArray } from '@/utils/helpers';
import { Dispatch, SetStateAction, useState } from 'react';
import { Input } from '@/components/ui/input';
import { HotelType } from './page';

const FormSchema = z.object({
  bookingDate: z.date({
    required_error: 'A date of birth is required.'
  }),
  howManyPeople: z.coerce.number({
    required_error: 'Group size is required.'
  }),
  time: z.string({
    required_error: 'Time is required.'
  })
});

export function CalendarForm({
  setUnblur,
  hotels
}: {
  setUnblur: Dispatch<SetStateAction<boolean>>;
  hotels: HotelType[];
}) {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema)
  });
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [hideForm, setHideForm] = useState(false);
  const disabledTime = [0, 1, 2, 3, 4, 5, 6, 7, 16, 17, 18, 19, 20, 21, 22, 23];
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(0);
  const [bookInfo, setBookInfo] = useState({
    bookingDate: new Date(),
    howManyPeople: 0,
    time: ''
  });
  function onSubmit(data: z.infer<typeof FormSchema>) {
    setBookInfo(data);
    setUnblur(true);
    setHideForm(true);
    //   toast({
    //     title: 'You submitted the following values:',
    //     description: (
    //       <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
    //         <code className="text-white">{JSON.stringify(data, null, 2)}</code>
    //       </pre>
    //     )
    //   });
  }

  return (
    <div>
      <Form {...form}>
        <form
          className={` gap-2 mb-7  items-baseline ${hideForm ? 'hidden' : 'flex flex-col'}`}
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FormField
            control={form.control}
            name="bookingDate"
            render={({ field }) => (
              <FormItem className="flex gap-2 items-baseline">
                <FormLabel className="sr-only">Pick a booking date</FormLabel>
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={'outline'}
                        className={cn(
                          'w-[240px] pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value ? (
                          format(field.value, 'PPP')
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
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
          <FormField
            control={form.control}
            name="howManyPeople"
            render={({ field }) => (
              <FormItem className="flex gap-2 items-baseline">
                <FormLabel>Group Size</FormLabel>
                <FormControl>
                  <Input
                    className={cn(
                      'w-[60px] pl-3 text-left font-normal',
                      !field.value && 'text-muted-foreground'
                    )}
                    type="number"
                    {...field}
                    value={field.value || 0}
                    placeholder="#Group Size"
                    min={0}
                    max={2000}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="time"
            render={({ field }) => (
              <FormItem className="flex gap-2 items-baseline">
                <FormLabel className="sr-only">Pick a time</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="w-[240px]">
                    <SelectValue placeholder="pick a time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Hour</SelectLabel>
                      {timeArray.map((time, index) => (
                        <SelectItem
                          {...field}
                          value={time} // Use time as value
                          key={`${time}-${index}`} // Ensure key is unique by combining time and index
                          disabled={disabledTime.includes(index)}
                        >
                          {time}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-[200px] justify-between"
              >
                {value
                  ? hotels?.find((hotel) => hotel?.Hotel_ID === value)
                      ?.Hotel_Name
                  : 'Select hotel...'}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
              <Command>
                <CommandInput placeholder="Search hotels..." />
                <CommandEmpty>No hotel found.</CommandEmpty>
                <CommandGroup>
                  {(hotels || []).map((hotel) => (
                    <CommandItem
                      key={hotel?.Hotel_ID}
                      value={hotel?.Hotel_ID.toString()}
                      onSelect={(currentValue) => {
                        setValue(
                          Number(currentValue) === Number(value)
                            ? 0
                            : Number(currentValue)
                        );
                        setOpen(false);
                      }}
                    >
                      <CheckIcon
                        className={cn(
                          'mr-2 h-4 w-4',
                          value.toString() === hotel?.Hotel_ID.toString()
                            ? 'opacity-100'
                            : 'opacity-0'
                        )}
                      />
                      {hotel?.Hotel_Name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
          <Button variant="default" className="w-full" type="submit">
            Submit
          </Button>
        </form>
      </Form>
      {hideForm && (
        <div className="flex flex-col justify-center gap-2 mb-7">
          <p>
            Booking date: {bookInfo.bookingDate.toISOString().split('T')[0]}
          </p>
          <p>How many people: {bookInfo.howManyPeople}</p>
          <p>Selected Time: {bookInfo.time}</p>
          <Button
            variant="secondary"
            onClick={() => {
              setUnblur(false);
              setHideForm(false);
            }}
          >
            <span>Change</span>
          </Button>
        </div>
      )}
    </div>
  );
}
