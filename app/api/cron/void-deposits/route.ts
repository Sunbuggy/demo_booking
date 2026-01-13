import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Admin Client
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const NMI_SECURITY_KEY = process.env.NMI_SECURITY_KEY!;

export async function GET(request: Request) {
  // 1. SECURITY: Verify Vercel Cron Header
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    console.log('[Cron] Starting Daily Deposit Release for YESTERDAY...');

    // 2. TIMING: Target "Yesterday"
    // Since this runs at midnight/early morning, "Yesterday" covers the bookings 
    // that likely finished late last night.
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - 1);
    const dateString = targetDate.toISOString().split('T')[0]; // YYYY-MM-DD

    console.log(`[Cron] Target Date: ${dateString}`);

    // 3. FETCH ELIGIBLE BOOKINGS
    // We look for 'confirmed' (active) bookings from yesterday that have a transaction ID.
    // We ignore 'completed' bookings because those were likely released manually by staff.
    const { data: bookings, error } = await supabase
      .from('pismo_bookings')
      .select('id, reservation_id, transaction_id')
      .eq('booking_date', dateString) 
      .eq('status', 'confirmed') 
      .not('transaction_id', 'is', null);

    if (error) throw error;
    if (!bookings || bookings.length === 0) {
        return NextResponse.json({ message: 'No active deposits found for ' + dateString });
    }

    const results = [];

    // 4. LOOP AND PROCESS
    for (const booking of bookings) {
        
        try {
            // --- A. SAFETY CHECK: QUERY NMI FIRST ---
            // We verify this is actually a "deposit_" order before voiding.
            const queryBody = new URLSearchParams({
                security_key: NMI_SECURITY_KEY,
                transaction_id: booking.transaction_id
            });

            const queryRes = await fetch('https://secure.nmi.com/api/query.php', {
                method: 'POST',
                body: queryBody
            });
            
            const xmlText = await queryRes.text();
            
            // Extract Order ID: <order_id>deposit_12345</order_id>
            const orderIdMatch = xmlText.match(/<order_id>(.*?)<\/order_id>/);
            const nmiOrderId = orderIdMatch ? orderIdMatch[1] : '';

            // --- B. CONDITION: IS IT A DEPOSIT? ---
            if (nmiOrderId.startsWith('deposit_')) {
                console.log(`[Cron] Releasing Deposit ${nmiOrderId}...`);

                // --- C. VOID THE DEPOSIT ---
                const voidBody = new URLSearchParams({
                    security_key: NMI_SECURITY_KEY,
                    type: 'void',
                    transactionid: booking.transaction_id
                });

                const voidRes = await fetch('https://secure.nmi.com/api/transact.php', {
                    method: 'POST',
                    body: voidBody
                });
                const voidText = await voidRes.text();
                const params = new URLSearchParams(voidText);
                const response = params.get('response');

                // Log Result
                const logEntry = {
                    booking_id: booking.id,
                    editor_name: 'System Cron',
                    action_description: response === '1' 
                        ? `Auto-Released Deposit (Void Success).`
                        : `Failed to Release Deposit. NMI Error: ${params.get('responsetext')}`
                };

                await supabase.from('pismo_booking_logs').insert(logEntry);

                // If successful, update status so we don't try again
                if (response === '1') {
                     await supabase.from('pismo_bookings')
                        .update({ status: 'completed' })
                        .eq('id', booking.id);
                }

                results.push({ 
                    reservation: booking.reservation_id, 
                    status: response === '1' ? 'Released' : 'Failed',
                    msg: params.get('responsetext')
                });

            } else {
                // It was a regular sale/payment, NOT a deposit. Skip it.
                console.log(`[Cron] Skipping Res #${booking.reservation_id} (Type: Payment/Sale)`);
                results.push({ reservation: booking.reservation_id, status: 'Skipped (Not a deposit)' });
            }

        } catch (err) {
            console.error(`Error processing booking ${booking.reservation_id}`, err);
        }
    }

    return NextResponse.json({ success: true, processed: results });

  } catch (error: any) {
    console.error('Cron Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}