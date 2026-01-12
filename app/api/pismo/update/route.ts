import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server'; 
import { createClient as createAdminClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const NMI_SECURITY_KEY = process.env.NMI_SECURITY_KEY!;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
        reservation_id, booking_id, total_amount, 
        payment_token, payment_amount, transaction_type, order_id_override,
        holder, booking, note 
    } = body;

    // 1. Identify User
    const cookieClient = await createClient();
    const { data: { user } } = await cookieClient.auth.getUser();
    let editorName = 'Online Customer'; 

    if (user) {
      const { data: profile } = await cookieClient
        .from('users')
        .select('full_name, email')
        .eq('id', user.id)
        .single();
      if (profile) editorName = profile.full_name || profile.email || 'Staff';
    }

    // 2. PROCESS PAYMENT (NMI)
    let transactionId: string | null = null;
    let paymentLogText = "";

    if (payment_token) {
        const nmiParams = {
            security_key: NMI_SECURITY_KEY,
            type: transaction_type || 'sale',
            amount: Number(payment_amount).toFixed(2),
            payment_token: payment_token,
            orderid: order_id_override || reservation_id.toString(),
            first_name: holder.firstName,
            last_name: holder.lastName,
            email: holder.email
        };

        const nmiBody = new URLSearchParams(nmiParams);
        const nmiRes = await fetch('https://secure.nmi.com/api/transact.php', { method: 'POST', body: nmiBody });
        const nmiText = await nmiRes.text();
        const params = new URLSearchParams(nmiText);

        if (params.get('response') !== '1') {
            return NextResponse.json({ success: false, error: `Declined: ${params.get('responsetext')}` }, { status: 400 });
        }

        transactionId = params.get('transactionid');
        paymentLogText = transaction_type === 'auth' 
            ? ` | Auth Deposit: $${nmiParams.amount} (ID: ${transactionId})`
            : ` | Charged: $${nmiParams.amount} (ID: ${transactionId})`;
    }

    // 3. DATABASE UPDATE
    const adminSupabase = createAdminClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // --- A. Update Booking Header (Include Adults/Minors) ---
    const updatePayload: any = {
        first_name: holder.firstName,
        last_name: holder.lastName,
        email: holder.email,
        phone: holder.phone,
        booking_date: booking.date,
        start_time: booking.startTime,
        end_time: booking.endTime,
        duration_hours: booking.duration,
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

    // B. Update Line Items (Standard logic)
    const { data: existingItems } = await adminSupabase
        .from('pismo_booking_items')
        .select('id, pricing_category_id')
        .eq('pismo_booking_id', booking_id);

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

    // C. History & Log
    if (note) await adminSupabase.from('pismo_booking_notes').insert({ booking_id, author_name: editorName, note_text: note });
    
    await adminSupabase.from('pismo_booking_logs').insert({
        booking_id,
        editor_name: editorName,
        action_description: `Updated reservation. Value: $${total_amount.toFixed(2)}${paymentLogText}`
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}