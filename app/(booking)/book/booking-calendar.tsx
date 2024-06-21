import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Dispatch, SetStateAction } from 'react';
import { HotelType } from './serve-bookings';
import DatePicker from './date-picker';
import NumberInput from './number-input';
import ComboBox from '../../../components/combo-box';
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
  hideForm,
  isCalendarOpen,
  freeShuttle,
  hotelsMemo,
  open,
  selectedHotel,
  bookInfo,
  setUnblur,
  setBookInfo,
  setHideForm,
  setIsCalendarOpen,
  setOpen,
  setSelectedHotel,
  setFreeShuttle
}: {
  hideForm: boolean;
  isCalendarOpen: boolean;
  freeShuttle: boolean;
  hotelsMemo: HotelType[];
  open: boolean;
  selectedHotel: string;
  bookInfo: any;
  setUnblur: Dispatch<SetStateAction<boolean>>;
  setBookInfo: Dispatch<SetStateAction<any>>;
  setHideForm: Dispatch<SetStateAction<boolean>>;
  setIsCalendarOpen: Dispatch<SetStateAction<boolean>>;
  setOpen: Dispatch<SetStateAction<boolean>>;
  setSelectedHotel: Dispatch<SetStateAction<string>>;
  setFreeShuttle: Dispatch<SetStateAction<boolean>>;
}) {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      bookingDate: new Date(),
      howManyPeople: 1
    }
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
