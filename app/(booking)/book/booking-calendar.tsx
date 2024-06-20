'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { CalendarIcon, CheckCheckIcon, ChevronsUpDown } from 'lucide-react';
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
  CommandItem,
  CommandList
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

import { Dispatch, SetStateAction, useMemo, useState } from 'react';
import { HotelType } from './serve-bookings';
import DatePicker from './date-picker';
import NumberInput from './number-input';

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
  const [open, setOpen] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState('');
  const hotelsMemo = useMemo(() => hotels, [hotels]);
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
          <DatePicker
            form={form}
            isCalendarOpen={isCalendarOpen}
            setIsCalendarOpen={setIsCalendarOpen}
            title="Pick a booking date"
            buttonTitle="Pick a date"
          />
          <NumberInput form={form} />

          {hotelsMemo && (
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-[200px] justify-between"
                >
                  {selectedHotel
                    ? hotelsMemo?.find(
                        (hotel) => String(hotel?.Hotel_Name) === selectedHotel
                      )?.Hotel_Name
                    : 'Select hotel...'}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0">
                <Command>
                  <CommandInput placeholder="Search hotel..." />
                  <CommandList>
                    <CommandEmpty>No Hotel found.</CommandEmpty>
                    <CommandGroup>
                      {hotelsMemo.map((hotel) => (
                        <CommandItem
                          key={hotel.Hotel_ID}
                          value={String(hotel.Hotel_Name)}
                          onSelect={(currentValue) => {
                            setSelectedHotel(
                              currentValue === selectedHotel ? '' : currentValue
                            );
                            setOpen(false);
                          }}
                        >
                          <CheckCheckIcon
                            className={cn(
                              'mr-2 h-4 w-4',
                              selectedHotel === String(hotel.Hotel_Name)
                                ? 'opacity-100'
                                : 'opacity-0'
                            )}
                          />
                          {hotel.Hotel_Name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          )}
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
          <p>Selected Hotel: {selectedHotel}</p>
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
