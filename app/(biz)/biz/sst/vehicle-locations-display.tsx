'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  fetchAllVehicleLocations,
  fetchVehicleNamesFromIds
} from '@/utils/supabase/queries';
import { createClient } from '@/utils/supabase/client'; // Client-side Supabase
import { VehicleLocation } from '../vehicles/types';
import { ArrowLeft, MapIcon } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import DialogFactory from '@/components/dialog-factory';
import DispatchForm from './dispatch-form';
import { User } from '@supabase/supabase-js';
import EditDispatchGroups from './edit-dispatch-groups';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

type VehicleLocationsDisplayProps = {
  initialData: VehicleLocation[];
  user: User;
};

export default function VehicleLocationsDisplay({
  initialData,
  user
}: VehicleLocationsDisplayProps) {
  const [supabase, setSupabase] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [openDialogIndex, setOpenDialogIndex] = useState<number | null>(null);
  const [openReDialogIndex, setOpenReDialogIndex] = useState<number | null>(null);
  const [isDispatchGroupsDialogOpen, setDispatchGroupsDialogOpen] = useState(false);

  const router = useRouter();

  // Initialize Supabase client on mount (client-side only)
  useEffect(() => {
    const client = createClient();
    setSupabase(client);
    setIsLoading(false);
  }, []);

  const { data: vehicleLocations } = useQuery({
    queryKey: ['vehicleLocations'],
    queryFn: () => supabase ? fetchAllVehicleLocations(supabase) : Promise.resolve(initialData),
    initialData: initialData,
    enabled: !!supabase, // Only run when supabase is ready
  });

  const [vehicleNames, setVehicleNames] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (!supabase || !vehicleLocations) return;

    const fetchVehicleNames = async () => {
      try {
        const setOfVehicleIds = new Set(
          vehicleLocations.map((location) => location.vehicle_id || '')
        );
        const res = await fetchVehicleNamesFromIds(
          supabase,
          Array.from(setOfVehicleIds)
        );
        const names = res.map((vehicle) => ({
          id: vehicle.id,
          name: vehicle.name
        }));
        setVehicleNames(names);
      } catch (err) {
        console.error('Error getting vehicle names:', err);
      }
    };

    fetchVehicleNames();
  }, [vehicleLocations, supabase]);

  const sst_locations = vehicleLocations?.filter(
    (location) => location.is_distress_signal === true
  );

  const today = new Date().toLocaleDateString();
  const today_data = sst_locations?.filter((location) => {
    const created_at = new Date(location.created_at).toLocaleDateString();
    return created_at === today;
  });

  const sortedData = today_data?.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const groupedByDate = sortedData?.reduce(
    (acc, location) => {
      const date = new Date(location.created_at).toLocaleDateString();
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(location);
      return acc;
    },
    {} as Record<string, VehicleLocation[]>
  );

  const sortedDates = Object.keys(groupedByDate || {}).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  const renderLocationCard = (location: VehicleLocation, index: number) => (
    <Card
      key={location.id}
      className={`mb-4 ${
        location.dispatch_status === 'open'
          ? 'bg-red-500/20'
          : location.dispatch_status === 'claimed'
            ? 'bg-purple-500/20'
            : location.dispatch_status === 'closed'
              ? 'bg-green-500/20'
              : ''
      }`}
    >
      <CardHeader>
        <CardTitle>
          {vehicleNames.find((vehicle) => vehicle.id === location.vehicle_id)?.name || 'Loading...'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p>
          <strong>Created:</strong>{' '}
          {new Date(location.created_at).toLocaleString()}
        </p>
        <p>
          <strong>City:</strong> {location.city}
        </p>
        <p>
          <strong>Status:</strong>{' '}
          {location.dispatch_status || 'Not Dispatched'}
        </p>
        <p>
          <strong>Ticket:</strong> {location.distress_ticket_number || 'N/A'}
        </p>
        <div className="flex justify-between items-center mt-4">
          <Link
            href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="sm">
              <MapIcon className="mr-2 h-4 w-4" />
              View Map
            </Button>
          </Link>
          {!location.dispatch_status && (
            <>
              <Button onClick={() => setOpenDialogIndex(index)}>
                Dispatch
              </Button>
              <DialogFactory
                isDialogOpen={openDialogIndex === index}
                setIsDialogOpen={() => setOpenDialogIndex(null)}
                title="Dispatch"
                children={
                  <DispatchForm
                    todayData={today_data}
                    location={location}
                    user={user}
                  />
                }
                description="Dispatch details"
              />
            </>
          )}
          {location.dispatch_status === 'open' && (
            <div className="flex gap-2">
              <Link href={`/biz/sst/cases`}>
                <Button>View</Button>
              </Link>
              <>
                <Button onClick={() => setOpenReDialogIndex(index)}>
                  Re-Dispatch
                </Button>
                <DialogFactory
                  isDialogOpen={openReDialogIndex === index}
                  setIsDialogOpen={() => setOpenReDialogIndex(null)}
                  title="Re-Dispatch"
                  children={
                    <DispatchForm
                      todayData={today_data}
                      location={location}
                      user={user}
                      dispatchId={location.id}
                    />
                  }
                  description="Dispatch details"
                />
              </>
            </div>
          )}
          {(location.dispatch_status === 'claimed' ||
            location.dispatch_status === 'closed') && (
            <Link href={`/biz/sst/cases/claimed/${location.id}`}>
              <Button>View</Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 px-4 text-center">
        <p>Loading vehicle locations...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <Button
        onClick={() => router.push('/biz/vehicles/admin')}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
      </Button>
      <Button
        onClick={() => setDispatchGroupsDialogOpen(true)}
        className="mb-6 w-full"
      >
        Edit/View Dispatch Groups
      </Button>
      <DialogFactory
        isDialogOpen={isDispatchGroupsDialogOpen}
        setIsDialogOpen={() => setDispatchGroupsDialogOpen(false)}
        title="Dispatch Groups"
        children={<EditDispatchGroups />}
        description="Manage dispatch groups"
      />
      <h1 className="text-2xl font-bold mb-4">SST Requests (Today)</h1>
      {sortedDates.map((date) => (
        <div key={date} className="mb-6">
          <h2 className="text-xl font-semibold mb-2">{date}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {groupedByDate[date].map((location, index) =>
              renderLocationCard(location, index)
            )}
          </div>
        </div>
      ))}
    </div>
  );
}