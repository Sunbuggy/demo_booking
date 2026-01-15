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
import TimePicker from '@/components/time-picker';
import { ffr_open_times } from '@/utils/helpers';
import { VehicleCounts } from '../serve-bookings/ffr';
import { PriceBreakdownDropdown } from '../breakdown-drop-down/ffr';

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
  selectedTabValue: 'Family Fun Romp';
  setSelectedTabValue: React.Dispatch<React.SetStateAction<'Family Fun Romp'>>;
  vehicleCounts: VehicleCounts;
  totalPrice: number;
  setTotalPrice: React.Dispatch<React.SetStateAction<number>>;
  formToken: string;
}) {
  const tabsData = [
    {
      value: 'Family Fun Romp',
      title: 'Family Fun Romp',
      name: 'Family Fun Romp',
      description:
        'A special package for those wishing to take the kids Off-Road on a buggy ride but not get thrown in the mix of wild and crazy patrons ',
      content: 'MB120 content'
    }
  ];

  // Wrapper function to ensure type safety
  const handleTabChange = (value: string) => {
    if (value === 'Family Fun Romp') {
      setSelectedTabValue(value);
      setTotalPrice(0);
      setSelectedTimeValue('');
    }
  };

  return (
    <div>
      <Tabs
        defaultValue={selectedTabValue}
        className="w-screen md:w-[350px]"
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
                  timeArray={ffr_open_times}
                />

                {!selectedTimeValue && <p>Pick a time to calculate price</p>}

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
                </CardFooter>
              )}
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
