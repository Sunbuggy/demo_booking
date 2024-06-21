'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Dispatch, SetStateAction, useMemo, useState } from 'react';
import { HotelType } from './serve-bookings';
import DatePicker from './date-picker';
import NumberInput from './number-input';
import ComboBox from './combo-box';
import { Checkbox } from '@/components/ui/checkbox';

const FormSchema = z.object({
  bookingDate: z.date({
    required_error: 'A date of birth is required.'
  }),
  howManyPeople: z.coerce.number({
    required_error: 'Group size is required.'
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
    resolver: zodResolver(FormSchema),
    defaultValues: {
      bookingDate: new Date(),
      howManyPeople: 1
    }
  });
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [hideForm, setHideForm] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState('');
  const [freeShuttle, setFreeShuttle] = useState<boolean>(true);
  const hotelsMemo = useMemo(() => hotels, [hotels]);
  const [bookInfo, setBookInfo] = useState({
    bookingDate: new Date(),
    howManyPeople: 1
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
          <div className="flex items-center space-x-2">
            <Checkbox
              id="free-shuttle"
              checked={freeShuttle}
              onCheckedChange={() => setFreeShuttle(!freeShuttle)}
            />
            <label
              htmlFor="free-shuttle"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Get Free Shuttle Pickup to Your Hotel
            </label>
          </div>
          {hotelsMemo && freeShuttle && (
            <ComboBox
              hotelsMemo={hotelsMemo}
              open={open}
              setOpen={setOpen}
              selectedHotel={selectedHotel}
              setSelectedHotel={setSelectedHotel}
            />
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
          <p>
            Selected Hotel: {(freeShuttle && selectedHotel) || 'Drive here'}
          </p>
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
