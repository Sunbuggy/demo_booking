import { Dispatch, SetStateAction, useEffect, useMemo, useState, useRef } from 'react';
import { mbj_vehicles_list, atv_vehicles_list, vof_vehicles_list, ffr_vehicles_list, ama_vehicles_list } from '@/utils/helpers';
import { Reservation } from '@/app/(biz)/biz/types';
import { BookInfoType, ContactFom, HotelType } from './server-booking';
import ComboBox from '@/components/hotel-combo-box';
import { Checkbox } from '@/components/ui/checkbox';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import DatePicker from '@/app/(com)/book/date-picker';
import { Form } from '@/components/ui/form';
import { FleetCarousel } from './booking-selection';
import { BookingTabs, TabValue, VehicleCategory } from './booking-tabs';
import { CalendarDays, Car, Contact, Users, MapPin } from 'lucide-react';

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
    case 'Amargosa':
      return ama_vehicles_list;
    default:
      return mbj_vehicles_list;
  };
};

// Function to convert 24-hour format to display format
const convertToDisplayFormat = (time24: string): string => {
  if (!time24) return '';

  // Handle time strings like "08:00" or "8:00"
  const [hours, minutes] = time24.split(':');
  let hour = parseInt(hours, 10);
  const minute = parseInt(minutes, 10);

  const period = hour >= 12 ? 'pm' : 'am';
  const displayHour = hour % 12 || 12;

  return `${displayHour} ${period}`;
};

// Function to find matching display time with discount consideration
const findMatchingDisplayTime = (time24: string, timeArray: string[]): string => {
  const displayTime = convertToDisplayFormat(time24);

  // First try exact match
  const exactMatch = timeArray.find(time => time.startsWith(displayTime));
  if (exactMatch) return exactMatch;

  // If no exact match, return the display time without discount info
  return displayTime;
};

// --- THEME CONSTANTS (SEMANTIC UPDATE) ---
// Updated to use semantic classes as per guidelines
const SECTION_CARD_CLASS = "p-5 bg-card text-card-foreground border border-border rounded-xl shadow-sm";
const INPUT_CLASS = "w-full h-10 px-3 rounded-md border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all";
const LABEL_CLASS = "block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5";
const HEADER_CLASS = "text-lg font-bold text-foreground mb-4 flex items-center gap-2";

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
  onGeneratePayment,
  showPayment = false,
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
  onGeneratePayment?: () => void;
  showPayment?: boolean;
}) {
  // Use a ref to track the initial render and prevent infinite loops
  const isInitialRender = useRef(true);
  
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

  // Initialize selectedTabValue based on location
  useEffect(() => {
    if (initialData?.location) {
      let tab: TabValue = 'mb60';
      switch (initialData.location) {
        case 'Nellis30':
          tab = 'mb30';
          break;
        case 'Nellis60':
          tab = 'mb60';
          break;
        case 'NellisDX':
          tab = 'mb120';
          break;
        case 'DunesATV30':
          tab = 'atv30';
          break;
        case 'DunesATV60':
          tab = 'atv60';
          break;
        case 'ValleyOfFire':
          tab = 'Valley of Fire';
          break;
        case 'FamilyFun':
          tab = 'Family Fun Romp';
          break;
        case 'Amargosa':
          tab = 'Amargosa';
          break;
      }
      setSelectedTabValue(tab);
    }
  }, [initialData?.location, setSelectedTabValue]);

  // Initialize selectedTimeValue based on initial data
  useEffect(() => {
    if (initialData?.sch_time) {
      // Get the appropriate time array based on current tab
      const getTimeArrayForTab = (tab: TabValue): string[] => {
        switch (tab) {
          case 'mb30':
            return ['9 am (20% discount)', '11 am', '1 pm'];
          case 'mb60':
            return ['8 am (20% discount)', '10 am', '12 pm', '2 pm'];
          case 'mb120':
            return ['8 am', '10 am'];
          case 'atv30':
            return ['8 am', '10 am', '12 pm'];
          case 'atv60':
            return ['8 am', '10 am', '12 pm'];
          case 'Valley of Fire':
            return ['8 am'];
          case 'Family Fun Romp':
            return ['8 am (20% discount)', '10 am', '12 pm', '2 pm'];
          case 'Amargosa':
             return ['8 am'];
            default:
            return ['8 am (20% discount)', '10 am', '12 pm', '2 pm'];
        }
      };

      const timeArray = getTimeArrayForTab(selectedTabValue);
      const displayTime = findMatchingDisplayTime(initialData.sch_time, timeArray);
      setSelectedTimeValue(displayTime);
    }
  }, [initialData?.sch_time, selectedTabValue, setSelectedTimeValue]);

  // Watch for date changes in react-hook-form and update bookInfo
  const watchedDate = dateForm.watch('bookingDate');
  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }

    if (watchedDate && watchedDate.getTime() !== bookInfo.bookingDate.getTime()) {
      setBookInfo(prev => ({ 
        ...prev, 
        bookingDate: watchedDate 
      }));
    }
  }, [watchedDate]); 

  useEffect(() => {
    if (bookInfo.bookingDate && bookInfo.bookingDate.getTime() !== dateForm.getValues('bookingDate')?.getTime()) {
      dateForm.setValue('bookingDate', bookInfo.bookingDate);
    }
  }, []);

  // Update the total_cost hidden input whenever total_cost changes
  useEffect(() => {
    const totalCostInput = document.getElementById('total_cost') as HTMLInputElement;
    if (totalCostInput) {
      totalCostInput.value = total_cost.toString();
    }
  }, [total_cost]);

  // Function to convert display time back to 24-hour format for form submission
  const convertTo12HourFormat = (displayTime: string): string => {
    if (!displayTime) return '';

    // Extract the time part (remove discount info)
    const timePart = displayTime.split(' (')[0];
    const [time, period] = timePart.split(' ');
    let hour = parseInt(time, 10);

    // If it's PM and not 12, add 12 to convert to 24-hour temporarily
    // But we'll format it back to 12-hour in the server action
    if (period === 'pm' && hour !== 12) {
      hour += 12;
    } else if (period === 'am' && hour === 12) {
      hour = 0;
    }

    // Return in 24-hour format for consistent processing, server will convert to 12-hour
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
    return ['Mini Baja', 'ATV', 'Valley of Fire', 'Family Fun', 'Amargosa'].includes(category);
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

  // Helper function to get vehicle count by vehicle name
  const getVehicleCountByName = (vehicleName: string): number => {
    const vehicle = Object.values(vehicleCounts).find(
      v => v.name === vehicleName
    );
    return vehicle ? vehicle.count : 0;
  };

  return (
    // Updated root class to use semantic text color
    <div className="w-full space-y-6 text-foreground">

      {/* Hidden inputs for form submission */}
      <input
        type="hidden"
        name="sch_date"
        value={bookInfo.bookingDate.toISOString().split('T')[0]} //YYYY-MM-DD
      />

      <input
        type="hidden"
        name="sch_time"
        value={convertTo12HourFormat(selectedTimeValue)}
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
                    selectedTabValue === 'Valley of Fire' ? 'ValleyOfFire' :
                      selectedTabValue === 'Family Fun Romp' ? 'FamilyFun' :
                        selectedTabValue === 'Amargosa' ? 'Amargosa' : ''
        }
      />

      {/* Booking Section */}
      <div className={SECTION_CARD_CLASS}>
        <h2 className={HEADER_CLASS}>
          {/* Use primary color for icons */}
          <CalendarDays className="w-5 h-5 text-primary" />
          Booking Details
        </h2>

        <div className="space-y-4">
          <div>
            <label className={LABEL_CLASS}>Booking Date</label>
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
            <label className={LABEL_CLASS}>Number of People</label>
            <div className="relative">
              {/* Use muted-foreground for inactive icons */}
              <Users className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="number"
                name="ppl_count"
                value={bookInfo.howManyPeople}
                onChange={(e) => handleBookingChange('howManyPeople', parseInt(e.target.value) || 1)}
                min="1"
                className={`${INPUT_CLASS} pl-10`}
                disabled={viewMode}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="free-shuttle"
              checked={freeShuttle}
              onCheckedChange={viewMode ? undefined : (checked) => handleShuttleChange(checked === true)}
              disabled={viewMode}
              // Updated to use semantic border and primary background when checked
              className="border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
            />
            <label
              htmlFor="free-shuttle"
              // Updated to use semantic text color
              className="text-sm font-medium leading-none text-foreground cursor-pointer select-none"
            >
              Get Free Shuttle Pickup to Your Hotel
            </label>
          </div>

          {hotelsMemo && freeShuttle && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <label className={LABEL_CLASS}>Select Hotel</label>
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
          {/* Hidden Vehicle Counts */}
          <input type="hidden" name="QA" value={getVehicleCountByName('Medium size ATV')} />
          <input type="hidden" name="QB" value={getVehicleCountByName('Full size ATV')} />
          <input type="hidden" name="QU" value={0} />
          <input type="hidden" name="QL" value={0} />
          <input type="hidden" name="SB1" value={getVehicleCountByName('1 seat desert racer')} />
          <input type="hidden" name="SB2" value={getVehicleCountByName('2 seat desert racer')} />
          <input type="hidden" name="SB4" value={getVehicleCountByName('4 seat desert racer')} />
          <input type="hidden" name="SB5" value={0} />
          <input type="hidden" name="SB6" value={getVehicleCountByName('6 seat desert racer')} />
          <input type="hidden" name="twoSeat4wd" value={getVehicleCountByName('2 seat UTV')} />
          <input type="hidden" name="UZ2" value={0} />
          <input type="hidden" name="UZ4" value={0} />
          <input type="hidden" name="RWG" value={getVehicleCountByName('Ride with Guide')} />
          <input type="hidden" name="GoKartplus" value={0} />
          <input type="hidden" name="GoKart" value={0} />
          <input type="hidden" name="total_cost" value={total_cost} />
        </div>
      </div>

      {/* Fleet Selection */}
      <div className={SECTION_CARD_CLASS}>
        <h2 className={HEADER_CLASS}>
          <Car className="w-5 h-5 text-primary" />
          Choose Your Adventure
        </h2>
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
      <div className={SECTION_CARD_CLASS}>
        <h2 className={HEADER_CLASS}>
          <Contact className="w-5 h-5 text-primary" />
          Contact Information
        </h2>

        <div className="space-y-4">
          <div>
            <label className={LABEL_CLASS}>Full Name</label>
            <input
              type="text"
              name="full_name"
              value={contactForm.name}
              onChange={(e) => handleContactChange('name', e.target.value)}
              className={INPUT_CLASS}
              placeholder="Driver / Primary Contact"
              disabled={viewMode}
            />
          </div>

          <div>
            <label className={LABEL_CLASS}>Email</label>
            <input
              type="email"
              name="email"
              value={contactForm.email}
              onChange={(e) => handleContactChange('email', e.target.value)}
              className={INPUT_CLASS}
              placeholder="receipts@example.com"
              disabled={viewMode}
            />
          </div>

          <div>
            <label className={LABEL_CLASS}>Phone</label>
            <input
              type="tel"
              name="phone"
              value={contactForm.phone}
              onChange={(e) => handleContactChange('phone', e.target.value)}
              className={INPUT_CLASS}
              placeholder="(555) 123-4567"
              disabled={viewMode}
            />
          </div>

          <div>
            <label className={LABEL_CLASS}>Group Name (Optional)</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                name="occasion"
                value={contactForm.groupName || ''}
                onChange={(e) => handleContactChange('groupName', e.target.value)}
                className={`${INPUT_CLASS} pl-10`}
                placeholder="e.g. Smith Bachelor Party"
                disabled={viewMode}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="flex flex-col items-center gap-5 pt-2">
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
          initialData={initialData}
        />
      </div>
    </div>
  );
}