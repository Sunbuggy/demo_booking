'use server';

import { createClient } from '@/utils/supabase/server';
import { resolveVehicleLocation } from '@/lib/fleet/geofencing';
import { Database } from '@/types_db';

export type VehicleType = Database['public']['Tables']['vehicles']['Row'];

export type DashboardVehicle = VehicleType & {
  location_name: string;
  last_active: string | null;
  updated_by_name?: string; // New Field
};

export async function getFleetDashboardData(): Promise<DashboardVehicle[]> {
  const supabase = await createClient();

  // 1. Fetch Vehicles
  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('*')
    .neq('vehicle_status', 'former')
    .order('name', { ascending: true });

  if (!vehicles) return [];

  // 2. Fetch Locations (with User ID if available)
  // We try to fetch 'created_by' which is standard in Supabase. 
  // If your schema uses 'user_id', we'll adjust.
  const { data: rawLocations } = await supabase
    .from('vehicle_locations')
    .select('vehicle_id, latitude, longitude, created_at, created_by')
    .order('created_at', { ascending: false });

  // 3. Fetch User Profiles (for names)
  // We assume a public 'profiles' table exists mapping id -> full_name
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name');

  // Create User Map
  const userMap = new Map<string, string>();
  profiles?.forEach(p => {
    if (p.id && p.full_name) userMap.set(p.id, p.full_name);
  });

  // 4. Map Data
  const locMap = new Map();
  if (rawLocations) {
    for (const loc of rawLocations) {
      if (!locMap.has(loc.vehicle_id)) {
        locMap.set(loc.vehicle_id, loc);
      }
    }
  }

  // 5. Hydrate
  const hydratedVehicles = await Promise.all(
    vehicles.map(async (v) => {
      const loc = locMap.get(v.id);
      
      let locationName = 'Unknown';
      let userName = 'System';

      if (loc) {
        // Resolve Location
        if (loc.latitude && loc.longitude) {
          locationName = await resolveVehicleLocation(Number(loc.latitude), Number(loc.longitude));
        }
        // Resolve User
        if (loc.created_by && userMap.has(loc.created_by)) {
          userName = userMap.get(loc.created_by) || 'Staff';
        } else if (loc.created_by) {
          userName = 'Guest User'; // Fallback if ID exists but no profile
        }
      } else {
        locationName = 'No Signal';
      }

      return {
        ...v,
        location_name: locationName,
        last_active: loc?.created_at || null,
        updated_by_name: userName,
      };
    })
  );

  return JSON.parse(JSON.stringify(hydratedVehicles));
}