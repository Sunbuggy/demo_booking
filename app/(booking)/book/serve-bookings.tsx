'use client';
import { useEffect, useMemo, useState } from 'react';
import { CalendarForm } from './booking-calendar';
import { BookingTabs } from './booking-tabs';
import Button from '@/components/ui/Button';

export interface HotelType {
  Hotel_ID: number;
  Hotel_Name: string;
  Hotel_Phone: string;
  Hotel_Address: string;
  Pickup_Location: string;
  Contact_Person: string;
}

export interface AddedBookingsType {
  mb30?: {
    vehicle: string;
    quantity: number;
    price: number;
    seats: number;
  }[];
  mb60?: {
    vehicle: string;
    quantity: number;
    price: number;
    seats: number;
  }[];
  mb120?: {
    vehicle: string;
    quantity: number;
    price: number;
    seats: number;
  }[];
}
export interface BookInfoType {
  bookingDate: Date;
  howManyPeople: number;
}

export function MiniBajaPage({ hotels }: { hotels: HotelType[] }) {
  const [unblur, setUnblur] = useState(false);
  const [selectedTabValue, setSelectedTabValue] = useState<
    'mb30' | 'mb60' | 'mb120'
  >('mb60');
  const [selectedTimeValue, setSelectedTimeValue] = useState('');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [hideForm, setHideForm] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState('');
  const [freeShuttle, setFreeShuttle] = useState<boolean>(true);
  const [showPricing, setShowPricing] = useState(false);
  const [addedBookings, setAddedBookings] = useState<AddedBookingsType>({});
  const [bookInfo, setBookInfo] = useState({
    bookingDate: new Date(),
    howManyPeople: 1
  });
  const hotelsMemo = useMemo(() => hotels, [hotels]);

  useEffect(() => {
    console.log(addedBookings);
  }, [addedBookings]);

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
        setShowPricing={setShowPricing}
        setSelectedTimeValue={setSelectedTimeValue}
      />
      <BookingTabs
        unblur={unblur}
        selectedTabValue={selectedTabValue}
        selectedTimeValue={selectedTimeValue}
        bookInfo={bookInfo}
        setSelectedTimeValue={setSelectedTimeValue}
        setSelectedTabValue={setSelectedTabValue}
        setShowPricing={setShowPricing}
        showPricing={showPricing}
        addedBookings={addedBookings}
        setAddedBookings={setAddedBookings}
      />
      {/* {showPricing && (
        <div className="flex flex-col items-center gap-5">
          <h1 className="text-xl font-bold">Summary</h1>
          <p>Hotel: {selectedHotel}</p>
          <p>
            Booking Date:{' '}
            {new Date(bookInfo.bookingDate).toLocaleDateString('en-US', {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}
          </p>{' '}
          <p>How many people: {bookInfo.howManyPeople}</p>
          <p>Time: {selectedTimeValue}</p>
          <Button
            onClick={() => {
              setShowPricing(false);
            }}
          >
            Dismiss
          </Button>
        </div>
      )} */}
    </div>
  );
}
