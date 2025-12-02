'use client';

import * as React from "react";
import { mbj_vehicles_list, atv_vehicles_list, vof_vehicles_list, ffr_vehicles_list, ama_vehicles_list } from '@/utils/helpers';

// Update the interface to be more flexible
interface VehiclePricing {
  [key: string]: number | string | undefined;
  mb30?: number;
  mb60?: number;
  mb120?: number;
  full_atv?: number;
  desert_racer?: number;
  price?: number;
  name?: string;
}

interface VehicleCounts {
  [vehicleId: number]: {
    isChecked: boolean;
    count: number;
    name: string;
    seats: number;
    pricing: VehiclePricing;
  };
}

interface FleetCarouselProps {
  vehicleCounts: VehicleCounts;
  setVehicleCounts: React.Dispatch<React.SetStateAction<VehicleCounts>>;
  totalSeats: number;
  howManyPeople: number;
  viewMode?: boolean;
  activeCategory: string;
  setActiveCategory: (category: string) => void;
}

const vehicleCategories = [
  {
    name: "Mini Baja",
    list: mbj_vehicles_list,
  },
  {
    name: "ATV",
    list: atv_vehicles_list,
  },
  {
    name: "Valley of Fire",
    list: vof_vehicles_list,
  },
  {
    name: "Family Fun",
    list: ffr_vehicles_list,
  },
  {
    name: "Amargosa",
    list: ama_vehicles_list,
  }
];

// Map vehicle names to database field names
const getVehicleFieldMapping = (): Record<string, string> => {
  return {
    // Mini Baja vehicles
    '1 seat desert racer': 'SB1',
    '2 seat desert racer': 'SB2',
    '4 seat desert racer': 'SB4',
    '6 seat desert racer': 'SB6',
    'Ride with Guide': 'RWG',
    
    // ATV vehicles  
    'Valley of fire 180 mins': 'QB',
    'Vegas dunes 60 mins': 'QA',
    'Vegas dunes 30 mins': 'QB',
    '1 Seat full ATV': 'QB',
    
    // Valley of Fire vehicles
     '2 seat UTV': 'twoSeat4wd', 
    // '4 seat desert racer': 'UZ2',
    // '6 seat desert racer': 'UZ4',
    

  };
};

export function FleetCarousel({
  vehicleCounts,
  setVehicleCounts,
  totalSeats,
  howManyPeople,
  viewMode = false,
  activeCategory,
  setActiveCategory,
}: FleetCarouselProps) {
  // Find the initial active index based on the activeCategory prop
  const initialActiveIndex = vehicleCategories.findIndex(cat => cat.name === activeCategory);
  const [activeIndex, setActiveIndex] = React.useState(initialActiveIndex >= 0 ? initialActiveIndex : 0);

  // Sync local activeIndex with parent's activeCategory
  React.useEffect(() => {
    const newIndex = vehicleCategories.findIndex(cat => cat.name === activeCategory);
    if (newIndex >= 0 && newIndex !== activeIndex) {
      setActiveIndex(newIndex);
    }
  }, [activeCategory]);

  const incrementCount = (
    vehicleId: number,
    isChecked: boolean,
    name: string,
    seats: number,
    pricing: VehiclePricing
  ) => {
    setVehicleCounts((prevCounts) => ({
      ...prevCounts,
      [vehicleId]: {
        ...prevCounts[vehicleId],
        count: (prevCounts[vehicleId]?.count ?? 0) + 1,
        isChecked,
        name,
        seats,
        pricing
      }
    }));
  };

  const decrementCount = (
    vehicleId: number,
    name: string,
    seats: number,
    pricing: VehiclePricing
  ) => {
    setVehicleCounts((prevCounts) => ({
      ...prevCounts,
      [vehicleId]: {
        ...prevCounts[vehicleId],
        count: Math.max(0, (prevCounts[vehicleId]?.count ?? 0) - 1),
        isChecked: (prevCounts[vehicleId]?.count ?? 0) > 1 ? true : false,
        name,
        seats,
        pricing
      }
    }));
  };

  const nextCategory = () => {
    const newIndex = (activeIndex + 1) % vehicleCategories.length;
    setActiveIndex(newIndex);
    setActiveCategory(vehicleCategories[newIndex].name);
  };

  const prevCategory = () => {
    const newIndex = (activeIndex - 1 + vehicleCategories.length) % vehicleCategories.length;
    setActiveIndex(newIndex);
    setActiveCategory(vehicleCategories[newIndex].name);
  };

  const handleCategoryChange = (index: number) => {
    setActiveIndex(index);
    setActiveCategory(vehicleCategories[index].name);
  };

  // Get the database field name for a vehicle
  const getFieldNameForVehicle = (vehicleName: string): string => {
    const fieldMapping = getVehicleFieldMapping();
    return fieldMapping[vehicleName] || vehicleName.split(' ')[0].toLowerCase().replace('-', '');
  };

  return (
    <div className="relative">
      <div className="mb-3">
        <p>
          Assigned Seats:{' '}
          <span className={totalSeats >= howManyPeople ? 'text-green-500' : 'text-red-500'}>
            {totalSeats}
          </span> / 
          <span className="text-green-500">{howManyPeople}</span>
        </p>
      </div>
      
      <div className="border rounded-lg p-4">
        {/* Category Header with Navigation Arrows */}
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={prevCategory}
            disabled={viewMode}
            className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Previous category"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <h3 className="text-lg font-semibold text-center flex-1 mx-4">
            {vehicleCategories[activeIndex].name}
          </h3>
          
          <button
            type="button"
            onClick={nextCategory}
            disabled={viewMode}
            className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Next category"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Category Indicator Dots */}
        <div className="flex justify-center space-x-2 mb-4">
          {vehicleCategories.map((category, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleCategoryChange(index)}
              disabled={viewMode}
              className={`w-2 h-2 rounded-full transition-all ${
                index === activeIndex 
                  ? 'bg-blue-500 scale-125' 
                  : 'bg-gray-300 hover:bg-gray-400'
              } ${viewMode ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              aria-label={`Go to ${category.name}`}
            />
          ))}
        </div>

        {/* Vehicle List for Current Category */}
        <div className="space-y-3">
          {vehicleCategories[activeIndex].list.map((vehicle) => {
            const fieldName = getFieldNameForVehicle(vehicle.name);
            return (
              <div key={vehicle.id} className="flex justify-between items-center py-2 border-b">
                <div className="flex items-center">
                  <span className={vehicleCounts[vehicle.id]?.isChecked ? 'text-green-500 font-medium' : ''}>
                    {vehicle.name}
                  </span>
                </div>
                
                <div className="flex items-center">
                  <button
                    type="button" 
                    onClick={viewMode ? undefined : () => decrementCount(vehicle.id, vehicle.name, vehicle.seats, vehicle.pricing)}
                    className="px-3 py-1 rounded-l border border-r-0 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={viewMode || !vehicleCounts[vehicle.id]?.count}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    name={fieldName}
                    value={vehicleCounts[vehicle.id]?.count || 0}
                    onChange={viewMode ? undefined : (e) => {
                      const count = Math.max(0, parseInt(e.target.value) || 0);
                      setVehicleCounts(prev => ({
                        ...prev,
                        [vehicle.id]: {
                          ...prev[vehicle.id],
                          count,
                          isChecked: count > 0
                        }
                      }));
                    }}
                    min="0"
                    className="w-12 text-center border-y px-0 disabled:opacity-50"
                    disabled={viewMode}
                  />
                  <button
                    type="button"
                    onClick={viewMode ? undefined : () => incrementCount(
                      vehicle.id,
                      true,
                      vehicle.name,
                      vehicle.seats,
                      vehicle.pricing
                    )}
                    className="px-3 py-1 rounded-r border border-l-0 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={viewMode}
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}