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

interface TabData {
  value: string;
  title: string;
  description: string;
  content: React.ReactNode;
}

export function BookingTabs({ unblur }: { unblur: boolean }) {
  const tabsData = [
    {
      value: 'mb30',
      title: 'MiniBaja 30 minutes',
      description: 'Chase in the dunes for 30 minutes',
      content: 'MiniBaja 30 minutes content'
    },
    {
      value: 'mb60',
      title: 'MB60',
      description: '60 mins',
      content: 'MB60 content'
    },
    {
      value: 'mb120',
      title: 'MB120',
      description: '120 mins',
      content: 'MB120 content'
    }
  ];

  return (
    <div className={unblur ? 'blur-none' : 'blur-sm'}>
      <Tabs defaultValue="mb30" className="w-[400px]">
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
                <CardTitle>{tab.title}</CardTitle>
                <CardDescription>{tab.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">{tab.content}</CardContent>
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
