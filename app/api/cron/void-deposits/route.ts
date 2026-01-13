import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const NMI_SECURITY_KEY = process.env.NMI_SECURITY_KEY!;

export async function GET(request: Request) {
  // 1. SECURITY: Verify Cron Secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    console.log('[Cron] Starting Deposit Check for TODAY...');

    // 2. GET BOOKINGS FOR *TODAY*
    const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD (UTC)
    
    // Note: If your server is in a different timezone than your store, 
    // you might need to adjust this date logic (e.g. subtracting hours).
    
    const { data: bookings, error } = await supabase
      .from('pismo_bookings')
      .select('id, reservation_id, transaction_id')
      .eq('booking_date', todayStr)
      .eq('status', 'confirmed') 
      .not('transaction_id', 'is', null);

    if (error) throw error;
    if (!bookings || bookings.length === 0) {
        return NextResponse.json({ message: `No bookings found for ${todayStr}` });
    }

    const results = [];

    // 3. LOOP THROUGH TRANSACTIONS
    for (const booking of bookings) {
        
        // --- A. QUERY NMI FIRST ---
        // We need to check the Order ID string before we decide to void.
        try {
            const queryBody = new URLSearchParams({
                security_key: NMI_SECURITY_KEY,
                transaction_id: booking.transaction_id
            });

            const queryRes = await fetch('https://secure.nmi.com/api/query.php', {
                method: 'POST',
                body: queryBody
            });
            
            const xmlText = await queryRes.text();

            // Simple Regex to extract Order ID from XML response
            // <order_id>deposit_1001</order_id>
            const orderIdMatch = xmlText.match(/<order_id>(.*?)<\/order_id>/);
            const nmiOrderId = orderIdMatch ? orderIdMatch[1] : '';

            // --- B. CHECK CONDITION ---
            // Only proceed if Order ID starts with "deposit_"
            if (nmiOrderId.startsWith('deposit_')) {
                
                console.log(`[Cron] Found Deposit: ${nmiOrderId}. Attempting Void...`);

                // --- C. EXECUTE VOID ---
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
                const responseCode = params.get('response');

                // --- D. LOG RESULT ---
                let logMsg = '';
                if (responseCode === '1') {
                    logMsg = `Cron: Auto-Voided Deposit (${nmiOrderId})`;
                    
                    // Optional: Mark as completed in DB since deposit is returned?
                    // await supabase.from('pismo_bookings').update({ status: 'completed' }).eq('id', booking.id);
                } else {
                    logMsg = `Cron: Failed to Void ${nmiOrderId}. Error: ${params.get('responsetext')}`;
                }

                await supabase.from('pismo_booking_logs').insert({
                    booking_id: booking.id,
                    editor_name: 'System Cron',
                    action_description: logMsg
                });

                results.push({ 
                    reservation: booking.reservation_id, 
                    order_id: nmiOrderId,
                    status: responseCode === '1' ? 'Voided' : 'Failed'
                });

            } else {
                console.log(`[Cron] Skipping ${booking.reservation_id} (Order ID: ${nmiOrderId} is not a deposit)`);
                results.push({ 
                    reservation: booking.reservation_id, 
                    status: 'Skipped (Not a deposit)' 
                });
            }

        } catch (err: any) {
            console.error(`Error processing ${booking.reservation_id}:`, err);
        }
    }

    return NextResponse.json({ success: true, processed: results });

  } catch (error: any) {
    console.error('Cron Critical Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}