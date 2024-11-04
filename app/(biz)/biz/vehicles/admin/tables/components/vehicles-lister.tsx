'use client';
import { createClient } from '@/utils/supabase/client';
import { fetchVehiclesFromListOfIds } from '@/utils/supabase/queries';
import React from 'react';
import { VehicleType } from '@/app/(biz)/biz/vehicles/admin/page';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { ScrollArea } from '@/components/ui/scroll-area';

const VehiclesLister = ({ list }: { list: string[] | null }) => {
  const [vehicles, setVehicles] = React.useState<VehicleType[]>([]);
  const supabase = createClient();
  React.useEffect(() => {
    if (list) {
      fetchVehiclesFromListOfIds(supabase, list).then((data) => {
        setVehicles(data);
      });
    }
  }, [list]);

  if (list === null || list.length === 0) {
    return <div>Nothing Found</div>;
  }
  if (vehicles.length === 0) {
    return <div>Loading...</div>;
  }
  const router = useRouter();

  const handleClick = (vehicleId: string) => {
    router.push(`/biz/vehicles/${vehicleId}`); // Navigate to the new page
  };

  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight">Vehicles</h2>
      <ScrollArea className="h-[215px] ml-2 rounded-md border p-4">
        <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
          {vehicles.map((vehicle, index) => (
            <span key={index}>
              <Button
                className="large_button_circular relative"
                onClick={() => handleClick(vehicle.id)}
              >
                {vehicle.pet_name ? (
                  <>
                    {vehicle.pet_name}
                    <br />
                    {vehicle.name}
                  </>
                ) : (
                  vehicle.name
                )}{' '}
                {vehicle.vehicle_status === 'broken' && (
                  <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
                {vehicle.vehicle_status === 'maintenance' && (
                  <span className="absolute top-0 right-0 w-2 h-2 bg-amber-500 rounded-full"></span>
                )}
                {vehicle.vehicle_status === 'fine' && (
                  <span className="absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full"></span>
                )}
              </Button>
            </span>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default VehiclesLister;
