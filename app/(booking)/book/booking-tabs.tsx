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
  setSelectedTabValue
}: {
  unblur: boolean;
  selectedTimeValue: string;
  setSelectedTimeValue: React.Dispatch<React.SetStateAction<string>>;
  selectedTabValue: string;
  setSelectedTabValue: React.Dispatch<React.SetStateAction<string>>;
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
              <CardContent className="space-y-2 flex justify-center">
                <TimePicker
                  disabledTimes={[8, 9, 10, 11, 12, 13, 14]}
                  selectValue={selectedTimeValue}
                  setSelectValue={setSelectedTimeValue}
                />
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
