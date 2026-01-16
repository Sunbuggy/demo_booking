import { createClient } from '@/utils/supabase/server';
import { fetch_from_old_db } from '@/utils/old_db/actions';

// Helper to map modern Supabase types back to legacy column names
function mapNewTypeToLegacyColumn(type: string): string {
  const map: Record<string, string> = {
    'BUGGY_1_SEATER': 'SB1',
    'BUGGY_2_SEATER': 'SB2',
    'BUGGY_4_SEATER': 'SB4',
    'BUGGY_5_SEATER': 'SB5',
    'BUGGY_6_SEATER': 'SB6',
    'ATV_STANDARD': 'QA',
    'ATV_LARGE': 'QB',
    'UTV_2_SEATER': 'twoSeat4wd',
    'RZR_2_SEATER': 'UZ2',
    'RZR_4_SEATER': 'UZ4',
    'GOKART_STD': 'GoKart',
    'GOKART_PLUS': 'GoKartplus'
  };
  return map[type] || 'Other';
}

export async function getUnifiedDashboardData(
  date: string, 
  locationId: string 
) {
  const supabase = await createClient();

  console.log(`⚡ [Unified Fetch] Loading dashboard for ${date}...`);

  // --- 1. PARALLEL FETCH (Old + New) ---
  const [rawLegacy, { data: newBookings, error }] = await Promise.all([
    // A. Fetch OLD Data (MySQL)
    // [FIX] Changed 'Res_Date' -> 'sch_date' and 'Res_Time' -> 'sch_time'
    fetch_from_old_db(`
      SELECT * FROM reservations_modified 
      WHERE sch_date = '${date}' 
      AND Location NOT LIKE '%Pismo%' 
      ORDER BY sch_time ASC
    `) as Promise<any[]>,

    // B. Fetch NEW Data (Supabase 3-Layer)
    supabase
      .from('bookings')
      .select(`
        *,
        booking_participants (
          id, role, temp_name, check_in_status, waiver_status, user_id,
          user:users (id, full_name, avatar_url)
        ),
        booking_resources (
          id, vehicle_type_id, assigned_vehicle_id
        )
      `)
      .eq('location_id', locationId)
      .gte('start_at', `${date}T00:00:00`)
      .lte('start_at', `${date}T23:59:59`)
  ]);

  if (error) {
    console.error("❌ Supabase Fetch Error:", error);
  }

  // --- 2. THE MERGE LOGIC ---
  
  // A. Identification: Which Legacy IDs have been migrated?
  const migratedLegacyIds = new Set(
    newBookings?.map(b => b.legacy_id).filter(Boolean)
  );

  // B. Filter Legacy: Keep ONLY rows that are NOT in Supabase
  const activeLegacyData = rawLegacy.filter(
    r => !migratedLegacyIds.has(r.Res_ID || r.res_id)
  );

  // C. Convert Supabase Data -> Legacy Shape
  const convertedNewData = newBookings?.map(b => {
    const primary = b.booking_participants.find((p: any) => p.role === 'PRIMARY_RENTER');
    
    // Count vehicles
    const vehicleCounts: Record<string, number> = {};
    b.booking_resources.forEach((r: any) => {
      const uiKey = mapNewTypeToLegacyColumn(r.vehicle_type_id); 
      vehicleCounts[uiKey] = (vehicleCounts[uiKey] || 0) + 1;
    });

    // Format Time
    const timeStr = new Date(b.start_at).toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      timeZone: 'America/Los_Angeles' 
    });

    return {
      // Identifiers
      res_id: b.legacy_id || 999999,
      uuid: b.id,
      
      // Legacy Shape Fields (Mapped for compatibility)
      full_name: primary?.temp_name || primary?.user?.full_name || b.group_name || 'Unknown',
      ppl_count: b.total_pax_count,
      sch_time: timeStr, 
      sch_date: date, // Explicitly return the date too
      status: b.status,
      location: b.operational_metadata?.legacy_tour_code || 'Vegas',
      
      // Spread counts
      ...vehicleCounts,
      
      // RAW Data for new features
      _participants: b.booking_participants,
      _resources: b.booking_resources
    };
  }) || [];

  console.log(`✅ [Unified Fetch] Merged: ${activeLegacyData.length} Legacy + ${convertedNewData.length} New.`);

  return [...activeLegacyData, ...convertedNewData];
}