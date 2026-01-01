import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const NMI_SECURITY_KEY = process.env.NMI_SECURITY_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { payment_token, amount, holder, billing, booking } = body;

    // --- Validation ---
    if (!payment_token) return NextResponse.json({ success: false, error: 'Missing token' }, { status: 400 });
    if (!amount) return NextResponse.json({ success: false, error: 'Invalid amount' }, { status: 400 });
    if (!NMI_SECURITY_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
       return NextResponse.json({ success: false, error: 'Server Config Error' }, { status: 500 });
    }

    // --- Prepare NMI Payload ---
    const formattedAmount = (amount / 100).toFixed(2);
    const orderId = `PISMO-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const params = new URLSearchParams();
    params.append('security_key', NMI_SECURITY_KEY);
    params.append('payment_token', payment_token);
    params.append('type', 'sale'); // 'type' is often used instead of 'transaction_type' in some NMI wrappers, but 'sale' is standard
    params.append('amount', formattedAmount);
    params.append('orderid', orderId);
    
    // Customer Info
    if (holder?.firstName) params.append('first_name', holder.firstName);
    if (holder?.lastName) params.append('last_name', holder.lastName);
    if (holder?.email) params.append('email', holder.email);
    if (holder?.phone) params.append('phone', holder.phone);

    // Billing Info (Crucial for AVS)
    if (billing) {
        params.append('address1', billing.address || '');
        params.append('city', billing.city || '');
        params.append('state', billing.state || '');
        params.append('zip', billing.zip || '');
        params.append('country', 'US');
    }

    // --- Execute NMI Request ---
    console.log(`Charging $${formattedAmount} on Order ${orderId}`);
    
    const nmiResponse = await fetch('https://secure.nmi.com/api/transact.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    });

    const responseText = await nmiResponse.text();
    
    const responseParts = responseText.split('|');
    const responseCode = responseParts[1]; // 1=Success, 2=Decline, 3=Error

    if (responseCode !== '1') {
      const errorMsg = responseParts[4] || responseParts[2] || 'Transaction Declined';
      console.error("NMI Fail:", responseText);
      return NextResponse.json({ success: false, error: errorMsg }, { status: 400 });
    }

    const transactionId = responseParts[0] || orderId;

    // --- Payment Success -> Database Write ---
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    try {
      // 1. Booking Header
      const { data: bookingRec, error: bookingErr } = await supabase
        .from('pismo_bookings')
        .insert({
          first_name: holder.firstName,
          last_name: holder.lastName,
          email: holder.email,
          phone: holder.phone,
          booked_by: holder.booked_by || 'Guest',
          booking_date: booking.date,
          start_time: booking.startTime,
          end_time: booking.endTime,
          duration_hours: booking.duration,
          goggles_qty: booking.goggles || 0,
          bandannas_qty: booking.bandannas || 0,
          total_amount_cents: amount,
          transaction_id: transactionId,
          status: 'confirmed'
        })
        .select()
        .single();

      if (bookingErr) throw bookingErr;

      // 2. Line Items
      const itemsToInsert = [];
      for (const [catId, itemData] of Object.entries(booking.vehicles)) {
         const item = itemData as any;
         if (item.qty > 0) {
            itemsToInsert.push({
               booking_id: bookingRec.id,
               pricing_category_id: catId,
               vehicle_name: item.name,
               quantity: item.qty,
               has_waiver: item.waiver,
               price_per_unit_cents: Math.round((item.price || 0) * 100),
               waiver_cost_cents: item.waiver ? 1500 : 0 
            });
         }
      }

      if (itemsToInsert.length > 0) {
         const { error: itemsErr } = await supabase.from('pismo_booking_items').insert(itemsToInsert);
         if (itemsErr) throw itemsErr;
      }

      return NextResponse.json({ success: true, booking_id: bookingRec.id, transaction_id: transactionId });

    } catch (dbError: any) {
      console.error("DB Insert Error:", dbError);
      // Return success because payment worked, but warn FE
      return NextResponse.json({ success: true, warning: 'Payment success, DB save failed', transaction_id: transactionId });
    }

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ success: false, error: 'Server Error' }, { status: 500 });
  }
}