'use client';
import { SetStateAction, useEffect, useMemo, useState } from 'react';
import { CalendarFormEdit } from './booking-calendar';
import { mbj_vehicles_list } from '@/utils/helpers';
import { Reservation } from '@/app/(biz)/biz/types';

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

type BaseVehiclePricingType = {
  mb30: number;
  mb60: number;
  mb120: number;
};

export type VehiclePricingType = Partial<BaseVehiclePricingType>;
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

export function MiniBajaEditPage({ 
  hotels, 
  initialData, 
  viewMode = false 
}: { 
  hotels: HotelType[];
  initialData?: Reservation;
  viewMode?: boolean;
}) {
  const [selectedTabValue, setSelectedTabValue] = useState<'mb30' | 'mb60' | 'mb120'>('mb60');
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
  const [formToken, setFormToken] = useState(''); // Added formToken state

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

  useEffect(() => {
    if (initialData) {
      const bookingDate = initialData.sch_date ? new Date(initialData.sch_date) : new Date();
      
      setTotalPrice(initialData.total_cost ? Number(initialData.total_cost) : 0);

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

      setBookInfo({
        bookingDate,
        howManyPeople: initialData.ppl_count || 1
      });
      
      setContactForm({
        name: initialData.full_name || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        groupName: initialData.occasion || ''
      });
      
      const counts: VehicleCounts = {};
      mbj_vehicles_list.forEach(vehicle => {
        const key = vehicle.name.split(' ')[0].toLowerCase().replace('-', '');
        const count = initialData[key as keyof Reservation];
        if (count && Number(count) > 0) {
          counts[vehicle.id] = {
            isChecked: true,
            count: Number(count),
            name: vehicle.name,
            seats: vehicle.seats,
            pricing: vehicle.pricing
          };
        }
      });
      setVehicleCounts(counts);
      
      const locationTabMap: Record<string, 'mb30' | 'mb60' | 'mb120'> = {
        'Nellis30': 'mb30',
        'Nellis60': 'mb60',
        'NellisDX': 'mb120'
      };
      
      if (initialData.location) {
        const tabValue = locationTabMap[initialData.location] || 'mb60';
        setSelectedTabValue(tabValue);
      }
      
      if (initialData.sch_time) {
        const [hours, minutes] = initialData.sch_time.split(':');
        const hour = parseInt(hours, 10);
        const period = hour >= 12 ? 'pm' : 'am';
        const displayHour = hour % 12 || 12;
        setSelectedTimeValue(`${displayHour} ${period}`);
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
      />
    </div>
  );
}