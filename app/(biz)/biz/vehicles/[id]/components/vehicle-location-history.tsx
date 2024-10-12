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

const supabase = createClient();

interface LocationHistoryProps {
  vehicleLocations: VehicleLocation[];
}

function isNearVegasShop(lat: number, lon: number): boolean {
  const shopCoordinates = [{ lat: 36.278439, lon: -115.020068 }];

  return shopCoordinates.some((coord) => {
    const distance = getDistanceFromLatLonInMiles(
      lat,
      lon,
      coord.lat,
      coord.lon
    );
    return distance <= 2;
  });
}

function isNearNellis(lat: number, lon: number): boolean {
  const nellisCoordinates = [
    { lat: 36.288471, lon: -114.970005 },
    { lat: 36.316064, lon: -114.944085 }
  ];

  return nellisCoordinates.some((coord) => {
    const distance = getDistanceFromLatLonInMiles(
      lat,
      lon,
      coord.lat,
      coord.lon
    );
    return distance <= 2;
  });
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
  vehicleLocations
}: LocationHistoryProps) {
  const [currentPage, setCurrentPage] = React.useState(1);
  const [isRotating, setIsRotating] = React.useState(false);
  const rowsPerPage = 10;

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
                    'Unknown'}
                </TableCell>
                <TableCell>
                  {isNearNellis(location.latitude, location.longitude)
                    ? 'Nellis'
                    : isNearVegasShop(location.latitude, location.longitude)
                      ? 'Vegas Shop'
                      : location.city || 'Unknown'}
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
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
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
