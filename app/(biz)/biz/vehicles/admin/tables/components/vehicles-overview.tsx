'use client';

import { createClient } from '@/utils/supabase/client';
import {
  fetchAllVehicleLocations,
  fetchVehicles
} from '@/utils/supabase/queries';
import { useQuery } from '@tanstack/react-query';
import { VehicleType } from '../../page';
import { Database } from '@/types_db';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useState } from 'react';

type VehicleLocation = Database['public']['Tables']['vehicle_locations']['Row'];

const shopCoordinates = {
  vegas: { lat: 36.278439, lon: -115.020068 },
  pismo: { lat: 35.105821, lon: -120.63038 },
  nellis: [
    { lat: 36.288471, lon: -114.970005 },
    { lat: 36.316064, lon: -114.944085 }
  ]
};

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

function getDistanceFromLatLonInMiles(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3958.8;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function isNearLocation(
  lat: number,
  lon: number,
  location: keyof typeof shopCoordinates,
  setDistance: number = 2
): boolean {
  const coordinates = shopCoordinates[location];
  if (Array.isArray(coordinates)) {
    return coordinates.some(
      (coord) =>
        getDistanceFromLatLonInMiles(lat, lon, coord.lat, coord.lon) <=
        setDistance
    );
  }
  return (
    getDistanceFromLatLonInMiles(lat, lon, coordinates.lat, coordinates.lon) <=
    setDistance
  );
}

function getLocationType(lat: number, lon: number): string {
  if (isNearLocation(lat, lon, 'vegas')) return 'Vegas Shop';
  if (isNearLocation(lat, lon, 'pismo')) return 'Pismo Shop';
  if (isNearLocation(lat, lon, 'nellis')) return 'Vegas Nellis';
  return 'Unknown';
}

function groupVehicles(
  vehicles: VehicleType[]
): Record<string, { operational: number; broken: number }> {
  return vehicles.reduce(
    (acc, vehicle) => {
      if (!acc[vehicle.type]) acc[vehicle.type] = { operational: 0, broken: 0 };
      if (vehicle.vehicle_status === 'broken') {
        acc[vehicle.type].broken++;
      } else {
        acc[vehicle.type].operational++;
      }
      return acc;
    },
    {} as Record<string, { operational: number; broken: number }>
  );
}

function groupVehiclesBySeatCount(
  vehicles: VehicleType[],
  vehicleType: string
): Record<string, { operational: number; broken: number }> {
  return vehicles
    .filter((v) => v.type === vehicleType)
    .reduce(
      (acc, vehicle) => {
        if (!acc[vehicle.seats])
          acc[vehicle.seats] = { operational: 0, broken: 0 };
        if (vehicle.vehicle_status === 'broken') {
          acc[vehicle.seats].broken++;
        } else {
          acc[vehicle.seats].operational++;
        }
        return acc;
      },
      {} as Record<string, { operational: number; broken: number }>
    );
}

export default function VehiclesOverview() {
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const supabase = createClient();

  const { data: vehicles, error: vehiclesError } = useQuery<
    VehicleType[],
    Error
  >({
    queryKey: ['vehicles'],
    queryFn: () => fetchVehicles(supabase)
  });

  const { data: vehicleLocations, error: locationsError } = useQuery<
    VehicleLocation[],
    Error
  >({
    queryKey: ['vehicleLocations'],
    queryFn: () => fetchAllVehicleLocations(supabase)
  });

  if (vehiclesError || locationsError) {
    console.error('Error fetching data:', vehiclesError || locationsError);
    return <div>Error fetching data</div>;
  }

  if (!vehicles || !vehicleLocations) {
    return <div>Loading...</div>;
  }

  const latestVehicleLocations = vehicleLocations.reduce(
    (acc, location) => {
      if (
        location.vehicle_id &&
        (!acc[location.vehicle_id] ||
          acc[location.vehicle_id].created_at < location.created_at)
      ) {
        acc[location.vehicle_id] = location;
      }
      return acc;
    },
    {} as Record<string, VehicleLocation>
  );

  const vehiclesWithLocation = vehicles.map((vehicle) => {
    const location = latestVehicleLocations[vehicle.id];
    return {
      ...vehicle,
      city:
        location && location.latitude && location.longitude
          ? getLocationType(location.latitude, location.longitude)
          : 'No Location',
      latitude: location?.latitude,
      longitude: location?.longitude,
      location_created_at: location?.created_at
    };
  });

  const filteredVehicles =
    selectedLocation === 'all'
      ? vehiclesWithLocation
      : vehiclesWithLocation.filter((v) =>
          v.city.toLowerCase().includes(selectedLocation.toLowerCase())
        );

  const vehicleTypes = groupVehicles(filteredVehicles);
  const buggiesBySeatCount = groupVehiclesBySeatCount(
    filteredVehicles,
    'buggy'
  );
  const atvsBySeatCount = groupVehiclesBySeatCount(filteredVehicles, 'atv');

  const locations = Array.from(
    new Set(vehiclesWithLocation.map((v) => v.city))
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Vehicles Overview</h1>
        <Select
          onValueChange={setSelectedLocation}
          defaultValue={selectedLocation}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select location" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            <SelectGroup>
              <SelectItem value="vegas" className="font-bold text-lg">
                Vegas
              </SelectItem>
              <SelectItem value="vegas shop">Vegas Shop</SelectItem>
              <SelectItem value="vegas nellis">Vegas Nellis</SelectItem>
            </SelectGroup>
            <SelectGroup>
              <SelectItem value="pismo" className="font-bold text-lg">
                Pismo
              </SelectItem>
              <SelectItem value="pismo shop">Pismo Shop</SelectItem>
            </SelectGroup>
            <SelectItem value="no location">No Location</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Category</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>
              <span className="text-green-500">Operational</span>/
              <span className="text-red-500">Broken</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>All Vehicles</TableCell>
            <TableCell>{filteredVehicles.length}</TableCell>
            <TableCell>
              <span className="text-green-500 font-bold">
                {
                  filteredVehicles.filter((v) => v.vehicle_status !== 'broken')
                    .length
                }
              </span>
              {' / '}
              <span className="text-red-500 font-bold">
                {
                  filteredVehicles.filter((v) => v.vehicle_status === 'broken')
                    .length
                }
              </span>
            </TableCell>
          </TableRow>
          {Object.entries(vehicleTypes).map(
            ([type, { operational, broken }]) => (
              <TableRow key={type}>
                <TableCell className="capitalize">{type}s</TableCell>
                <TableCell>{operational + broken}</TableCell>
                <TableCell>
                  <span className="text-green-500 font-bold">
                    {operational}
                  </span>
                  {' / '}
                  <span className="text-red-500 font-bold">{broken}</span>
                </TableCell>
              </TableRow>
            )
          )}
        </TableBody>
      </Table>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead colSpan={3}>Buggies by Seat Count</TableHead>
            </TableRow>
            <TableRow>
              <TableHead>Seats</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>
                <span className="text-green-500">Operational</span>/
                <span className="text-red-500">Broken</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(buggiesBySeatCount).map(
              ([seats, { operational, broken }]) => (
                <TableRow key={seats}>
                  <TableCell>{seats}</TableCell>
                  <TableCell>{operational + broken}</TableCell>
                  <TableCell>
                    <span className="text-green-500 font-bold">
                      {operational}
                    </span>
                    {' / '}
                    <span className="text-red-500 font-bold">{broken}</span>
                  </TableCell>
                </TableRow>
              )
            )}
          </TableBody>
        </Table>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead colSpan={3}>ATVs by Seat Count</TableHead>
            </TableRow>
            <TableRow>
              <TableHead>Seats</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>
                <span className="text-green-500">Operational</span>/
                <span className="text-red-500">Broken</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(atvsBySeatCount).map(
              ([seats, { operational, broken }]) => (
                <TableRow key={seats}>
                  <TableCell>{seats}</TableCell>
                  <TableCell>{operational + broken}</TableCell>
                  <TableCell>
                    <span className="text-green-500 font-bold">
                      {operational}
                    </span>
                    {' / '}
                    <span className="text-red-500 font-bold">{broken}</span>
                  </TableCell>
                </TableRow>
              )
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
