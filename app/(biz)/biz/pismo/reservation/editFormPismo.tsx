'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// Components
import DateTimeSelector from '@/app/pismo/book/components/dateTimeSelector';
import ReservationHolderForm from '@/app/pismo/book/components/reservationForm';
import VehicleGrid from '@/app/pismo/book/components/vehicleGrid';
import CheckoutForm from '@/app/pismo/book/components/checkoutForm';

export default function PismoReservationEditForm({ 
  initialData, 
  pricingRules 
}: { 
  initialData: any, 
  pricingRules: any[] 
}) {
  
  // --- 1. Initialize State ---
  
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    initialData.booking_date ? new Date(initialData.booking_date + 'T00:00:00') : null
  );
  
  const [startTime, setStartTime] = useState<string>(initialData.start_time);
  const [endTime, setEndTime] = useState<string>(initialData.end_time);
  const [durationHours, setDurationHours] = useState<number | null>(Number(initialData.duration_hours));
  
  // Initialize Pricing Categories with Server Data, but allow DateTimeSelector to update them
  const [pricingCategories, setPricingCategories] = useState<any[]>(pricingRules || []);

  // Map Database Items back to Grid Selections
  const [selections, setSelections] = useState<Record<string, { qty: number; waiver: boolean }>>(() => {
    const map: any = {};
    if (initialData.pismo_booking_items) {
        initialData.pismo_booking_items.forEach((item: any) => {
          if(item.pricing_category_id) {
              map[item.pricing_category_id] = { 
                qty: item.quantity, 
                waiver: item.has_waiver 
              };
          }
        });
    }
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

  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isCheckoutExpanded, setIsCheckoutExpanded] = useState(false);

  // --- 2. Live Total Calculation ---
  useEffect(() => {
    // If we haven't selected a time/duration yet, total is 0 (or just upsells)
    if (!pricingCategories || pricingCategories.length === 0) return;

    let calc = goggles * 4 + bandannas * 5;
    
    pricingCategories.forEach(cat => {
      const sel = selections[cat.id] || { qty: 0, waiver: false };
      
      const priceKey = durationHours ? `price_${durationHours}hr` : 'price_1hr';
      // Use fallback price if specific hour price is missing (safety check)
      const price = cat[priceKey] !== undefined ? cat[priceKey] : (cat.price_1hr || 0);
      
      calc += sel.qty * price;
      if (sel.waiver) calc += sel.qty * (cat.damage_waiver || 0);
    });
    
    setTotal(calc);
  }, [selections, goggles, bandannas, pricingCategories, durationHours]);

  // --- 3. Update Handler ---
  const handleUpdate = async () => {
    setLoading(true);
    setMessage('Updating Reservation...');

    // Prepare enriched vehicle data
    const vehiclesPayload: Record<string, any> = {};
    pricingCategories.forEach(cat => {
        const sel = selections[cat.id];
        if (sel && sel.qty > 0) {
            const priceKey = durationHours ? `price_${durationHours}hr` : 'price_1hr';
            vehiclesPayload[cat.id] = {
                qty: sel.qty,
                waiver: sel.waiver,
                name: cat.vehicle_name, 
                price: cat[priceKey] || 0 
            };
        }
    });

    try {
        const res = await fetch('/api/pismo/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                reservation_id: initialData.reservation_id, 
                booking_id: initialData.id,
                total_amount: total,
                holder: holderInfo,
                booking: { 
                    // SEND UPDATED DATE/TIME
                    date: selectedDate?.toISOString().split('T')[0],
                    startTime,
                    endTime,
                    duration: durationHours,
                    vehicles: vehiclesPayload, 
                    goggles, 
                    bandannas 
                }
            }),
        });

        const result = await res.json();

        if (result.success) {
            setMessage('Reservation Updated Successfully');
        } else {
            setMessage(`Update Failed: ${result.error}`);
        }

    } catch (err) {
        console.error(err);
        setMessage("Server Error during update.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto text-white pb-32">
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
           <span className={`font-bold uppercase ${initialData.status === 'confirmed' ? 'text-green-400' : 'text-yellow-400'}`}>
               {initialData.status}
           </span>
        </div>
      </div>

      {/* 1. Customer Info */}
      <section className="mb-10">
         <h2 className="text-xl font-bold text-orange-500 mb-4">Customer Information</h2>
         <ReservationHolderForm 
            initialData={holderInfo} 
            onUpdate={(info: any) => setHolderInfo({...holderInfo, ...info})} 
         />
      </section>

      {/* 2. Date & Time (Live Selector) */}
      {/* We reuse the exact same component as the booking page for full editing capabilities */}
      <DateTimeSelector 
          selectedDate={selectedDate} 
          setSelectedDate={setSelectedDate}
          startTime={startTime} 
          setStartTime={setStartTime}
          endTime={endTime} 
          setEndTime={setEndTime}
          setDurationHours={setDurationHours}
          setPricingCategories={setPricingCategories}
          setLoading={setLoading}
          setMessage={setMessage}
      />

      {/* 3. Vehicles Grid */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-orange-500 mb-4">Vehicles & Add-ons</h2>
        
        {pricingCategories && pricingCategories.length > 0 ? (
          <VehicleGrid 
            categories={pricingCategories}
            selections={selections}
            setSelections={setSelections}
            durationHours={durationHours}
          />
        ) : (
          <div className="p-8 text-center bg-gray-800 rounded-xl border border-red-900/50 text-gray-400">
             {loading ? 'Loading availability...' : 'Please select a valid time range above to see vehicles.'}
          </div>
        )}
        
        <div className="mt-8 flex gap-8 justify-center bg-gray-800 p-6 rounded-xl border border-gray-700">
           <div className="text-center">
              <label className="block mb-2 font-bold">Goggles ($4)</label>
              <input type="number" min="0" value={goggles} onChange={e => setGoggles(Number(e.target.value))} className="w-24 bg-gray-700 p-3 rounded text-center text-xl focus:ring-2 focus:ring-orange-500 outline-none" />
           </div>
           <div className="text-center">
              <label className="block mb-2 font-bold">Bandannas ($5)</label>
              <input type="number" min="0" value={bandannas} onChange={e => setBandannas(Number(e.target.value))} className="w-24 bg-gray-700 p-3 rounded text-center text-xl focus:ring-2 focus:ring-orange-500 outline-none" />
           </div>
        </div>
      </section>

      {/* 4. Update Button */}
      <CheckoutForm 
        total={total}
        holderInfo={holderInfo}
        isExpanded={isCheckoutExpanded}
        setIsExpanded={setIsCheckoutExpanded}
        onPayment={handleUpdate} 
        message={message}
        loading={loading}
        isEditing={true}
      />
    </div>
  );
}