'use client'
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Dispatch, SetStateAction, useEffect } from 'react';
import {
  BookInfoType,
  ContactFom,
  HotelType,
  VehicleCounts,
  VehiclePricingType
} from '../serve-bookings/mbj';
import DatePicker from '../date-picker';
import NumberInput from '../number-input';
import ComboBox from '../../../../components/hotel-combo-box';
import { Checkbox } from '@/components/ui/checkbox';
import { mbj_vehicles_list } from '@/utils/helpers';
import { ContactForm } from '../contact-form';
import { BookingTabs } from '../tabs/mbj';
import { Reservation } from '@/app/(biz)/biz/types';

const FormSchema = z.object({
  bookingDate: z.date({
    required_error: 'A reservation date is required.'
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
  total_cost,
  settotal_cost,
  contactForm,
  setContactForm,
  showContactForm,
  setShowContactForm,
  formToken,
  viewMode = false,
  onEdit,
  initialData,
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
  total_cost: number;
  settotal_cost: Dispatch<SetStateAction<number>>;
  contactForm: ContactFom;
  setContactForm: Dispatch<SetStateAction<ContactFom>>;
  showContactForm: boolean;
  setShowContactForm: Dispatch<SetStateAction<boolean>>;
  formToken: string;
  viewMode?: boolean;
  onEdit?: () => void;
  initialData?: Reservation;
}) {
  const incrementCount = (
    vehicleId: number,
    isChecked: boolean,
    name: string,
    seats: number,
    pricing: VehiclePricingType
  ) => {
    setVehicleCounts((prevCounts) => ({
      ...prevCounts,
      [vehicleId]: {
        ...prevCounts[vehicleId],
        count: (prevCounts[vehicleId]?.count ?? 0) + 1,
        isChecked,
        name,
        seats,
        pricing
      }
    }));
  };

  const decrementCount = (
    vehicleId: number,
    name: string,
    seats: number,
    pricing: VehiclePricingType
  ) => {
    setVehicleCounts((prevCounts) => ({
      ...prevCounts,
      [vehicleId]: {
        ...prevCounts[vehicleId],
        count: Math.max(0, prevCounts[vehicleId].count - 1), // Ensure count doesn't go below 1
        isChecked: prevCounts[vehicleId]?.count > 1 ? true : false,
        name,
        seats,
        pricing
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
  }

   useEffect(() => {
    if (initialData) {
      const bookingDate = initialData.sch_date ? new Date(initialData.sch_date) : new Date();
      
      form.reset({
        bookingDate,
        howManyPeople: initialData.ppl_count || 1
      });
      
      // Set hotel if exists
    if (initialData.hotel) {
      // If hotel is "Drive here", disable shuttle
      if (initialData.hotel === 'Drive here') {
        setFreeShuttle(false);
        setSelectedHotel('');
      } 
      // Otherwise, enable shuttle and set hotel
      else {
        setFreeShuttle(true);
        setSelectedHotel(initialData.hotel);
      }
    }
    // Handle case where hotel is not specified
    else {
      setFreeShuttle(false);
      setSelectedHotel('');
    }
  }
}, [initialData, form]);


  return (
    <div className="w-screen md:w-[350px]">
      {/* Edit button for view mode */}
      {viewMode && (
        <div className="mb-4">
          <Button variant="outline" onClick={onEdit}>
            Edit Reservations
          </Button>
        </div>
      )}
      
      <Form {...form}>
        <form
          className={`gap-2 mb-7 w-full items-baseline ${hideForm ? 'hidden' : 'flex flex-col'}`}
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <DatePicker
            form={form}
            isCalendarOpen={isCalendarOpen}
            setIsCalendarOpen={setIsCalendarOpen}
            title="Pick a booking date"
            buttonTitle="Pick a date"
            disabled={viewMode}
          />
          <NumberInput form={form} disabled={viewMode} />
          <div className="flex items-center space-x-2">
            <Checkbox
              id="free-shuttle"
              checked={freeShuttle}
              onCheckedChange={viewMode ? undefined : () => setFreeShuttle(!freeShuttle)}
              disabled={viewMode}
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
    setOpen={viewMode ? undefined : setOpen}
    selectedHotel={selectedHotel}
    setSelectedHotel={viewMode ? undefined : setSelectedHotel}
    disabled={viewMode}
  />
)}
          {!viewMode && (
            <Button variant="default" className="w-full" type="submit">
              Next
            </Button>
          )}
        </form>
      </Form>
      
      {hideForm && (
        <div className="flex flex-col w-full mb-5 items-center gap-2">
          <p>
            Booking date: {bookInfo.bookingDate.toISOString().split('T')[0]}
          </p>
          <p>How many people: {bookInfo.howManyPeople}</p>
          {/* Fixed hotel display */}
<p>
  Selected Hotel: {selectedHotel ? selectedHotel : 'Drive here'}
</p>

          
          {!viewMode ? (
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => {
                setHideForm(false);
                setSelectedTimeValue('');
                setVehicleCounts({});
                setShowPricing(false);
                setShowContactForm(false);
              }}
            >
              <span>Change Booking Details</span>
            </Button>
          ) : (
            <Button
              variant="secondary"
              className="w-full"
              onClick={onEdit}
            >
              <span>Edit Reservation</span>
            </Button>
          )}
        </div>
      )}
      
      {hideForm && (
        <div className="flex flex-col w-full mb-5 items-center gap-2">
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
          
          {(showContactForm || showPricing) && (
            <>
              <h1>Booking details</h1>
              {Object.values(vehicleCounts).map((vehicle) => {
                if (vehicle.isChecked) {
                  return (
                    <div key={`${vehicle.id}-${vehicle.name}`}>
                      <h2 className=" underline font-bold text-green-500">
                        {vehicle.name}
                      </h2>
                    </div>
                  );
                }
                return null;
              })}
            </>
          )}
          
          {(showContactForm || showPricing) && !viewMode && (
            <Button
              variant="secondary"
              className="my-5 w-full"
              onClick={() => {
                setShowPricing(false);
                setSelectedTimeValue('');
                setShowContactForm(false);
              }}
            >
              Change Chosen Fleet
            </Button>
          )}
          
          {showPricing && (
            <div className="flex flex-col w-full mb-5 items-center gap-2">
              <div className="flex flex-col items-start">
                <p>
                  Name:{' '}
                  <span className="text-green-500">{contactForm.name}</span>
                </p>
                <p>
                  Email:{' '}
                  <span className="text-green-500">{contactForm.email}</span>
                </p>
                <p>
                  Phone:{' '}
                  <span className="text-green-500">{contactForm.phone}</span>
                </p>
                <p>
                  {contactForm.groupName &&
                    `Group Name: ${contactForm.groupName}`}
                </p>
              </div>
            </div>
          )}

          {!showContactForm && !showPricing && (
            <div className="flex flex-col w-full items-center">
              <p className="text-center text-lg mb-2">
                {viewMode ? 'Chosen Fleet' : 'Choose Fleet'}
              </p>
              {mbj_vehicles_list.map((vehicle) => (
                <div
                  key={vehicle.id}
                  className="flex gap-2 justify-between w-[60%] mb-2 border-b pb-2"
                >
                  <label
                    className={
                      vehicleCounts[vehicle.id]?.isChecked
                        ? 'text-green-500'
                        : ''
                    }
                    htmlFor={String(vehicle.id)}
                  >
                    {vehicle.name}
                  </label>
                  <div className="flex gap-2">
                    {!viewMode && (
                      <button
                        onClick={() =>
                          decrementCount(
                            vehicle.id,
                            vehicle.name,
                            vehicle.seats,
                            vehicle.pricing
                          )
                        }
                      >
                        -
                      </button>
                    )}
                    <span>{vehicleCounts[vehicle.id]?.count || 0}</span>
                    {!viewMode && (
                      <button
                        onClick={() =>
                          incrementCount(
                            vehicle.id,
                            true,
                            vehicle.name,
                            vehicle.seats,
                            vehicle.pricing
                          )
                        }
                      >
                        +
                      </button>
                    )}
                  </div>
                </div>
              ))}
              
              {!showPricing && !viewMode && (
                <div>
                  <Button
                    disabled={totalSeats < bookInfo.howManyPeople}
                    onClick={() => setShowContactForm(true)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}
          
          {showContactForm && !viewMode && (
            <div className="flex flex-col items-center gap-5">
              <h1>Quick Contact Form</h1>
              <ContactForm
                FormSchema={ContactFormSchema}
                form={contact_form}
                contactForm={contactForm}
                setContactForm={setContactForm}
                setShowPricing={setShowPricing}
                setShowContactForm={setShowContactForm}
                disabled={viewMode}
              />
            </div>
          )}
          
          {showPricing && (
            <div className="flex flex-col items-center gap-5">
              <BookingTabs
                selectedTabValue={selectedTabValue}
                setSelectedTabValue={setSelectedTabValue}
                selectedTimeValue={selectedTimeValue}
                setSelectedTimeValue={setSelectedTimeValue}
                vehicleCounts={vehicleCounts}
            totalPrice={total_cost}
            setTotalPrice={settotal_cost}
                formToken={formToken}
                // custom_cost={initialData?.custom_cost}  
                viewMode={viewMode}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}