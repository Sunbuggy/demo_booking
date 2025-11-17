import React, { useEffect } from 'react';
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
  atv30_open_times,
  atv60_open_times,
  ffr_open_times,
  mb120_open_times,
  mb30_open_times,
  mb60_open_times,
  vof_open_times
} from '@/utils/helpers';
import { PriceBreakdownDropdown } from '@/app/(com)/book/breakdown-drop-down/mbj';
import { Reservation } from '@/app/(biz)/biz/types';

// Define all possible tab values
export type TabValue = 'mb30' | 'mb60' | 'mb120' | 'atv30' | 'atv60' | 'Valley of Fire' | 'Family Fun Romp';

// Mini Baja specific tab values (for PriceBreakdownDropdown)
export type MiniBajaTabValue = 'mb30' | 'mb60' | 'mb120';

// ATV specific tab values
export type ATVTabValue = 'atv30' | 'atv60';

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
  vehicleCounts: any;
  totalPrice: number;
  setTotalPrice: React.Dispatch<React.SetStateAction<number>>;
  formToken: string;
  viewMode?: boolean;
  initialData?: Reservation;
}

// Tab configurations for each vehicle category
const tabConfigs: Record<VehicleCategory, TabConfig[]> = {
  'Mini Baja': [
    {
      value: 'mb30',
      title: '30 minutes',
      name: 'Mini Baja Chase X (30 min)',
      description: 'Chase in the dunes for 30 minutes',
      timeArray: mb30_open_times,
      showDiscount: true
    },
    {
      value: 'mb60',
      title: '60 minutes',
      name: 'Mini Baja Chase XX (60 min)',
      description: 'Chase in the dunes for 1 hour',
      timeArray: mb60_open_times,
      showDiscount: true
    },
    {
      value: 'mb120',
      title: '120 minutes',
      name: 'Mini Baja Chase XXX (120 min)',
      description: 'Chase in the dunes for 2 hours',
      timeArray: mb120_open_times,
      showDiscount: false
    }
  ],
  'ATV': [
    {
      value: 'atv30',
      title: '30 minutes',
      name: 'Dunes ATV X (30 min)',
      description: '30 minutes of thrilling ATV riding',
      timeArray: atv30_open_times,
      showDiscount: false
    },
    {
      value: 'atv60',
      title: '60 minutes',
      name: 'Dunes ATV XX (60 min)',
      description: '60 minutes of extended ATV fun',
      timeArray: atv60_open_times,
      showDiscount: false
    }
  ],
  'Valley of Fire': [
    {
      value: 'Valley of Fire',
      title: 'Valley of Fire',
      name: 'Valley of Fire Tour ',
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
  'ATV': 'atv60',
  'Valley of Fire': 'Valley of Fire',
  'Family Fun': 'Family Fun Romp'
};

// Type guard to check if a tab value is a Mini Baja tab value
const isMiniBajaTabValue = (value: TabValue): value is MiniBajaTabValue => {
  return value === 'mb30' || value === 'mb60' || value === 'mb120';
};

// Type guard to check if a tab value is an ATV tab value
const isATVTabValue = (value: TabValue): value is ATVTabValue => {
  return value === 'atv30' || value === 'atv60';
};

// Calculate total price based on vehicle counts and selected tab
const calculateTotalPrice = (vehicleCounts: any, selectedTabValue: TabValue, selectedTimeValue: string): number => {
  let total = 0;

  // Check if we should apply discount (for Mini Baja morning times)
  const shouldApplyDiscount = (tabValue: TabValue, timeValue: string): boolean => {
    if (!timeValue) return false;
    
    const timeNumber = Number(timeValue.split(' ')[0]);
    const period = timeValue.split(' ')[1];
    
    return (tabValue === 'mb30' || tabValue === 'mb60') 
      ? timeNumber < 10 && period === 'am'
      : false;
  };

  const discountMultiplier = shouldApplyDiscount(selectedTabValue, selectedTimeValue) ? 0.8 : 1;

  // Calculate total based on vehicle counts and pricing
  Object.values(vehicleCounts).forEach((vehicle: any) => {
    if (vehicle.count > 0) {
      let price = 0;

      // Mini Baja pricing
      if (isMiniBajaTabValue(selectedTabValue)) {
        const duration = selectedTabValue.replace('mb', '');
        price = vehicle.pricing[`mb${duration}`] || 0;
      }
      // ATV pricing
      else if (isATVTabValue(selectedTabValue)) {
        const duration = selectedTabValue.replace('atv', '');
        if (vehicle.pricing[`full_atv_${duration}`]) {
          price = vehicle.pricing[`full_atv_${duration}`];
        } else if (vehicle.pricing[`medium_atv_${duration}`]) {
          price = vehicle.pricing[`medium_atv_${duration}`];
        } else {
          price = vehicle.pricing.full_atv || vehicle.pricing.medium_atv || 0;
        }
      }
      // Valley of Fire pricing
      else if (selectedTabValue === 'Valley of Fire') {
        price = vehicle.pricing.price || 0;
      }
      // Family Fun pricing
      else if (selectedTabValue === 'Family Fun Romp') {
        price = vehicle.pricing.desert_racer || 0;
      }

      total += price * vehicle.count;
    }
  });

  return total * discountMultiplier;
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
  initialData,
}: BookingTabsProps) {
  const currentTabs = tabConfigs[activeVehicleCategory] || tabConfigs['Mini Baja'];
  const displayPrice = typeof totalPrice === 'string' ? parseFloat(totalPrice) : totalPrice;

  // Calculate total price whenever vehicle counts, tab, or time changes
  useEffect(() => {
    if (selectedTimeValue) {
      const calculatedTotal = calculateTotalPrice(vehicleCounts, selectedTabValue, selectedTimeValue);
      setTotalPrice(calculatedTotal);
    } else {
      setTotalPrice(0);
    }
  }, [vehicleCounts, selectedTabValue, selectedTimeValue, setTotalPrice]);

  // Ensure selectedTabValue is valid for current category
  useEffect(() => {
    const validTabValues = currentTabs.map(tab => tab.value);
    if (!validTabValues.includes(selectedTabValue)) {
      setSelectedTabValue(defaultTabValues[activeVehicleCategory]);
    }
  }, [activeVehicleCategory, selectedTabValue, setSelectedTabValue, currentTabs]);

  const handleTabChange = (value: string) => {
    if (currentTabs.some(tab => tab.value === value)) {
      setSelectedTabValue(value as TabValue);
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
                
                {/* For ATV tabs, show ATV pricing info */}
                {selectedTimeValue && isATVTabValue(selectedTabValue) && (
                  <div className="text-sm text-gray-600">
                    ATV pricing varies by vehicle type (Full ATV / Medium ATV) and duration
                  </div>
                )}
                
                {/* For other vehicle categories */}
                {selectedTimeValue && !isMiniBajaTabValue(selectedTabValue) && !isATVTabValue(selectedTabValue) && (
                  <div className="text-sm text-gray-600">
                    Pricing calculated based on selected vehicles and time
                  </div>
                )}
              </CardContent>
              
              {(selectedTimeValue || viewMode) && (
                <CardFooter className="w-full flex justify-between">
                  <p className="text-green-500 font-bold text-lg">
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