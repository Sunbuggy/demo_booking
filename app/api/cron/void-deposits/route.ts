// app/api/cron/void-deposits/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Admin Client (Bypasses RLS)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const NMI_SECURITY_KEY = process.env.NMI_SECURITY_KEY!;

export async function GET(request: Request) {
  // 1. SECURITY: Verify the Vercel Cron Header
  // Vercel automatically sends this header. If it's missing, reject the request.
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    console.log('[Cron] Starting Daily Deposit Release...');

    // 2. FIND ELIGIBLE BOOKINGS
    // We want bookings that ended "Yesterday" (so we give staff all day to report damage)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateString = yesterday.toISOString().split('T')[0]; // YYYY-MM-DD

    // Fetch confirmed bookings from yesterday that have a transaction ID
    const { data: bookings, error } = await supabase
      .from('pismo_bookings')
      .select('id, reservation_id, transaction_id, first_name, last_name')
      .eq('booking_date', dateString) 
      .eq('status', 'confirmed') 
      .not('transaction_id', 'is', null);

    if (error) throw error;
    if (!bookings || bookings.length === 0) {
        return NextResponse.json({ message: 'No deposits to release for ' + dateString });
    }

    const results = [];

    // 3. LOOP AND VOID
    for (const booking of bookings) {
        // NMI Void Request
        const nmiBody = new URLSearchParams({
            security_key: NMI_SECURITY_KEY,
            type: 'void', // 'void' cancels an Auth so the money is released
            transactionid: booking.transaction_id
        });

        try {
            const nmiRes = await fetch('https://secure.nmi.com/api/transact.php', {
                method: 'POST',
                body: nmiBody
            });
            const nmiText = await nmiRes.text();
            const params = new URLSearchParams(nmiText);
            const response = params.get('response');
            
            // Log Success or Failure
            const logEntry = {
                booking_id: booking.id,
                editor_name: 'System Cron',
                action_description: response === '1' 
                    ? `Auto-Released Deposit (Void Success). TransID: ${booking.transaction_id}`
                    : `Failed to Auto-Release Deposit. NMI Error: ${params.get('responsetext')}`
            };

            await supabase.from('pismo_booking_logs').insert(logEntry);
            
            results.push({ 
                reservation: booking.reservation_id, 
                success: response === '1',
                msg: params.get('responsetext') 
            });

        } catch (err: any) {
            console.error(`Failed to void ${booking.reservation_id}`, err);
        }
    }

    return NextResponse.json({ success: true, processed: results });

  } catch (error: any) {
    console.error('Cron Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}