// app/biz/[...locdate]/page.tsx
// Pismo Daily Operations Board

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
    // SEMANTIC: Main Page Container
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <Button variant="outline" asChild>
            <Link href={`/biz/pismo/${yesterday}`}>← Prev</Link>
          </Button>
          
          {/* SEMANTIC: Primary Header */}
          <h1 className="text-3xl font-bold text-primary">
            Pismo Ops: {dayjs(dateStr).format('ddd, MMM D, YYYY')}
          </h1>
          
          <Button variant="outline" asChild>
            <Link href={`/biz/pismo/${tomorrow}`}>Next →</Link>
          </Button>
        </div>

        {/* Dashboard Grid */}
        {/* SEMANTIC: Card Container */}
        <div className="bg-card text-card-foreground rounded-xl p-6 shadow-sm border border-border">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-foreground">
              {reservations.length} Bookings Found
            </h2>
            {/* SEMANTIC: Primary Action Button */}
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90" asChild>
              <Link href="/pismo/book">+ New Walk-In</Link>
            </Button>
          </div>

          {reservations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No reservations for this date.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  {/* SEMANTIC: Table Header (Muted Text, Border) */}
                  <tr className="text-muted-foreground border-b border-border text-sm uppercase">
                    <th className="p-3">Time</th>
                    <th className="p-3">Res ID</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Vehicles</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Action</th>
                  </tr>
                </thead>
                {/* SEMANTIC: Table Body (Divide Border) */}
                <tbody className="divide-y divide-border">
                  {reservations.map((res: any) => (
                    // SEMANTIC: Row Hover (Muted Background)
                    <tr key={res.id} className="hover:bg-muted/50 transition-colors">
                      <td className="p-3 font-mono text-primary font-bold">
                        {res.start_time} - {res.end_time}
                      </td>
                      <td className="p-3 font-bold text-foreground">
                        <Link 
                          href={`/biz/pismo/reservation/${res.reservation_id}`} 
                          // SEMANTIC: Link Color (Primary or Accent - defaulting to primary for consistency)
                          className="text-primary hover:underline text-sm"
                        > #{res.reservation_id}
                        </Link> 
                      </td>
                      <td className="p-3">
                        <div className="font-medium text-foreground">{res.first_name} {res.last_name}</div>
                        <div className="text-xs text-muted-foreground">{res.phone}</div>
                      </td>
                      <td className="p-3 text-sm text-foreground/80">
                        {res.pismo_booking_items.map((item: any, i: number) => (
                          <span key={i} className="block">
                            {item.quantity}x {item.vehicle_name_snapshot}
                          </span>
                        ))}
                      </td>
                      <td className="p-3">
                        {/* SEMANTIC: Status Badges (Using opacity tints for Light/Dark compatibility) */}
                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                          res.status === 'confirmed' 
                            ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20' 
                            : 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20'
                        }`}>
                          {res.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <Link 
                          href={`/biz/pismo/reservation/${res.reservation_id}`} 
                          className="text-muted-foreground hover:text-foreground underline text-sm transition-colors"
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