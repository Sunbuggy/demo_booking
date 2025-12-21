'use client';

import { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { createClient } from '@/utils/supabase/client';

const TYPE_ORDER = {
  ATV: 1,
  UTV: 2,
  Buggy: 3,
};

export default function PismoBooking() {
  // === Core Booking State ===
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [startTime, setStartTime] = useState<string>('');
  const [possibleEndTimes, setPossibleEndTimes] = useState<string[]>([]);
  const [endTime, setEndTime] = useState<string>('');
  const [durationHours, setDurationHours] = useState<number | null>(null);
  const [pricingCategories, setPricingCategories] = useState<any[]>([]);
  const [selections, setSelections] = useState<Record<string, { qty: number; waiver: boolean }>>({});
  const [goggles, setGoggles] = useState<number>(0);
  const [bandannas, setBandannas] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [collectLoaded, setCollectLoaded] = useState(false);

  // === Reservation Holder ===
  const [user, setUser] = useState<any>(null);
  const [isAuthorizedToBookForOthers, setIsAuthorizedToBookForOthers] = useState(false);
  const [bookingForSelf, setBookingForSelf] = useState(true);
  const [holderFirstName, setHolderFirstName] = useState('');
  const [holderLastName, setHolderLastName] = useState('');
  const [holderEmail, setHolderEmail] = useState('');
  const [holderPhone, setHolderPhone] = useState('');

  // === Cardholder ===
  const [useHolderInfo, setUseHolderInfo] = useState(true);
  const [cardFirstName, setCardFirstName] = useState('');
  const [cardLastName, setCardLastName] = useState('');
  const [cardEmail, setCardEmail] = useState('');

  // === Cart Mode: false = minimized summary, true = expanded checkout with waiver ===
  const [isCheckoutExpanded, setIsCheckoutExpanded] = useState(false);

  // === Liability Waiver (only relevant in expanded mode) ===
  const [agreedToWaiver, setAgreedToWaiver] = useState(false);

  // === NMI Collect.js (PCI Compliant) ===
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://secure.networkmerchants.com/token/Collect.js';
    script.setAttribute('data-tokenization-key', process.env.NEXT_PUBLIC_NMI_TOKENIZATION_KEY!);
    script.async = true;

    script.onload = () => {
      if ((window as any).CollectJS) {
        (window as any).CollectJS.configure({
          variant: 'inline',
          fields: {
            ccnumber: { selector: '#cc-number' },
            ccexp: { selector: '#cc-exp' },
            cvv: { selector: '#cc-cvv' },
          },
          style: {
            'background-color': '#1f2937',
            'color': '#fff',
            'padding': '16px',
            'font-size': '18px',
            'border-radius': '8px',
          },
          callback: (response: { token: string }) => handlePayment(response.token),
        });
        setCollectLoaded(true);
      }
    };

    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) document.body.removeChild(script);
    };
  }, []);

  const handlePayment = async (token: string) => {
    if (!token) return setMessage('Invalid payment token.');

    setMessage('Processing payment...');
    setLoading(true);

    const res = await fetch('/api/pismo/charge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        payment_token: token,
        amount: total * 100,
        holder: { first_name: holderFirstName, last_name: holderLastName, email: holderEmail, phone: holderPhone },
        cardholder: { first_name: cardFirstName, last_name: cardLastName, email: cardEmail },
        booking: {
          date: selectedDate?.toISOString().split('T')[0],
          startTime,
          endTime,
          duration: durationHours,
          vehicles: selections,
          goggles,
          bandannas,
        },
      }),
    });

    const result = await res.json();
    setMessage(result.success ? `Booking confirmed! ID: ${result.transaction_id}` : `Payment failed: ${result.error || 'Try again.'}`);
    setLoading(false);
  };

  const startPayment = () => {
    if (total <= 0) return setMessage('Select vehicles/add-ons first.');
    if (!holderFirstName || !holderLastName || !holderEmail || !holderPhone)
      return setMessage('Complete reservation holder info.');
    if (!cardFirstName || !cardLastName || !cardEmail)
      return setMessage('Complete cardholder info.');
    if (!agreedToWaiver) return setMessage('You must agree to the liability waiver.');
    if (!collectLoaded) return setMessage('Payment form loading...');
    (window as any).CollectJS.startPaymentRequest();
  };

  // === Auth & Auto-Fill ===
  useEffect(() => {
    const supabase = createClient();

    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        setUser(user);

        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, phone, user_level')
          .eq('id', user.id)
          .single();

        let firstName = '';
        let lastName = '';

        if (profile?.full_name) {
          const parts = profile.full_name.trim().split(' ');
          firstName = parts[0] || '';
          lastName = parts.slice(1).join(' ') || '';
        } else if (user.email) {
          const emailPart = user.email.split('@')[0].replace(/[\d._-]/g, ' ');
          const parts = emailPart.trim().split(' ');
          firstName = parts[0] || '';
          lastName = parts.slice(1).join(' ') || '';
        }

        setHolderFirstName(firstName);
        setHolderLastName(lastName);
        setHolderEmail(user.email || '');
        setHolderPhone(profile?.phone || '');
        setIsAuthorizedToBookForOthers((profile?.user_level || 0) >= 300);
        setBookingForSelf(true);

        setCardFirstName(firstName);
        setCardLastName(lastName);
        setCardEmail(user.email || '');
      }
    };

    fetchUser();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchUser();
      else {
        setHolderFirstName('');
        setHolderLastName('');
        setHolderEmail('');
        setHolderPhone('');
        setIsAuthorizedToBookForOthers(false);
        setBookingForSelf(true);
        setCardFirstName('');
        setCardLastName('');
        setCardEmail('');
      }
    });

    return () => listener?.subscription.unsubscribe();
  }, []);

  // === Sync Cardholder ===
  useEffect(() => {
    if (useHolderInfo) {
      setCardFirstName(holderFirstName);
      setCardLastName(holderLastName);
      setCardEmail(holderEmail);
    }
  }, [useHolderInfo, holderFirstName, holderLastName, holderEmail]);

  // === Availability & Pricing ===
  useEffect(() => {
    if (!selectedDate) {
      setAvailableTimes([]);
      setPricingCategories([]);
      return;
    }

    const fetchTimes = async () => {
      setLoading(true);
      const dateStr = selectedDate.toISOString().split('T')[0];
      const res = await fetch(`/api/pismo/times?date=${dateStr}`);
      if (res.ok) {
        const data = await res.json();
        setAvailableTimes(data.startTimes || []);
      }
      setLoading(false);
    };

    fetchTimes();
  }, [selectedDate]);

  useEffect(() => {
    if (!startTime) {
      setPossibleEndTimes([]);
      return;
    }

    const ends: string[] = [];
    const match = startTime.match(/(\d+):(\d+) (\w+)/);
    if (!match) return;

    let hours = parseInt(match[1]);
    const period = match[3].toUpperCase();
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;

    for (let i = 1; i <= 4; i++) {
      let endHour = hours + i;
      let endPeriod = period;
      if (endHour >= 24) endHour -= 24;
      if (endHour >= 12) {
        if (endHour > 12) endHour -= 12;
        endPeriod = period === 'AM' ? 'PM' : 'AM';
      }
      ends.push(`${endHour.toString().padStart(2, '0')}:00 ${endPeriod}`);
    }

    setPossibleEndTimes(ends);
  }, [startTime]);

  useEffect(() => {
    if (!endTime || !selectedDate) {
      setPricingCategories([]);
      setDurationHours(null);
      return;
    }

    const calculateDuration = () => {
      const startMatch = startTime.match(/(\d+):(\d+) (\w+)/);
      const endMatch = endTime.match(/(\d+):(\d+) (\w+)/);
      if (!startMatch || !endMatch) return null;

      let startH = parseInt(startMatch[1]);
      if (startMatch[3] === 'PM' && startH !== 12) startH += 12;
      if (startMatch[3] === 'AM' && startH === 12) startH = 0;

      let endH = parseInt(endMatch[1]);
      if (endMatch[3] === 'PM' && endH !== 12) endH += 12;
      if (endMatch[3] === 'AM' && endH === 12) endH = 0;

      let hours = endH - startH;
      if (hours <= 0) hours += 24;
      return hours;
    };

    const hours = calculateDuration();
    setDurationHours(hours);

    const fetchPricing = async () => {
      setLoading(true);
      const dateStr = selectedDate.toISOString().split('T')[0];
      const res = await fetch(`/api/pismo/pricing?date=${dateStr}&start=${startTime}&end=${endTime}`);
      if (res.ok) {
        const data = await res.json();
        const sorted = data.sort((a: any, b: any) => (a.sort_order || 100) - (b.sort_order || 100));
        setPricingCategories(sorted);
      } else {
        setMessage('No vehicles available');
      }
      setLoading(false);
    };

    fetchPricing();
  }, [endTime, selectedDate, startTime]);

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

  const updateSelection = (catId: string, qty: number, waiver: boolean) => {
    setSelections(prev => ({ ...prev, [catId]: { qty, waiver } }));
  };

  const selectedItems = pricingCategories
    .filter(cat => selections[cat.id]?.qty > 0)
    .map(cat => ({
      id: cat.id,
      name: cat.vehicle_name,
      qty: selections[cat.id].qty,
      waiver: selections[cat.id].waiver,
      waiverCost: selections[cat.id].waiver ? (cat.damage_waiver || 0) * selections[cat.id].qty : 0,
      price: (durationHours ? cat[`price_${durationHours}hr`] : cat.price_1hr) * selections[cat.id].qty,
    }));

  const totalSeats = selectedItems.reduce((sum, item) => sum + item.qty * (pricingCategories.find(c => c.id === item.id)?.seats || 1), 0);
  const totalItemsCount = selectedItems.length + (goggles > 0 ? 1 : 0) + (bandannas > 0 ? 1 : 0);

  const grouped = pricingCategories.reduce((acc, cat) => {
    const type = cat.type_vehicle || 'Other';
    if (!acc[type]) acc[type] = [];
    acc[type].push(cat);
    return acc;
  }, {} as Record<string, any[]>);

  const sortedTypes = Object.keys(grouped).sort((a, b) => (TYPE_ORDER[a as keyof typeof TYPE_ORDER] || 99) - (TYPE_ORDER[b as keyof typeof TYPE_ORDER] || 99));

  // === Progress Indicator Logic ===
  const isStep1Complete = !!endTime && !!durationHours;
  const isStep2Complete = total > 0;
  const isStep3Active = isCheckoutExpanded;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 pb-64 md:p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-8 text-orange-500">
          Pismo Beach Hourly Rentals
        </h1>

        {/* === PROGRESS INDICATOR === */}
        <div className="sticky top-16 z-40 bg-gray-900 py-4 mb-8 shadow-md border-b border-gray-800 overflow-x-auto">
          <div className="flex flex-col items-center min-w-max mx-auto">
            <div className="flex items-center justify-center gap-4 md:gap-8">
              {/* Step 1: Date & Time */}
              <div className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold transition-all ${
                  isStep1Complete ? 'bg-orange-600 text-white' : 'bg-gray-700 text-gray-400'
                }`}>
                  {isStep1Complete ? '✓' : '1'}
                </div>
                <span className={`ml-2 text-md hidden md:block ${isStep1Complete ? 'text-orange-400' : 'text-gray-500'}`}>
                  Date & Time
                </span>
              </div>

              <div className={`w-12 h-1 mx-1 transition-all ${isStep1Complete ? 'bg-orange-600' : 'bg-gray-700'}`} />

              {/* Step 2: Select Vehicles */}
              <div className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold transition-all ${
                  isStep2Complete ? 'bg-orange-600 text-white' : 'bg-gray-700 text-gray-400'
                }`}>
                  {isStep2Complete ? '✓' : '2'}
                </div>
                <span className={`ml-2 text-md hidden md:block ${isStep2Complete ? 'text-orange-400' : 'text-gray-500'}`}>
                  Vehicles
                </span>
              </div>

              <div className={`w-12 h-1 mx-1 transition-all ${isStep2Complete ? 'bg-orange-600' : 'bg-gray-700'}`} />

              {/* Step 3: Checkout */}
              <div className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold transition-all ${
                  isStep3Active ? 'bg-orange-600 text-white' : 'bg-gray-700 text-gray-400'
                }`}>
                  3
                </div>
                <span className={`ml-2 text-md hidden md:block ${isStep3Active ? 'text-orange-400' : 'text-gray-500'}`}>
                  Checkout
                </span>
              </div>
            </div>

            {/* Mobile labels - spaced to align with steps */}
            <div className="flex justify-around w-full mt-2 text-xs text-gray-400 md:hidden">
              <span className="text-center flex-1">Date & Time</span>
              <span className="text-center flex-1">Vehicles</span>
              <span className="text-center flex-1">Checkout</span>
            </div>
          </div>
        </div>

        {/* Reservation Holder */}
        <section className="bg-gray-800 rounded-2xl p-6 md:p-8 mb-12 shadow-xl">
          <h2 className="text-2xl md:text-3xl font-bold mb-6 text-orange-500 text-center">
            Reservation Holder
            {user && (holderFirstName || holderLastName) && (
              <span className="block text-lg md:text-xl mt-2 text-gray-300">
                Booking for: {holderFirstName} {holderLastName} ({holderEmail})
              </span>
            )}
          </h2>

          {isAuthorizedToBookForOthers && (
            <div className="mb-8 flex justify-center">
              <button
                type="button"
                onClick={() => {
                  const newSelf = !bookingForSelf;
                  setBookingForSelf(newSelf);
                  if (!newSelf) {
                    setHolderFirstName('');
                    setHolderLastName('');
                    setHolderEmail('');
                    setHolderPhone('');
                  } else {
                    const supabase = createClient();
                    supabase.auth.getUser().then(async ({ data }) => {
                      if (data.user) {
                        const { data: profile } = await supabase
                          .from('profiles')
                          .select('full_name, phone')
                          .eq('id', data.user.id)
                          .single();
                        let firstName = '';
                        let lastName = '';
                        if (profile?.full_name) {
                          const parts = profile.full_name.trim().split(' ');
                          firstName = parts[0] || '';
                          lastName = parts.slice(1).join(' ') || '';
                        }
                        setHolderFirstName(firstName);
                        setHolderLastName(lastName);
                        setHolderEmail(data.user.email || '');
                        setHolderPhone(profile?.phone || '');
                      }
                    });
                  }
                }}
                className="relative inline-flex items-center h-12 md:h-14 rounded-full w-80 md:w-96 bg-gray-700 px-3 focus:outline-none"
              >
                <span className={`absolute left-5 text-base md:text-lg ${bookingForSelf ? 'text-white font-bold' : 'text-gray-400'}`}>
                  Booking for me
                </span>
                <span className={`absolute right-5 text-base md:text-lg ${!bookingForSelf ? 'text-white font-bold' : 'text-gray-400'}`}>
                  Someone else
                </span>
                <span
                  className={`inline-block w-36 md:w-44 h-10 md:h-12 rounded-full bg-orange-600 transform transition-transform duration-300 ${
                    bookingForSelf ? 'translate-x-1' : 'translate-x-36 md:translate-x-44'
                  }`}
                />
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 max-w-3xl mx-auto">
            <input type="text" placeholder="First Name *" value={holderFirstName} onChange={e => setHolderFirstName(e.target.value)} disabled={bookingForSelf && !isAuthorizedToBookForOthers} className="p-4 bg-gray-700 rounded-lg text-lg md:text-xl disabled:opacity-60" required />
            <input type="text" placeholder="Last Name *" value={holderLastName} onChange={e => setHolderLastName(e.target.value)} disabled={bookingForSelf && !isAuthorizedToBookForOthers} className="p-4 bg-gray-700 rounded-lg text-lg md:text-xl disabled:opacity-60" required />
            <input type="email" placeholder="Email *" value={holderEmail} onChange={e => setHolderEmail(e.target.value)} disabled={bookingForSelf && !isAuthorizedToBookForOthers} className="md:col-span-2 p-4 bg-gray-700 rounded-lg text-lg md:text-xl disabled:opacity-60" required />
            <input type="tel" placeholder="Phone *" value={holderPhone} onChange={e => setHolderPhone(e.target.value)} disabled={bookingForSelf && !isAuthorizedToBookForOthers} className="md:col-span-2 p-4 bg-gray-700 rounded-lg text-lg md:text-xl disabled:opacity-60" required />
          </div>

          <p className="text-center text-gray-400 mt-6 text-sm">
            We'll send your confirmation, receipt, and ride details to this email and phone.
          </p>
        </section>

        {/* Date Picker */}
        <section className="text-center mb-12">
          <label className="text-2xl block mb-4">1. Choose Reservation Date</label>
          <DatePicker
            selected={selectedDate}
            // ✅ PASSES: Accepts Date or null, and only updates state if date exists
onChange={(date: Date | null) => {
  if (date) setSelectedDate(date);
}}
            minDate={new Date()}
            className="p-4 text-black text-xl rounded-lg cursor-pointer w-full max-w-xs"
            placeholderText="Click to select date"
          />
        </section>

        {/* Start Time */}
        {availableTimes.length > 0 && (
          <section className="text-center mb-12">
            <label className="text-2xl block mb-4">2. Choose Start Time</label>
            <select
              value={startTime}
              onChange={e => {
                setStartTime(e.target.value);
                setEndTime('');
                setDurationHours(null);
                setPricingCategories([]);
                setSelections({});
              }}
              className="p-4 bg-gray-800 rounded-lg w-full max-w-md mx-auto text-xl"
            >
              <option value="">Select start time</option>
              {availableTimes.map(time => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
          </section>
        )}

        {/* End Time */}
        {startTime && possibleEndTimes.length > 0 && (
          <section className="text-center mb-12">
            <label className="text-2xl block mb-4">3. Choose End Time</label>
            <select
              value={endTime}
              onChange={e => setEndTime(e.target.value)}
              className="p-4 bg-gray-800 rounded-lg w-full max-w-md mx-auto text-xl"
            >
              <option value="">Select end time</option>
              {possibleEndTimes.map(time => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
            {durationHours && (
              <p className="text-xl mt-8 text-orange-400">
                Duration: <strong>{durationHours} hour{durationHours > 1 ? 's' : ''}</strong>
              </p>
            )}
          </section>
        )}

        {loading && <p className="text-center text-2xl text-orange-400 mb-12">Loading vehicles...</p>}

        {/* Vehicles */}
{pricingCategories.length > 0 && (
  <section className="mb-12">
    <h2 className="text-3xl md:text-4xl font-bold text-center mb-10">4. Select Vehicles</h2>
    {sortedTypes.map(type => (
      <div key={type} className="mb-12">
        <h3 className="text-2xl md:text-3xl font-bold text-orange-400 mb-6 text-center">
          {type === 'Buggy' ? 'Buggies' : type + 's'}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {/* FIX APPLIED HERE: Added (cat: any) */}
          {grouped[type].map((cat: any) => {
            const priceKey = durationHours ? `price_${durationHours}hr` : 'price_1hr';
            const price = cat[priceKey] || 0;
            const seats = cat.seats || 1;
            return (
              <div key={cat.id} className="bg-gray-800 p-6 md:p-8 rounded-2xl shadow-xl flex flex-col">
                {/* ... rest of your card code ... */}
                        {/* Title with fixed min-height to align across cards (accommodates up to 2 lines) */}
                        <h4 className="text-2xl md:text-3xl font-bold mb-2 min-h-[3.5rem] flex items-center justify-center text-center">
                          {cat.vehicle_name}
                        </h4>
                        {/* Price with fixed min-height for alignment */}
                        <p className="text-xl md:text-2xl mb-4 min-h-[3rem] flex flex-col justify-center text-center">
                          ${price} / {durationHours || 1}hr
                          <span className="block text-sm text-gray-400 mt-1">
                            Seats {seats}
                          </span>
                        </p>
                        {/* Inputs section - takes remaining space */}
                        <div className="space-y-6 mt-auto">
                          <div>
                            <label className="text-lg md:text-xl block mb-2">Quantity</label>
                            <input
                              type="number"
                              min="0"
                              max={10}
                              value={selections[cat.id]?.qty || 0}
                              onChange={e => updateSelection(cat.id, parseInt(e.target.value) || 0, selections[cat.id]?.waiver || false)}
                              className="p-3 md:p-4 bg-gray-700 rounded w-full text-lg md:text-xl"
                            />
                          </div>
                          <label className="flex items-center text-lg md:text-xl">
                            <input
                              type="checkbox"
                              checked={selections[cat.id]?.waiver || false}
                              onChange={e => updateSelection(cat.id, selections[cat.id]?.qty || 0, e.target.checked)}
                              className="mr-4 w-5 h-5 md:w-6 md:h-6"
                            />
                            Add Damage Waiver (${cat.damage_waiver || 0}/unit)
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Optional Extras */}
        <section className="bg-gray-800 rounded-2xl p-6 md:p-8 mb-12 shadow-xl">
          <h2 className="text-3xl font-bold text-center mb-8 text-orange-500">Optional Extras</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            <div className="text-center">
              <label className="text-2xl block mb-4">Goggles ($4 each)</label>
              <input
                type="number"
                min="0"
                value={goggles}
                onChange={e => setGoggles(parseInt(e.target.value) || 0)}
                className="p-4 bg-gray-700 rounded w-32 text-xl"
              />
            </div>
            <div className="text-center">
              <label className="text-2xl block mb-4">Bandannas ($5 each)</label>
              <input
                type="number"
                min="0"
                value={bandannas}
                onChange={e => setBandannas(parseInt(e.target.value) || 0)}
                className="p-4 bg-gray-700 rounded w-32 text-xl"
              />
            </div>
          </div>
        </section>

        {/* Extra space for floating cart */}
        <div className="h-96" />
      </div>

      {/* Floating Cart */}
      {selectedItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 md:left-1/2 md:-translate-x-1/2 md:max-w-3xl md:bottom-4">
          <div className="bg-gray-800 border-t-4 border-orange-600 md:border-4 md:rounded-2xl shadow-2xl">
            {/* Minimized Summary Bar */}
            {!isCheckoutExpanded ? (
              <div
                onClick={() => setIsCheckoutExpanded(true)}
                className="flex justify-between items-center p-5 cursor-pointer hover:bg-gray-700/50 transition"
              >
                <div>
                  <span className="text-lg font-semibold">
                    {totalSeats} seat{totalSeats !== 1 ? 's' : ''}
                  </span>
                  <span className="text-gray-400 ml-3">
                    {totalItemsCount} item{totalItemsCount !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">${total.toFixed(2)}</div>
                  <div className="text-sm text-orange-400">Tap to Review & Checkout ↓</div>
                </div>
              </div>
            ) : (
              /* Expanded Checkout */
              <div className="p-5 md:p-6 max-h-[85vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold">Your Selection</h3>
                  <button
                    onClick={() => {
                      setIsCheckoutExpanded(false);
                      setAgreedToWaiver(false);
                    }}
                    className="text-orange-400 hover:text-orange-300 underline text-sm"
                  >
                    Edit Selection ↑
                  </button>
                </div>

                <div className="space-y-3 text-sm mb-4 border-b border-gray-700 pb-4">
                  {selectedItems.map(item => (
                    <div key={item.id} className="flex flex-col">
                      <div className="flex justify-between">
                        <span>{item.qty}× {item.name}</span>
                        <span>${item.price.toFixed(2)}</span>
                      </div>
                      {item.waiver && (
                        <div className="text-sm text-orange-300 ml-4">
                          + Damage Waiver (${item.waiverCost.toFixed(2)})
                        </div>
                      )}
                    </div>
                  ))}
                  {goggles > 0 && (
                    <div className="flex justify-between">
                      <span>Goggles × {goggles}</span>
                      <span>${(goggles * 4).toFixed(2)}</span>
                    </div>
                  )}
                  {bandannas > 0 && (
                    <div className="flex justify-between">
                      <span>Bandannas × {bandannas}</span>
                      <span>${(bandannas * 5).toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between text-lg font-bold mb-6">
                  <span>Total:</span>
                  <span>${total.toFixed(2)}</span>
                </div>

                {/* Liability Waiver */}
                <div className="bg-red-900/30 border-2 border-red-600 rounded-xl p-4 mb-6">
                  <label className="flex items-start gap-4 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreedToWaiver}
                      onChange={(e) => setAgreedToWaiver(e.target.checked)}
                      className="mt-1 w-6 h-6 text-orange-600 shrink-0"
                    />
                    <span className="text-sm leading-relaxed">
                      I understand that off-road vehicle driving can be inherently dangerous and involves risk of injury or death. 
                      I agree to participate at my own risk and assume full responsibility for any injury or damage that may occur.
                    </span>
                  </label>
                </div>

                {/* Payment Form — only after waiver */}
                {agreedToWaiver && (
                  <div className="space-y-5">
                    <div className="text-center">
                      <label className="flex items-center justify-center gap-3 text-sm">
                        <input
                          type="checkbox"
                          checked={useHolderInfo}
                          onChange={(e) => setUseHolderInfo(e.target.checked)}
                          className="w-5 h-5"
                        />
                        Cardholder same as reservation holder
                      </label>
                    </div>

                    {!useHolderInfo && (
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <input
                          placeholder="First Name *"
                          value={cardFirstName}
                          onChange={(e) => setCardFirstName(e.target.value)}
                          className="p-3 bg-gray-700 rounded"
                        />
                        <input
                          placeholder="Last Name *"
                          value={cardLastName}
                          onChange={(e) => setCardLastName(e.target.value)}
                          className="p-3 bg-gray-700 rounded"
                        />
                        <input
                          placeholder="Email *"
                          value={cardEmail}
                          onChange={(e) => setCardEmail(e.target.value)}
                          className="col-span-2 p-3 bg-gray-700 rounded"
                        />
                      </div>
                    )}

                    <div className="space-y-4">
                      <div id="cc-number" className="p-5 bg-gray-900 rounded-lg border border-gray-600"></div>
                      <div className="grid grid-cols-2 gap-4">
                        <div id="cc-exp" className="p-5 bg-gray-900 rounded-lg border border-gray-600"></div>
                        <div id="cc-cvv" className="p-5 bg-gray-900 rounded-lg border border-gray-600"></div>
                      </div>
                    </div>

                    {message && (
                      <p className={`text-center text-sm font-medium ${message.includes('confirmed') ? 'text-green-400' : 'text-red-400'}`}>
                        {message}
                      </p>
                    )}

                    <button
                      onClick={startPayment}
                      disabled={loading || !collectLoaded}
                      className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-50 py-5 text-2xl font-bold rounded-xl shadow-lg transition"
                    >
                      {loading ? 'Processing...' : `Pay $${total.toFixed(2)} & Book Now`}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}