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
import { BookInfoType } from './serve-bookings';
import { mbj_vehicles_list } from '@/utils/helpers';
import { AddVehicleDemo } from './popover';

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
  bookInfo
}: {
  unblur: boolean;
  selectedTimeValue: string;
  setSelectedTimeValue: React.Dispatch<React.SetStateAction<string>>;
  selectedTabValue: string;
  setSelectedTabValue: React.Dispatch<React.SetStateAction<string>>;
  setShowPricing: React.Dispatch<React.SetStateAction<boolean>>;
  bookInfo: BookInfoType;
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

  console.log(mbj_vehicles_list);
  return (
    <div className={unblur ? 'blur-none' : 'blur-sm pointer-events-none'}>
      <Tabs
        defaultValue={selectedTabValue}
        className="w-[350px]"
        onValueChange={setSelectedTabValue}
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
                <div className="flex flex-col items-center gap-2">
                  {mbj_vehicles_list.map((itm) => {
                    // Determine the pricing based on the tab value
                    const pricing =
                      tab.value === 'mb30'
                        ? itm.pricing.mb30
                        : tab.value === 'mb60'
                          ? itm.pricing.mb60
                          : itm.pricing.mb120;

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
                            setAmount={bookInfo.howManyPeople}
                          />
                        </div>
                      );
                    }

                    // Return null if pricing does not exist, so nothing is rendered
                    return null;
                  })}
                </div>
              </CardContent>
              <CardFooter className="w-full flex justify-end">
                <Button>Book</Button>
              </CardFooter>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
