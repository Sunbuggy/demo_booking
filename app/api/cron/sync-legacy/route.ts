/**
 * @file app/api/cron/sync-legacy/route.ts
 * @description The API endpoint triggers the sync.
 * FIX: Removed 'Status' column filter causing SQL crash.
 */
import { NextResponse } from 'next/server';
import { fetch_from_old_db, migrateReservationToSupabase } from '@/utils/old_db/actions';

// Security: Require a secret key
const CRON_SECRET = process.env.CRON_SECRET || 'make_up_a_secure_password_here';

export const dynamic = 'force-dynamic'; 
export const maxDuration = 60; 

export async function GET(request: Request) {
  // 1. Security Check
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // 2. Feature Flag
  if (process.env.ENABLE_LEGACY_SYNC !== 'true') {
    return NextResponse.json({ 
      success: true, 
      message: 'Sync skipped: ENABLE_LEGACY_SYNC is not true.' 
    });
  }

  try {
    console.log("⚡ [Cron] Starting Legacy Sync Pulse...");

    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    
    // 3. MySQL Query
    // FIX: Removed "AND Status NOT LIKE '%Cancel%'" because the column 'Status' does not exist.
    // If you need to filter cancelled bookings, check the legacy DB schema for the correct name 
    // (likely 'Res_Status', 'status', 'Type', or similar) and add it back later.
    const query = `
      SELECT * FROM reservations_modified 
      WHERE sch_date >= '${dateStr}' 
      AND sch_date <= DATE_ADD('${dateStr}', INTERVAL 2 DAY)
    `;

    const legacyBookings = await fetch_from_old_db(query) as any[];
    console.log(`⚡ [Cron] Found ${legacyBookings.length} bookings to sync.`);

// --- DEBUGGING PROBE START ---
    if (legacyBookings.length > 0) {
      console.log("🔍 INSPECTING LEGACY COLUMNS:", Object.keys(legacyBookings[0]));
      // This will print an array like: ['Res_ID', 'First_Name', 'Res_Status', ...]
      // Look for the one that sounds like "Status"!
    }
    // --- DEBUGGING PROBE END ---

    // 4. Process them in parallel
    const results = await Promise.allSettled(
      legacyBookings.map(async (res) => {
        try {
          // You can also filter in JS if the DB column is unknown:
          // if (res.Res_Status?.includes('Cancel')) return { id: res.Res_ID, status: 'skipped' };
          
          const id = await migrateReservationToSupabase(res);
          return { id, status: 'synced' };
        } catch (err: any) {
          console.error(`❌ Failed to sync ID ${res.Res_ID}:`, err.message);
          return { id: res.Res_ID, status: 'failed', error: err.message };
        }
      })
    );

    // 5. Summarize
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const failCount = results.filter(r => r.status === 'rejected').length;

    console.log(`✅ [Cron] Sync Complete. Success: ${successCount}, Failed: ${failCount}`);

    return NextResponse.json({
      success: true,
      processed: legacyBookings.length,
      successful: successCount,
      failed: failCount
    });

  } catch (error: any) {
    console.error("🔥 [Cron] Critical Failure:", error);
    return new NextResponse(`Server Error: ${error.message}`, { status: 500 });
  }
}