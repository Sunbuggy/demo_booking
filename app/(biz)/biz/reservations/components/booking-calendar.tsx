import { Dispatch, SetStateAction, useEffect, useMemo, useState } from 'react';
import { mbj_vehicles_list, atv_vehicles_list, vof_vehicles_list, ffr_vehicles_list } from '@/utils/helpers';
import { Reservation } from '@/app/(biz)/biz/types';
import { BookInfoType, ContactFom, HotelType, VehicleCounts, VehiclePricingType } from './server-booking';
import ComboBox from '@/components/hotel-combo-box';
import { Checkbox } from '@/components/ui/checkbox';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import DatePicker from '@/app/(com)/book/date-picker';
import { Form } from '@/components/ui/form';
import { FleetCarousel } from './booking-selection';
import { BookingTabs, TabValue, VehicleCategory } from './booking-tabs';

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
  };
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
  activeVehicleCategory,
  setActiveVehicleCategory,
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
  setSelectedTabValue: Dispatch<SetStateAction<TabValue>>;
  selectedTabValue: TabValue;
  selectedTimeValue: string;
  total_cost: number;
  settotal_cost: Dispatch<SetStateAction<number>>;
  contactForm: ContactFom;
  setContactForm: Dispatch<SetStateAction<ContactFom>>;
  formToken: string;
  initialData?: Reservation;
  viewMode?: boolean;
  activeVehicleCategory: VehicleCategory;
  setActiveVehicleCategory: Dispatch<SetStateAction<VehicleCategory>>;
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

  // Function to convert display time back to 24-hour format for form submission
  const convertTo24HourFormat = (displayTime: string): string => {
    if (!displayTime) return '';
    
    // Extract the time part (remove discount info)
    const timePart = displayTime.split(' (')[0];
    const [time, period] = timePart.split(' ');
    let hour = parseInt(time, 10);

    if (period === 'pm' && hour !== 12) {
      hour += 12;
    } else if (period === 'am' && hour === 12) {
      hour = 0;
    }

    return `${hour.toString().padStart(2, '0')}:00`;
  };

  // Create a wrapper function that accepts string and validates it's a VehicleCategory
  const handleCategoryChange = (category: string) => {
    // Validate that the category is a valid VehicleCategory
    if (isVehicleCategory(category)) {
      setActiveVehicleCategory(category);
    }
  };

  // Type guard to check if a string is a valid VehicleCategory
  const isVehicleCategory = (category: string): category is VehicleCategory => {
    return ['Mini Baja', 'ATV', 'Valley of Fire', 'Family Fun'].includes(category);
  };

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

  // Handle hotel checkbox change
  const handleShuttleChange = (checked: boolean) => {
    setFreeShuttle(checked);
    if (!checked) {
      setSelectedHotel('');
    }
  };

  return (
    <div className="w-screen md:w-[350px] space-y-4">

      {/* Hidden inputs for form submission */}
      <input
        type="hidden"
        name="sch_date"
        value={bookInfo.bookingDate.toISOString().split('T')[0]}
      />
      <input
        type="hidden"
        name="sch_time"
        value={convertTo24HourFormat(selectedTimeValue)}
      />
<input 
  type="hidden" 
  name="location" 
  value={
    selectedTabValue === 'mb30' ? 'Nellis30' :
    selectedTabValue === 'mb60' ? 'Nellis60' :
    selectedTabValue === 'mb120' ? 'NellisDX' :
    selectedTabValue === 'atv30' ? 'DunesATV30' : 
    selectedTabValue === 'atv60' ? 'DunesATV60' :
    selectedTabValue === 'Valley of Fire' ? 'Valley' :
    selectedTabValue === 'Family Fun Romp' ? 'FamilyFun' : 'Nellis60'
  } 
/>

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
            </div>
          )}
          
          {/* Hidden input for hotel value */}
          <input
            type="hidden"
            name="hotel"
            value={freeShuttle ? selectedHotel : ''}
          />
        </div>
      </div>

      {/* Fleet Selection */}
      <div className="p-4 border rounded-lg shadow-sm w-auto">
        <h2 className="text-lg font-bold mb-3">Choose Your Adventure</h2>
        <FleetCarousel
          vehicleCounts={vehicleCounts}
          setVehicleCounts={setVehicleCounts}
          totalSeats={totalSeats}
          howManyPeople={bookInfo.howManyPeople}
          viewMode={viewMode}
          activeCategory={activeVehicleCategory}
          setActiveCategory={handleCategoryChange}
        />
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
          activeVehicleCategory={activeVehicleCategory}
          selectedTimeValue={selectedTimeValue}
          setSelectedTimeValue={setSelectedTimeValue}
          selectedTabValue={selectedTabValue}
          setSelectedTabValue={setSelectedTabValue}
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