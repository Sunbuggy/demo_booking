'use client';

import React from 'react';
import { DialogClose } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { createClient } from '@/utils/supabase/client';
import {
  fetchVehicleNameFromId,
  recordVehicleLocation
} from '@/utils/supabase/queries';

const AssignLocationHistory = ({
  vehicle_id,
  user_id
}: {
  vehicle_id: string;
  user_id: string;
}) => {
  const [vehicleName, setVehicleName] = React.useState<string>('');
  const [newLocation, setNewLocation] = React.useState<string>('');
  const supabase = createClient();
  const { toast } = useToast();
  const dialogCloseRef = React.useRef<HTMLButtonElement>(null);

  const locationsList = [
    {
      id: '1',
      name: 'Las Vegas',
      alias: 'Vegas Shop',
      lat: 36.27766,
      lon: -115.020692
    },
    {
      id: '2',
      name: 'Las Vegas',
      alias: 'Nellis',
      lat: 36.288372,
      lon: -114.970088
    },
    {
      id: '3',
      name: 'California',
      alias: 'Pismo Beach',
      lat: 35.090735,
      lon: -120.629598
    },
    {
      id: '4',
      name: 'Michigan',
      alias: 'Silverlake Shop',
      lat: 43.675239,
      lon: -86.472552
    },
    {
      id: '5',
      name: 'Michigan',
      alias: 'Silverlake Dunes',
      lat: 43.686365,
      lon: -86.508345
    }
  ];

  const handleLocationAssign = async () => {
    if (newLocation) {
      const selectedLocation = locationsList.find(
        (location) => location.id === newLocation
      );
      if (selectedLocation) {
        try {
          await recordVehicleLocation(supabase, {
            city: selectedLocation.name,
            latitude: selectedLocation.lat,
            longitude: selectedLocation.lon,
            vehicle_id,
            created_at: new Date().toISOString(),
            created_by: user_id
          });

          toast({
            title: 'Location Recorded',
            description: `Vehicle ${vehicleName} has been assigned to ${selectedLocation.alias}`,
            variant: 'success',
            duration: 5000
          });

          // Close the dialog
          dialogCloseRef.current?.click();
        } catch (error) {
          console.error('Error recording location:', error);
          toast({
            title: 'Error Recording Location',
            description: `There was an error recording the location for vehicle ${vehicleName}. Please try again.`,
            variant: 'destructive',
            duration: 5000
          });
        }
      }
    }
  };

  React.useEffect(() => {
    fetchVehicleNameFromId(supabase, vehicle_id)
      .then((data) => {
        const name = data[0]?.name as string;
        setVehicleName(name ?? 'Unknown');
      })
      .catch((error) => {
        console.error('Error fetching vehicle name:', error);
      });
  }, [supabase, vehicle_id]);

  return (
    <div className="flex flex-col gap-4 items-start">
      <Select onValueChange={setNewLocation}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select Location" />
        </SelectTrigger>
        <SelectContent>
          {locationsList.map((location) => (
            <SelectItem key={location.id} value={location.id}>
              {location.alias}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button onClick={handleLocationAssign}>Assign Location</Button>
      <DialogClose ref={dialogCloseRef} className="hidden" />
    </div>
  );
};

export default AssignLocationHistory;
