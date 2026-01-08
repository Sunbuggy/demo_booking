'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
// Import your utility (Ensure this path is correct for your project)
import { getUserDetails } from '@/utils/supabase/queries'; 

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
  
  const [selections, setSelections] = useState<Record<string, { qty: number; waiver: boolean }>>({});
  
  const [goggles, setGoggles] = useState<number>(0);
  const [bandannas, setBandannas] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);
  
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  
  const [holderInfo, setHolderInfo] = useState({ 
    firstName: '', lastName: '', email: '', phone: '', booked_by: 'Guest' 
  });
  
  const [isCheckoutExpanded, setIsCheckoutExpanded] = useState(false);

  // === STAFF STATE ===
  const [userLevel, setUserLevel] = useState(0);
  // Default to 'payment' (Sale) for new bookings because deposits are hidden
  const [paymentType, setPaymentType] = useState<'deposit' | 'payment'>('payment'); 
  const [useCustomAmount, setUseCustomAmount] = useState(false);
  const [customAmount, setCustomAmount] = useState(0);

  // === FETCH USER LEVEL (Using your util) ===
  useEffect(() => {
    const fetchUser = async () => {
        const supabase = createClient();
        // getUserDetails returns an array based on your definition: Promise<any[] | null>
        const details = await getUserDetails(supabase);
        
        if (details && details.length > 0) {
            // Safe access to the first user record
            setUserLevel(details[0].user_level || 0);
        }
    };
    fetchUser();
  }, []);

  // === CALCULATE TOTAL ===
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
    
    // If staff hasn't manually overridden yet, sync custom amount with total
    if (!useCustomAmount) setCustomAmount(calc);
  }, [selections, goggles, bandannas, pricingCategories, durationHours, useCustomAmount]);

  // === HANDLE BOOKING ===
  const handleBooking = useCallback(async (paymentToken?: string | null) => {
    setLoading(true);
    setMessage(paymentToken ? 'Processing Payment...' : 'Saving reservation...');

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

    // If Staff overrides price, use customAmount; otherwise use calculated total
    const finalAmount = useCustomAmount ? customAmount : total;

    try {
      const res = await fetch('/api/pismo/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          total_amount: total, // The "Real" value of the booking
          
          // Payment Specifics
          payment_amount: finalAmount, // The amount we are actually charging
          payment_token: paymentToken,
          
          holder: holderInfo, 
          booking: { 
            date: selectedDate?.toISOString().split('T')[0], 
            startTime, endTime, duration: durationHours, 
            vehicles: vehiclesPayload, goggles, bandannas 
          }
        }),
      });

      const result = await res.json();
      if (result.success) {
        setMessage(`Confirmed! Booking ID: ${result.booking_id}`);
      } else {
        setMessage(`Failed: ${result.error || 'Could not save booking.'}`);
      }
    } catch (err) {
      console.error(err);
      setMessage('Error connecting to server.');
    } finally {
      setLoading(false);
    }
  }, [total, holderInfo, selectedDate, startTime, endTime, durationHours, selections, pricingCategories, goggles, bandannas, useCustomAmount, customAmount]);

  // Helper for Order Summary List
  const selectedItemsList = pricingCategories
    .filter(cat => (selections[cat.id]?.qty || 0) > 0)
    .map(cat => {
        const priceKey = durationHours ? `price_${durationHours}hr` : 'price_1hr';
        const basePrice = cat[priceKey] !== undefined ? cat[priceKey] : (cat.price_1hr || 0);
        const waiverPrice = selections[cat.id].waiver ? (cat.damage_waiver || 0) : 0;
        
        return {
            id: cat.id,
            name: cat.vehicle_name,
            qty: selections[cat.id].qty,
            waiver: selections[cat.id].waiver,
            price: (basePrice + waiverPrice) * selections[cat.id].qty
        };
    });

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 pb-64 md:p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-8 text-orange-500">Pismo Beach Rentals</h1>
        
        <BookingProgress isStep1={!!endTime && !!durationHours} isStep2={total > 0} isStep3={isCheckoutExpanded} />
        <ReservationHolderForm onUpdate={(newInfo: any) => setHolderInfo(prev => ({ ...prev, ...newInfo }))} />
        <DateTimeSelector 
          selectedDate={selectedDate} setSelectedDate={setSelectedDate}
          startTime={startTime} setStartTime={setStartTime}
          endTime={endTime} setEndTime={setEndTime}
          setDurationHours={setDurationHours} setPricingCategories={setPricingCategories}
          setLoading={setLoading} setMessage={setMessage}
        />

        {pricingCategories.length > 0 && (
          <VehicleGrid categories={pricingCategories} selections={selections} setSelections={setSelections} durationHours={durationHours} />
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
        selectedItems={selectedItemsList}
        goggles={goggles}
        bandannas={bandannas}
        isExpanded={isCheckoutExpanded}
        setIsExpanded={setIsCheckoutExpanded}
        onPayment={handleBooking} 
        message={message}
        loading={loading}
        
        // --- STAFF PROPS ---
        userLevel={userLevel} 
        
        // isEditing={false} ensures the Deposit toggle is HIDDEN for new bookings
        isEditing={false} 
        
        paymentType={paymentType}
        setPaymentType={setPaymentType}
        customAmount={customAmount}
        setCustomAmount={setCustomAmount}
        useCustomAmount={useCustomAmount}
        setUseCustomAmount={setUseCustomAmount}
      />
    </div>
  );
}