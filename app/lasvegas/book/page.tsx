/**
 * @file app/lasvegas/book/page.tsx
 * @description Public Booking Page for Las Vegas.
 * Wraps the internal booking component for public use.
 */

import { createClient } from '@/utils/supabase/server';
import { fetchHotels } from '@/utils/supabase/queries';
// 🟢 FIXED: Import from 'server-booking' where the component actually lives
import { BookingEditPage } from '@/app/(biz)/biz/vegas/reservations/components/server-booking';
import { MapPin } from 'lucide-react';

export const metadata = {
  title: 'Book Your Adventure | SunBuggy Las Vegas',
  description: 'Reserve your ATV or Dune Buggy experience in Las Vegas.',
};

export default async function PublicBookingPage() {
  const supabase = await createClient();

  // Fetch Hotels for the shuttle dropdown
  const [hotels] = await Promise.all([
    fetchHotels(supabase)
  ]);

  return (
    <div className="w-full min-h-screen bg-background text-foreground">
      
      {/* HERO / HEADER SECTION */}
      <div className="w-full bg-primary/5 border-b border-border py-12 px-4 mb-8">
        <div className="max-w-7xl mx-auto text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-foreground">
            <span className="text-primary">Las Vegas</span> Booking
          </h1>
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <MapPin className="w-5 h-5 text-primary" />
            <p className="text-lg font-medium">Nellis Dunes & Valley of Fire</p>
          </div>
          <p className="max-w-2xl mx-auto text-muted-foreground">
            Choose your adventure below. Our live booking system will guide you through vehicle selection, 
            shuttle options, and secure payment.
          </p>
        </div>
      </div>

      {/* BOOKING FORM WRAPPER */}
      <div className="container max-w-7xl mx-auto px-4 pb-20">
        <BookingEditPage 
          hotels={hotels} 
          initialData={undefined}
          viewMode={false}
        />
      </div>
    </div>
  );
}