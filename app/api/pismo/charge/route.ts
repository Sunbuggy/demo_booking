import { NextResponse } from 'next/server';

const NMI_SECURITY_KEY = process.env.NMI_SECURITY_KEY!;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { payment_token, amount, holder } = body;

    if (!payment_token || !amount || amount <= 0) {
      return NextResponse.json({ success: false, error: 'Invalid payment data' }, { status: 400 });
    }

    // NMI expects a string decimal (e.g., "59.99"). Frontend sends cents (e.g., 5999).
    const formattedAmount = (amount / 100).toFixed(2);

    const params = new URLSearchParams({
      security_key: NMI_SECURITY_KEY, // Using the Security Key
      payment_token: payment_token,
      transaction_type: 'sale',
      amount: formattedAmount,
      first_name: holder.firstName,
      last_name: holder.lastName,
      email: holder.email,
      phone: holder.phone,
      orderid: `PISMO-${Date.now()}`,
      create_customer_vault: '1'
    });

    const res = await fetch('https://secure.nmi.com/api/transact.php', {
      method: 'POST',
      body: params,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const text = await res.text();
    const parts = text.split('|');

    if (parts[1] === '1') { // 1 = Approved
      return NextResponse.json({
        success: true,
        transaction_id: parts[0],
        message: 'Payment approved'
      });
    } else {
      return NextResponse.json({
        success: false,
        error: parts[4] || 'Card was declined'
      });
    }
  } catch (error) {
    console.error('NMI Error:', error);
    return NextResponse.json({ success: false, error: 'Gateway Connection Error' }, { status: 500 });
  }
}