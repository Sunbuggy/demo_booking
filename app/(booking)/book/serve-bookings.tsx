'use client';
import { useMemo, useState } from 'react';
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
  const [selectedTabValue, setSelectedTabValue] = useState('mb60');
  const [selectedTimeValue, setSelectedTimeValue] = useState('');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [hideForm, setHideForm] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState('');
  const [freeShuttle, setFreeShuttle] = useState<boolean>(true);
  const hotelsMemo = useMemo(() => hotels, [hotels]);
  const [bookInfo, setBookInfo] = useState({
    bookingDate: new Date(),
    howManyPeople: 1
  });
  return (
    <div className=" font-extrabold dark:text-white sm:text-center  flex flex-col justify-center items-center h-screen">
      <CalendarForm
        setUnblur={setUnblur}
        bookInfo={bookInfo}
        freeShuttle={freeShuttle}
        hideForm={hideForm}
        hotelsMemo={hotelsMemo}
        isCalendarOpen={isCalendarOpen}
        open={open}
        selectedHotel={selectedHotel}
        setBookInfo={setBookInfo}
        setFreeShuttle={setFreeShuttle}
        setHideForm={setHideForm}
        setIsCalendarOpen={setIsCalendarOpen}
        setOpen={setOpen}
        setSelectedHotel={setSelectedHotel}
      />
      <BookingTabs
        unblur={unblur}
        selectedTabValue={selectedTabValue}
        selectedTimeValue={selectedTimeValue}
        setSelectedTimeValue={setSelectedTimeValue}
        setSelectedTabValue={setSelectedTabValue}
      />
    </div>
  );
}
