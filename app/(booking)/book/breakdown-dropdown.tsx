'use client';

import * as React from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { AddedBookingsType } from './serve-bookings';
interface BreakdownProps {
  addedBookings: AddedBookingsType; // Assuming AddedBookingsType is already defined
}

export const PriceBreakdownDropdown: React.FC<BreakdownProps> = ({
  addedBookings
}) => {
  // Initialize totalAmount to 0
  let totalAmount = 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Show Breakdown</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>Break Down</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div>
          {Object.values(addedBookings).map(
            (bookingArray, index) =>
              bookingArray &&
              bookingArray.map((booking: any, bookingIndex: number) => {
                // Calculate the amount for this booking and add it to totalAmount
                const amount = booking.quantity * booking.price;
                totalAmount += amount;

                return (
                  <div
                    key={`${index}-${bookingIndex}`}
                    className="flex justify-between"
                  >
                    <p>
                      {booking.vehicle} x {booking.quantity}
                    </p>
                    <p>${amount}</p>
                  </div>
                );
              })
          )}
        </div>
        {/* Display the total amount */}
        <div className="flex justify-between font-bold mt-2">
          <hr className="h-px my-8 dark:bg-gray-200 border-0 bg-gray-700" />
          <p>Total</p>
          <p>${totalAmount}</p>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
