'use client';

import * as React from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { mbj_vehicles_list, atv_vehicles_list, vof_vehicles_list, ffr_vehicles_list } from '@/utils/helpers';

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
];

export function FleetCarousel({
  vehicleCounts,
  setVehicleCounts,
  totalSeats,
  howManyPeople,
  viewMode = false,
}: FleetCarouselProps) {
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

  return (
    <div className="relative">
      {/* <h2 className="text-lg font-bold mb-3">Fleet Selection</h2> */}
      
      <div className="mb-3">
        <p>
          Assigned Seats:{' '}
          <span className={totalSeats >= howManyPeople ? 'text-green-500' : 'text-red-500'}>
            {totalSeats}
          </span> / 
          <span className="text-green-500">{howManyPeople}</span>
        </p>
      </div>
      
      <div className="relative">
        <Carousel
          opts={{
            align: "start",
            loop: false,
          }}
          className="w-full"
        >
          <CarouselContent>
            {vehicleCategories.map((category, index) => (
              <CarouselItem key={index}>
                <div className="p-2">
                  <h3 className="text-md font-semibold mb-2">{category.name}</h3>
                  <div className="space-y-3">
                    {category.list.map((vehicle) => {
                      const fieldName = vehicle.name.split(' ')[0].toLowerCase().replace('-', '');
                      return (
                        <div key={vehicle.id} className="flex justify-between items-center py-2 border-b">
                          <div className="flex items-center">
                            <span className={vehicleCounts[vehicle.id]?.isChecked ? 'text-green-500 font-medium' : ''}>
                              {vehicle.name}
                            </span>
                          </div>
                          
                          <div className="flex items-center">
                            <button
                              type="button" // Add this to prevent form submission
                              onClick={viewMode ? undefined : () => decrementCount(vehicle.id, vehicle.name, vehicle.seats, vehicle.pricing)}
                              className="px-3 py-1 rounded-l border"
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
                              className="w-12 text-center border-y"
                              disabled={viewMode}
                            />
                            <button
                              type="button" // Add this to prevent form submission
                              onClick={viewMode ? undefined : () => incrementCount(
                                vehicle.id,
                                true,
                                vehicle.name,
                                vehicle.seats,
                                vehicle.pricing
                              )}
                              className="px-3 py-1 rounded-r border"
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
              </CarouselItem>
            ))}
          </CarouselContent>
          
          {/* Updated arrow positioning with more spacing */}
          <CarouselPrevious 
            type="button" // Add this to prevent form submission
            className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-full" 
          />
          <CarouselNext 
            type="button" // Add this to prevent form submission
            className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-full" 
          />
        </Carousel>
      </div>
    </div>
  );
}