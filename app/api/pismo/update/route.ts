import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server'; 
import { createClient as createAdminClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const NMI_SECURITY_KEY = process.env.NMI_SECURITY_KEY!;

// Helper: Calculate End Time
const calculateEndTime = (start: string, duration: number) => {
    if (!start || !duration) return '';
    const match = start.match(/(\d+):(\d+) (\w+)/);
    if (!match) return '';

    let hours = parseInt(match[1]);
    const period = match[3].toUpperCase();
    
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;

    let endHour = (hours + duration);
    const displayPeriod = endHour >= 12 && endHour < 24 ? 'PM' : 'AM';
    if (endHour >= 24) endHour -= 24; 

    let displayHour = endHour % 12 || 12;
    return `${displayHour.toString().padStart(2, '0')}:00 ${displayPeriod}`;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
        reservation_id, booking_id, total_amount, 
        payment_token, payment_amount, transaction_type, order_id_override,
        capture_deposit, existing_transaction_id,
        holder, booking, note 
    } = body;

    const cookieClient = await createClient();
    const { data: { user } } = await cookieClient.auth.getUser();
    let editorName = 'Online Customer'; 

    if (user) {
      const { data: profile } = await cookieClient.from('users').select('full_name, email').eq('id', user.id).single();
      if (profile) editorName = profile.full_name || profile.email || 'Staff';
    }

    let transactionId: string | null = existing_transaction_id || null;
    let paymentLogText = "";

    // 2. PAYMENT LOGIC
    if (capture_deposit && existing_transaction_id) {
        const nmiParams = {
            security_key: NMI_SECURITY_KEY,
            type: 'capture',
            transactionid: existing_transaction_id,
            amount: Number(payment_amount).toFixed(2), 
        };
        // ... (Payment Fetching Code Omitted for brevity, logic remains same as before) ...
        const nmiBody = new URLSearchParams(nmiParams);
        const nmiRes = await fetch('https://secure.nmi.com/api/transact.php', { method: 'POST', body: nmiBody });
        const nmiText = await nmiRes.text();
        const params = new URLSearchParams(nmiText);

        if (params.get('response') !== '1') {
            return NextResponse.json({ success: false, error: `Capture Failed: ${params.get('responsetext')}` }, { status: 400 });
        }
        paymentLogText = ` | Captured: $${nmiParams.amount}`;

    } else if (payment_token) {
        // ... (New Payment Logic Omitted for brevity, logic remains same) ...
        const nmiParams = {
            security_key: NMI_SECURITY_KEY,
            type: transaction_type || 'sale',
            amount: Number(payment_amount).toFixed(2),
            payment_token: payment_token,
            orderid: order_id_override || reservation_id.toString(),
            first_name: holder.firstName, last_name: holder.lastName, email: holder.email
        };
        const nmiBody = new URLSearchParams(nmiParams);
        const nmiRes = await fetch('https://secure.nmi.com/api/transact.php', { method: 'POST', body: nmiBody });
        const nmiText = await nmiRes.text();
        const params = new URLSearchParams(nmiText);
        if (params.get('response') !== '1') return NextResponse.json({ success: false, error: `Declined: ${params.get('responsetext')}` }, { status: 400 });
        
        transactionId = params.get('transactionid');
        paymentLogText = ` | Charged: $${nmiParams.amount}`;
    }

    const adminSupabase = createAdminClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // --- RECALCULATE END TIME ---
    const calculatedEndTime = calculateEndTime(booking.startTime, Number(booking.duration));

    // Update Booking Header
    const updatePayload: any = {
        first_name: holder.firstName,
        last_name: holder.lastName,
        email: holder.email,
        phone: holder.phone,
        
        booking_date: booking.date,
        start_time: booking.startTime,
        duration_hours: Number(booking.duration), // Save Duration
        end_time: calculatedEndTime,              // Save Calculated End Time
        
        goggles_qty: booking.goggles || 0,
        bandannas_qty: booking.bandannas || 0,
        total_amount: Math.round(total_amount * 100),
        adults: holder.adults || 1,
        minors: holder.minors || 0,
        ...(transactionId && { transaction_id: transactionId })
    };

    if (note && note.trim().length > 0) updatePayload.notes = note;

    const { error: headerErr } = await adminSupabase
      .from('pismo_bookings')
      .update(updatePayload)
      .eq('id', booking_id);

    if (headerErr) throw headerErr;

    // Update Vehicles (Standard Logic)
    const { data: existingItems } = await adminSupabase.from('pismo_booking_items').select('id, pricing_category_id').eq('pismo_booking_id', booking_id);
    const itemsToUpdate: any[] = [], itemsToInsert: any[] = [], processedIds = new Set();
    const vehicles = booking.vehicles || {};

    for (const [catId, itemData] of Object.entries(vehicles)) {
      const item = itemData as any;
      if (item.qty > 0) {
        const existingRow = existingItems?.find(r => r.pricing_category_id === catId);
        const payload = {
            pismo_booking_id: booking_id,
            pricing_category_id: catId,
            vehicle_name_snapshot: item.name || 'Unknown',
            quantity: item.qty,
            has_waiver: item.waiver,
            price_at_booking: item.price || 0
        };
        if (existingRow) itemsToUpdate.push({ ...payload, id: existingRow.id });
        else itemsToInsert.push(payload);
        processedIds.add(catId);
      }
    }
    const idsToDelete = existingItems?.filter(r => !processedIds.has(r.pricing_category_id)).map(r => r.id) || [];
    if (idsToDelete.length) await adminSupabase.from('pismo_booking_items').delete().in('id', idsToDelete);
    if (itemsToUpdate.length) await adminSupabase.from('pismo_booking_items').upsert(itemsToUpdate);
    if (itemsToInsert.length) await adminSupabase.from('pismo_booking_items').insert(itemsToInsert);

    // Logs
    if (note) await adminSupabase.from('pismo_booking_notes').insert({ booking_id, author_name: editorName, note_text: note });
    await adminSupabase.from('pismo_booking_logs').insert({ booking_id, editor_name: editorName, action_description: `Updated reservation. Value: $${total_amount.toFixed(2)}${paymentLogText}`});

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}