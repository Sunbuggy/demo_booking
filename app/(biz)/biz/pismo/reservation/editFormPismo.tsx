'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client'; 
import { getUserDetails } from '@/utils/supabase/queries'; 
import { ChevronLeft, ClipboardList, History, Pencil } from 'lucide-react';

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
              map[item.pricing_category_id] = { qty: item.quantity, waiver: item.has_waiver };
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
    adults: initialData.adults || 1, 
    minors: initialData.minors || 0, 
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
  const [depositTotal, setDepositTotal] = useState<number>(0);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isCheckoutExpanded, setIsCheckoutExpanded] = useState(false);

  const [userLevel, setUserLevel] = useState(0); 
  const [paymentType, setPaymentType] = useState<'deposit' | 'payment'>('deposit');
  const [useCustomAmount, setUseCustomAmount] = useState(false);
  const [customAmount, setCustomAmount] = useState(0);

  useEffect(() => {
    const fetchUser = async () => {
        const supabase = createClient();
        const details = await getUserDetails(supabase);
        if (details && details.length > 0) setUserLevel(details[0].user_level || 0);
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (!pricingCategories.length) return;
    
    let rentalCalc = goggles * 4 + bandannas * 5;
    let depositCalc = 0;

    pricingCategories.forEach(cat => {
      const sel = selections[cat.id] || { qty: 0, waiver: false };
      const priceKey = durationHours ? `price_${durationHours}hr` : 'price_1hr';
      const price = cat[priceKey] !== undefined ? cat[priceKey] : (cat.price_1hr || 0);
      
      rentalCalc += sel.qty * price;
      if (sel.waiver) rentalCalc += sel.qty * (cat.damage_waiver || 0);
      depositCalc += sel.qty * (cat.deposit || 0);
    });

    setTotal(rentalCalc);
    setDepositTotal(depositCalc);
    
    if (!useCustomAmount) {
        setCustomAmount(paymentType === 'deposit' ? depositCalc : rentalCalc);
    }
  }, [selections, goggles, bandannas, pricingCategories, durationHours, useCustomAmount, paymentType]);

  const handleUpdate = async (paymentToken: string | null, captureDeposit: boolean = false, captureAmountOverride?: number) => {
    setLoading(true);
    
    if (captureDeposit) setMessage('Capturing Deposit...');
    else if (paymentToken) setMessage('Processing Transaction...');
    else setMessage('Updating Reservation...');

    const vehiclesPayload: Record<string, any> = {};
    pricingCategories.forEach(cat => {
        const sel = selections[cat.id];
        if (sel && sel.qty > 0) {
            const priceKey = durationHours ? `price_${durationHours}hr` : 'price_1hr';
            vehiclesPayload[cat.id] = {
                qty: sel.qty, waiver: sel.waiver, name: cat.vehicle_name, price: cat[priceKey] || 0 
            };
        }
    });

    let transactionAmount = 0;
    if (captureDeposit && captureAmountOverride !== undefined) {
        transactionAmount = captureAmountOverride;
    } else {
        const baseAmount = paymentType === 'deposit' ? depositTotal : total;
        transactionAmount = useCustomAmount ? customAmount : baseAmount;
    }

    const orderIdOverride = paymentType === 'deposit' ? `Deposit_${initialData.reservation_id}` : String(initialData.reservation_id);

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
                
                capture_deposit: captureDeposit,
                existing_transaction_id: initialData.transaction_id,

                holder: holderInfo,
                note: newNote, 
                booking: { 
                    date: selectedDate?.toISOString().split('T')[0],
                    startTime, 
                    endTime, 
                    duration: durationHours, // Passing Duration explicitly
                    vehicles: vehiclesPayload, goggles, bandannas 
                }
            }),
        });

        const result = await res.json();
        if (result.success) {
            setMessage('Success! Refreshing...');
            setTimeout(() => window.location.reload(), 800);
        } else {
            setMessage(`Failed: ${result.error}`);
        }
    } catch (err) {
        console.error(err);
        setMessage("Server Error.");
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
        return { id: cat.id, name: cat.vehicle_name, qty: selections[cat.id].qty, waiver: selections[cat.id].waiver, price: (basePrice + waiverPrice) * selections[cat.id].qty };
    });

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8 flex flex-col lg:flex-row gap-8">
      <div className="flex-1 min-w-0 max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8 pb-6 border-b border-border">
            <div>
              <Link href={`/biz/pismo/${initialData.booking_date}`} className="text-primary hover:text-primary/80 mb-2 block flex items-center gap-1 transition-colors"><ChevronLeft className="w-4 h-4" /> Back to Dashboard</Link>
              <h1 className="text-3xl font-bold text-foreground">Res #{initialData.reservation_id}</h1>
              <span className="text-muted-foreground text-sm">Created {new Date(initialData.created_at).toLocaleDateString()}</span>
            </div>
            <div className="text-right">
              <span className={`block font-bold uppercase text-lg px-3 py-1 rounded border ${initialData.status === 'confirmed' ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20' : 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20'}`}>{initialData.status}</span>
            </div>
          </div>
          <ReservationHolderForm initialData={holderInfo} onUpdate={(info: any) => setHolderInfo({...holderInfo, ...info})} />
          
          <DateTimeSelector 
              selectedDate={selectedDate} setSelectedDate={setSelectedDate}
              startTime={startTime} setStartTime={setStartTime}
              endTime={endTime} setEndTime={setEndTime}
              durationHours={durationHours} setDurationHours={setDurationHours} // Pass Duration Props
              setPricingCategories={setPricingCategories}
              setLoading={setLoading} setMessage={setMessage} initialData={initialData}
          />

          <section className="mb-12 mt-8">
            <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2"><Pencil className="w-5 h-5" /> Vehicles & Extras</h2>
            {pricingCategories.length > 0 ? <VehicleGrid categories={pricingCategories} selections={selections} setSelections={setSelections} durationHours={durationHours} /> : <div className="p-8 text-center bg-card rounded-xl text-muted-foreground border border-border">Loading...</div>}
            <div className="mt-8 flex gap-8 justify-center bg-card p-6 rounded-xl border border-border shadow-sm text-card-foreground">
              <div className="text-center"><label className="block mb-2 font-bold text-foreground">Goggles</label><input type="number" min="0" value={goggles} onChange={e => setGoggles(Number(e.target.value))} className="w-24 bg-background border border-input p-3 rounded text-center text-xl outline-none focus:ring-2 focus:ring-ring text-foreground" /></div>
              <div className="text-center"><label className="block mb-2 font-bold text-foreground">Bandannas</label><input type="number" min="0" value={bandannas} onChange={e => setBandannas(Number(e.target.value))} className="w-24 bg-background border border-input p-3 rounded text-center text-xl outline-none focus:ring-2 focus:ring-ring text-foreground" /></div>
            </div>
          </section>

          <CheckoutForm 
            total={total} depositTotal={depositTotal} holderInfo={holderInfo} 
            isExpanded={isCheckoutExpanded} setIsExpanded={setIsCheckoutExpanded} onPayment={handleUpdate} 
            message={message} loading={loading} selectedItems={selectedItemsList} goggles={goggles} bandannas={bandannas}
            userLevel={userLevel} isEditing={true} paymentType={paymentType} setPaymentType={setPaymentType}
            customAmount={customAmount} setCustomAmount={setCustomAmount} useCustomAmount={useCustomAmount} setUseCustomAmount={setUseCustomAmount}
            duration={durationHours || 0}
            startTime={startTime}
            existingTransactionId={initialData.transaction_id}
          />
      </div>

      <div className="w-full lg:w-96 space-y-8 flex-shrink-0">
          <div className="bg-card text-card-foreground p-6 rounded-xl border border-border shadow-md">
              <h3 className="text-xl font-bold text-primary mb-4 flex items-center gap-2"><ClipboardList className="w-5 h-5" /> Notes</h3>
              <textarea value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Type note here..." className="w-full bg-background border border-input rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[80px] text-foreground placeholder:text-muted-foreground" />
              <div className="max-h-64 overflow-y-auto space-y-3 pr-2 mt-4 custom-scrollbar">
                  {existingNotes.map((note: any) => (<div key={note.id} className="bg-muted/50 p-3 rounded border border-border text-sm"><p className="text-foreground">{note.note_text}</p><div className="flex justify-between mt-2 text-xs text-muted-foreground"><span>{note.author_name}</span><span suppressHydrationWarning>{new Date(note.created_at).toLocaleDateString()}</span></div></div>))}
              </div>
          </div>
          <div className="bg-card text-card-foreground p-6 rounded-xl border border-border shadow-md">
              <h3 className="text-xl font-bold text-primary mb-4 flex items-center gap-2"><History className="w-5 h-5" /> Edit History</h3>
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                  {logs.map((log: any) => (<div key={log.id} className="relative pl-4 border-l-2 border-primary/30"><div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-primary"></div><p className="text-sm text-foreground">{log.action_description}</p><div className="text-xs text-muted-foreground mt-1"><span className="text-primary font-medium">{log.editor_name}</span> • <span suppressHydrationWarning>{new Date(log.created_at).toLocaleString()}</span></div></div>))}
              </div>
          </div>
      </div>
    </div>
  );
}