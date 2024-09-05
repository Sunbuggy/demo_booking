import * as React from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

export interface VehicleCount {
  isChecked: boolean;
  count: number;
  name: string;
  seats: number;
  pricing: { [key: string]: number };
}

export interface VehicleCounts {
  vehicleCounts: { [vehicleId: number]: VehicleCount };
  selectedTabValue: 'mb120' | 'mb30' | 'mb60';
}

export const PriceBreakdownDropdown: React.FC<VehicleCounts> = ({
  vehicleCounts,
  selectedTabValue
}) => {
  let total = 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Show Breakdown</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className=" w-[348px]">
        <DropdownMenuLabel>Break Down</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="pr-2">Name</th>
              <th className="pr-2">Seats</th>
              <th className="pr-2">Base Price</th>
              <th className="pr-2">Service Fee</th>
              <th className="pr-2">Fuel Fee</th>
              <th className="pr-2">Total Price</th>
            </tr>
          </thead>
          <tbody>
            {Object.values(vehicleCounts).map((vehicle, index) => {
              if (vehicle.isChecked) {
                const priceForTime = vehicle.pricing[selectedTabValue];
                const vehiclePrice =
                  priceForTime * vehicle.count * vehicle.seats;
                const serviceFee = vehiclePrice * 0.06;
                const fuelFee = vehiclePrice * 0.1;
                const totalVehiclePrice = vehiclePrice + serviceFee + fuelFee;
                total += totalVehiclePrice;
                return (
                  <tr key={index}>
                    {/* slice the name after the second space */}
                    <td className="pr-2">{vehicle.name.split(' ', 2)}</td>
                    <td className="pr-2">{vehicle.seats * vehicle.count}</td>
                    <td className="pr-2">${vehiclePrice.toFixed(2)}</td>
                    <td className="pr-2">${serviceFee.toFixed(2)}</td>
                    <td className="pr-2">${fuelFee.toFixed(2)}</td>
                    <td className="pr-2">${totalVehiclePrice.toFixed(2)}</td>
                  </tr>
                );
              }
              return null;
            })}
          </tbody>
        </table>
        <div className="flex justify-between font-bold mt-2">
          <hr className="h-px my-8 dark:bg-gray-200 border-0 bg-gray-700" />
          <p>Full Price</p>
          <p>${total.toFixed(2)}</p>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
