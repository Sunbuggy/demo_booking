'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  fetchAllVehicleLocations,
  fetchVehicleNamesFromIds
} from '@/utils/supabase/queries';
import { createClient } from '@/utils/supabase/client';
import { VehicleLocation } from '../vehicles/types';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { MapIcon } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import DialogFactory from '@/components/dialog-factory';
import DispatchForm from './dispatch-form';
import { User } from '@supabase/supabase-js';
import EditDispatchGroups from './edit-dispatch-groups';

type VehicleLocationsDisplayProps = {
  initialData: VehicleLocation[];
  user: User;
};
type DispatchGroup = {
  user: string;
  location: 'NV' | 'CA' | 'MI';
};
export default function VehicleLocationsDisplay({
  initialData,
  user
}: VehicleLocationsDisplayProps) {
  const [openDialogIndex, setOpenDialogIndex] = React.useState<number | null>(
    null
  );
  const [isDispatchGroupsDialogOpen, setDispatchGroupsDialogOpen] =
    React.useState<boolean>(false);
  const supabase = createClient();
  const { data: vehicleLocations } = useQuery({
    queryKey: ['vehicleLocations'],
    queryFn: () => fetchAllVehicleLocations(supabase),
    initialData: initialData
  });

  const [vehicleNames, setVehicleNames] = React.useState<
    { id: string; name: string }[]
  >([]);

  React.useEffect(() => {
    const fetchVehicleNames = async () => {
      try {
        const setOfVehicleIds = new Set(
          vehicleLocations?.map((location) => location.vehicle_id || '')
        );

        const res = await fetchVehicleNamesFromIds(
          supabase,
          Array.from(setOfVehicleIds)
        );

        const vehicleNames = res.map((vehicle) => ({
          id: vehicle.id,
          name: vehicle.name
        }));

        setVehicleNames(vehicleNames);
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

  return (
    <div className="container mx-auto py-10">
      <div>
        <Button onClick={() => setDispatchGroupsDialogOpen(true)}>
          Edit/View Dispatch Groups
        </Button>
        <DialogFactory
          isDialogOpen={isDispatchGroupsDialogOpen}
          setIsDialogOpen={() => setDispatchGroupsDialogOpen(false)}
          title="Dispatch Groups"
          children={<EditDispatchGroups />}
          description="some description for now"
        />
      </div>
      <h1 className="text-2xl font-bold mb-4">SST Requests (Today)</h1>
      {sortedDates.map((date) => (
        <div key={date} className="mb-6">
          <h2 className="text-xl font-semibold mb-2">{date}</h2>
          <Table>
            <TableCaption>
              A list of vehicle locations with ticket numbers from {date}.
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Fleet</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ticket Number</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groupedByDate[date].map((location, index) => (
                <TableRow
                  key={location.id}
                  className={`border border-gray-200 ${
                    location.dispatch_status === 'open'
                      ? 'bg-red-500/20'
                      : location.dispatch_status === 'claimed'
                        ? 'bg-purple-500/20'
                        : location.dispatch_status === 'closed'
                          ? 'bg-green-500/20'
                          : ''
                  }`}
                >
                  <TableCell>
                    {vehicleNames.find(
                      (vehicle) => vehicle.id === location.vehicle_id
                    )?.name || 'Loading...'}
                  </TableCell>
                  <TableCell>
                    {new Date(location.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MapIcon className="text-purple-500" />
                    </Link>
                  </TableCell>
                  <TableCell>{location.city}</TableCell>
                  <TableCell>
                    <div>
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
                            description="some description for now"
                          />
                        </>
                      )}
                      {location.dispatch_status === 'open' && (
                        <>
                          <Link href={`/biz/sst/cases`}>
                            <Button>View</Button>
                          </Link>
                        </>
                      )}
                      {(location.dispatch_status === 'claimed' ||
                        location.dispatch_status === 'closed') && (
                        <>
                          <Link href={`/biz/sst/cases/claimed/${location.id}`}>
                            <Button>View</Button>
                          </Link>
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {location.dispatch_status
                      ? location.dispatch_status
                      : 'Not Dispatched'}
                  </TableCell>
                  <TableCell>
                    {location.distress_ticket_number ? (
                      location.distress_ticket_number
                    ) : (
                      <span></span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ))}
    </div>
  );
}
