'use client';
import { SetStateAction, useEffect, useMemo, useState } from 'react';
import { CalendarFormEdit } from './booking-calendar';
import { mbj_vehicles_list, atv_vehicles_list, vof_vehicles_list, ffr_vehicles_list, atv30_open_times, atv60_open_times } from '@/utils/helpers';
import { Reservation } from '@/app/(biz)/biz/types';
import { TabValue, VehicleCategory } from './booking-tabs';

export interface HotelType {
  Hotel_ID: number;
  Hotel_Name: string;
  Hotel_Phone: string;
  Hotel_Address: string;
  Pickup_Location: string;
  Contact_Person: string;
}

export interface BookInfoType {
  bookingDate: Date;
  howManyPeople: number;
}

// More flexible pricing type that can handle all vehicle categories
export type VehiclePricingType = {
  [key: string]: number | string | undefined;
  mb30?: number;
  mb60?: number;
  mb120?: number;
  full_atv?: number;
  desert_racer?: number;
  price?: number;
  name?: string;
};

export interface VehicleCount {
  isChecked: boolean;
  count: number;
  name: string;
  seats: number;
  pricing: VehiclePricingType;
}

export interface ContactFom {
  name: string;
  email: string;
  phone: string;
  groupName?: string;
}

export interface VehicleCounts {
  [vehicleId: number]: VehicleCount;
}

export function BookingEditPage({ 
  hotels, 
  initialData, 
  viewMode = false 
}: { 
  hotels: HotelType[];
  initialData?: Reservation;
  viewMode?: boolean;
}) {
  const [selectedTabValue, setSelectedTabValue] = useState<TabValue>('mb60');
  const [selectedTimeValue, setSelectedTimeValue] = useState('');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState('');
  const [freeShuttle, setFreeShuttle] = useState<boolean>(true);
  const [vehicleCounts, setVehicleCounts] = useState<VehicleCounts>({});
  const [totalSeats, setTotalSeats] = useState(0);
  const [totalPrice, setTotalPrice] = useState(
    initialData?.total_cost ? Number(initialData.total_cost) : 0
  );
  const [formToken, setFormToken] = useState('');
  const [activeVehicleCategory, setActiveVehicleCategory] = useState<VehicleCategory>('Mini Baja');

  const [contactForm, setContactForm] = useState<ContactFom>({
    name: '',
    email: '',
    phone: '',
    groupName: ''
  });
  const [bookInfo, setBookInfo] = useState({
    bookingDate: new Date(),
    howManyPeople: 1
  });
  const hotelsMemo = useMemo(() => hotels, [hotels]);

  useEffect(() => {
    const total = Object.values(vehicleCounts).reduce(
      (acc, { count, seats }) => acc + count * seats,
      0
    );
    setTotalSeats(total);
  }, [vehicleCounts]);

  // Get all vehicle lists combined for mapping reservation data
  const getAllVehicles = () => {
    return [
      ...mbj_vehicles_list,
      ...atv_vehicles_list,
      ...vof_vehicles_list,
      ...ffr_vehicles_list
    ];
  };

  // Function to convert 24-hour time to display format (like "9 am", "2 pm")
  const convertToDisplayTime = (time24: string): string => {
    if (!time24) return '';
    
    // Handle cases where time might already be in display format
    if (time24.includes('am') || time24.includes('pm')) {
      return time24;
    }
    
    // Convert HH:MM to display format
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours, 10);
    const period = hour >= 12 ? 'pm' : 'am';
    const displayHour = hour % 12 || 12;
    
    return `${displayHour} ${period}`;
  };

  // Function to find the exact time string from time arrays that matches the reservation time
  const findMatchingTimeString = (time24: string, tabValue: TabValue): string => {
    if (!time24) return '';
    
    const displayTime = convertToDisplayTime(time24);
    
    // Import time arrays
    const { 
      mb30_open_times, 
      mb60_open_times, 
      mb120_open_times, 
      atv_open_times, 
      vof_open_times, 
      ffr_open_times 
    } = require('@/utils/helpers');
    
    let timeArray: string[] = [];
    
    switch (tabValue) {
      case 'mb30':
        timeArray = mb30_open_times;
        break;
      case 'mb60':
        timeArray = mb60_open_times;
        break;
      case 'mb120':
        timeArray = mb120_open_times;
        break;
      case 'atv30':
        timeArray = atv30_open_times;
        break;
      case 'atv60':
        timeArray = atv60_open_times;
        break;
      case 'Valley of Fire':
        timeArray = vof_open_times;
        break;
      case 'Family Fun Romp':
        timeArray = ffr_open_times;
        break;
      default:
        timeArray = mb60_open_times;
    }
    
    // Try to find exact match first
    const exactMatch = timeArray.find(time => 
      time.toLowerCase().includes(displayTime.toLowerCase())
    );
    
    if (exactMatch) return exactMatch;
    
    // If no exact match, return the display time
    return displayTime;
  };

  const getVehicleFieldMapping = () => {
    return {
      // Mini Baja vehicles
      'SB1': '1 seat desert racer',
      'SB2': '2 seat desert racer', 
      'SB4': '4 seat desert racer',
      'SB6': '6 seat desert racer',
      'RWG': 'Ride with Guide',
      
      // ATV vehicles - fixed syntax for QB mapping
      'QB': 'Full ATV',
      'QA': 'Medium ATV',
      
      // Valley of Fire vehicles
      'twoSeat4wd': '2 seat UTV',
    };
  };

  // Reverse mapping: vehicle name to database field
  const getReverseFieldMapping = () => {
    const mapping: { [key: string]: string } = {};
    const fieldMapping = getVehicleFieldMapping();
    
    Object.entries(fieldMapping).forEach(([field, vehicleName]) => {
      mapping[vehicleName] = field;
    });
    
    return mapping;
  };

  useEffect(() => {
    if (initialData) {
      console.log('Initial data loaded:', initialData);
      
      const bookingDate = initialData.sch_date ? new Date(initialData.sch_date) : new Date();
      
      setTotalPrice(initialData.total_cost ? Number(initialData.total_cost) : 0);

      // Hotel/shuttle logic
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

      // Booking info
      setBookInfo({
        bookingDate,
        howManyPeople: initialData.ppl_count || 1
      });
      
      // Contact information
      setContactForm({
        name: initialData.full_name || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        groupName: initialData.occasion || ''
      });
      
      // Map vehicle counts from reservation data using field mapping
      const counts: VehicleCounts = {};
      const allVehicles = getAllVehicles();
      const fieldMapping = getVehicleFieldMapping();
      const reverseMapping = getReverseFieldMapping();
      
      console.log('Mapping vehicle counts from reservation...');
      
      // First, map database fields to vehicles
      Object.entries(fieldMapping).forEach(([field, vehicleName]) => {
        const count = initialData[field as keyof Reservation];
        
        if (count !== undefined && count !== null && Number(count) > 0) {
          // Find the vehicle by name
          let vehicle;
          if (field === 'QB') {
            // For QB field, check for both possible vehicle names
            vehicle = allVehicles.find(v => 
              v.name === 'Full ATV' || v.name === 'Full size ATV' || v.name === '1 Seat full ATV'
            );
          } else {
            vehicle = allVehicles.find(v => v.name === vehicleName);
          }
          
          if (vehicle) {
            counts[vehicle.id] = {
              isChecked: true,
              count: Number(count),
              name: vehicle.name,
              seats: vehicle.seats,
              pricing: vehicle.pricing as VehiclePricingType
            };
            console.log(`Mapped ${field}: ${count} -> ${vehicle.name}`);
          }
        }
      });
      
      console.log('Final vehicle counts:', counts);
      setVehicleCounts(counts);
      
      // Set location-based tab and category
      const locationTabMap: Record<string, TabValue> = {
        'Nellis30': 'mb30',
        'Nellis60': 'mb60',
        'NellisDX': 'mb120',
        'DunesATV30': 'atv30',
        'DunesATV60': 'atv60',
        'ValleyOfFire': 'Valley of Fire',
        'FamilyFun': 'Family Fun Romp'
      };
      
      const locationCategoryMap: Record<string, VehicleCategory> = {
        'Nellis30': 'Mini Baja',
        'Nellis60': 'Mini Baja',
        'NellisDX': 'Mini Baja',
        'DunesATV30': 'ATV',
        'DunesATV60': 'ATV',
        'ValleyOfFire': 'Valley of Fire',
        'FamilyFun': 'Family Fun'
      };
      
      if (initialData.location) {
        const tabValue = locationTabMap[initialData.location] || 'mb60';
        const category = locationCategoryMap[initialData.location] || 'Mini Baja';
        console.log(`Setting tab to ${tabValue} and category to ${category} based on location ${initialData.location}`);
        
        setSelectedTabValue(tabValue);
        setActiveVehicleCategory(category);
        
        // Set the time using the exact format from time arrays
        if (initialData.sch_time) {
          const matchingTime = findMatchingTimeString(initialData.sch_time, tabValue);
          console.log(`Setting time: ${initialData.sch_time} -> ${matchingTime}`);
          setSelectedTimeValue(matchingTime);
        } else {
          console.log('No time found in reservation');
        }
      }
    }
  }, [initialData]);

  return (
    <div className="font-extrabold dark:text-white sm:text-center flex flex-col justify-center w-full items-center h-fit">
      <CalendarFormEdit
        bookInfo={bookInfo}
        freeShuttle={freeShuttle}
        hotelsMemo={hotelsMemo}
        isCalendarOpen={isCalendarOpen}
        open={open}
        selectedHotel={selectedHotel}
        setBookInfo={setBookInfo}
        setFreeShuttle={setFreeShuttle}
        setIsCalendarOpen={setIsCalendarOpen}
        setOpen={setOpen}
        setSelectedHotel={setSelectedHotel}
        setSelectedTimeValue={setSelectedTimeValue}
        setVehicleCounts={setVehicleCounts}
        vehicleCounts={vehicleCounts}
        totalSeats={totalSeats}
        setSelectedTabValue={setSelectedTabValue}
        selectedTabValue={selectedTabValue}
        selectedTimeValue={selectedTimeValue}
        total_cost={totalPrice}
        settotal_cost={setTotalPrice}
        contactForm={contactForm}
        setContactForm={setContactForm}
        formToken={formToken}
        viewMode={viewMode}
        initialData={initialData}
        activeVehicleCategory={activeVehicleCategory}
        setActiveVehicleCategory={setActiveVehicleCategory}
      />
    </div>
  );
}