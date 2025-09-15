'use client'

import { useState } from 'react'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  mbj_vehicles_list, 
  atv_vehicles_list, 
  vof_vehicles_list, 
  ffr_vehicles_list 
} from '@/utils/helpers'

interface Vehicle {
  id: number
  name: string
  seats: number
  pricing: {
    [key: string]: number | string | undefined
    mb30?: number
    mb60?: number
    mb120?: number
    full_atv?: number
    desert_racer?: number
    price?: number
  }
  image?: string
  description?: string
}

interface BookingSelectionProps {
  selectedVehicles: { [key: number]: { count: number; isChecked: boolean } }
  onVehicleSelect: (vehicleId: number, count: number, isChecked: boolean) => void
  viewMode?: boolean
}

type FleetType = 'mbj' | 'atv' | 'vof' | 'ffr'

export default function BookingSelection({ 
  selectedVehicles, 
  onVehicleSelect, 
  viewMode = false 
}: BookingSelectionProps) {
  const [activeFleet, setActiveFleet] = useState<FleetType>('mbj')
  
  const fleetData: Record<FleetType, { name: string; vehicles: Vehicle[] }> = {
    mbj: {
      name: "Mini Baja",
      vehicles: mbj_vehicles_list
    },
    atv: {
      name: "ATV Adventures",
      vehicles: atv_vehicles_list
    },
    vof: {
      name: "Valley of Fire",
      vehicles: vof_vehicles_list
    },
    ffr: {
      name: "Family Fun Rides",
      vehicles: ffr_vehicles_list
    }
  }

  const handleIncrement = (vehicleId: number) => {
    const currentCount = selectedVehicles[vehicleId]?.count || 0
    onVehicleSelect(vehicleId, currentCount + 1, true)
  }

  const handleDecrement = (vehicleId: number) => {
    const currentCount = selectedVehicles[vehicleId]?.count || 0
    if (currentCount > 0) {
      onVehicleSelect(vehicleId, currentCount - 1, currentCount - 1 > 0)
    }
  }

  return (
    <div className="w-full space-y-4">
      {/* Fleet Selection Tabs */}
      <div className="flex space-x-2 overflow-x-auto pb-2">
        {Object.entries(fleetData).map(([key, fleet]) => (
          <Button
            key={key}
            variant={activeFleet === key ? "default" : "outline"}
            onClick={() => setActiveFleet(key as FleetType)}
            className="min-w-max"
          >
            {fleet.name}
          </Button>
        ))}
      </div>

      {/* Carousel for Selected Fleet */}
      <div className="px-8">
        <Carousel opts={{ align: "start", loop: true }}>
          <CarouselContent>
            {fleetData[activeFleet].vehicles.map((vehicle) => {
              const count = selectedVehicles[vehicle.id]?.count || 0
              const isSelected = selectedVehicles[vehicle.id]?.isChecked || false
              
              return (
                <CarouselItem key={vehicle.id} className="md:basis-1/2 lg:basis-1/3">
                  <Card className={`h-full ${isSelected ? 'border-2 border-primary' : ''}`}>
                    <CardContent className="flex flex-col p-4">
                      {/* Vehicle Image Placeholder */}
                      <div className="h-40 bg-muted rounded-md mb-3 flex items-center justify-center">
                        {vehicle.image ? (
                          <img 
                            src={vehicle.image} 
                            alt={vehicle.name} 
                            className="h-full w-full object-cover rounded-md"
                          />
                        ) : (
                          <div className="text-muted-foreground">Vehicle Image</div>
                        )}
                      </div>
                      
                      {/* Vehicle Info */}
                      <div className="flex-grow">
                        <h3 className="font-bold text-lg">{vehicle.name}</h3>
                        {vehicle.description && (
                          <p className="text-sm text-muted-foreground mt-1">{vehicle.description}</p>
                        )}
                        <div className="flex items-center mt-2">
                          <Badge variant="secondary" className="mr-2">
                            {vehicle.seats} {vehicle.seats === 1 ? 'seat' : 'seats'}
                          </Badge>
                          <Badge variant="outline">
                            ${vehicle.pricing.mb30 || vehicle.pricing.full_atv || vehicle.pricing.price}
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Selection Controls */}
                      {!viewMode && (
                        <div className="flex items-center justify-between mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDecrement(vehicle.id)}
                            disabled={count === 0}
                          >
                            -
                          </Button>
                          
                          <span className="font-bold">{count}</span>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleIncrement(vehicle.id)}
                          >
                            +
                          </Button>
                        </div>
                      )}
                      
                      {viewMode && count > 0 && (
                        <div className="text-center mt-2">
                          <Badge className="bg-green-500">
                            Selected: {count}
                          </Badge>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </CarouselItem>
              )
            })}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>
    </div>
  )
}