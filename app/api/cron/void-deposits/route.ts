import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const NMI_SECURITY_KEY = process.env.NMI_SECURITY_KEY!;

export async function GET(request: Request) {
  // 1. SECURITY
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    console.log('[Cron] Starting Deposit Release...');

    // 2. TIMING: Target Yesterday
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - 1);
    const dateString = targetDate.toISOString().split('T')[0];

    // 3. FETCH BOOKINGS
    // We look for 'confirmed' bookings. Note: If you have a different status 
    // for captured bookings (like 'completed'), you might want to filter those out here directly.
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
            // --- A. QUERY NMI STATUS ---
            const queryRes = await fetch('https://secure.nmi.com/api/query.php', {
                method: 'POST',
                body: new URLSearchParams({
                    security_key: NMI_SECURITY_KEY,
                    transaction_id: booking.transaction_id
                })
            });
            
            const xmlText = await queryRes.text();

            // Extract Order ID & Status Condition
            const orderIdMatch = xmlText.match(/<order_id>(.*?)<\/order_id>/);
            const conditionMatch = xmlText.match(/<condition>(.*?)<\/condition>/); 
            
            const nmiOrderId = orderIdMatch ? orderIdMatch[1] : '';
            const nmiCondition = conditionMatch ? conditionMatch[1] : ''; // 'pending', 'complete', 'canceled'

            // --- B. SAFETY CHECKS ---
            
            // 1. Case Insensitive Check: Matches 'deposit_', 'Deposit_', 'DEPOSIT_'
            const isDeposit = nmiOrderId.toLowerCase().startsWith('deposit_');

            if (!isDeposit) {
                results.push({ reservation: booking.reservation_id, status: 'Skipped (Not a deposit)' });
                continue;
            }

            // 2. Status Check: Only void if 'pending'
            if (nmiCondition !== 'pending') {
                // If it is 'complete' (Captured) or 'canceled' (Already Voided), SKIP IT.
                console.log(`[Cron] Skipping ${nmiOrderId}. Status is '${nmiCondition}' (likely captured or already released).`);
                
                // Optional: Update DB status to completed since it's resolved?
                // await supabase.from('pismo_bookings').update({ status: 'completed' }).eq('id', booking.id);
                
                results.push({ reservation: booking.reservation_id, status: `Skipped (${nmiCondition})` });
                continue;
            }

            // --- C. EXECUTE VOID ---
            console.log(`[Cron] Voiding Pending Deposit: ${nmiOrderId}...`);

            const voidRes = await fetch('https://secure.nmi.com/api/transact.php', {
                method: 'POST',
                body: new URLSearchParams({
                    security_key: NMI_SECURITY_KEY,
                    type: 'void',
                    transactionid: booking.transaction_id
                })
            });

            const voidText = await voidRes.text();
            const params = new URLSearchParams(voidText);
            const response = params.get('response');

            // --- D. LOGGING ---
            const logMsg = response === '1'
                ? `Auto-Released: Void Success (TransID: ${booking.transaction_id})`
                : `Cron Failed to Void. NMI Error: ${params.get('responsetext')}`;

            await supabase.from('pismo_booking_logs').insert({
                booking_id: booking.id,
                editor_name: 'System Cron',
                action_description: logMsg
            });

            if (response === '1') {
                 await supabase.from('pismo_bookings')
                    .update({ status: 'completed' })
                    .eq('id', booking.id);
            }

            results.push({ 
                reservation: booking.reservation_id, 
                result: response === '1' ? 'Voided' : 'Failed'
            });

        } catch (err) {
            console.error(`Error processing ${booking.reservation_id}`, err);
        }
    }

    return NextResponse.json({ success: true, processed: results });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}