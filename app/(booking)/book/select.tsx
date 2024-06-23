import * as React from 'react';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { AddedBookingsType } from './serve-bookings';

export function NumberPicker({
  totlalPeople,
  name,
  setAddedBookings,
  selectedTabValue,
  addedBookings,
  pricing,
  seats
}: {
  totlalPeople: number;
  name: string;
  setAddedBookings: React.Dispatch<React.SetStateAction<AddedBookingsType>>;
  selectedTabValue: 'mb30' | 'mb60' | 'mb120';
  addedBookings: AddedBookingsType;
  pricing: number;
  seats: number;
}) {
  const numbers = Array.from({ length: totlalPeople + 1 }, (_, i) => i);
  return (
    // <Select onValueChange={setAddedInBooked} value={addedInBooked}>
    <Select
      onValueChange={(value) => {
        console.log('selected value', value);
        try {
          setAddedBookings((prev) => {
            console.log('prev', prev);
            // Retrieve current bookings for the selected tab or initialize if undefined
            const currentBookings = prev[selectedTabValue] || [];
            // Find the index of the booking with the same vehicle name
            const bookingIndex = currentBookings.findIndex(
              (item) => item.vehicle === name
            );

            let newBookings;
            if (bookingIndex > -1) {
              // Vehicle exists, update its quantity
              newBookings = [...currentBookings];
              newBookings[bookingIndex] = {
                ...newBookings[bookingIndex],
                quantity: Number(value),
                price: pricing,
                seats: seats * Number(value)
              };
            } else {
              // Vehicle doesn't exist, add a new booking
              newBookings = [
                ...currentBookings,
                {
                  vehicle: name,
                  quantity: Number(value),
                  price: pricing,
                  seats: seats * Number(value)
                }
              ];
            }

            // Return the updated state with the new bookings for the selected tab
            return {
              ...prev,
              [selectedTabValue]: newBookings
            };
          });
        } catch (error) {
          console.error(error);
        }
      }}
      value={
        addedBookings[selectedTabValue]
          ?.find((item) => item.vehicle === name)
          ?.quantity.toString() || ''
      }
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select a number" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel></SelectLabel>
          {numbers.map((number) => (
            <SelectItem key={number} value={String(number)}>
              {number}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
