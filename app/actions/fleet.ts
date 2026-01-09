/**
 * @file app/actions/fleet.ts
 * @description Server Actions for Fleet Management.
 * Replaces client-side Supabase calls in vehicles-overview.tsx
 */
'use server';

import { createClient } from '@/utils/supabase/server';
import { resolveVehicleLocation } from '@/lib/fleet/geofencing';
import { VehicleType } from '@/app/(biz)/biz/vehicles/admin/page'; // Reuse your type or define new one

// Extended type for the UI
export type DashboardVehicle = VehicleType & {
  location_name: string;
  last_active: string | null;
  fuel_level?: string;
};

export async function getFleetDashboardData(): Promise<DashboardVehicle[]> {
  const supabase = await createClient();

  // 1. Fetch Vehicles (Active Only - filtered by status if needed)
  const { data: vehicles, error: vError } = await supabase
    .from('vehicles')
    .select('*')
    .neq('vehicle_status', 'former') // Filter out sold vehicles immediately
    .order('name', { ascending: true });

  if (vError || !vehicles) {
    console.error('Fleet fetch error:', vError);
    return [];
  }

  // 2. Fetch Latest Locations (Optimized: One query for all active vehicles)
  // We use a distinct on vehicle_id to get only the newest ping per vehicle
  const { data: locations, error: lError } = await supabase
    .from('vehicle_locations')
    .select('vehicle_id, latitude, longitude, created_at')
    .order('vehicle_id')
    .order('created_at', { ascending: false })
    .limit(1, { foreignTable: 'vehicle_locations' }); // This approach varies by Supabase version, so we'll use a manual JS Map for safety if distinct fails

  // Alternative safe fetching strategy: Fetch all recent locations (e.g., last 24h) or use a raw query if performance drags.
  // For now, let's fetch all locations and reduce in memory (standard approach for <10k rows)
  // OPTIMIZATION: If row count > 50k, we must switch to a .rpc() function.
  const { data: rawLocations } = await supabase
    .from('vehicle_locations')
    .select('vehicle_id, latitude, longitude, created_at')
    .order('created_at', { ascending: false });

  // 3. Create a Location Map (Vehicle ID -> Location Data)
  const locMap = new Map();
  if (rawLocations) {
    for (const loc of rawLocations) {
      if (!locMap.has(loc.vehicle_id)) {
        locMap.set(loc.vehicle_id, loc);
      }
    }
  }

  // 4. Hydrate the Vehicles (Parallel processing for speed)
  const hydratedVehicles = await Promise.all(
    vehicles.map(async (v) => {
      const loc = locMap.get(v.id);
      
      // Resolve "Vegas Shop" vs "In Transit" using our new Lib
      const locationName = loc 
        ? await resolveVehicleLocation(loc.latitude, loc.longitude) 
        : 'Unknown';

      return {
        ...v,
        location_name: locationName,
        last_active: loc?.created_at || null,
        // Future: Fuel level from vehicle_inspections join
      };
    })
  );

  return hydratedVehicles;
}