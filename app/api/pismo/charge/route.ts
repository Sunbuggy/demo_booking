// app/api/pismo/charge/route.ts
import { NextResponse } from 'next/server';

const NMI_USERNAME = process.env.NMI_USERNAME!;
const NMI_PASSWORD = process.env.NMI_PASSWORD!;

export async function POST(request: Request) {
  const body = await request.json();
  const { payment_token, amount } = body;

  if (!payment_token || !amount || amount <= 0) {
    return NextResponse.json({ success: false, error: 'Invalid payment data' }, { status: 400 });
  }

  const params = new URLSearchParams({
    username: NMI_USERNAME,
    password: NMI_PASSWORD,
    payment_token: payment_token,
    transaction_type: 'sale',
    amount: amount.toFixed(2),
    // Optional: vault for repeat customers
    create_customer_vault: '1',
    customer_vault_id: `pismo_${Date.now()}`
  });

  try {
    const res = await fetch('https://secure.nmi.com/api/transact.php', {
      method: 'POST',
      body: params,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const text = await res.text();
    const parts = text.split('|');

    if (parts[1] === '1') { // Approved
      return NextResponse.json({
        success: true,
        transaction_id: parts[0],
        message: 'Payment successful'
      });
    } else {
      return NextResponse.json({
        success: false,
        error: parts[4] || 'Payment declined'
      });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Payment gateway error'
    }, { status: 500 });
  }
}