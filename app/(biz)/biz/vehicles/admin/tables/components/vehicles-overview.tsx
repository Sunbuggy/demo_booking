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
import MapComponent from './mapcomponent';
import DialogFactory from '@/components/dialog-factory';
import VehiclesLister from './vehicles-lister';

type VehicleLocation = Database['public']['Tables']['vehicle_locations']['Row'];

const locationCoordinates = {
  vegasShop: { lat: 36.278439, lon: -115.020068 },
  pismoShop: { lat: 35.105821, lon: -120.63038 },
  nellis: [
    { lat: 36.288471, lon: -114.970005 },
    { lat: 36.316064, lon: -114.944085 }
  ],
  pismoBeach: { lat: 35.090735, lon: -120.629598 }, //0.25 from here
  silverlakeShop: { lat: 43.675239, lon: -86.472552 },
  silverlakeDunes: { lat: 43.686365, lon: -86.508345 }
};

const pismoBeachCoordinates = [
  { lat: 35.095288, lon: -120.63195 },
  { lat: 35.095301, lon: -120.621078 },
  { lat: 35.086092, lon: -120.63192 },
  { lat: 35.086167, lon: -120.61671 }
];

const pismoDunesCoordinates = [
  { lat: 35.085717, lon: -120.632317 },
  { lat: 35.091236, lon: -120.583693 },
  { lat: 35.020388, lon: -120.590649 },
  { lat: 35.022873, lon: -120.635966 }
];

const vofCoordinates = [
  { lat: 36.617272, lon: -114.48814 },
  { lat: 36.620518, lon: -114.526353 },
  { lat: 36.479769, lon: -114.583101 },
  { lat: 36.479083, lon: -114.514348 }
];

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
function isPointInPolygon(
  lat: number,
  lon: number,
  coordinates: { lat: number; lon: number }[]
): boolean {
  let inside = false;
  for (let i = 0, j = coordinates.length - 1; i < coordinates.length; j = i++) {
    const xi = coordinates[i].lat,
      yi = coordinates[i].lon;
    const xj = coordinates[j].lat,
      yj = coordinates[j].lon;

    const intersect =
      yi > lon !== yj > lon && lat < ((xj - xi) * (lon - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function isBetweenCoordinates(
  lat: number,
  lon: number,
  coordinates: { lat: number; lon: number }[]
): boolean {
  return isPointInPolygon(lat, lon, coordinates);
}

function isNearLocation(
  lat: number,
  lon: number,
  location: keyof typeof locationCoordinates,
  setDistance: number = 2
): boolean {
  const coordinates = locationCoordinates[location];
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
  if (isNearLocation(lat, lon, 'vegasShop')) return 'Vegas Shop';
  if (isNearLocation(lat, lon, 'pismoShop', 0.5)) return 'Pismo Shop';
  if (isNearLocation(lat, lon, 'nellis')) return 'Vegas Nellis';
  if (isBetweenCoordinates(lat, lon, vofCoordinates))
    return 'Vegas Valley of fire';
  if (isBetweenCoordinates(lat, lon, pismoBeachCoordinates))
    return 'Pismo Beach';
  if (isBetweenCoordinates(lat, lon, pismoDunesCoordinates))
    return 'Pismo Dunes';
  if (isNearLocation(lat, lon, 'silverlakeShop')) return 'Silver Lake Shop';
  if (isNearLocation(lat, lon, 'silverlakeDunes', 0.25))
    return 'Silver Lake Dunes';

  return 'Unknown';
}

function groupVehicles(vehicles: VehicleType[]): Record<
  string,
  {
    operational: number;
    broken: number;
    operationalIds: string[];
    brokenIds: string[];
  }
> {
  return vehicles.reduce(
    (acc, vehicle) => {
      if (!acc[vehicle.type]) {
        acc[vehicle.type] = {
          operational: 0,
          broken: 0,
          operationalIds: [],
          brokenIds: []
        };
      }
      if (vehicle.vehicle_status === 'broken') {
        acc[vehicle.type].broken++;
        acc[vehicle.type].brokenIds.push(vehicle.id);
      } else {
        acc[vehicle.type].operational++;
        acc[vehicle.type].operationalIds.push(vehicle.id);
      }
      return acc;
    },
    {} as Record<
      string,
      {
        operational: number;
        broken: number;
        operationalIds: string[];
        brokenIds: string[];
      }
    >
  );
}

function groupVehiclesBySeatCount(
  vehicles: VehicleType[],
  vehicleType: string
): Record<
  string,
  {
    operational: number;
    broken: number;
    operationalIds: string[];
    brokenIds: string[];
  }
> {
  return vehicles
    .filter((v) => v.type === vehicleType)
    .reduce(
      (acc, vehicle) => {
        if (!acc[vehicle.seats]) {
          acc[vehicle.seats] = {
            operational: 0,
            broken: 0,
            operationalIds: [],
            brokenIds: []
          };
        }
        if (vehicle.vehicle_status === 'broken') {
          acc[vehicle.seats].broken++;
          acc[vehicle.seats].brokenIds.push(vehicle.id);
        } else {
          acc[vehicle.seats].operational++;
          acc[vehicle.seats].operationalIds.push(vehicle.id);
        }
        return acc;
      },
      {} as Record<
        string,
        {
          operational: number;
          broken: number;
          operationalIds: string[];
          brokenIds: string[];
        }
      >
    );
}

export default function VehiclesOverview() {
  const [selectedLocation, setSelectedLocation] = useState<string>('all');

  const [selectedOverViewList, setSelectedOverViewList] = useState<string[]>(
    []
  );
  const [openOverviewDialog, setOpenOverviewDialog] = useState<
    'total' | 'operational' | 'broken' | null
  >(null);
  const supabase = createClient();

  const handleOverviewDialogOpen = (
    list: string[],
    type: 'total' | 'operational' | 'broken'
  ) => {
    setSelectedOverViewList(list);
    setOpenOverviewDialog(type);
  };

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
      <div className="flex justify-between items-center z-50">
        <h1 className="text-2xl font-bold">Vehicles Overview</h1>
        <Select
          onValueChange={setSelectedLocation}
          defaultValue={selectedLocation}
        >
          <SelectTrigger className="w-[180px] z-50">
            <SelectValue placeholder="Select location" />
          </SelectTrigger>
          <SelectContent className="z-50">
            <SelectItem value="all">All Locations</SelectItem>
            <SelectGroup>
              <SelectItem value="vegas" className="font-bold text-lg">
                Vegas
              </SelectItem>
              <SelectItem value="vegas shop">Vegas Shop</SelectItem>
              <SelectItem value="vegas nellis">Vegas Nellis</SelectItem>
              <SelectItem value="vegas valley of fire">
                Vegas Valley of Fire
              </SelectItem>
            </SelectGroup>
            <SelectGroup>
              <SelectItem value="pismo" className="font-bold text-lg">
                Pismo
              </SelectItem>
              <SelectItem value="pismo shop">Pismo Shop</SelectItem>
              <SelectItem value="pismo beach">Pismo Beach</SelectItem>
              <SelectItem value="pismo dunes">Pismo Dunes</SelectItem>
            </SelectGroup>
            <SelectGroup>
              <SelectItem value="Silver Lake" className="font-bold text-lg">
                Silver Lake
              </SelectItem>
              <SelectItem value="silver lake shop">Silver Lake Shop</SelectItem>
              <SelectItem value="silver lake dunes">
                Silver Lake Dunes
              </SelectItem>
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
            ([type, { operational, broken, operationalIds, brokenIds }]) => {
              const totalIds = operationalIds.concat(brokenIds);
              return (
                <TableRow key={type}>
                  <TableCell className="capitalize">{type}s</TableCell>
                  <TableCell>
                    <span
                      className="cursor-pointer underline hover:text-blue-500"
                      onClick={() =>
                        handleOverviewDialogOpen(totalIds, 'total')
                      }
                    >
                      {operational + broken}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className="cursor-pointer text-green-500 font-bold underline hover:text-green-700"
                      onClick={() =>
                        handleOverviewDialogOpen(operationalIds, 'operational')
                      }
                    >
                      {operational}
                    </span>
                    {' / '}
                    <span
                      className="cursor-pointer text-red-500 font-bold underline hover:text-red-700"
                      onClick={() =>
                        handleOverviewDialogOpen(brokenIds, 'broken')
                      }
                    >
                      {broken}
                    </span>
                  </TableCell>
                </TableRow>
              );
            }
          )}
        </TableBody>
      </Table>
      {openOverviewDialog === 'total' && (
        <DialogFactory
          title={'Total Vehicles Overview'}
          setIsDialogOpen={() => setOpenOverviewDialog(null)}
          isDialogOpen={openOverviewDialog === 'total'}
          description="Overview of all vehicles."
          children={<VehiclesLister list={selectedOverViewList} />}
        />
      )}
      {openOverviewDialog === 'operational' && (
        <DialogFactory
          title={'Operational Vehicles Overview'}
          setIsDialogOpen={() => setOpenOverviewDialog(null)}
          isDialogOpen={openOverviewDialog === 'operational'}
          description="Overview of operational vehicles."
          children={<VehiclesLister list={selectedOverViewList} />}
        />
      )}
      {openOverviewDialog === 'broken' && (
        <DialogFactory
          title={'Broken Vehicles Overview'}
          setIsDialogOpen={() => setOpenOverviewDialog(null)}
          isDialogOpen={openOverviewDialog === 'broken'}
          description="Overview of broken vehicles."
          children={<VehiclesLister list={selectedOverViewList} />}
        />
      )}

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
              ([seats, { operational, broken, brokenIds, operationalIds }]) => {
                const totalIds = operationalIds.concat(brokenIds);
                return (
                  <TableRow key={seats}>
                    <TableCell>{seats}</TableCell>
                    <TableCell>
                      <span
                        className="cursor-pointer underline hover:text-blue-500"
                        onClick={() =>
                          handleOverviewDialogOpen(totalIds, 'total')
                        }
                      >
                        {operational + broken}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className="cursor-pointer text-green-500 font-bold underline hover:text-green-700"
                        onClick={() =>
                          handleOverviewDialogOpen(
                            operationalIds,
                            'operational'
                          )
                        }
                      >
                        {operational}
                      </span>
                      {' / '}
                      <span
                        className="cursor-pointer text-red-500 font-bold underline hover:text-red-700"
                        onClick={() =>
                          handleOverviewDialogOpen(brokenIds, 'broken')
                        }
                      >
                        {broken}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              }
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
              ([seats, { operational, broken, brokenIds, operationalIds }]) => {
                const totalIds = operationalIds.concat(brokenIds);
                return (
                  <TableRow key={seats}>
                    <TableCell>{seats}</TableCell>
                    <TableCell>
                      <span
                        className="cursor-pointer underline hover:text-blue-500"
                        onClick={() =>
                          handleOverviewDialogOpen(totalIds, 'total')
                        }
                      >
                        {operational + broken}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className="cursor-pointer text-green-500 font-bold underline hover:text-green-700"
                        onClick={() =>
                          handleOverviewDialogOpen(
                            operationalIds,
                            'operational'
                          )
                        }
                      >
                        {operational}
                      </span>
                      {' / '}
                      <span
                        className="cursor-pointer text-red-500 font-bold underline hover:text-red-700"
                        onClick={() =>
                          handleOverviewDialogOpen(brokenIds, 'broken')
                        }
                      >
                        {broken}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              }
            )}
          </TableBody>
        </Table>
      </div>
      <div className="z-30">
        <MapComponent vehicles={filteredVehicles} />
      </div>
    </div>
  );
}
