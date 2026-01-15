/**
 * @file vehicle-location-history.tsx
 * @description Renders vehicle history with external S3 Profile Avatars.
 * CONFIGURATION:
 * - Endpoint: https://usc1.contabostorage.com (Contabo US Central)
 * - Bucket: sb-fleet
 * - DB Column: profile_pic_key
 */
'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';
import { getUserDetailsById } from '@/utils/supabase/queries';
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
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination';
import { RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DialogFactory from '@/components/dialog-factory';
import AssignLocationHistory from './assign-location-form';
import { LocationCell } from '@/components/fleet/LocationCell';
import VehicleStatusAvatar from '@/components/fleet/vehicle-status-avatar';

// --- CONFIGURATION ---
// Validated from your environment variables
const S3_PUBLIC_ENDPOINT = "https://usc1.contabostorage.com"; 
const S3_BUCKET_NAME = "sb-fleet"; 

const supabase = createClient();

// --- HELPER: Construct S3 URL ---
const getS3Url = (key: string | null) => {
  if (!key) return null;
  if (key.startsWith('http')) return key; 
  
  // Format: https://{endpoint}/{bucket}/{key}
  const cleanEndpoint = S3_PUBLIC_ENDPOINT.replace(/\/$/, "");
  return `${cleanEndpoint}/${S3_BUCKET_NAME}/${key}`;
};

interface LocationHistoryProps {
  vehicleLocations: VehicleLocation[];
  locCreator?: boolean;
  user_id?: string;
}

// -----------------------------------------------------------------------------
// GEOFENCING LOGIC
// -----------------------------------------------------------------------------

const locationCoordinates = {
  vegasShop: { lat: 36.278439, lon: -115.020068 },
  pismoShop: { lat: 35.105821, lon: -120.63038 },
  nellis: [
    { lat: 36.288471, lon: -114.970005 },
    { lat: 36.316064, lon: -114.944085 }
  ],
  pismoBeach: { lat: 35.090735, lon: -120.629598 }, 
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

function isPointInPolygon(lat: number, lon: number, coordinates: { lat: number; lon: number }[]): boolean {
  let inside = false;
  for (let i = 0, j = coordinates.length - 1; i < coordinates.length; j = i++) {
    const xi = coordinates[i].lat, yi = coordinates[i].lon;
    const xj = coordinates[j].lat, yj = coordinates[j].lon;
    const intersect = yi > lon !== yj > lon && lat < ((xj - xi) * (lon - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function isBetweenCoordinates(lat: number, lon: number, coordinates: { lat: number; lon: number }[]): boolean {
  return isPointInPolygon(lat, lon, coordinates);
}

function isNearLocation(lat: number, lon: number, location: keyof typeof locationCoordinates, setDistance: number = 2): boolean {
  const coordinates = locationCoordinates[location];
  if (Array.isArray(coordinates)) {
    return coordinates.some(
      (coord) => getDistanceFromLatLonInMiles(lat, lon, coord.lat, coord.lon) <= setDistance
    );
  }
  return getDistanceFromLatLonInMiles(lat, lon, coordinates.lat, coordinates.lon) <= setDistance;
}

function getLocationType(lat: number, lon: number): string {
  if (isNearLocation(lat, lon, 'vegasShop')) return 'Vegas Shop';
  if (isNearLocation(lat, lon, 'pismoShop', 0.5)) return 'Pismo Shop';
  if (isNearLocation(lat, lon, 'pismoBeach', 0.5)) return 'Pismo Beach';
  if (isNearLocation(lat, lon, 'nellis')) return 'Vegas Nellis';
  if (isBetweenCoordinates(lat, lon, vofCoordinates)) return 'Vegas Valley of fire';
  if (isBetweenCoordinates(lat, lon, pismoBeachCoordinates)) return 'Pismo Beach';
  if (isBetweenCoordinates(lat, lon, pismoDunesCoordinates)) return 'Pismo Dunes';
  if (isNearLocation(lat, lon, 'silverlakeShop')) return 'Silver Lake Shop';
  if (isNearLocation(lat, lon, 'silverlakeDunes', 0.25)) return 'Silver Lake Dunes';
  return 'Unknown';
}

function getDistanceFromLatLonInMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

// -----------------------------------------------------------------------------
// MAIN COMPONENT
// -----------------------------------------------------------------------------

export default function LocationHistory({
  vehicleLocations,
  locCreator,
  user_id
}: LocationHistoryProps) {
  const [currentPage, setCurrentPage] = React.useState(1);
  const [isRotating, setIsRotating] = React.useState(false);
  const rowsPerPage = 10;
  const [isLocationCreatorDialogOpen, setIsLocationCreatorDialogOpen] = React.useState(false);

  // Sort by Newest
  const sortedLocations = React.useMemo(
    () => [...vehicleLocations].sort((a, b) => (a?.created_at ?? '') < (b?.created_at ?? '') ? 1 : -1),
    [vehicleLocations]
  );

  const totalPages = Math.ceil(sortedLocations.length / rowsPerPage);
  const currentRows = sortedLocations.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const uniqueUserIds = React.useMemo(() => 
    Array.from(new Set(currentRows.map((row) => row.created_by).filter(Boolean) as string[])),
    [currentRows]
  );

  const uniqueVehicleIds = React.useMemo(() => 
    Array.from(new Set(currentRows.map((row) => row.vehicle_id).filter(Boolean) as string[])),
    [currentRows]
  );

  // 1. FETCH USER DETAILS
  const { data: userDetails, refetch: refetchUserDetails } = useQuery({
    queryKey: ['userDetails', uniqueUserIds],
    queryFn: async () => {
      const details = await Promise.all(uniqueUserIds.map((id) => getUserDetailsById(supabase, id)));
      return details.flat().reduce((acc, user) => {
        if (user) acc[user.id] = user.full_name ?? 'Unknown';
        return acc;
      }, {} as Record<string, string>);
    },
    enabled: uniqueUserIds.length > 0
  });

  // 2. FETCH VEHICLE DETAILS
  const { data: vehiclesMap, refetch: refetchVehicles } = useQuery({
    queryKey: ['vehicleDetailsFull', uniqueVehicleIds],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        // Using 'profile_pic_key' to grab the S3 filename
        .select('id, name, type, pet_name, profile_pic_key')
        .in('id', uniqueVehicleIds);
      
      if (error) {
        console.error('Error fetching vehicle details:', error);
        return {};
      }

      const map: Record<string, any> = {};
      data?.forEach((v) => { map[v.id] = v; });
      return map;
    },
    enabled: uniqueVehicleIds.length > 0
  });

  const handleRefresh = () => {
    setIsRotating(true);
    refetchUserDetails();
    refetchVehicles();
    setTimeout(() => setIsRotating(false), 500);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (currentRows.length === 0)
    return <div className="p-4 text-slate-500 italic">No Location History Found For This Vehicle</div>;

  return (
    <div className="space-y-4">
      {/* HEADER */}
      <div className="flex justify-between items-center px-1">
        <button
          onClick={handleRefresh}
          className={`p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all ${isRotating ? 'animate-spin' : ''}`}
          title="Refresh History"
        >
          <RefreshCcw size={16} className="text-slate-500" />
        </button>

        {locCreator && (
          <div className="flex">
            <Button size="sm" onClick={() => setIsLocationCreatorDialogOpen(true)}>
              Assign New Location
            </Button>
            <DialogFactory
              title="Assign Location"
              description="Manually record a vehicle location."
              isDialogOpen={isLocationCreatorDialogOpen}
              setIsDialogOpen={setIsLocationCreatorDialogOpen}
            >
              <AssignLocationHistory
                vehicle_id={vehicleLocations[0]?.vehicle_id || ''}
                user_id={user_id || ''}
              />
            </DialogFactory>
          </div>
        )}
      </div>

      {/* TABLE */}
      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50 dark:bg-zinc-900">
            <TableRow>
              <TableHead className="w-[250px]">Vehicle Identity</TableHead>
              <TableHead>Timestamp</TableHead>
              <TableHead>Logged By</TableHead>
              <TableHead>Location</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentRows.map((location, index) => {
              if (!location.latitude || !location.longitude) return null;

              const vData = vehiclesMap?.[location.vehicle_id] || {};
              
              const mockVehicleObj = {
                id: location.vehicle_id,
                name: vData.name || 'Loading...',
                pet_name: vData.pet_name,
                type: vData.type || 'unknown',
                // Using helper to build Contabo URL
                profile_pic_url: getS3Url(vData.profile_pic_key),
                vehicle_status: 'fine'
              };

              const locationLabel = getLocationType(location.latitude, location.longitude);

              return (
                <TableRow key={`${location.vehicle_id}-${index}`} className="hover:bg-slate-50 dark:hover:bg-zinc-900/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {location.vehicle_id && (
                        <VehicleStatusAvatar 
                          vehicle={mockVehicleObj} 
                          size="sm" 
                          showStatusDot={false} 
                        />
                      )}
                      <div className="flex flex-col">
                        <Link
                          href={`/biz/vehicles/${location.vehicle_id}`}
                          className="font-medium text-sm hover:underline hover:text-blue-600 transition-colors"
                        >
                          {mockVehicleObj.name}
                        </Link>
                        {mockVehicleObj.pet_name && (
                           <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wide">
                             {mockVehicleObj.pet_name}
                           </span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-slate-500">
                    {new Date(location.created_at).toLocaleString('en-US', {
                      month: 'short', day: 'numeric',
                      hour: 'numeric', minute: '2-digit'
                    })}
                  </TableCell>
                  <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                    {(userDetails && location.created_by && userDetails[location.created_by]) || 'System / Guest'}
                  </TableCell>
                  <TableCell>
                    <LocationCell 
                      name={locationLabel}
                      lat={location.latitude}
                      lng={location.longitude}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => { e.preventDefault(); handlePageChange(Math.max(1, currentPage - 1)); }}
                className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .slice(Math.max(0, currentPage - 3), Math.min(totalPages, currentPage + 2))
              .map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    href="#"
                    onClick={(e) => { e.preventDefault(); handlePageChange(page); }}
                    isActive={currentPage === page}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => { e.preventDefault(); handlePageChange(Math.min(totalPages, currentPage + 1)); }}
                className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}