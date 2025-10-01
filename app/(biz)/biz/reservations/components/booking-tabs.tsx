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
import {
  atv_open_times,
  ffr_open_times,
  mb120_open_times,
  mb30_open_times,
  mb60_open_times,
  vof_open_times
} from '@/utils/helpers';
import { PriceBreakdownDropdown } from '@/app/(com)/book/breakdown-drop-down/mbj';

// Define all possible tab values
export type TabValue = 'mb30' | 'mb60' | 'mb120' | 'Premium ATV Tours' | 'Family Fun Romp' | 'Valley of Fire';

// Mini Baja specific tab values (for PriceBreakdownDropdown)
export type MiniBajaTabValue = 'mb30' | 'mb60' | 'mb120';

// Define vehicle categories
export type VehicleCategory = 'Mini Baja' | 'ATV' | 'Valley of Fire' | 'Family Fun';

interface TabConfig {
  value: TabValue;
  title: string;
  name: string;
  description: string;
  timeArray: string[];
  showDiscount?: boolean;
}

interface BookingTabsProps {
  activeVehicleCategory: VehicleCategory;
  selectedTimeValue: string;
  setSelectedTimeValue: React.Dispatch<React.SetStateAction<string>>;
  selectedTabValue: TabValue;
  setSelectedTabValue: React.Dispatch<React.SetStateAction<TabValue>>;
  vehicleCounts: any; // Updated to match what's being passed from parent
  totalPrice: number;
  setTotalPrice: React.Dispatch<React.SetStateAction<number>>;
  formToken: string;
  viewMode?: boolean;
}

// Tab configurations for each vehicle category
const tabConfigs: Record<VehicleCategory, TabConfig[]> = {
  'Mini Baja': [
    {
      value: 'mb30',
      title: '30 minutes',
      name: 'MiniBaja 1/4 Chase',
      description: 'Chase in the dunes for 30 minutes',
      timeArray: mb30_open_times,
      showDiscount: true
    },
    {
      value: 'mb60',
      title: '60 minutes',
      name: 'MiniBaja 1/2 Chase',
      description: 'Chase in the dunes for 1 hour',
      timeArray: mb60_open_times,
      showDiscount: true
    },
    {
      value: 'mb120',
      title: '120 minutes',
      name: 'MiniBaja Full Chase',
      description: 'Chase in the dunes for 2 hours',
      timeArray: mb120_open_times,
      showDiscount: false
    }
  ],
  'ATV': [
    {
      value: 'Premium ATV Tours',
      title: 'Premium ATV Tours',
      name: 'Premium ATV Tours',
      description: 'A special package for those wishing to take the kids Off-Road on a buggy ride but not get thrown in the mix of wild and crazy patrons',
      timeArray: atv_open_times,
      showDiscount: false
    }
  ],
  'Valley of Fire': [
    {
      value: 'Valley of Fire',
      title: 'Valley of Fire',
      name: 'Valley of Fire Tour',
      description: 'Experience the stunning Valley of Fire',
      timeArray: vof_open_times,
      showDiscount: false
    }
  ],
  'Family Fun': [
    {
      value: 'Family Fun Romp',
      title: 'Family Fun Romp',
      name: 'Family Fun Romp',
      description: 'A special package for those wishing to take the kids Off-Road on a buggy ride but not get thrown in the mix of wild and crazy patrons',
      timeArray: ffr_open_times,
      showDiscount: false
    }
  ]
};

// Default tab values for each category
const defaultTabValues: Record<VehicleCategory, TabValue> = {
  'Mini Baja': 'mb60',
  'ATV': 'Premium ATV Tours',
  'Valley of Fire': 'Valley of Fire',
  'Family Fun': 'Family Fun Romp'
};

// Type guard to check if a tab value is a Mini Baja tab value
const isMiniBajaTabValue = (value: TabValue): value is MiniBajaTabValue => {
  return value === 'mb30' || value === 'mb60' || value === 'mb120';
};

export function BookingTabs({
  activeVehicleCategory,
  selectedTimeValue,
  setSelectedTimeValue,
  selectedTabValue,
  setSelectedTabValue,
  vehicleCounts,
  totalPrice,
  setTotalPrice,
  viewMode = false,
}: BookingTabsProps) {
  const currentTabs = tabConfigs[activeVehicleCategory] || tabConfigs['Mini Baja'];
  const displayPrice = typeof totalPrice === 'string' ? parseFloat(totalPrice) : totalPrice;

  // Ensure selectedTabValue is valid for current category
  React.useEffect(() => {
    const validTabValues = currentTabs.map(tab => tab.value);
    if (!validTabValues.includes(selectedTabValue)) {
      setSelectedTabValue(defaultTabValues[activeVehicleCategory]);
    }
  }, [activeVehicleCategory, selectedTabValue, setSelectedTabValue, currentTabs]);

  const handleTabChange = (value: string) => {
    if (currentTabs.some(tab => tab.value === value)) {
      setSelectedTabValue(value as TabValue);
      setTotalPrice(0);
      setSelectedTimeValue('');
    }
  };

  // Discount logic for MiniBaja tabs
  const shouldShowDiscount = (tabValue: TabValue, timeValue: string): boolean => {
    if (!timeValue) return false;
    
    const timeNumber = Number(timeValue.split(' ')[0]);
    const period = timeValue.split(' ')[1];
    
    return (tabValue === 'mb30' || tabValue === 'mb60') 
      ? timeNumber < 10 && period === 'am'
      : false;
  };

  return (
    <div>
      <Tabs
        defaultValue={defaultTabValues[activeVehicleCategory]}
        className="w-screen md:w-[350px]"
        onValueChange={viewMode ? undefined : handleTabChange}
        value={selectedTabValue}
      >
        <TabsList className={`grid w-full ${
          currentTabs.length === 1 ? 'grid-cols-1' : 
          currentTabs.length === 2 ? 'grid-cols-2' : 'grid-cols-3'
        }`}>
          {currentTabs.map((tab) => (
            <TabsTrigger 
              key={tab.value} 
              value={tab.value}
              disabled={viewMode}
            >
              {tab.title}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {currentTabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            <Card>
              <CardHeader>
                <CardTitle>{tab.name}</CardTitle>
                <CardDescription>{tab.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 flex flex-col items-center">
                {viewMode ? (
                  <div className="text-lg font-semibold">
                    Selected Time: {selectedTimeValue || 'Not specified'}
                  </div>
                ) : (
                  <TimePicker
                    selectValue={selectedTimeValue}
                    setSelectValue={setSelectedTimeValue}
                    timeArray={tab.timeArray}
                  />
                )}

                {!selectedTimeValue && !viewMode && <p>Pick a time to calculate price</p>}
                
                {selectedTimeValue && tab.showDiscount && shouldShowDiscount(tab.value, selectedTimeValue) && (
                  <p className="text-green-500">20% discount applied</p>
                )}
                
                {/* Only show PriceBreakdownDropdown for Mini Baja tabs */}
                {selectedTimeValue && isMiniBajaTabValue(selectedTabValue) && (
                  <PriceBreakdownDropdown
                    selectedTabValue={selectedTabValue as MiniBajaTabValue}
                    vehicleCounts={vehicleCounts}
                  />
                )}
                
                {/* For other vehicle categories, you might want to add different pricing components */}
                {selectedTimeValue && !isMiniBajaTabValue(selectedTabValue) && (
                  <div className="text-sm text-gray-600">
                    Pricing calculated based on selected vehicles and time
                  </div>
                )}
              </CardContent>
              
              {(selectedTimeValue || viewMode) && (
                <CardFooter className="w-full flex justify-between">
                  <p className="text-green-500">
                    Final Price: ${displayPrice.toFixed(2)}
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