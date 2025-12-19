// app/pismo/book/page.tsx - Floating Summary Cart (Centered Card) + Checkout Scrolls In Below

'use client';

import { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const TYPE_ORDER = {
  ATV: 1,
  UTV: 2,
  Buggy: 3,
};

export default function PismoBooking() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [startTime, setStartTime] = useState<string>('');
  const [possibleEndTimes, setPossibleEndTimes] = useState<string[]>([]);
  const [endTime, setEndTime] = useState<string>('');
  const [durationHours, setDurationHours] = useState<number | null>(null);
  const [pricingCategories, setPricingCategories] = useState<any[]>([]);
  const [selections, setSelections] = useState<Record<string, { qty: number; waiver: boolean }>>({});
  const [goggles, setGoggles] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [collectLoaded, setCollectLoaded] = useState(false);

  // NMI Collect.js (PCI compliant - hosted fields)
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
    if (!token) {
      setMessage('Invalid payment token.');
      return;
    }

    setMessage('Processing payment...');
    setLoading(true);

    const res = await fetch('/api/pismo/charge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        payment_token: token,
        amount: total * 100,
        booking: {
          date: selectedDate?.toISOString().split('T')[0],
          startTime,
          endTime,
          duration: durationHours,
          vehicles: selections,
          goggles,
        },
      }),
    });

    const result = await res.json();

    if (result.success) {
      setMessage(`Booking confirmed! Transaction ID: ${result.transaction_id}`);
    } else {
      setMessage(`Payment failed: ${result.error || 'Please try again.'}`);
    }
    setLoading(false);
  };

  const startPayment = () => {
    if (total <= 0) {
      setMessage('Please select vehicles or add-ons first.');
      return;
    }
    if (!collectLoaded) {
      setMessage('Payment form still loading...');
      return;
    }
    (window as any).CollectJS.startPaymentRequest();
  };

  // Fetch times
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

  // Generate end times
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

  // Fetch pricing
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

  // Selected items for cart
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

  // Total calculation
  useEffect(() => {
    let calc = goggles * 4;
    pricingCategories.forEach(cat => {
      const sel = selections[cat.id] || { qty: 0, waiver: false };
      const priceKey = durationHours ? `price_${durationHours}hr` : 'price_1hr';
      const price = cat[priceKey] || 0;
      calc += sel.qty * price;
      if (sel.waiver) calc += sel.qty * (cat.damage_waiver || 0);
    });
    setTotal(calc);
  }, [selections, goggles, pricingCategories, durationHours]);

  const updateSelection = (catId: string, qty: number, waiver: boolean) => {
    setSelections(prev => ({
      ...prev,
      [catId]: { qty, waiver },
    }));
  };

  // Group for headings
  const grouped = pricingCategories.reduce((acc, cat) => {
    const type = cat.type_vehicle || 'Other';
    if (!acc[type]) acc[type] = [];
    acc[type].push(cat);
    return acc;
  }, {} as Record<string, any[]>);

  const sortedTypes = Object.keys(grouped).sort((a, b) => (TYPE_ORDER[a] || 99) - (TYPE_ORDER[b] || 99));

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 pb-32"> {/* Padding for floating cart */}
      <div className="max-w-5xl mx-auto">
        <h1 className="text-5xl font-bold text-center mb-16 text-orange-500">
          Pismo Beach Hourly Rentals
        </h1>

        {/* 1. Choose Reservation Date */}
        <section className="text-center mb-16">
          <label className="text-2xl block mb-4">1. Choose Reservation Date</label>
          <DatePicker
            selected={selectedDate}
            onChange={(date: Date) => setSelectedDate(date)}
            minDate={new Date()}
            className="p-4 text-black text-xl rounded-lg cursor-pointer"
            placeholderText="Click to select date"
          />
        </section>

        {/* 2. Choose Start Time */}
        {availableTimes.length > 0 && (
          <section className="text-center mb-16">
            <label className="text-2xl block mb-4">2. Choose Start Time</label>
            <select
              value={startTime}
              onChange={(e) => {
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

        {/* 3. Choose End Time */}
        {startTime && possibleEndTimes.length > 0 && (
          <section className="text-center mb-16">
            <label className="text-2xl block mb-4">3. Choose End Time</label>
            <select
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
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

        {/* 4. Select Vehicles */}
        {pricingCategories.length > 0 && (
          <section className="mb-16">
            <h2 className="text-4xl font-bold text-center mb-12">4. Select Vehicles</h2>
            {sortedTypes.map(type => (
              <div key={type} className="mb-12">
                <h3 className="text-3xl font-bold text-orange-400 mb-8 text-center">
                  {type === 'Buggy' ? 'Buggies' : type + 's'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  {grouped[type].map(cat => {
                    const priceKey = durationHours ? `price_${durationHours}hr` : 'price_1hr';
                    const price = cat[priceKey] || 0;
                    return (
                      <div key={cat.id} className="bg-gray-800 p-8 rounded-2xl shadow-xl">
                        <h4 className="text-3xl font-bold mb-4">
                          {cat.vehicle_name} — ${price} / {durationHours || 1} hour{durationHours && durationHours > 1 ? 's' : ''}
                        </h4>
                        <div className="space-y-6">
                          <div>
                            <label className="text-xl block mb-2">
                              Quantity (Available: N/A)
                            </label>
                            <input
                              type="number"
                              min="0"
                              max={10}
                              value={selections[cat.id]?.qty || 0}
                              onChange={(e) => updateSelection(cat.id, parseInt(e.target.value) || 0, selections[cat.id]?.waiver || false)}
                              className="p-4 bg-gray-700 rounded w-32 text-xl"
                            />
                          </div>
                          <label className="flex items-center text-xl">
                            <input
                              type="checkbox"
                              checked={selections[cat.id]?.waiver || false}
                              onChange={(e) => updateSelection(cat.id, selections[cat.id]?.qty || 0, e.target.checked)}
                              className="mr-4 w-6 h-6"
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

        {/* 5. Goggles */}
        <section className="text-center mb-32"> {/* Extra margin so checkout appears below cart */}
          <label className="text-2xl block mb-4">Goggles ($4 each)</label>
          <input
            type="number"
            min="0"
            value={goggles}
            onChange={(e) => setGoggles(parseInt(e.target.value) || 0)}
            className="p-4 bg-gray-700 rounded w-32 text-xl"
          />
        </section>

        {/* Secure Checkout */}
        <section className="bg-gradient-to-br from-gray-800 to-gray-900 p-12 rounded-3xl shadow-2xl">
          <h2 className="text-4xl font-bold text-center mb-8">Secure Checkout</h2>
          <p className="text-center text-3xl mb-12">Total: ${total.toFixed(2)}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <input placeholder="First Name" className="p-4 bg-gray-700 rounded text-xl" required />
            <input placeholder="Last Name" className="p-4 bg-gray-700 rounded text-xl" required />
            <input placeholder="Email" type="email" className="md:col-span-2 p-4 bg-gray-700 rounded text-xl" required />
            <input placeholder="Phone" type="tel" className="md:col-span-2 p-4 bg-gray-700 rounded text-xl" />
          </div>

          <div className="space-y-8 mb-12">
            <div id="cc-number" className="p-6 bg-gray-800 rounded-lg border border-gray-600"></div>
            <div className="grid grid-cols-2 gap-8">
              <div id="cc-exp" className="p-6 bg-gray-800 rounded-lg border border-gray-600"></div>
              <div id="cc-cvv" className="p-6 bg-gray-800 rounded-lg border border-gray-600"></div>
            </div>
          </div>

          {message && (
            <p className={`text-center text-2xl mb-8 ${message.includes('confirmed') ? 'text-green-400' : 'text-red-400'}`}>
              {message}
            </p>
          )}

          <button
            onClick={startPayment}
            disabled={loading || total === 0}
            className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-50 py-8 text-4xl font-bold rounded-xl transition shadow-lg"
          >
            {loading ? 'Processing...' : `Pay $${total.toFixed(2)} & Book Now`}
          </button>
        </section>
      </div>

      {/* Floating Summary Cart - Centered Card, Always Visible */}
      {selectedItems.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-3xl">
          <div className="bg-gray-800 border-4 border-orange-500 rounded-2xl shadow-2xl p-6">
            <h3 className="text-2xl font-bold mb-4 text-center">Your Selection</h3>
            <div className="max-h-96 overflow-y-auto space-y-3 mb-4">
              {selectedItems.map(item => (
                <div key={item.id} className="flex flex-col">
                  <div className="flex justify-between">
                    <span>{item.name} x {item.qty}</span>
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
                  <span>Goggles x {goggles}</span>
                  <span>${(goggles * 4).toFixed(2)}</span>
                </div>
              )}
            </div>
            <div className="flex justify-between text-xl font-bold border-t-2 border-orange-500 pt-4">
              <span>Total Seats: {totalSeats}</span>
              <span>Total: ${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}