import { notFound, redirect } from 'next/navigation';
import dayjs from 'dayjs';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0; 

// --- Fetcher Function ---
async function fetchPismoReservations(date: string) {
  'use server';
  const supabase = await createClient();

  // Fetch bookings for the specific date
  const { data, error } = await supabase
    .from('pismo_bookings')
    .select(`
      *,
      pismo_booking_items (
        quantity,
        vehicle_name_snapshot
      )
    `)
    .eq('booking_date', date)
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Error fetching Pismo reservations:', error.message);
    return [];
  }
  return data || [];
}

export default async function PismoBoardPage({
  params,
}: {
  params: Promise<{ locdate: string[] }>;
}) {
  const { locdate } = await params;

  if (locdate.length !== 2) notFound();
  const [locationSlug, dateStr] = locdate;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) redirect('/biz/calendar');
  if (locationSlug !== 'pismo') notFound();

  const reservations = await fetchPismoReservations(dateStr);

  const yesterday = dayjs(dateStr).subtract(1, 'day').format('YYYY-MM-DD');
  const tomorrow = dayjs(dateStr).add(1, 'day').format('YYYY-MM-DD');

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <Button variant="outline" asChild>
            <Link href={`/biz/pismo/${yesterday}`}>← Prev</Link>
          </Button>
          <h1 className="text-3xl font-bold text-orange-500">
            Pismo Ops: {dayjs(dateStr).format('ddd, MMM D, YYYY')}
          </h1>
          <Button variant="outline" asChild>
            <Link href={`/biz/pismo/${tomorrow}`}>Next →</Link>
          </Button>
        </div>

        {/* Dashboard Grid */}
        <div className="bg-gray-800 rounded-xl p-6 shadow-xl border border-gray-700">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-white">
              {reservations.length} Bookings Found
            </h2>
            <Button className="bg-orange-600 hover:bg-orange-500">
              <Link href="/pismo/book">+ New Walk-In</Link>
            </Button>
          </div>

          {reservations.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No reservations for this date.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-700 text-sm uppercase">
                    <th className="p-3">Time</th>
                    <th className="p-3">Res ID</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Vehicles</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {reservations.map((res: any) => (
                    <tr key={res.id} className="hover:bg-gray-700/50 transition-colors">
                      <td className="p-3 font-mono text-orange-300">
                        {res.start_time} - {res.end_time}
                      </td>
                      <td className="p-3 font-bold text-white">
                        #{res.reservation_id}
                      </td>
                      <td className="p-3">
                        <div className="font-medium text-white">{res.first_name} {res.last_name}</div>
                        <div className="text-xs text-gray-400">{res.phone}</div>
                      </td>
                      <td className="p-3 text-sm text-gray-300">
                        {res.pismo_booking_items.map((item: any, i: number) => (
                          <span key={i} className="block">
                            {item.quantity}x {item.vehicle_name_snapshot}
                          </span>
                        ))}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                          res.status === 'confirmed' ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'
                        }`}>
                          {res.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <Link 
                          href={`/biz/pismo/reservation/${res.reservation_id}`} 
                          className="text-blue-400 hover:text-blue-300 underline text-sm"
                        >
                          View / Edit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}