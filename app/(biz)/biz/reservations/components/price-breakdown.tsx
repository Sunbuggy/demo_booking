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
  pricing: { [key: string]: number | undefined } & { price?: number; name?: string };
}

export interface VehicleCounts {
  [vehicleId: number]: VehicleCount;
}

export interface FeeConfig {
  serviceFeeRate: number;
  fuelFeeRate: number;
  additionalFees?: Array<{
    name: string;
    calculate: (vehiclePrice: number) => number;
  }>;
}

export interface PriceBreakdownDropdownProps {
  vehicleCounts: VehicleCounts;
  selectedTabValue?: string;
  pricingKey?: string;
  feeConfig?: FeeConfig;
  customPriceCalculator?: (vehicle: VehicleCount, pricingKey: string) => number;
}

const DEFAULT_FEE_CONFIG: FeeConfig = {
  serviceFeeRate: 0.06,
  fuelFeeRate: 0.10,
  additionalFees: []
};

const PRICING_CONFIG: Record<string, string> = {
  'Premium ATV Tours': 'full_atv',
  'Family Fun Romp': 'desert_racer',
  'Valley of Fire': 'price',
  'mb30': 'mb30',
  'mb60': 'mb60', 
  'mb120': 'mb120',
};

const DEFAULT_PRICING_KEY = 'price';

export const PriceBreakdownDropdown: React.FC<PriceBreakdownDropdownProps> = ({
  vehicleCounts,
  selectedTabValue,
  pricingKey,
  feeConfig = DEFAULT_FEE_CONFIG,
  customPriceCalculator
}) => {
  let total = 0;

  const getPricingKey = (): string => {
    if (pricingKey) return pricingKey;
    if (selectedTabValue && PRICING_CONFIG[selectedTabValue]) {
      return PRICING_CONFIG[selectedTabValue];
    }
    return DEFAULT_PRICING_KEY;
  };

  const currentPricingKey = getPricingKey();
  const { serviceFeeRate, fuelFeeRate, additionalFees = [] } = feeConfig;

  const calculateVehiclePrice = (vehicle: VehicleCount): {
    basePrice: number;
    serviceFee: number;
    fuelFee: number;
    additionalFees: Array<{ name: string; amount: number }>;
    total: number;
  } => {
    // Use custom price calculator if provided, otherwise use the default logic
    let basePrice: number;
    
    if (customPriceCalculator) {
      basePrice = customPriceCalculator(vehicle, currentPricingKey);
    } else {
      // Default pricing logic
      const priceValue = vehicle.pricing[currentPricingKey] || vehicle.pricing.price || 0;
      
      // For Mini Baja vehicles, multiply by count and seats
      // For other vehicle types, use the price as is
      if (selectedTabValue && ['mb30', 'mb60', 'mb120'].includes(selectedTabValue)) {
        basePrice = priceValue * vehicle.count * vehicle.seats;
      } else {
        basePrice = priceValue * vehicle.count;
      }
    }
    
    const serviceFee = basePrice * serviceFeeRate;
    const fuelFee = basePrice * fuelFeeRate;
    
    const additionalFeeAmounts = additionalFees.map(fee => ({
      name: fee.name,
      amount: fee.calculate(basePrice)
    }));
    
    const additionalFeesTotal = additionalFeeAmounts.reduce((sum, fee) => sum + fee.amount, 0);
    const total = basePrice + serviceFee + fuelFee + additionalFeesTotal;

    return {
      basePrice,
      serviceFee,
      fuelFee,
      additionalFees: additionalFeeAmounts,
      total
    };
  };

  const checkedVehicles = Object.values(vehicleCounts).filter(vehicle => vehicle.isChecked && vehicle.count > 0);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Show Breakdown</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[348px] max-h-96 overflow-y-auto">
        <DropdownMenuLabel>Price Breakdown</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {checkedVehicles.length === 0 ? (
          <p className="p-4 text-center text-gray-500">No vehicles selected</p>
        ) : (
          <>
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="pr-2 text-left py-2">Vehicle</th>
                  <th className="pr-2 text-left py-2">Qty</th>
                  <th className="pr-2 text-left py-2">Base</th>
                  <th className="pr-2 text-left py-2">Service</th>
                  <th className="pr-2 text-left py-2">Fuel</th>
                  {additionalFees.length > 0 && (
                    <th className="pr-2 text-left py-2">Other</th>
                  )}
                  <th className="pr-2 text-left py-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {checkedVehicles.map((vehicle, index) => {
                  const priceDetails = calculateVehiclePrice(vehicle);
                  total += priceDetails.total;

                  return (
                    <tr key={index} className="border-b">
                      <td className="pr-2 py-2">
                        {vehicle.name.split(' ').slice(0, 2).join(' ')}
                      </td>
                      <td className="pr-2 py-2">{vehicle.count}</td>
                      <td className="pr-2 py-2">${priceDetails.basePrice.toFixed(2)}</td>
                      <td className="pr-2 py-2">${priceDetails.serviceFee.toFixed(2)}</td>
                      <td className="pr-2 py-2">${priceDetails.fuelFee.toFixed(2)}</td>
                      {additionalFees.length > 0 && (
                        <td className="pr-2 py-2">
                          ${priceDetails.additionalFees.reduce((sum, fee) => sum + fee.amount, 0).toFixed(2)}
                        </td>
                      )}
                      <td className="pr-2 py-2">${priceDetails.total.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            <div className="mt-4 pt-2 border-t">
              <div className="flex justify-between font-bold">
                <span>Total Price</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};