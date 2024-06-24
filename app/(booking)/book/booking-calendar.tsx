import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Dispatch, SetStateAction } from 'react';
import {
  BookInfoType,
  ContactFom,
  HotelType,
  VehicleCounts,
  VehiclePricingType
} from './serve-bookings';
import DatePicker from './date-picker';
import NumberInput from './number-input';
import ComboBox from '../../../components/combo-box';
import { Checkbox } from '@/components/ui/checkbox';
import { mbj_vehicles_list } from '@/utils/helpers';
import { BookingTabs } from './booking-tabs';
import { ContactForm } from './contact-form';

const FormSchema = z.object({
  bookingDate: z.date({
    required_error: 'A date of birth is required.'
  }),
  howManyPeople: z.coerce.number({
    required_error: 'Group size is required.'
  })
});
const ContactFormSchema = z.object({
  name: z.string({
    required_error: 'Name is required.'
  }),
  email: z.string({
    required_error: 'Email is required.'
  }),
  phone: z.string({
    required_error: 'Phone is required.'
  }),
  groupName: z.string()
});

// Define an interface for the count object
export function CalendarForm({
  hideForm,
  isCalendarOpen,
  freeShuttle,
  hotelsMemo,
  open,
  selectedHotel,
  bookInfo,
  setBookInfo,
  setHideForm,
  setIsCalendarOpen,
  setOpen,
  setSelectedHotel,
  setFreeShuttle,
  setSelectedTimeValue,
  setVehicleCounts,
  vehicleCounts,
  totalSeats,
  showPricing,
  setShowPricing,
  selectedTabValue,
  setSelectedTabValue,
  selectedTimeValue,
  totalPrice,
  setTotalPrice,
  contactForm,
  setContactForm,
  showContactForm,
  setShowContactForm
}: {
  hideForm: boolean;
  isCalendarOpen: boolean;
  freeShuttle: boolean;
  hotelsMemo: HotelType[];
  open: boolean;
  selectedHotel: string;
  bookInfo: BookInfoType;
  setBookInfo: Dispatch<SetStateAction<BookInfoType>>;
  setHideForm: Dispatch<SetStateAction<boolean>>;
  setIsCalendarOpen: Dispatch<SetStateAction<boolean>>;
  setOpen: Dispatch<SetStateAction<boolean>>;
  setSelectedHotel: Dispatch<SetStateAction<string>>;
  setFreeShuttle: Dispatch<SetStateAction<boolean>>;
  setSelectedTimeValue: Dispatch<SetStateAction<string>>;
  setVehicleCounts: Dispatch<SetStateAction<VehicleCounts>>;
  vehicleCounts: VehicleCounts;
  totalSeats: number;
  showPricing: boolean;
  setShowPricing: Dispatch<SetStateAction<boolean>>;
  selectedTabValue: 'mb120' | 'mb30' | 'mb60';
  setSelectedTabValue: Dispatch<SetStateAction<'mb30' | 'mb60' | 'mb120'>>;
  selectedTimeValue: string;
  totalPrice: number;
  setTotalPrice: Dispatch<SetStateAction<number>>;
  contactForm: ContactFom;
  setContactForm: Dispatch<SetStateAction<ContactFom>>;
  showContactForm: boolean;
  setShowContactForm: Dispatch<SetStateAction<boolean>>;
}) {
  const handleCheckboxChange = (
    vehicleId: number,
    isChecked: boolean,
    name: string,
    seats: number,
    pricing: VehiclePricingType
  ) => {
    setVehicleCounts((prevCounts) => {
      // If the checkbox is checked, update or add the vehicle to the state
      if (isChecked) {
        return {
          ...prevCounts,
          [vehicleId]: {
            isChecked,
            count: 1, // Assuming you want to reset count to 1 when checked
            name,
            seats,
            pricing
          }
        };
      } else {
        // If the checkbox is unchecked, create a new object without the vehicle
        const { [vehicleId]: value, ...newCounts } = prevCounts;
        return newCounts;
      }
    });
  };
  const incrementCount = (vehicleId: number) => {
    setVehicleCounts((prevCounts) => ({
      ...prevCounts,
      [vehicleId]: {
        ...prevCounts[vehicleId],
        count: prevCounts[vehicleId].count + 1
      }
    }));
  };

  const decrementCount = (vehicleId: number) => {
    setVehicleCounts((prevCounts) => ({
      ...prevCounts,
      [vehicleId]: {
        ...prevCounts[vehicleId],
        count: Math.max(1, prevCounts[vehicleId].count - 1) // Ensure count doesn't go below 1
      }
    }));
  };
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      bookingDate: new Date(),
      howManyPeople: 1
    }
  });
  const contact_form = useForm<z.infer<typeof ContactFormSchema>>({
    resolver: zodResolver(ContactFormSchema),
    defaultValues: {
      name: contactForm.name || '',
      email: contactForm.email || '',
      phone: contactForm.phone || '',
      groupName: contactForm.groupName || ''
    }
  });

  function onSubmit(data: z.infer<typeof FormSchema>) {
    setBookInfo(data);
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
            Next
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
              setHideForm(false);
              setSelectedTimeValue('');
              setVehicleCounts({});
              setShowPricing(false);
            }}
          >
            <span>Change</span>
          </Button>
        </div>
      )}
      {hideForm && (
        <div className="flex flex-col items-center">
          <p>
            Assigned Seats:{' '}
            <span
              className={
                totalSeats >= bookInfo.howManyPeople
                  ? 'text-green-500'
                  : 'text-red-500'
              }
            >
              {totalSeats || 0}
            </span>
            / <span className="text-green-500">{bookInfo.howManyPeople}</span>
          </p>
          <div>
            <h1>Booking details</h1>
            {Object.values(vehicleCounts).map((vehicle) => {
              if (vehicle.isChecked) {
                return (
                  <div key={`${vehicle.id}-${vehicle.name}`}>
                    <h2>{vehicle.name}✅</h2>
                  </div>
                );
              } else {
                return null;
              }
            })}
            {showPricing && (
              <div className="flex flex-col">
                <p>Name: {contactForm.name}</p>
                <p>Email: {contactForm.email}</p>
                <p>Phone: {contactForm.phone}</p>
                {contactForm.groupName &&
                  `Group Name: ${contactForm.groupName}`}
              </div>
            )}
          </div>

          {!showContactForm && (
            <div className="flex flex-col">
              <p>Choose Fleet</p>
              {mbj_vehicles_list.map((vehicle) => (
                <div key={vehicle.id} className="flex gap-2 items-center">
                  <input
                    type="checkbox"
                    id={String(vehicle.id)}
                    name="vehicle"
                    value={vehicle.name}
                    checked={!!vehicleCounts[vehicle.id]?.isChecked}
                    onChange={(e) =>
                      handleCheckboxChange(
                        vehicle.id,
                        e.target.checked,
                        vehicle.name,
                        vehicle.seats,
                        vehicle.pricing
                      )
                    }
                  />
                  <label htmlFor={String(vehicle.id)}>{vehicle.name}</label>
                  {vehicleCounts[vehicle.id]?.isChecked && (
                    <div className="flex gap-2">
                      <button onClick={() => decrementCount(vehicle.id)}>
                        -
                      </button>
                      <span>{vehicleCounts[vehicle.id].count}</span>
                      <button onClick={() => incrementCount(vehicle.id)}>
                        +
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {!showPricing && (
                <div>
                  <Button
                    disabled={totalSeats < bookInfo.howManyPeople}
                    onClick={() => {
                      console.log(vehicleCounts);
                      setShowContactForm(true);
                    }}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}
          {showContactForm && (
            <ContactForm
              FormSchema={ContactFormSchema}
              form={contact_form}
              contactForm={contactForm}
              setContactForm={setContactForm}
              setShowPricing={setShowPricing}
              setShowContactForm={setShowContactForm}
            />
          )}
          {showPricing && (
            <div className="flex flex-col items-center gap-5">
              <Button
                className="mt-5"
                onClick={() => {
                  setShowPricing(false);
                  setSelectedTimeValue('');
                  setShowContactForm(false);
                }}
              >
                Change Chosen Fleet
              </Button>
              <h1>Quick Contact Form</h1>

              <BookingTabs
                selectedTabValue={selectedTabValue}
                setSelectedTabValue={setSelectedTabValue}
                selectedTimeValue={selectedTimeValue}
                setSelectedTimeValue={setSelectedTimeValue}
                vehicleCounts={vehicleCounts}
                totalPrice={totalPrice}
                setTotalPrice={setTotalPrice}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
