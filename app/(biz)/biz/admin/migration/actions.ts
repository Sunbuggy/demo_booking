/**
 * @file app/(biz)/biz/admin/migration/actions.ts
 * @description Server Actions for the Migration Workbench.
 * Includes:
 * 1. triggerManualSync: Proxies the Bulk Sync Cron Job (Securely).
 * 2. testMigration: Surgically migrates a SINGLE reservation (for debugging).
 */
'use server';

import { headers } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { USER_LEVELS } from '@/lib/constants/user-levels';
import { getReservationById, migrateReservationToSupabase } from '@/utils/old_db/actions';

/**
 * ACTION 1: TRIGGER BULK SYNC
 * Hits the internal API route with the CRON_SECRET to force a full update.
 */
export async function triggerManualSync() {
  const supabase = await createClient();
  
  // Authenticate & Authorize
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No active session');

  const { data: profile } = await supabase
    .from('users')
    .select('user_level')
    .eq('id', user.id)
    .single();

  if (!profile || profile.user_level < USER_LEVELS.DEV) {
    throw new Error('Unauthorized: Developer Access Required');
  }

  // Construct URL & Call
  const headersList = await headers();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const apiUrl = `${protocol}://${host}/api/cron/sync-legacy`;

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.CRON_SECRET}`,
        'Cache-Control': 'no-store',
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      if (response.status === 401) throw new Error('API Rejected: Check CRON_SECRET');
      throw new Error(`API Error ${response.status}`);
    }

    const data = await response.json();
    return { success: true, count: data.processed_count || 0 };
  } catch (err: any) {
    console.error('Manual Sync Action Failed:', err);
    throw new Error(err.message || 'Failed to trigger sync job');
  }
}

/**
 * ACTION 2: MIGRATE SINGLE RECORD (Troubleshooting)
 * Fetches one row from MySQL and forces it through the adapter.
 */
export async function testMigration(legacyId: number) {
  const supabase = await createClient();
  
  // 1. Fetch Raw Legacy Data (MySQL)
  // Note: verify getReservationById treats input as string or number correctly
  const legacyData = await getReservationById(String(legacyId));
  
  if (!legacyData) {
    return { success: false, error: `Legacy Reservation #${legacyId} not found in MySQL.` };
  }

  try {
    // 2. Run the Migration (Adapter Logic)
    const newBookingId = await migrateReservationToSupabase(legacyData);

    // 3. Fetch the Results (Supabase)
    const { data: booking } = await supabase
      .from('bookings')
      .select(`
        *,
        booking_participants (*),
        booking_resources (*)
      `)
      .eq('id', newBookingId)
      .single();

    return { 
      success: true, 
      legacyData, 
      migratedData: booking 
    };

  } catch (error) {
    console.error("Migration Test Failed:", error);
    return { success: false, error: (error as Error).message };
  }
}