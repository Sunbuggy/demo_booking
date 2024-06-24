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
import { VehicleCounts } from './serve-bookings';
import { PriceBreakdownDropdown } from './breakdown-dropdown';

interface TabData {
  value: string;
  title: string;
  description: string;
  content: React.ReactNode;
}

export function BookingTabs({
  selectedTimeValue,
  setSelectedTimeValue,
  selectedTabValue,
  setSelectedTabValue,
  vehicleCounts,
  totalPrice,
  setTotalPrice
}: {
  selectedTimeValue: string;
  setSelectedTimeValue: React.Dispatch<React.SetStateAction<string>>;
  selectedTabValue: 'mb30' | 'mb60' | 'mb120';
  setSelectedTabValue: React.Dispatch<
    React.SetStateAction<'mb30' | 'mb60' | 'mb120'>
  >;
  vehicleCounts: VehicleCounts;
  totalPrice: number;
  setTotalPrice: React.Dispatch<React.SetStateAction<number>>;
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
      description: 'Chase in the dunes for 1 hour',
      content: 'MB60 content'
    },
    {
      value: 'mb120',
      title: '120 minutes',
      name: 'MiniBaja Full Chase',
      description: 'Chase in the dunes for 2 hours',
      content: 'MB120 content'
    }
  ];

  // Wrapper function to ensure type safety
  const handleTabChange = (value: string) => {
    if (value === 'mb30' || value === 'mb60' || value === 'mb120') {
      setSelectedTabValue(value);
      setTotalPrice(0);
      setSelectedTimeValue('');
    }
  };

  return (
    <div>
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
                  }}
                  timeArray={
                    tab.value === 'mb30'
                      ? mb30_open_times
                      : tab.value === 'mb60'
                        ? mb60_open_times
                        : mb120_open_times
                  }
                />

                {!selectedTimeValue && <p>Pick a time to calculate price</p>}
                {selectedTimeValue && (
                  <div>
                    {Number(selectedTimeValue.split(' ')[0]) < 10 &&
                    selectedTimeValue.split(' ')[1] === 'am' &&
                    (selectedTabValue === 'mb60' ||
                      selectedTabValue === 'mb30') ? (
                      <p className="text-green-500">20% discount applied</p>
                    ) : null}
                  </div>
                )}
                {selectedTimeValue && (
                  <PriceBreakdownDropdown
                    selectedTabValue={selectedTabValue}
                    vehicleCounts={vehicleCounts}
                  />
                )}
              </CardContent>
              {selectedTimeValue && (
                <CardFooter className="w-full flex justify-between">
                  <p className="text-green-500">
                    Final Price: ${totalPrice.toFixed(2)}
                  </p>
                  <Button>Book</Button>
                </CardFooter>
              )}
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
