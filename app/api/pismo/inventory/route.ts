// app/api/pismo/inventory/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  const start = searchParams.get('start');
  const end = searchParams.get('end');

  if (!date || !start || !end) {
    return NextResponse.json({ error: 'Date, start, end required' }, { status: 400 });
  }

  // Replace this stub with your real inventory check (running + not rented)
  const vehicles = [
    { code: 'QA', name: 'Quad Adult', price: 199, waiverPrice: 25, availableQty: 5 },
    { code: 'QB', name: 'Quad Youth', price: 179, waiverPrice: 20, availableQty: 3 },
    { code: 'SB4', name: '4-Seat Buggy', price: 299, waiverPrice: 40, availableQty: 2 },
    // Add all your vehicles (QU, QL, SB1-6, twoSeat4wd, UZ2/4, RWG, GoKart, etc.)
  ];

  return NextResponse.json(vehicles);
}