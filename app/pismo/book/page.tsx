'use client';

import { useState, useEffect, useCallback } from 'react';
// import { createClient } from '@/utils/supabase/client'; 
import BookingProgress from './components/bookingProgress';
import ReservationHolderForm from './components/reservationForm';
import DateTimeSelector from './components/dateTimeSelector';
import VehicleGrid from './components/vehicleGrid';
import CheckoutForm from './components/checkoutForm';

export default function PismoBookingPage() {
  // === Core State ===
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [durationHours, setDurationHours] = useState<number | null>(null);
  const [pricingCategories, setPricingCategories] = useState<any[]>([]);
  
  // Store selections. 
  const [selections, setSelections] = useState<Record<string, { qty: number; waiver: boolean }>>({});
  
  // === Upsell State ===
  const [goggles, setGoggles] = useState<number>(0);
  const [bandannas, setBandannas] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);
  
  // === UI & Auth State ===
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  
  const [holderInfo, setHolderInfo] = useState({ 
    firstName: '', 
    lastName: '', 
    email: '', 
    phone: '',
    booked_by: 'Guest' 
  });
  
  const [isCheckoutExpanded, setIsCheckoutExpanded] = useState(false);

  // === Handler for Form Updates ===
  const handleHolderUpdate = (newInfo: any) => {
     setHolderInfo(prev => ({
        ...prev,
        ...newInfo,
        // Ensure booked_by is preserved if not explicitly passed
        booked_by: newInfo.booked_by || prev.booked_by
     }));
  };

  // === Total Calculation ===
  useEffect(() => {
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

  // === The Payment Logic ===
  // Updated to accept 'billing' object from CheckoutForm
  const handlePayment = useCallback(async (token: string, billing: any) => {
    if (!token) {
      setMessage('Invalid payment token.');
      return;
    }
    
    setLoading(true);
    setMessage('Processing payment & saving reservation...');

    // Prepare enriched vehicle data for the API (so it can snapshot names/prices)
    const vehiclesPayload: Record<string, any> = {};
    
    pricingCategories.forEach(cat => {
        const sel = selections[cat.id];
        if (sel && sel.qty > 0) {
            const priceKey = durationHours ? `price_${durationHours}hr` : 'price_1hr';
            vehiclesPayload[cat.id] = {
                qty: sel.qty,
                waiver: sel.waiver,
                name: cat.vehicle_name, // Snapshot name
                price: cat[priceKey] || 0 // Snapshot unit price
            };
        }
    });

    try {
      const res = await fetch('/api/pismo/charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_token: token,
          amount: Math.round(total * 100), 
          holder: holderInfo,
          billing: billing, // Pass billing info (address/zip) to API
          booking: { 
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
        setMessage(`Success! Confirmation #: ${result.booking_id || result.transaction_id}`);
        // Optional: Redirect to confirmation page here
        // window.location.href = `/confirmation/${result.booking_id}`;
      } else {
        setMessage(`Failed: ${result.error || 'Please check card details.'}`);
      }
    } catch (err) {
      console.error(err);
      setMessage('Error connecting to server.');
    } finally {
      setLoading(false);
    }
  }, [total, holderInfo, selectedDate, startTime, endTime, durationHours, selections, pricingCategories, goggles, bandannas]);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 pb-64 md:p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-8 text-orange-500">Pismo Beach Rentals</h1>
        
        <BookingProgress 
            isStep1={!!endTime && !!durationHours} 
            isStep2={total > 0} 
            isStep3={isCheckoutExpanded} 
        />

        <ReservationHolderForm onUpdate={handleHolderUpdate} />

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

        {loading && !isCheckoutExpanded && <p className="text-center text-2xl text-orange-400 mb-12 animate-pulse">{message || "Updating information..."}</p>}

        {pricingCategories.length > 0 && (
          <VehicleGrid 
            categories={pricingCategories}
            selections={selections}
            setSelections={setSelections}
            durationHours={durationHours}
          />
        )}

        <section className="bg-gray-800 rounded-2xl p-6 md:p-8 mb-12 shadow-xl">
          <h2 className="text-3xl font-bold text-center mb-8 text-orange-500">Optional Extras</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            <div className="text-center">
              <label className="text-2xl block mb-4">Goggles ($4)</label>
              <input type="number" min="0" value={goggles} onChange={e => setGoggles(parseInt(e.target.value) || 0)} className="p-4 bg-gray-700 rounded w-32 text-xl text-center" />
            </div>
            <div className="text-center">
              <label className="text-2xl block mb-4">Bandannas ($5)</label>
              <input type="number" min="0" value={bandannas} onChange={e => setBandannas(parseInt(e.target.value) || 0)} className="p-4 bg-gray-700 rounded w-32 text-xl text-center" />
            </div>
          </div>
        </section>
      </div>

      <CheckoutForm 
        total={total}
        holderInfo={holderInfo}
        // This is primarily for the UI list inside the checkout drawer
        selectedItems={pricingCategories.filter(cat => (selections[cat.id]?.qty || 0) > 0).map(cat => ({
            id: cat.id,
            name: cat.vehicle_name,
            qty: selections[cat.id].qty,
            waiver: selections[cat.id].waiver,
            price: (durationHours ? cat[`price_${durationHours}hr`] : cat.price_1hr) * selections[cat.id].qty
        }))}
        isExpanded={isCheckoutExpanded}
        setIsExpanded={setIsCheckoutExpanded}
        onPayment={handlePayment}
        message={message}
        loading={loading}
      />
    </div>
  );
}