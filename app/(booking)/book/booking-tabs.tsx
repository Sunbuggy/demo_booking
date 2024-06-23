import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import TimePicker from '../../../components/time-picker';
import {
  mb120_open_times,
  mb30_open_times,
  mb60_open_times
} from '@/utils/helpers';
import { AddedBookingsType, BookInfoType } from './serve-bookings';
import { mbj_vehicles_list } from '@/utils/helpers';
import { AddVehicleDemo } from './popover';
import { PriceBreakdownDropdown } from './breakdown-dropdown';

interface TabData {
  value: string;
  title: string;
  description: string;
  content: React.ReactNode;
}

export function BookingTabs({
  unblur,
  selectedTimeValue,
  setSelectedTimeValue,
  selectedTabValue,
  setSelectedTabValue,
  setShowPricing,
  bookInfo,
  showPricing,
  addedBookings,
  setAddedBookings
}: {
  unblur: boolean;
  selectedTimeValue: string;
  setSelectedTimeValue: React.Dispatch<React.SetStateAction<string>>;
  selectedTabValue: 'mb30' | 'mb60' | 'mb120';
  setSelectedTabValue: React.Dispatch<
    React.SetStateAction<'mb30' | 'mb60' | 'mb120'>
  >;
  setShowPricing: React.Dispatch<React.SetStateAction<boolean>>;
  bookInfo: BookInfoType;
  showPricing: boolean;
  addedBookings: AddedBookingsType;
  setAddedBookings: React.Dispatch<React.SetStateAction<AddedBookingsType>>;
}) {
  const tabsData = [
    {
      value: 'mb30',
      title: '30 minutes',
      name: 'MiniBaja 1/4 Chase',
      description: 'Chase in the dunes for 30 minutes',
      content: '30 minutes content'
    },
    {
      value: 'mb60',
      title: '60 minutes',
      name: 'MiniBaja 1/2 Chase',
      description: '60 mins',
      content: 'MB60 content'
    },
    {
      value: 'mb120',
      title: '120 minutes',
      name: 'MiniBaja Full Chase',
      description: '120 mins',
      content: 'MB120 content'
    }
  ];

  function calculateTotalSeats(bookings: AddedBookingsType): number {
    let totalSeats = 0;

    // Iterate over each booking type
    Object.values(bookings).forEach((bookingArray) => {
      // Check if the booking type exists
      if (bookingArray) {
        // Add the seats from each booking in the array
        bookingArray.forEach((booking: any) => {
          totalSeats += booking.seats;
        });
      }
    });

    return totalSeats;
  }

  function calculateTotalPrice(bookings: AddedBookingsType): number {
    let totalPrice = 0;

    // Iterate over each booking type
    Object.values(bookings).forEach((bookingArray) => {
      // Check if the booking type exists
      if (bookingArray) {
        // Calculate the price for each booking in the array
        bookingArray.forEach((booking: any) => {
          totalPrice += booking.quantity * booking.price;
        });
      }
    });

    return totalPrice;
  }

  // Wrapper function to ensure type safety
  const handleTabChange = (value: string) => {
    if (value === 'mb30' || value === 'mb60' || value === 'mb120') {
      setSelectedTabValue(value);
    }
  };
  return (
    <div className={unblur ? 'blur-none' : 'blur-sm pointer-events-none'}>
      <Tabs
        defaultValue={selectedTabValue}
        className="w-[350px]"
        onValueChange={handleTabChange}
        value={selectedTabValue}
      >
        <TabsList className="grid w-full grid-cols-3">
          {tabsData.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.title}
            </TabsTrigger>
          ))}
        </TabsList>
        {tabsData.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            <Card>
              <CardHeader>
                <CardTitle>{tab.name}</CardTitle>
                <CardDescription>{tab.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 flex flex-col items-center">
                <TimePicker
                  selectValue={selectedTimeValue}
                  setSelectValue={(value) => {
                    setSelectedTimeValue(value);
                    setShowPricing(true);
                  }}
                  timeArray={
                    tab.value === 'mb30'
                      ? mb30_open_times
                      : tab.value === 'mb60'
                        ? mb60_open_times
                        : mb120_open_times
                  }
                />
                <p>Group Size: {bookInfo.howManyPeople}</p>
                <p className="text-green-500">
                  Reserved Seats:{' '}
                  <span
                    className={
                      bookInfo.howManyPeople <=
                      calculateTotalSeats(addedBookings)
                        ? 'text-green-500'
                        : 'text-red-500'
                    }
                  >
                    {calculateTotalSeats(addedBookings)}
                  </span>
                </p>
                {/* <p className="text-green-600">
                  <span
                    className={
                      Number(addedInBooked) == bookInfo.howManyPeople
                        ? 'text-green-600'
                        : 'text-red-600'
                    }
                  >
                    Booked: {Number(addedInBooked)}
                  </span>
                </p> */}
                {showPricing ? (
                  <div className="flex flex-col items-center gap-2">
                    {mbj_vehicles_list.map((itm) => {
                      // Determine the pricing based on the tab value
                      const pricing =
                        tab.value === 'mb30'
                          ? itm.pricing.mb30
                          : tab.value === 'mb60'
                            ? itm.pricing.mb60
                            : itm.pricing.mb120;

                      const seats = itm.seats;

                      // Only render the item if pricing exists
                      if (pricing) {
                        return (
                          <div
                            key={itm.id}
                            className="flex gap-2 justify-between w-full"
                          >
                            <p># {itm.name}s</p>
                            <p>: ${pricing}</p>
                            <AddVehicleDemo
                              name={itm.name}
                              totlalPeople={bookInfo.howManyPeople}
                              setAddedBookings={setAddedBookings}
                              selectedTabValue={selectedTabValue}
                              addedBookings={addedBookings}
                              pricing={pricing}
                              seats={seats}
                            />
                          </div>
                        );
                      }

                      // Return null if pricing does not exist, so nothing is rendered
                      return null;
                    })}
                    <div className="flex flex-col gap-2">
                      {addedBookings && (
                        <PriceBreakdownDropdown addedBookings={addedBookings} />
                      )}
                      Total Price: ${calculateTotalPrice(addedBookings)}
                    </div>
                  </div>
                ) : (
                  <></>
                )}
              </CardContent>
              <CardFooter className="w-full flex justify-end">
                <Button
                  disabled={
                    bookInfo.howManyPeople > calculateTotalSeats(addedBookings)
                  }
                >
                  Book
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
