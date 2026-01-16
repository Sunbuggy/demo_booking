'use server'

import { getReservationById, migrateReservationToSupabase } from '@/utils/old_db/actions';
import { createClient } from '@/utils/supabase/server';

export async function testMigration(legacyId: number) {
  const supabase = await createClient();
  
  // 1. Fetch Raw Legacy Data
  const legacyData = await getReservationById(String(legacyId));
  
  if (!legacyData) {
    return { success: false, error: `Legacy Reservation #${legacyId} not found.` };
  }

  try {
    // 2. Run the Migration
    const newBookingId = await migrateReservationToSupabase(legacyData);

    // 3. Fetch the Results for Verification
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