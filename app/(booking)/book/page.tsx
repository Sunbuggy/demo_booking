'use client';
import { useState } from 'react';
import { CalendarForm } from './booking-calendar';
import { BookingTabs } from './booking-tabs';

export default function BookPage() {
  const [unblur, setUnblur] = useState(false);
  return (
    <div className=" font-extrabold text-white sm:text-center  flex flex-col justify-center items-center h-screen">
      <CalendarForm setUnblur={setUnblur} />
      <BookingTabs unblur={unblur} />
    </div>
  );
}
