'use client'
import React from 'react'
import VehiclesTab from '../fleet/vehicles-tab'
import { VehicleType } from '../../page'
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

export const FilteredVehicles = ({vehicles}:{vehicles:VehicleType[]}) => {
    const [former, setFormer] = React.useState(false);
    const filteredVehicles= vehicles.filter(veh=>veh.vehicle_status !== 'former')
  return (
    <div>
      <VehiclesTab vehicles={former ? vehicles : filteredVehicles} />
     <div className="flex items-center space-x-2">
      <Switch onCheckedChange={(checked) => setFormer(checked)} id="show-former"/>
      <Label htmlFor="show-former-vehicles">Show former vehicles</Label>
    </div>
</div>
  )
}
