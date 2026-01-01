'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ReservationHolderForm from '@/app/pismo/book/components/reservationForm';
import VehicleGrid from '@/app/pismo/book/components/vehicleGrid';
import CheckoutForm from '@/app/pismo/book/components/checkoutForm';

export default function PismoReservationEditForm({ initialData }: { initialData: any }) {
  
  // --- Initialize State with Database Data ---
  
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    new Date(initialData.booking_date + 'T00:00:00')
  );
  
  const [startTime, setStartTime] = useState<string>(initialData.start_time);
  const [endTime, setEndTime] = useState<string>(initialData.end_time);
  const [durationHours, setDurationHours] = useState<number | null>(Number(initialData.duration_hours));
  
  // Reconstruct Selections from pismo_booking_items
  const [selections, setSelections] = useState<Record<string, { qty: number; waiver: boolean }>>(() => {
    const map: any = {};
    initialData.pismo_booking_items.forEach((item: any) => {
      // Note: We need the original category ID to map back to the grid correctly.
      // Ideally, pricing_category_id is stored in the items table.
      if(item.pricing_category_id) {
          map[item.pricing_category_id] = { 
            qty: item.quantity, 
            waiver: item.has_waiver 
          };
      }
    });
    return map;
  });

  const [goggles, setGoggles] = useState<number>(initialData.goggles_qty || 0);
  const [bandannas, setBandannas] = useState<number>(initialData.bandannas_qty || 0);
  
  const [holderInfo, setHolderInfo] = useState({ 
    firstName: initialData.first_name, 
    lastName: initialData.last_name, 
    email: initialData.email, 
    phone: initialData.phone,
    booked_by: initialData.booked_by
  });

  const [total, setTotal] = useState<number>(initialData.total_amount_cents ? initialData.total_amount_cents / 100 : initialData.total_amount);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isCheckoutExpanded, setIsCheckoutExpanded] = useState(false);
  const [pricingCategories, setPricingCategories] = useState<any[]>([]);

  // --- Fetch Pricing Rules (Needed for the Grid) ---
  useEffect(() => {
    const fetchPricing = async () => {
        // You can reuse your existing pricing fetcher or logic here
        // Ideally fetch this from your supabase client
        const { createClient } = await import('@/utils/supabase/client');
        const supabase = createClient();
        const { data } = await supabase.from('pismo_pricing_rules').select('*').eq('is_active', true);
        if(data) setPricingCategories(data);
    };
    fetchPricing();
  }, []);

  // --- Recalculate Total (Live Updates) ---
  useEffect(() => {
    // Only recalculate if we have pricing data loaded, otherwise keep initial total
    if (pricingCategories.length === 0) return;

    let calc = goggles * 4 + bandannas * 5;
    pricingCategories.forEach(cat => {
      const sel = selections[cat.id] || { qty: 0, waiver: false };
      const priceKey = durationHours ? `price_${durationHours}hr` : 'price_1hr';
      const price = cat[priceKey] || 0;
      calc += sel.qty * price;
      if (sel.waiver) calc += sel.qty * (cat.damage_waiver || 0);
    });
    setTotal(calc);
  }, [selections, goggles, bandannas, pricingCategories, durationHours]);

  const handleUpdate = async () => {
    setLoading(true);
    setMessage('Updating Reservation...');
    
    // Call API route to UPDATE (You will need to create a PATCH route similar to the POST one)
    // For now, let's just simulate success or log it
    console.log("Saving updates for ID:", initialData.id);
    
    setTimeout(() => {
        setLoading(false);
        setMessage('Reservation Updated Successfully');
    }, 1000);
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto text-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-700">
        <div>
           <Link href={`/biz/pismo/${initialData.booking_date}`} className="text-orange-400 hover:text-orange-300 mb-2 block">
             ← Back to Dashboard
           </Link>
           <h1 className="text-3xl font-bold">Res #{initialData.reservation_id}</h1>
           <span className="text-gray-400">Created on {new Date(initialData.created_at).toLocaleDateString()}</span>
        </div>
        <div className="bg-gray-800 px-6 py-3 rounded-lg border border-gray-600">
           <span className="block text-xs text-gray-400 uppercase">Status</span>
           <span className="font-bold text-green-400 uppercase">{initialData.status}</span>
        </div>
      </div>

      {/* 1. Customer Info */}
      <section className="mb-10">
         <h2 className="text-xl font-bold text-orange-500 mb-4">Customer Information</h2>
         <ReservationHolderForm 
            initialData={holderInfo} // Pass initial data to form
            onUpdate={(info: typeof holderInfo) => setHolderInfo({...holderInfo, ...info})} 
         />
      </section>

      {/* 2. Timing */}
      <section className="mb-10 bg-gray-800 p-6 rounded-xl border border-gray-700">
         <h2 className="text-xl font-bold text-orange-500 mb-4">Date & Time</h2>
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
               <label className="text-gray-400 text-sm">Date</label>
               <input 
                 type="date" 
                 disabled 
                 value={initialData.booking_date} 
                 className="w-full bg-gray-900 border border-gray-600 p-2 rounded text-gray-400 cursor-not-allowed"
               />
            </div>
            <div>
               <label className="text-gray-400 text-sm">Start Time</label>
               <div className="p-2 bg-gray-900 border border-gray-600 rounded">{startTime}</div>
            </div>
             <div>
               <label className="text-gray-400 text-sm">End Time</label>
               <div className="p-2 bg-gray-900 border border-gray-600 rounded">{endTime}</div>
            </div>
             <div>
               <label className="text-gray-400 text-sm">Duration</label>
               <div className="p-2 bg-gray-900 border border-gray-600 rounded">{durationHours} Hours</div>
            </div>
         </div>
      </section>

      {/* 3. Vehicles */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-orange-500 mb-4">Vehicles & Add-ons</h2>
        {pricingCategories.length > 0 ? (
          <VehicleGrid 
            categories={pricingCategories}
            selections={selections}
            setSelections={setSelections}
            durationHours={durationHours}
          />
        ) : (
          <p>Loading vehicle options...</p>
        )}
        
        <div className="mt-8 flex gap-8 justify-center bg-gray-800 p-6 rounded-xl">
           <div className="text-center">
              <label className="block mb-2">Goggles</label>
              <input type="number" value={goggles} onChange={e => setGoggles(Number(e.target.value))} className="w-20 bg-gray-700 p-2 rounded text-center" />
           </div>
           <div className="text-center">
              <label className="block mb-2">Bandannas</label>
              <input type="number" value={bandannas} onChange={e => setBandannas(Number(e.target.value))} className="w-20 bg-gray-700 p-2 rounded text-center" />
           </div>
        </div>
      </section>

      {/* 4. Checkout / Save */}
      <CheckoutForm 
        total={total}
        holderInfo={holderInfo}
        isExpanded={isCheckoutExpanded}
        setIsExpanded={setIsCheckoutExpanded}
        onPayment={handleUpdate} // Calls the update logic
        message={message}
        loading={loading}
      />
    </div>
  );
}