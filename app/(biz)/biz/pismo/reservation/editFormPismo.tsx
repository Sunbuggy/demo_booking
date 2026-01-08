'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client'; // Import Client
import { getUserDetails } from '@/utils/supabase/queries'; // Import Query

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
  
  // --- Core State ---
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    initialData.booking_date ? new Date(initialData.booking_date + 'T00:00:00') : null
  );
  const [startTime, setStartTime] = useState<string>(initialData.start_time);
  const [endTime, setEndTime] = useState<string>(initialData.end_time);
  const [durationHours, setDurationHours] = useState<number | null>(Number(initialData.duration_hours));
  const [pricingCategories, setPricingCategories] = useState<any[]>(pricingRules || []);

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

  const [existingNotes] = useState<any[]>(
      initialData.pismo_booking_notes?.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) || []
  );
  const [newNote, setNewNote] = useState('');
  const [logs] = useState<any[]>(
      initialData.pismo_booking_logs?.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) || []
  );

  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isCheckoutExpanded, setIsCheckoutExpanded] = useState(false);

  // --- NEW: Staff / Payment State ---
  const [userLevel, setUserLevel] = useState(0); // <--- Add this state
  const [paymentType, setPaymentType] = useState<'deposit' | 'payment'>('deposit');
  const [useCustomAmount, setUseCustomAmount] = useState(false);
  const [customAmount, setCustomAmount] = useState(0);

  // --- NEW: Fetch User Level ---
  useEffect(() => {
    const fetchUser = async () => {
        const supabase = createClient();
        const details = await getUserDetails(supabase);
        
        if (details && details.length > 0) {
            setUserLevel(details[0].user_level || 0);
        }
    };
    fetchUser();
  }, []);

  // --- Live Total Calculation ---
  useEffect(() => {
    if (!pricingCategories || pricingCategories.length === 0) return;
    let calc = goggles * 4 + bandannas * 5;
    pricingCategories.forEach(cat => {
      const sel = selections[cat.id] || { qty: 0, waiver: false };
      const priceKey = durationHours ? `price_${durationHours}hr` : 'price_1hr';
      const price = cat[priceKey] !== undefined ? cat[priceKey] : (cat.price_1hr || 0);
      calc += sel.qty * price;
      if (sel.waiver) calc += sel.qty * (cat.damage_waiver || 0);
    });
    setTotal(calc);
    
    // Auto-update custom amount default if user hasn't typed yet
    if (!useCustomAmount) {
        setCustomAmount(calc);
    }
  }, [selections, goggles, bandannas, pricingCategories, durationHours, useCustomAmount]);

  // --- Update Handler ---
  const handleUpdate = async (paymentToken: string | null) => {
    setLoading(true);
    setMessage(paymentToken ? (paymentType === 'deposit' ? 'Authorizing Deposit...' : 'Processing Payment...') : 'Updating Reservation...');

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

    const transactionAmount = useCustomAmount ? customAmount : total;
    const orderIdOverride = paymentType === 'deposit' 
        ? `deposit_${initialData.reservation_id}` 
        : String(initialData.reservation_id);

    try {
        const res = await fetch('/api/pismo/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                reservation_id: initialData.reservation_id, 
                booking_id: initialData.id,
                total_amount: total, 
                
                payment_token: paymentToken,
                payment_amount: transactionAmount,
                transaction_type: paymentType === 'deposit' ? 'auth' : 'sale',
                order_id_override: orderIdOverride,

                holder: holderInfo,
                note: newNote, 
                booking: { 
                    date: selectedDate?.toISOString().split('T')[0],
                    startTime, endTime, duration: durationHours,
                    vehicles: vehiclesPayload, goggles, bandannas 
                }
            }),
        });

        const result = await res.json();
        if (result.success) {
            setMessage(paymentToken 
                ? (paymentType === 'deposit' ? 'Deposit Authorized!' : 'Payment Charged!')
                : 'Reservation Updated'
            );
            setTimeout(() => window.location.reload(), 800);
        } else {
            setMessage(`Failed: ${result.error}`);
        }
    } catch (err) {
        console.error(err);
        setMessage("Server Error during update.");
    } finally {
        setLoading(false);
    }
  };

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
    <div className="p-4 md:p-8 max-w-7xl mx-auto text-white pb-32 flex flex-col lg:flex-row gap-8">
      
      {/* LEFT COLUMN */}
      <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-700">
            <div>
              <Link href={`/biz/pismo/${initialData.booking_date}`} className="text-orange-400 hover:text-orange-300 mb-2 block">
                ← Back to Dashboard
              </Link>
              <h1 className="text-3xl font-bold">Res #{initialData.reservation_id}</h1>
              <span className="text-gray-400">Created {new Date(initialData.created_at).toLocaleDateString()}</span>
            </div>
            <div className="text-right">
              <span className={`block font-bold uppercase text-lg ${initialData.status === 'confirmed' ? 'text-green-400' : 'text-yellow-400'}`}>
                  {initialData.status}
              </span>
            </div>
          </div>

          <ReservationHolderForm initialData={holderInfo} onUpdate={(info: any) => setHolderInfo({...holderInfo, ...info})} />
          
          <DateTimeSelector 
              selectedDate={selectedDate} setSelectedDate={setSelectedDate}
              startTime={startTime} setStartTime={setStartTime}
              endTime={endTime} setEndTime={setEndTime}
              setDurationHours={setDurationHours} setPricingCategories={setPricingCategories}
              setLoading={setLoading} setMessage={setMessage} initialData={initialData}
          />

          <section className="mb-12 mt-8">
            <h2 className="text-xl font-bold text-orange-500 mb-4">Vehicles</h2>
            {pricingCategories && pricingCategories.length > 0 ? (
              <VehicleGrid categories={pricingCategories} selections={selections} setSelections={setSelections} durationHours={durationHours} />
            ) : (
              <div className="p-8 text-center bg-gray-800 rounded-xl border border-red-900/50 text-gray-400">
                {loading ? 'Loading...' : 'Select a time range to see vehicles.'}
              </div>
            )}
            <div className="mt-8 flex gap-8 justify-center bg-gray-800 p-6 rounded-xl border border-gray-700">
              <div className="text-center">
                  <label className="block mb-2 font-bold">Goggles</label>
                  <input type="number" min="0" value={goggles} onChange={e => setGoggles(Number(e.target.value))} className="w-24 bg-gray-700 p-3 rounded text-center text-xl outline-none" />
              </div>
              <div className="text-center">
                  <label className="block mb-2 font-bold">Bandannas</label>
                  <input type="number" min="0" value={bandannas} onChange={e => setBandannas(Number(e.target.value))} className="w-24 bg-gray-700 p-3 rounded text-center text-xl outline-none" />
              </div>
            </div>
          </section>

          <CheckoutForm 
            total={total} holderInfo={holderInfo} isExpanded={isCheckoutExpanded} setIsExpanded={setIsCheckoutExpanded}
            onPayment={handleUpdate} message={message} loading={loading} 
            selectedItems={selectedItemsList}
            goggles={goggles}
            bandannas={bandannas}
            
            // --- UPDATED STAFF PROPS ---
            userLevel={userLevel} // Pass the fetched level
            isEditing={true}      // Shows deposit toggle
            
            paymentType={paymentType}
            setPaymentType={setPaymentType}
            customAmount={customAmount}
            setCustomAmount={setCustomAmount}
            useCustomAmount={useCustomAmount}
            setUseCustomAmount={setUseCustomAmount}
          />
      </div>

      {/* RIGHT COLUMN */}
      <div className="w-full lg:w-96 space-y-8 flex-shrink-0">
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-xl">
              <h3 className="text-xl font-bold text-orange-400 mb-4 flex items-center gap-2">📝 Notes</h3>
              <div className="mb-4">
                  <textarea 
                      value={newNote}
                      onChange={e => setNewNote(e.target.value)}
                      placeholder="Type a new note here..."
                      className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-orange-500 min-h-[80px]"
                  />
                  <p className="text-xs text-gray-500 mt-1 text-right">Click "Update Reservation" to save.</p>
              </div>
              <div className="max-h-64 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                  {existingNotes.map((note: any) => (
                      <div key={note.id} className="bg-gray-900/50 p-3 rounded border border-gray-700 text-sm">
                          <p className="text-gray-200 whitespace-pre-wrap">{note.note_text}</p>
                          <div className="flex justify-between mt-2 text-xs text-gray-500">
                              <span>{note.author_name}</span>
                              <span>{new Date(note.created_at).toLocaleDateString()}</span>
                          </div>
                      </div>
                  ))}
              </div>
          </div>

          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-xl">
              <h3 className="text-xl font-bold text-blue-400 mb-4 flex items-center gap-2">🕒 Edit History</h3>
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                  <div className="relative pl-4 border-l-2 border-green-500/30">
                      <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-green-500"></div>
                      <p className="text-sm text-gray-300">Reservation Created</p>
                      <div className="text-xs text-gray-500 mt-1">
                          By {initialData.booked_by} • {new Date(initialData.created_at).toLocaleString()}
                      </div>
                  </div>
                  {logs.map((log: any) => (
                      <div key={log.id} className="relative pl-4 border-l-2 border-blue-500/30">
                          <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-blue-500"></div>
                          <p className="text-sm text-gray-300">{log.action_description}</p>
                          <div className="text-xs text-gray-500 mt-1">
                              By <span className="text-blue-300 font-semibold">{log.editor_name}</span> • {new Date(log.created_at).toLocaleString()}
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      </div>
    </div>
  );
}