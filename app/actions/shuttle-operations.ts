// app/actions/shuttle-operations.ts
'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { Reservation } from '@/types'; 

// --- TYPES ---
export interface ManifestItem {
  id: string;
  driverId: string;
  driverName: string; 
  vehicleName: string;
  capacity: number;
}

export type HourlyUtilization = Record<string, Record<string, number>>;

// --- AUTHORIZATION HELPER (Level 300+) ---
async function requireStaff() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from('users')
    .select('user_level')
    .eq('id', user.id)
    .single();

  if (!profile || profile.user_level < 300) {
    throw new Error("Unauthorized: Staff Access (Level 300+) required");
  }
  return user;
}

// ============================================================================
// 1. GET DATA (READ ENGINE)
// ============================================================================
export async function getDailyOperations(date: string, legacyReservations: Reservation[]) {
  const supabase = await createClient();

  // A. Fetch Manifest
  const { data: manifest, error: manifestError } = await supabase
    .from('daily_shuttle_manifest')
    .select('*')
    .eq('date', date);

  if (manifestError) {
    console.error("Manifest Fetch Error:", manifestError);
    return { activeFleet: [], reservationStatusMap: {}, hourlyUtilization: {} };
  }

  if (!manifest || manifest.length === 0) {
    return { activeFleet: [], reservationStatusMap: {}, hourlyUtilization: {} };
  }

  // B. Manual Join for Driver Names
  const driverIds = manifest.map(m => m.driver_id).filter(Boolean);
  
  let drivers: any[] = [];
  if (driverIds.length > 0) {
    const { data } = await supabase
      .from('users') 
      .select('id, full_name, stage_name') 
      .in('id', driverIds);
    drivers = data || [];
  }

  // C. Build Active Fleet
  const activeFleet: ManifestItem[] = manifest.map(m => {
    const driverUser = drivers?.find(d => d.id === m.driver_id);
    // Prefer stage_name
    const displayName = driverUser?.stage_name || driverUser?.full_name || 'Unknown Driver';

    return {
      id: m.id,
      driverId: m.driver_id,
      driverName: displayName,
      vehicleName: m.vehicle_name || m.vehicle_id || 'Unknown Vehicle',
      capacity: m.capacity || 14,
    };
  });

  // D. Fetch Assignments
  const { data: assignments } = await supabase
    .from('reservation_assignments')
    .select('*')
    .in('manifest_id', manifest.map(m => m.id));

  // E. Calculate Utilization
  const hourlyUtilization: HourlyUtilization = {};
  const reservationStatusMap: any = {};

  activeFleet.forEach(f => { hourlyUtilization[f.id] = {} });

  if (assignments && assignments.length > 0) {
    assignments.forEach(assign => {
      // 1. Track Assignment for Map
      if (!reservationStatusMap[assign.reservation_id]) {
        reservationStatusMap[assign.reservation_id] = { totalAssigned: 0, assignments: [] };
      }
      
      const driver = activeFleet.find(f => f.id === assign.manifest_id);
      
      reservationStatusMap[assign.reservation_id].totalAssigned += assign.pax_count;
      reservationStatusMap[assign.reservation_id].assignments.push({
        manifestId: assign.manifest_id,
        driverName: driver?.driverName || 'Unknown',
        vehicleName: driver?.vehicleName || '?',
        paxCount: assign.pax_count
      });

      // 2. Track Hourly Load
      if (!assign.reservation_id) return;

      const res = legacyReservations.find(r => 
        r && r.id && String(r.id) === String(assign.reservation_id)
      );
      
      if (res && res.time) {
        const hourVal = parseInt(res.time, 10);
        if (!isNaN(hourVal)) {
          const hourKey = hourVal.toString(); 
          
          if (!hourlyUtilization[assign.manifest_id]) {
             hourlyUtilization[assign.manifest_id] = {};
          }
          if (!hourlyUtilization[assign.manifest_id][hourKey]) {
             hourlyUtilization[assign.manifest_id][hourKey] = 0;
          }
          hourlyUtilization[assign.manifest_id][hourKey] += (assign.pax_count || 0);
        }
      }
    });
  }

  return { activeFleet, reservationStatusMap, hourlyUtilization };
}

// ============================================================================
// 2. WRITE FUNCTIONS (SECURED)
// ============================================================================

export async function createFleetPairing(date: string, driverId: string, vehicleId: string, vehicleName: string, capacity: number) {
  const user = await requireStaff(); // Security Check
  const supabase = await createClient();

  const { error } = await supabase
    .from('daily_shuttle_manifest')
    .upsert({
      date,
      driver_id: driverId,
      vehicle_id: vehicleId,
      vehicle_name: vehicleName,
      capacity,
      created_by: user.id
    }, {
      onConflict: 'date, driver_id' 
    });

  if (error) {
    console.error("Fleet Pairing Error:", error);
    throw new Error(error.message);
  }
  revalidatePath(`/biz/${date}`);
}

export async function removeFleetPairing(manifestId: string, dateContext: string) {
  await requireStaff(); // Security Check
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('daily_shuttle_manifest')
    .delete()
    .eq('id', manifestId);

  if (error) throw new Error("Failed to remove fleet pairing");
    
  revalidatePath(`/biz/${dateContext}`);
}

export async function assignShuttleSegment(reservationId: string, manifestId: string, paxCount: number, dateContext: string) {
  const user = await requireStaff(); // Security Check
  const supabase = await createClient();

  if (!reservationId || !manifestId || paxCount <= 0) throw new Error("Invalid assignment details");

  const { error } = await supabase.from('reservation_assignments').upsert({
    reservation_id: reservationId.toString(),
    manifest_id: manifestId,
    pax_count: paxCount,
    assigned_by: user.id
  }, { onConflict: 'reservation_id, manifest_id' });

  if (error) throw new Error("Failed to save assignment");
  revalidatePath(`/biz/${dateContext}`);
}

export async function removeShuttleSegment(reservationId: string, manifestId: string, dateContext: string) {
  await requireStaff(); // Security Check
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('reservation_assignments')
    .delete()
    .match({ reservation_id: reservationId, manifest_id: manifestId });

  if (error) throw new Error("Failed to remove assignment");
  revalidatePath(`/biz/${dateContext}`);
}