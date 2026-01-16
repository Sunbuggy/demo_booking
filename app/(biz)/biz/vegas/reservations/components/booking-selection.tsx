'use client';

import * as React from "react";
import { mbj_vehicles_list, atv_vehicles_list, vof_vehicles_list, ffr_vehicles_list, ama_vehicles_list } from '@/utils/helpers';
import { ChevronLeft, ChevronRight, Users } from "lucide-react"; // Added Icons for polish

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
  { name: "Mini Baja", list: mbj_vehicles_list },
  { name: "ATV", list: atv_vehicles_list },
  { name: "Valley of Fire", list: vof_vehicles_list },
  { name: "Family Fun", list: ffr_vehicles_list },
  { name: "Amargosa", list: ama_vehicles_list }
];

// Map vehicle names to database field names
const getVehicleFieldMapping = (): Record<string, string> => {
  return {
    '1 seat desert racer': 'SB1',
    '2 seat desert racer': 'SB2',
    '4 seat desert racer': 'SB4',
    '6 seat desert racer': 'SB6',
    'Ride with Guide': 'RWG',
    'Valley of fire 180 mins': 'QB',
    'Vegas dunes 60 mins': 'QA',
    'Vegas dunes 30 mins': 'QB',
    '1 Seat full ATV': 'QB',
    '2 seat UTV': 'twoSeat4wd', 
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
    <div className="relative space-y-4">
      {/* SEAT TRACKER */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Users className="w-4 h-4" />
          <span>Assigned Seats:</span>
        </div>
        <div className="font-mono font-bold text-sm">
           {/* Semantic Colors for Status */}
           <span className={totalSeats >= howManyPeople ? 'text-green-600 dark:text-green-400' : 'text-destructive'}>
            {totalSeats}
          </span>
          <span className="text-muted-foreground mx-1">/</span>
          <span className="text-foreground">{howManyPeople}</span>
        </div>
      </div>
      
      {/* CARD CONTAINER */}
      {/* Semantic: bg-card, border-border */}
      <div className="border border-border rounded-xl p-4 bg-card shadow-sm">
        
        {/* Category Header with Navigation Arrows */}
        <div className="flex items-center justify-between mb-6">
          <button
            type="button"
            onClick={prevCategory}
            disabled={viewMode}
            // Semantic: hover:bg-accent hover:text-accent-foreground
            className="p-2 rounded-full hover:bg-accent hover:text-accent-foreground text-muted-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Previous category"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <h3 className="text-lg font-bold text-center flex-1 mx-4 text-foreground">
            {vehicleCategories[activeIndex].name}
          </h3>
          
          <button
            type="button"
            onClick={nextCategory}
            disabled={viewMode}
            className="p-2 rounded-full hover:bg-accent hover:text-accent-foreground text-muted-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Next category"
          >
             <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Category Indicator Dots */}
        <div className="flex justify-center space-x-2 mb-6">
          {vehicleCategories.map((category, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleCategoryChange(index)}
              disabled={viewMode}
              // Semantic: bg-primary (Active), bg-muted (Inactive)
              className={`w-2 h-2 rounded-full transition-all ${
                index === activeIndex 
                  ? 'bg-primary scale-125' 
                  : 'bg-muted hover:bg-muted-foreground/50'
              } ${viewMode ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              aria-label={`Go to ${category.name}`}
            />
          ))}
        </div>

        {/* Vehicle List for Current Category */}
        <div className="space-y-1">
          {vehicleCategories[activeIndex].list.map((vehicle) => {
            const fieldName = getFieldNameForVehicle(vehicle.name);
            const isSelected = vehicleCounts[vehicle.id]?.count > 0;

            return (
              <div key={vehicle.id} className="flex justify-between items-center py-3 border-b border-border last:border-0">
                <div className="flex items-center">
                  {/* Semantic: text-primary for active items */}
                  <span className={`text-sm font-medium transition-colors ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>
                    {vehicle.name}
                  </span>
                </div>
                
                <div className="flex items-center">
                  <button
                    type="button" 
                    onClick={viewMode ? undefined : () => decrementCount(vehicle.id, vehicle.name, vehicle.seats, vehicle.pricing)}
                    // Semantic: border-input, hover:bg-accent
                    className="w-8 h-8 flex items-center justify-center rounded-l-md border border-input bg-background hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                    // Semantic: border-input, bg-background, text-foreground
                    className="w-12 h-8 text-center border-y border-input bg-background text-foreground text-sm font-medium focus:outline-none focus:ring-1 focus:ring-primary z-10 disabled:opacity-50"
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
                    // Semantic: border-input, hover:bg-accent
                    className="w-8 h-8 flex items-center justify-center rounded-r-md border border-input bg-background hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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