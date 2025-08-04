'use client'

import { ContactForm } from "@/app/(com)/book/contact-form";
import NumberInput from "@/app/(com)/book/number-input";
import ComboBox from "@/components/hotel-combo-box";
import { mbj_vehicles_list } from "@/utils/helpers";
import { zodResolver } from "@hookform/resolvers/zod";
import { DatePicker, Checkbox, Button } from "antd";
import { Dispatch, SetStateAction, useEffect } from "react";
import { useForm, Form } from "react-hook-form";
import { z } from "zod";
import { HotelType, BookInfoType, VehicleCounts, ContactFom, VehiclePricingType } from "./server-booking";
import { BookingTabs } from "./tabs";


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
  contactForm,
  setContactForm,
  showContactForm,
  setShowContactForm,
  viewMode = false,
  editMode = false,
  onCancelEdit,
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
  editMode?: boolean;
  onCancelEdit?: () => void;
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
        count: Math.max(0, (prevCounts[vehicleId]?.count || 0) - 1),
        isChecked: (prevCounts[vehicleId]?.count || 0) > 1 ? true : false,
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
    if (bookInfo) {
      form.reset({
        bookingDate: bookInfo.bookingDate,
        howManyPeople: bookInfo.howManyPeople
      });
    }
  }, [bookInfo, form]);

  // In edit mode, show all steps completed
  useEffect(() => {
    if (editMode) {
      setHideForm(true);
      setShowContactForm(true);
      setShowPricing(true);
    }
  }, [editMode, setHideForm, setShowContactForm, setShowPricing]);

  return (
    <div className="w-screen md:w-[350px]">
      <Form {...form}>
        <form
          className={`gap-2 mb-7 w-full items-baseline ${hideForm && !editMode ? 'hidden' : 'flex flex-col'}`}
          onSubmit={form.handleSubmit(onSubmit)}
        >
          {/* Hidden fields for form submission */}
          {editMode && (
            <>
              <input type="hidden" name="bookingDate" value={bookInfo.bookingDate.toISOString()} />
              <input type="hidden" name="howManyPeople" value={bookInfo.howManyPeople} />
              <input type="hidden" name="hotel" value={freeShuttle ? selectedHotel : 'Drive here'} />
              <input type="hidden" name="location" value={
                selectedTabValue === 'mb30' ? 'Nellis30' : 
                selectedTabValue === 'mb60' ? 'Nellis60' : 'NellisDX'
              } />
              <input type="hidden" name="time" value={selectedTimeValue} />
              <input type="hidden" name="total_cost" value={total_cost} />
            </>
          )}

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
          {!viewMode && !editMode && (
            <Button variant="default" className="w-full" type="submit">
              Next
            </Button>
          )}
        </form>
      </Form>
      
      {(hideForm || editMode) && (
        <div className="flex flex-col w-full mb-5 items-center gap-2">
          <p>
            Booking date: {bookInfo.bookingDate.toISOString().split('T')[0]}
          </p>
          <p>How many people: {bookInfo.howManyPeople}</p>
          <p>
            Selected Hotel: {selectedHotel ? selectedHotel : 'Drive here'}
          </p>
          
          {(editMode || !viewMode) && (
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
              disabled={viewMode}
            >
              <span>Change Booking Details</span>
            </Button>
          )}
        </div>
      )}
      
      {(hideForm || editMode) && (
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
          
          {/* Vehicle Selection Section */}
          <div className="w-full mt-4">
            <p className="text-center text-lg mb-2">
              {viewMode ? 'Chosen Fleet' : 'Choose Fleet'}
            </p>
            {mbj_vehicles_list.map((vehicle) => {
              const vehicleCount = vehicleCounts[vehicle.id]?.count || 0;
              return (
                <div
                  key={vehicle.id}
                  className="flex gap-4 justify-between items-center w-full mb-3 p-2 border-b"
                >
                  <label
                    className={
                      vehicleCounts[vehicle.id]?.isChecked
                        ? 'text-green-500 font-medium'
                        : ''
                    }
                  >
                    {vehicle.name} ({vehicle.seats} seats)
                  </label>
                  <div className="flex items-center gap-2">
                    {!viewMode && (
                      <button
                        type="button"
                        className="px-3 py-1 bg-gray-200 rounded"
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
                    <span className="min-w-[30px] text-center">{vehicleCount}</span>
                    {editMode && (
                      <input 
                        type="hidden" 
                        name={`vehicle_${vehicle.name.replace(/\s+/g, '')}`}
                        value={vehicleCount} 
                      />
                    )}
                    {!viewMode && (
                      <button
                        type="button"
                        className="px-3 py-1 bg-gray-200 rounded"
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
              );
            })}
          </div>
          
          {/* Contact Form Section */}
          <div className="w-full mt-6">
            <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
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
          
          {/* Pricing Section */}
          <div className="w-full mt-6">
            <BookingTabs
              selectedTabValue={selectedTabValue}
              setSelectedTabValue={setSelectedTabValue}
              selectedTimeValue={selectedTimeValue}
              setSelectedTimeValue={setSelectedTimeValue}
              vehicleCounts={vehicleCounts}
              totalPrice={total_cost}
              viewMode={viewMode}
              editMode={editMode}
            />
          </div>

          {editMode && (
            <div className="flex gap-4 w-full mt-6">
              <Button 
                variant="destructive" 
                className="flex-1"
                onClick={onCancelEdit}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                Save Changes
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}