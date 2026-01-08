import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server'; 
import { createClient as createAdminClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const NMI_SECURITY_KEY = process.env.NMI_SECURITY_KEY!;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Destructure all necessary fields including the new payment ones
    const { 
        reservation_id, // The human readable ID (e.g. 100500)
        booking_id,     // The UUID
        total_amount,   // The full value of the reservation
        
        // --- Payment Fields ---
        payment_token,
        payment_amount,    // The specific amount being charged/authed right now
        transaction_type,  // 'sale' or 'auth'
        order_id_override, // e.g. 'deposit_100500' or '100500'
        
        holder, 
        booking, 
        note 
    } = body;

    // 1. Identify the Current User (The Editor)
    const cookieClient = await createClient();
    const { data: { user } } = await cookieClient.auth.getUser();
    
    let editorName = 'Online Customer'; 

    if (user) {
      const { data: profile } = await cookieClient
        .from('users')
        .select('full_name, email')
        .eq('id', user.id)
        .single();
      
      if (profile && profile.full_name) {
        editorName = profile.full_name;
      } else {
        editorName = profile?.email || 'Staff Member';
      }
    }

    // 2. PROCESS PAYMENT (NMI) - If a token is provided
    let transactionId: string | null = null;
    let authCode: string | null = null;
    let paymentLogText = "";

    if (payment_token) {
        // Construct NMI Payload
        const nmiParams = {
            security_key: NMI_SECURITY_KEY,
            type: transaction_type || 'sale', // 'auth' for deposits, 'sale' for payments
            amount: Number(payment_amount).toFixed(2), // Charge ONLY the override amount
            payment_token: payment_token,
            
            // Order ID logic (Deposit vs Sale)
            orderid: order_id_override || reservation_id.toString(),
            order_description: `${transaction_type === 'auth' ? 'Deposit' : 'Payment'} for Res #${reservation_id}`,
            
            // Billing Info
            first_name: holder.firstName,
            last_name: holder.lastName,
            email: holder.email,
            phone: holder.phone,
        };

        const nmiBody = new URLSearchParams(nmiParams);

        console.log(`[Update] Processing ${transaction_type} of $${nmiParams.amount} for Order ${nmiParams.orderid}...`);

        const nmiRes = await fetch('https://secure.nmi.com/api/transact.php', {
            method: 'POST',
            body: nmiBody
        });

        const nmiText = await nmiRes.text();
        const params = new URLSearchParams(nmiText);
        const response = params.get('response'); 
        const responseText = params.get('responsetext');

        if (response !== '1') {
            console.error(`[Update] Payment Declined: ${responseText}`);
            return NextResponse.json({ success: false, error: `Transaction Declined: ${responseText}` }, { status: 400 });
        }

        // Success
        transactionId = params.get('transactionid');
        authCode = params.get('authcode');
        
        paymentLogText = transaction_type === 'auth' 
            ? ` | Authorized Deposit: $${nmiParams.amount} (TransID: ${transactionId})`
            : ` | Charged Payment: $${nmiParams.amount} (TransID: ${transactionId})`;
    }

    // 3. DATABASE UPDATES (Admin Client)
    const adminSupabase = createAdminClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // A. Update Booking Header
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
        total_amount: Math.round(total_amount * 100), // Update the TOTAL value of the booking
        // If we made a NEW transaction, update the ID on the header?
        // Note: This overwrites the previous transaction ID. 
        // If you want to keep history, usually you don't overwrite, or you have a separate payments table.
        // For now, we update it so the latest transaction is visible.
        ...(transactionId && { transaction_id: transactionId })
    };

    if (note && note.trim().length > 0) {
        updatePayload.notes = note; 
    }

    const { error: headerErr } = await adminSupabase
      .from('pismo_bookings')
      .update(updatePayload)
      .eq('id', booking_id);

    if (headerErr) throw headerErr;

    // B. Update Line Items (Vehicles)
    const { data: existingItems } = await adminSupabase
        .from('pismo_booking_items')
        .select('id, pricing_category_id')
        .eq('pismo_booking_id', booking_id);

    const vehicles = booking.vehicles || {};
    const itemsToUpdate: any[] = [];
    const itemsToInsert: any[] = [];
    const processedCategoryIds = new Set();
    
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
        if (existingRow) {
            itemsToUpdate.push({ ...payload, id: existingRow.id });
        } else {
            itemsToInsert.push(payload);
        }
        processedCategoryIds.add(catId);
      }
    }

    const idsToDelete = existingItems
        ?.filter(r => !processedCategoryIds.has(r.pricing_category_id))
        .map(r => r.id) || [];

    if (idsToDelete.length > 0) await adminSupabase.from('pismo_booking_items').delete().in('id', idsToDelete);
    if (itemsToUpdate.length > 0) await adminSupabase.from('pismo_booking_items').upsert(itemsToUpdate);
    if (itemsToInsert.length > 0) await adminSupabase.from('pismo_booking_items').insert(itemsToInsert);

    // C. INSERT NOTE HISTORY
    if (note && note.trim().length > 0) {
        await adminSupabase.from('pismo_booking_notes').insert({
            booking_id: booking_id,
            author_name: editorName,
            note_text: note
        });
    }

    // D. INSERT AUDIT LOG
    // We append the payment log text if a payment occurred
    const logDescription = `Updated details. Total Value: $${total_amount.toFixed(2)}${paymentLogText}`;

    await adminSupabase.from('pismo_booking_logs').insert({
        booking_id: booking_id,
        editor_name: editorName,
        action_description: logDescription
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}