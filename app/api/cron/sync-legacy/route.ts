import { NextResponse } from 'next/server';
import { fetch_from_old_db, migrateReservationToSupabase } from '@/utils/old_db/actions';

// Security: Require a secret key so strangers can't trigger your sync
const CRON_SECRET = process.env.CRON_SECRET || 'make_up_a_secure_password_here';

export const dynamic = 'force-dynamic'; // Prevent caching
export const maxDuration = 60; // Allow it to run for up to 60 seconds

export async function GET(request: Request) {
  // 1. Security Check
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    console.log("⚡ [Cron] Starting Legacy Sync Pulse...");

    // 2. Define the Window (Today + Next 2 Days to be safe)
    // We want to ensure the "Active Board" is always 100% in sync
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    
    // MySQL Query: Get everything for Today onwards (limit to recent/upcoming)
    // We sort by 'last_modified' if you have it, otherwise just sync the active window.
    const query = `
      SELECT * FROM reservations_modified 
      WHERE sch_date >= '${dateStr}' 
      AND sch_date <= DATE_ADD('${dateStr}', INTERVAL 2 DAY)
      AND Status NOT LIKE '%Cancel%' -- Optional: Skip cancelled if you want
    `;

    const legacyBookings = await fetch_from_old_db(query) as any[];
    console.log(`⚡ [Cron] Found ${legacyBookings.length} bookings to sync.`);

    // 3. Process them in parallel (Batched)
    // We don't want to crash the server, so we map them with a catch block
    const results = await Promise.allSettled(
      legacyBookings.map(async (res) => {
        try {
          const id = await migrateReservationToSupabase(res);
          return { id, status: 'synced' };
        } catch (err: any) {
          console.error(`❌ Failed to sync ID ${res.Res_ID}:`, err.message);
          return { id: res.Res_ID, status: 'failed', error: err.message };
        }
      })
    );

    // 4. Summarize
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