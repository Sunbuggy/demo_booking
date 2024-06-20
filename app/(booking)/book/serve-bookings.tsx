'use client';
import { useState } from 'react';
import { CalendarForm } from './booking-calendar';
import { BookingTabs } from './booking-tabs';

export interface HotelType {
  Hotel_ID: number;
  Hotel_Name: string;
  Hotel_Phone: string;
  Hotel_Address: string;
  Pickup_Location: string;
  Contact_Person: string;
}

export function MiniBajaPage({ hotels }: { hotels: HotelType[] }) {
  const [unblur, setUnblur] = useState(false);
  return (
    <div className=" font-extrabold dark:text-white sm:text-center  flex flex-col justify-center items-center h-screen">
      <CalendarForm setUnblur={setUnblur} hotels={hotels} />
      <BookingTabs unblur={unblur} />
    </div>
  );
}
