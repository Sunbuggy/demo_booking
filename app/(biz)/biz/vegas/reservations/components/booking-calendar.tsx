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
import { CalendarDays, Car, Users, MapPin, PartyPopper, Minus, Plus } from 'lucide-react';
import { ContactInfoSection } from './contact-info-section';

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
  const [hours, minutes] = time24.split(':');
  let hour = parseInt(hours, 10);
  const period = hour >= 12 ? 'pm' : 'am';
  const displayHour = hour % 12 || 12;
  return `${displayHour} ${period}`;
};

// Function to find matching display time with discount consideration
const findMatchingDisplayTime = (time24: string, timeArray: string[]): string => {
  const displayTime = convertToDisplayFormat(time24);
  const exactMatch = timeArray.find(time => time.startsWith(displayTime));
  if (exactMatch) return exactMatch;
  return displayTime;
};

// --- THEME CONSTANTS (SEMANTIC) ---
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
  const isInitialRender = useRef(true);
  
  const dateForm = useForm<z.infer<typeof DateFormSchema>>({
    resolver: zodResolver(DateFormSchema),
    defaultValues: {
      bookingDate: bookInfo.bookingDate
    }
  });

  const location = initialData?.location || 'Nellis60';
  const currentVehicleList = useMemo(() => getVehicleListByLocation(location), [location]);

  // --- Logic Hooks ---
  useEffect(() => {
    if (initialData?.location) {
      let tab: TabValue = 'mb60';
      switch (initialData.location) {
        case 'Nellis30': tab = 'mb30'; break;
        case 'Nellis60': tab = 'mb60'; break;
        case 'NellisDX': tab = 'mb120'; break;
        case 'DunesATV30': tab = 'atv30'; break;
        case 'DunesATV60': tab = 'atv60'; break;
        case 'ValleyOfFire': tab = 'Valley of Fire'; break;
        case 'FamilyFun': tab = 'Family Fun Romp'; break;
        case 'Amargosa': tab = 'Amargosa'; break;
      }
      setSelectedTabValue(tab);
    }
  }, [initialData?.location, setSelectedTabValue]);

  useEffect(() => {
    if (initialData?.sch_time) {
      const getTimeArrayForTab = (tab: TabValue): string[] => {
        if (tab === 'mb30') return ['9 am (20% discount)', '11 am', '1 pm'];
        if (tab === 'mb60' || tab === 'Family Fun Romp') return ['8 am (20% discount)', '10 am', '12 pm', '2 pm'];
        if (tab === 'mb120' || tab === 'atv30' || tab === 'atv60') return ['8 am', '10 am', '12 pm'];
        if (tab === 'Valley of Fire' || tab === 'Amargosa') return ['8 am'];
        return ['8 am (20% discount)', '10 am', '12 pm', '2 pm'];
      };
      const timeArray = getTimeArrayForTab(selectedTabValue);
      const displayTime = findMatchingDisplayTime(initialData.sch_time, timeArray);
      setSelectedTimeValue(displayTime);
    }
  }, [initialData?.sch_time, selectedTabValue, setSelectedTimeValue]);

  const watchedDate = dateForm.watch('bookingDate');
  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }
    if (watchedDate && watchedDate.getTime() !== bookInfo.bookingDate.getTime()) {
      setBookInfo(prev => ({ ...prev, bookingDate: watchedDate }));
    }
  }, [watchedDate]); 

  useEffect(() => {
    if (bookInfo.bookingDate && bookInfo.bookingDate.getTime() !== dateForm.getValues('bookingDate')?.getTime()) {
      dateForm.setValue('bookingDate', bookInfo.bookingDate);
    }
  }, []);

  useEffect(() => {
    const totalCostInput = document.getElementById('total_cost') as HTMLInputElement;
    if (totalCostInput) totalCostInput.value = total_cost.toString();
  }, [total_cost]);

  // --- Handlers ---
  const convertTo12HourFormat = (displayTime: string): string => {
    if (!displayTime) return '';
    const timePart = displayTime.split(' (')[0];
    const [time, period] = timePart.split(' ');
    let hour = parseInt(time, 10);
    if (period === 'pm' && hour !== 12) hour += 12;
    else if (period === 'am' && hour === 12) hour = 0;
    return `${hour.toString().padStart(2, '0')}:00`;
  };

  const handleCategoryChange = (category: string) => {
    if (['Mini Baja', 'ATV', 'Valley of Fire', 'Family Fun', 'Amargosa'].includes(category)) {
      setActiveVehicleCategory(category as VehicleCategory);
    }
  };

  const handleBookingChange = (field: keyof BookInfoType, value: any) => {
    setBookInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleContactChange = (field: keyof ContactFom, value: string) => {
    setContactForm(prev => ({ ...prev, [field]: value }));
  };

  const handleShuttleChange = (checked: boolean) => {
    setFreeShuttle(checked);
    if (!checked) setSelectedHotel('');
  };

  const getVehicleCountByName = (vehicleName: string): number => {
    const vehicle = Object.values(vehicleCounts).find(v => v.name === vehicleName);
    return vehicle ? vehicle.count : 0;
  };

  return (
    <div className="w-full space-y-6 text-foreground">

      {/* Hidden inputs for form submission */}
      <input type="hidden" name="sch_date" value={bookInfo.bookingDate.toISOString().split('T')[0]} />
      <input type="hidden" name="sch_time" value={convertTo12HourFormat(selectedTimeValue)} />
      <input type="hidden" name="location" value={
          selectedTabValue === 'mb30' ? 'Nellis30' :
          selectedTabValue === 'mb60' ? 'Nellis60' :
          selectedTabValue === 'mb120' ? 'NellisDX' :
          selectedTabValue === 'atv30' ? 'DunesATV30' :
          selectedTabValue === 'atv60' ? 'DunesATV60' :
          selectedTabValue === 'Valley of Fire' ? 'ValleyOfFire' :
          selectedTabValue === 'Family Fun Romp' ? 'FamilyFun' :
          selectedTabValue === 'Amargosa' ? 'Amargosa' : ''
      } />

      {/* 1. CONTACT INFORMATION (User Check) */}
      <ContactInfoSection 
        contactForm={contactForm} 
        setContactForm={setContactForm} 
        viewMode={viewMode} 
      />

      {/* 2. BOOKING DETAILS */}
      <div className={SECTION_CARD_CLASS}>
        <h2 className={HEADER_CLASS}>
          <CalendarDays className="w-5 h-5 text-primary" />
          Booking Details
        </h2>

        <div className="space-y-4">
          
          {/* GROUP NAME (Event Title) */}
          <div>
            <label className={LABEL_CLASS}>Group Name (Optional)</label>
            <div className="relative">
              <PartyPopper className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                name="occasion"
                value={contactForm.groupName || ''}
                onChange={(e) => handleContactChange('groupName', e.target.value)}
                className={`${INPUT_CLASS} pl-10`}
                placeholder="e.g. Jerry's Birthday Bash"
                disabled={viewMode}
              />
            </div>
          </div>

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

          {/* NUMBER OF PEOPLE - STEPPER UI */}
          <div>
            <label className={LABEL_CLASS}>Number of People</label>
            <div className="flex items-center gap-0 w-full h-12 rounded-md border border-input bg-background overflow-hidden focus-within:ring-2 focus-within:ring-primary/50 transition-all">
              {/* Decrement Button */}
              <button
                type="button"
                onClick={() => {
                  const newVal = Math.max(1, bookInfo.howManyPeople - 1);
                  handleBookingChange('howManyPeople', newVal);
                }}
                disabled={viewMode || bookInfo.howManyPeople <= 1}
                className="h-full w-14 flex items-center justify-center bg-accent/30 hover:bg-accent text-foreground disabled:opacity-30 disabled:hover:bg-transparent border-r border-input transition-colors"
                aria-label="Decrease number of people"
              >
                <Minus className="w-5 h-5" />
              </button>

              {/* Icon & Input */}
              <div className="flex-1 flex items-center justify-center relative h-full">
                <Users className="w-4 h-4 text-muted-foreground absolute left-3 md:left-6" />
                <input
                  type="number"
                  name="ppl_count"
                  value={bookInfo.howManyPeople}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    handleBookingChange('howManyPeople', Math.max(1, val));
                  }}
                  min="1"
                  disabled={viewMode}
                  className="w-full h-full text-center bg-transparent border-none focus:ring-0 text-foreground font-semibold text-lg"
                />
              </div>

              {/* Increment Button */}
              <button
                type="button"
                onClick={() => {
                  handleBookingChange('howManyPeople', bookInfo.howManyPeople + 1);
                }}
                disabled={viewMode}
                className="h-full w-14 flex items-center justify-center bg-accent/30 hover:bg-accent text-foreground disabled:opacity-30 disabled:hover:bg-transparent border-l border-input transition-colors"
                aria-label="Increase number of people"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="free-shuttle"
              checked={freeShuttle}
              onCheckedChange={viewMode ? undefined : (checked) => handleShuttleChange(checked === true)}
              disabled={viewMode}
              className="border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
            />
            <label
              htmlFor="free-shuttle"
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

          <input type="hidden" name="hotel" value={freeShuttle ? selectedHotel : ''} />
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

      {/* 3. FLEET SELECTION */}
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

      {/* 4. PRICING */}
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