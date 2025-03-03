'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';
import {
  fetchVehicleNameFromId,
  getUserDetailsById
} from '@/utils/supabase/queries';
import { VehicleLocation } from '../../types';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination';
import { MapIcon, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DialogFactory from '@/components/dialog-factory';
import AssignLocationHistory from './assign-location-form';

const supabase = createClient();

interface LocationHistoryProps {
  vehicleLocations: VehicleLocation[];
  locCreator?: boolean;
  user_id?: string;
}
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

function getLocationType(lat: number, lon: number, city?: string): string {
  if (isNearLocation(lat, lon, 'vegasShop')) return 'Vegas Shop';
  if (isNearLocation(lat, lon, 'pismoShop', 0.5)) return 'Pismo Shop';
  if (isNearLocation(lat, lon, 'pismoBeach', 0.5)) return 'Pismo Beach';
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
function getDistanceFromLatLonInMiles(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3958.8; // Radius of the Earth in miles
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in miles
  return distance;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

export default function LocationHistory({
  vehicleLocations,
  locCreator,
  user_id
}: LocationHistoryProps) {
  const [currentPage, setCurrentPage] = React.useState(1);
  const [isRotating, setIsRotating] = React.useState(false);
  const rowsPerPage = 10;
  const [isLocationCreatorDialogOpen, setIsLocationCreatorDialogOpen] =
    React.useState(false);

  const sortedLocations = React.useMemo(
    () =>
      [...vehicleLocations].sort((a, b) =>
        (a?.created_at ?? '') < (b?.created_at ?? '') ? 1 : -1
      ),
    [vehicleLocations]
  );

  const totalPages = Math.ceil(sortedLocations.length / rowsPerPage);
  const currentRows = sortedLocations.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const uniqueUserIds = React.useMemo(
    () =>
      Array.from(
        new Set(
          currentRows.map((row) => row.created_by).filter(Boolean) as string[]
        )
      ),
    [currentRows]
  );

  const uniqueVehicleIds = React.useMemo(
    () =>
      Array.from(
        new Set(
          currentRows.map((row) => row.vehicle_id).filter(Boolean) as string[]
        )
      ),
    [currentRows]
  );

  const { data: userDetails, refetch: refetchUserDetails } = useQuery({
    queryKey: ['userDetails', uniqueUserIds],
    queryFn: async () => {
      const details = await Promise.all(
        uniqueUserIds.map((id) => getUserDetailsById(supabase, id))
      );
      return details.flat().reduce(
        (acc, user) => {
          if (user) {
            acc[user.id] = user.full_name ?? 'Unknown';
          }
          return acc;
        },
        {} as Record<string, string>
      );
    },
    enabled: uniqueUserIds.length > 0
  });

  const { data: vehicleNames, refetch: refetchVehicleNames } = useQuery({
    queryKey: ['vehicleNames', uniqueVehicleIds],
    queryFn: async () => {
      const names = await Promise.all(
        uniqueVehicleIds.map((id) => fetchVehicleNameFromId(supabase, id))
      );
      const flatNames = names.flat().flat();
      return flatNames;
      //  flatNames: {
      //   name: any;
      //   id: any;
      // }[];
    },
    enabled: uniqueVehicleIds.length > 0
  });

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  const handleRefresh = () => {
    setIsRotating(true);
    refetchUserDetails();
    refetchVehicleNames();
    setTimeout(() => setIsRotating(false), 500); // Reset the animation class after the animation duration
  };
  if (currentRows.length === 0)
    return <div>No Location History Found For This Vehicle</div>;
  return (
    <div className="space-y-4">
      <div className="w-full flex justify-center">
        <button
          onClick={handleRefresh}
          className={` ${isRotating ? 'rotate-180' : ''}`}
        >
          <RefreshCcw size={16} />
        </button>
      </div>
      {locCreator && (
        <div className="w-full flex ">
          <Button onClick={() => setIsLocationCreatorDialogOpen(true)}>
            Assign New Location Location
          </Button>

          <DialogFactory
            title="Assign Location"
            description="Assign Location"
            isDialogOpen={isLocationCreatorDialogOpen}
            setIsDialogOpen={setIsLocationCreatorDialogOpen}
            children={
              <AssignLocationHistory
                vehicle_id={vehicleLocations[0].vehicle_id || ''}
                user_id={user_id || ''}
              />
            }
          />
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Vehicle</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead>User</TableHead>
            <TableHead>City</TableHead>
            <TableHead>Map</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {currentRows.map((location, index) => {
            if (!location.latitude || !location.longitude) return null;
            return (
              <TableRow key={index}>
                <TableCell>
                  {vehicleNames && location.vehicle_id && (
                    <Link
                      href={`/biz/vehicles/${location.vehicle_id}`}
                      className="text-primary hover:underline"
                    >
                      {vehicleNames.find(
                        (vehicle) => vehicle.id === location.vehicle_id
                      )?.name || 'Unknown'}
                    </Link>
                  )}
                </TableCell>
                <TableCell>
                  {new Date(location.created_at).toLocaleString('en-US', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  })}
                </TableCell>
                <TableCell>
                  {(userDetails &&
                    location.created_by &&
                    userDetails[location.created_by]) ||
                    'Guest User'}
                </TableCell>
                <TableCell>
                  {getLocationType(location.latitude, location.longitude)}
                </TableCell>
                <TableCell>
                  {location.latitude === 0 || location.longitude === 0 ? (
                    <div>Unknown</div>
                  ) : (
                    <a
                      href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:underline "
                    >
                      <MapIcon size={16} />
                    </a>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
            />
          </PaginationItem>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .slice(
              Math.max(0, currentPage - 3),
              Math.min(totalPages, currentPage + 3)
            )
            .map((page) => (
              <PaginationItem key={page}>
                <PaginationLink
                  href="#"
                  onClick={() => handlePageChange(page)}
                  isActive={currentPage === page}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}
          <PaginationItem>
            <PaginationNext
              href="#"
              onClick={() =>
                handlePageChange(Math.min(totalPages, currentPage + 1))
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
