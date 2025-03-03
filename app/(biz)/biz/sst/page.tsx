import {
  dehydrate,
  HydrationBoundary,
  QueryClient
} from '@tanstack/react-query';
import { fetchAllVehicleLocations } from '@/utils/supabase/queries';
import { createClient } from '@/utils/supabase/server';
import VehicleLocationsDisplay from './vehicle-locations-display';
import { VehicleLocation } from '../vehicles/types';

const SSTPage = async () => {
  const supabase = createClient();
  const queryClient = new QueryClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return {};

  // Fetch the data
  await queryClient.prefetchQuery({
    queryKey: ['vehicleLocations'],
    queryFn: () => fetchAllVehicleLocations(supabase)
  });

  // Get the data from the query client
  const vehicleLocations = queryClient.getQueryData([
    'vehicleLocations'
  ]) as VehicleLocation[];

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <VehicleLocationsDisplay initialData={vehicleLocations} user={user} />
    </HydrationBoundary>
  );
};

export default SSTPage;
