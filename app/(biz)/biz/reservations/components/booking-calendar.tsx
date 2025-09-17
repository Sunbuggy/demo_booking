'use client'
import { Dispatch, SetStateAction, useEffect, useMemo } from 'react';
import { mbj_vehicles_list, atv_vehicles_list, vof_vehicles_list, ffr_vehicles_list } from '@/utils/helpers';
import { Reservation } from '@/app/(biz)/biz/types';
import { BookInfoType, ContactFom, HotelType, VehicleCounts, VehiclePricingType } from './server-booking';
import ComboBox from '@/components/hotel-combo-box';
import { Checkbox } from '@/components/ui/checkbox';
import { BookingTabs } from './booking-type/mbj-tabs';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import DatePicker from '@/app/(com)/book/date-picker';
import { Form } from '@/components/ui/form';
import { FleetCarousel } from './booking-selection';

// Define the form schema for the date field
const DateFormSchema = z.object({
  bookingDate: z.date({
    required_error: 'A reservation date is required.'
  })
});

// Define a more flexible pricing type
type FlexiblePricingType = {
  [key: string]: number | string | undefined;
  mb30?: number;
  mb60?: number;
  mb120?: number;
  full_atv?: number;
  desert_racer?: number;
  price?: number;
  name?: string;
};

// Update the VehicleCounts type to use FlexiblePricingType
interface FlexibleVehicleCounts {
  [key: number]: {
    count: number;
    isChecked: boolean;
    name: string;
    seats: number;
    pricing: FlexiblePricingType;
  };
}

// Helper function to get the appropriate vehicle list based on location
const getVehicleListByLocation = (location: string) => {
  switch (location) {
    case 'Nellis30':
    case 'Nellis60':
    case 'NellisDX':
      return mbj_vehicles_list;
    case 'DunesATV':
      return atv_vehicles_list;
    case 'ValleyOfFire':
      return vof_vehicles_list;
    case 'FamilyFun':
      return ffr_vehicles_list;
    default:
      return mbj_vehicles_list;
  }
};

export function CalendarFormEdit({
  isCalendarOpen,
  freeShuttle,
  hotelsMemo,
  open,
  selectedHotel,
  bookInfo,
  setBookInfo,
  setIsCalendarOpen,
  setOpen,
  setSelectedHotel,
  setFreeShuttle,
  setSelectedTimeValue,
  setVehicleCounts,
  vehicleCounts,
  totalSeats,
  setSelectedTabValue,
  selectedTabValue,
  selectedTimeValue,
  total_cost,
  settotal_cost,
  contactForm,
  setContactForm,
  formToken,
  viewMode = false,
  initialData,
}: {
  isCalendarOpen: boolean;
  freeShuttle: boolean;
  hotelsMemo: HotelType[];
  open: boolean;
  selectedHotel: string;
  bookInfo: BookInfoType;
  setBookInfo: Dispatch<SetStateAction<BookInfoType>>;
  setIsCalendarOpen: Dispatch<SetStateAction<boolean>>;
  setOpen: Dispatch<SetStateAction<boolean>>;
  setSelectedHotel: Dispatch<SetStateAction<string>>;
  setFreeShuttle: Dispatch<SetStateAction<boolean>>;
  setSelectedTimeValue: Dispatch<SetStateAction<string>>;
  setVehicleCounts: Dispatch<SetStateAction<FlexibleVehicleCounts>>;
  vehicleCounts: FlexibleVehicleCounts;
  totalSeats: number;
  setSelectedTabValue: Dispatch<SetStateAction<'mb30' | 'mb60' | 'mb120'>>;
  selectedTabValue: 'mb120' | 'mb30' | 'mb60';
  selectedTimeValue: string;
  total_cost: number;
  settotal_cost: Dispatch<SetStateAction<number>>;
  contactForm: ContactFom;
  setContactForm: Dispatch<SetStateAction<ContactFom>>;
  formToken: string;
  initialData?: Reservation;
  viewMode?: boolean;
}) {
  // Initialize react-hook-form for the date field
  const dateForm = useForm<z.infer<typeof DateFormSchema>>({
    resolver: zodResolver(DateFormSchema),
    defaultValues: {
      bookingDate: bookInfo.bookingDate
    }
  });

  // Get the location from initialData or default to Nellis60
  const location = initialData?.location || 'Nellis60';

  // Get the appropriate vehicle list based on location
  const currentVehicleList = useMemo(() => getVehicleListByLocation(location), [location]);

  // Update the form when bookInfo changes
  useEffect(() => {
    dateForm.setValue('bookingDate', bookInfo.bookingDate);
  }, [bookInfo.bookingDate, dateForm]);

  const incrementCount = (
    vehicleId: number,
    isChecked: boolean,
    name: string,
    seats: number,
    pricing: FlexiblePricingType
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
    pricing: FlexiblePricingType
  ) => {
    setVehicleCounts((prevCounts) => ({
      ...prevCounts,
      [vehicleId]: {
        ...prevCounts[vehicleId],
        count: Math.max(0, (prevCounts[vehicleId]?.count ?? 0) - 1),
        isChecked: (prevCounts[vehicleId]?.count ?? 0) > 1 ? true : false,
        name,
        seats,
        pricing
      }
    }));
  };

  // Handle input changes directly
  const handleBookingChange = (field: keyof BookInfoType, value: any) => {
    setBookInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleContactChange = (field: keyof ContactFom, value: string) => {
    setContactForm(prev => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    if (initialData) {
      const bookingDate = initialData.sch_date ? new Date(initialData.sch_date) : new Date();

      setBookInfo({
        bookingDate,
        howManyPeople: initialData.ppl_count || 1
      });

      // Set hotel if exists
      if (initialData.hotel) {
        if (initialData.hotel === 'Drive here') {
          setFreeShuttle(false);
          setSelectedHotel('');
        } else {
          setFreeShuttle(true);
          setSelectedHotel(initialData.hotel);
        }
      } else {
        setFreeShuttle(false);
        setSelectedHotel('');
      }
    }
  }, [initialData]);

  const convertTo24HourFormat = (timeStr: string): string => {
    if (!timeStr) return '';
    const [time, period] = timeStr.split(' ');
    let hour = parseInt(time, 10);

    if (period === 'pm' && hour !== 12) {
      hour += 12;
    } else if (period === 'am' && hour === 12) {
      hour = 0;
    }

    return `${hour.toString().padStart(2, '0')}:00`;
  };

  const getLocationFromTab = () => {
    return selectedTabValue === 'mb30' ? 'Nellis30' :
      selectedTabValue === 'mb60' ? 'Nellis60' : 'NellisDX';
  };

  // Handle hotel checkbox change
  const handleShuttleChange = (checked: boolean) => {
    setFreeShuttle(checked);
    if (!checked) {
      setSelectedHotel('');
    }
  };

  return (
    <div className="w-screen md:w-[350px] space-y-4">

      {/* Booking Section */}
      <div className="p-4 border rounded-lg shadow-sm">
        <h2 className="text-lg font-bold mb-3">Booking Details</h2>

        <div className="space-y-3">
          <div>
            <label className="block mb-1">Booking Date</label>
            <Form {...dateForm}>
              <DatePicker
                form={dateForm}
                title="Pick a booking date"
                buttonTitle="Pick a date"
                isCalendarOpen={isCalendarOpen}
                setIsCalendarOpen={setIsCalendarOpen}
                disabled={viewMode}
              />
            </Form>
            <input
              type="hidden"
              name="sch_date"
              value={bookInfo.bookingDate.toISOString().split('T')[0]}
            />
          </div>

          <div>
            <label className="block mb-1">Number of People</label>
            <input
              type="number"
              name="ppl_count"
              value={bookInfo.howManyPeople}
              onChange={(e) => handleBookingChange('howManyPeople', parseInt(e.target.value) || 1)}
              min="1"
              className="w-full p-2 border rounded"
              disabled={viewMode}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="free-shuttle"
              checked={freeShuttle}
              onCheckedChange={viewMode ? undefined : (checked) => handleShuttleChange(checked === true)}
              disabled={viewMode}
            />
            <label
              htmlFor="free-shuttle"
              className="text-sm font-medium leading-none"
            >
              Get Free Shuttle Pickup to Your Hotel
            </label>
          </div>

          {hotelsMemo && freeShuttle && (
            <div>
              <ComboBox
                hotelsMemo={hotelsMemo}
                open={open}
                setOpen={viewMode ? undefined : setOpen}
                selectedHotel={selectedHotel}
                setSelectedHotel={viewMode ? undefined : setSelectedHotel}
                disabled={viewMode}
              />
              {/* Hidden input to capture hotel value for form submission */}
              <input
                type="hidden"
                name="hotel"
                value={selectedHotel}
              />
            </div>
          )}
          {/* Hidden input for hotel when freeShuttle is false */}
          {!freeShuttle && (
            <input
              type="hidden"
              name="hotel"
              value=""
            />
          )}
        </div>
      </div>

      {/* Fleet Selection */}
      <div className="p-4 border rounded-lg shadow-sm w-auto">
        <h2 className="text-lg font-bold mb-3">Fleet Selection</h2>
        <FleetCarousel
          vehicleCounts={vehicleCounts}
          setVehicleCounts={setVehicleCounts}
          totalSeats={totalSeats}
          howManyPeople={bookInfo.howManyPeople}
          viewMode={viewMode}
        />

        {/* <div className="space-y-3">
          {currentVehicleList.map((vehicle) => {
            const fieldName = vehicle.name.split(' ')[0].toLowerCase().replace('-', '');
            return (
              <div key={vehicle.id} className="flex justify-between items-center py-2 border-b">
                <div className="flex items-center">
                  <span className={vehicleCounts[vehicle.id]?.isChecked ? 'text-green-500 font-medium' : ''}>
                    {vehicle.name}
                  </span>
                </div>
                
                <div className="flex items-center">
                  <button
                    onClick={viewMode ? undefined : () => decrementCount(vehicle.id, vehicle.name, vehicle.seats, vehicle.pricing)}
                    className="px-3 py-1 rounded-l"
                    disabled={viewMode}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    name={fieldName}
                    value={vehicleCounts[vehicle.id]?.count || 0}
                    onChange={viewMode ? undefined : (e) => {
                      const count = Math.max(0, parseInt(e.target.value) || 0);
                      setVehicleCounts(prev => ({
                        ...prev,
                        [vehicle.id]: {
                          ...prev[vehicle.id],
                          count,
                          isChecked: count > 0
                        }
                      }));
                    }}
                    min="0"
                    className="w-12 text-center border-y"
                    disabled={viewMode}
                  />
                  <button
                    onClick={viewMode ? undefined : () => incrementCount(
                      vehicle.id,
                      true,
                      vehicle.name,
                      vehicle.seats,
                      vehicle.pricing
                    )}
                    className="px-3 py-1 rounded-r"
                    disabled={viewMode}
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div> */}
      </div>

      {/* Contact Information */}
      <div className="p-4 border rounded-lg shadow-sm">
        <h2 className="text-lg font-bold mb-3">Contact Information</h2>

        <div className="space-y-3">
          <div>
            <label className="block mb-1">Full Name</label>
            <input
              type="text"
              name="full_name"
              value={contactForm.name}
              onChange={(e) => handleContactChange('name', e.target.value)}
              className="w-full p-2 border rounded"
              disabled={viewMode}
            />
          </div>

          <div>
            <label className="block mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={contactForm.email}
              onChange={(e) => handleContactChange('email', e.target.value)}
              className="w-full p-2 border rounded"
              disabled={viewMode}
            />
          </div>

          <div>
            <label className="block mb-1">Phone</label>
            <input
              type="tel"
              name="phone"
              value={contactForm.phone}
              onChange={(e) => handleContactChange('phone', e.target.value)}
              className="w-full p-2 border rounded"
              disabled={viewMode}
            />
          </div>

          <div>
            <label className="block mb-1">Group Name (Optional)</label>
            <input
              type="text"
              name="occasion"
              value={contactForm.groupName || ''}
              onChange={(e) => handleContactChange('groupName', e.target.value)}
              className="w-full p-2 border rounded"
              disabled={viewMode}
            />
          </div>
        </div>
      </div>

      {/* Pricing Section */}
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
          viewMode={viewMode}
        />
      </div>
    </div>
  );
}