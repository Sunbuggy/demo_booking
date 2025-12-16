import {
  dehydrate,
  HydrationBoundary,
  QueryClient
} from '@tanstack/react-query';
import { fetchAllVehicleLocations } from '@/utils/supabase/queries';
import { createClient } from '@/utils/supabase/server';
import VehicleLocationsDisplay from './vehicle-locations-display';
import { VehicleLocation } from '../vehicles/types';
import { redirect } from 'next/navigation'; // Add this import

const SSTPage = async () => {
  const supabase = await await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/signin');
    // return null;
  }

  const queryClient = new QueryClient();
  
  const typedSupabase = supabase as any;
  
  await queryClient.prefetchQuery({
    queryKey: ['vehicleLocations'],
    queryFn: () => fetchAllVehicleLocations(typedSupabase)
  });

  const vehicleLocations = queryClient.getQueryData([
    'vehicleLocations'
  ]) as VehicleLocation[];

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <VehicleLocationsDisplay initialData={vehicleLocations} user={user!} />
    </HydrationBoundary>
  );
};

export default SSTPage;