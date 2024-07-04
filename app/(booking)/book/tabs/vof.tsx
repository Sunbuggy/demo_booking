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
import TimePicker from '@/components/time-picker';
import { vof_open_times } from '@/utils/helpers';
import { type VehicleCounts } from '../serve-bookings/vof';
import { PriceBreakdownDropdown } from '../breakdown-drop-down/vof';
import AcceptHostedPage from '../../payment/acceptHosted';

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
  setTotalPrice,
  formToken
}: {
  selectedTimeValue: string;
  setSelectedTimeValue: React.Dispatch<React.SetStateAction<string>>;
  selectedTabValue: 'Valley of Fire';
  setSelectedTabValue: React.Dispatch<React.SetStateAction<'Valley of Fire'>>;
  vehicleCounts: VehicleCounts;
  totalPrice: number;
  setTotalPrice: React.Dispatch<React.SetStateAction<number>>;
  formToken: string;
}) {
  const tabsData = [
    {
      value: 'Valley of Fire',
      title: 'Valley of Fire',
      name: 'Valley of Fire',
      description:
        'A special package for those wishing to take the kids Off-Road on a buggy ride but not get thrown in the mix of wild and crazy patrons ',
      content: 'MB120 content'
    }
  ];

  // Wrapper function to ensure type safety
  const handleTabChange = (value: string) => {
    if (value === 'Valley of Fire') {
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
                  timeArray={vof_open_times}
                />

                {!selectedTimeValue && <p>Pick a time to calculate price</p>}

                {selectedTimeValue && (
                  <PriceBreakdownDropdown vehicleCounts={vehicleCounts} />
                )}
              </CardContent>
              {selectedTimeValue && (
                <CardFooter className="w-full flex justify-between">
                  <p className="text-green-500">
                    Final Price: ${totalPrice.toFixed(2)}
                  </p>
                </CardFooter>
              )}
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
