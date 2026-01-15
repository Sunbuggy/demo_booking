import { NextRequest } from 'next/server';

const NMI_USERNAME = process.env.NMI_USERNAME!;
const NMI_PASSWORD = process.env.NMI_PASSWORD!;

export async function POST(req: NextRequest) {
  const { payment_token, amount } = await req.json();

  const params = new URLSearchParams({
    username: NMI_USERNAME,
    password: NMI_PASSWORD,
    payment_token,
    transaction_type: 'sale',
    amount: amount.toFixed(2),
  });

  const res = await fetch('https://secure.nmi.com/api/transact.php', {
    method: 'POST',
    body: params
  });

  const text = await res.text();
  const parts = text.split('|');
  if (parts[1] === '1') {
    return Response.json({ success: true, transaction_id: parts[0] });
  } else {
    return Response.json({ success: false, error: parts[4] || 'Declined' });
  }
}