// app/pismo/page.tsx - Pismo Beach Hourly Rentals Booking (PCI Compliant via NMI Collect.js)

'use client';

import { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

export default function PismoBooking() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [startTime, setStartTime] = useState<string>('');
  const [possibleEndTimes, setPossibleEndTimes] = useState<string[]>([]);
  const [endTime, setEndTime] = useState<string>('');
  const [durationHours, setDurationHours] = useState<number | null>(null);
  const [availableVehicles, setAvailableVehicles] = useState<any[]>([]);
  const [selections, setSelections] = useState<Record<string, { qty: number; waiver: boolean }>>({});
  const [goggles, setGoggles] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [collectLoaded, setCollectLoaded] = useState(false);

  // Vehicle pricing – replace with DB fetch later
  const vehiclePricing: Record<string, { name: string; price: number; waiverPrice: number }> = {
    QA: { name: 'Quad Adult', price: 199, waiverPrice: 25 },
    QB: { name: 'Quad Youth', price: 179, waiverPrice: 20 },
    QU: { name: 'UTV Adult', price: 299, waiverPrice: 40 },
    QL: { name: 'UTV Youth', price: 279, waiverPrice: 35 },
    SB4: { name: '4-Seat Buggy', price: 399, waiverPrice: 50 },
  };

  // Recalculate total
  useEffect(() => {
    let calc = goggles * 4;
    availableVehicles.forEach(v => {
      const sel = selections[v.code] || { qty: 0, waiver: false };
      calc += sel.qty * v.price;
      if (sel.waiver) calc += sel.qty * v.waiverPrice;
    });
    setTotal(calc);
  }, [selections, goggles, availableVehicles]);

  // Load NMI Collect.js (PCI compliant)
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://secure.nmi.com/token/Collect.js';
    script.setAttribute('data-tokenization-key', process.env.NEXT_PUBLIC_NMI_TOKENIZATION_KEY!);
    script.async = true;

    script.onload = () => {
      // @ts-ignore
      if (window.CollectJS) {
        // @ts-ignore
        window.CollectJS.configure({
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

    script.onerror = () => setMessage('Failed to load payment system.');

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
    // @ts-ignore
    window.CollectJS.startPaymentRequest();
  };

  // 1. Date change → fetch available start times
  useEffect(() => {
    if (!selectedDate) {
      setAvailableTimes([]);
      setStartTime('');
      setPossibleEndTimes([]);
      setEndTime('');
      setDurationHours(null);
      setAvailableVehicles([]);
      setSelections({});
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

  // 2. Start time change → generate hourly end times (simple, reliable – no suncalc dependency)
  useEffect(() => {
    if (!startTime) {
      setPossibleEndTimes([]);
      setEndTime('');
      setDurationHours(null);
      setAvailableVehicles([]);
      setSelections({});
      return;
    }

    const ends: string[] = [];
    const match = startTime.match(/(\d+):(\d+) (\w+)/);
    if (!match) return;

    let hours = parseInt(match[1]);
    const period = match[3].toUpperCase();
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;

    // Add 1 to 4 hours
    for (let i = 1; i <= 4; i++) {
      let endHour = hours + i;
      let endPeriod = period;
      if (endHour >= 12) {
        if (endHour > 12) endHour -= 12;
        if (period === 'AM') endPeriod = 'PM';
        else endPeriod = 'AM';
      }
      ends.push(`${endHour.toString().padStart(2, '0')}:00 ${endPeriod}`);
    }

    setPossibleEndTimes(ends);
  }, [startTime]);

  // 3. End time selected → calculate duration + fetch inventory
  useEffect(() => {
    if (!startTime || !endTime || !selectedDate) {
      setDurationHours(null);
      setAvailableVehicles([]);
      setSelections({});
      return;
    }

    const startMatch = startTime.match(/(\d+):(\d+) (\w+)/);
    const endMatch = endTime.match(/(\d+):(\d+) (\w+)/);
    if (!startMatch || !endMatch) return;

    let startH = parseInt(startMatch[1]);
    if (startMatch[3] === 'PM' && startH !== 12) startH += 12;
    if (startMatch[3] === 'AM' && startH === 12) startH = 0;

    let endH = parseInt(endMatch[1]);
    if (endMatch[3] === 'PM' && endH !== 12) endH += 12;
    if (endMatch[3] === 'AM' && endH === 12) endH = 0;

    let hours = endH - startH;
    if (hours <= 0) hours += 24;

    setDurationHours(hours);

    const fetchVehicles = async () => {
      setLoading(true);
      const dateStr = selectedDate.toISOString().split('T')[0];
      const res = await fetch(`/api/pismo/inventory?date=${dateStr}&start=${startTime}&end=${endTime}`);
      if (res.ok) {
        const data = await res.json();
        const enriched = data.map((v: any) => ({
          ...v,
          ...vehiclePricing[v.code],
        }));
        setAvailableVehicles(enriched);
      }
      setLoading(false);
    };

    fetchVehicles();
  }, [endTime]);

  const updateSelection = (code: string, qty: number, waiver: boolean) => {
    setSelections(prev => ({
      ...prev,
      [code]: { qty, waiver },
    }));
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-5xl font-bold text-center mb-16 text-orange-500">
          Pismo Beach Hourly Rentals
        </h1>

        {/* 1. Date Selection */}
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

        {/* 2. Start Time */}
        {availableTimes.length > 0 && (
          <section className="text-center mb-16">
            <label className="text-2xl block mb-4">2. Choose Start Time</label>
            <select
              value={startTime}
              onChange={(e) => {
                setStartTime(e.target.value);
                setEndTime('');
                setDurationHours(null);
                setAvailableVehicles([]);
                setSelections({});
              }}
              className="p-4 bg-gray-800 rounded-lg w-full max-w-md mx-auto text-xl"
              onBlur={() => {}} // Helps close dropdown on click away
            >
              <option value="">Select start time</option>
              {availableTimes.map(time => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
          </section>
        )}

        {/* 3. End Time + Duration */}
        {startTime && possibleEndTimes.length > 0 && (
          <section className="text-center mb-16">
            <label className="text-2xl block mb-4">3. Choose End Time</label>
            <select
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="p-4 bg-gray-800 rounded-lg w-full max-w-md mx-auto text-xl"
              onBlur={() => {}} // Helps close dropdown on click away
            >
              <option value="">Select end time (1–4 hours)</option>
              {possibleEndTimes.map(time => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>

            {durationHours !== null && (
              <p className="text-xl mt-8 text-orange-400">
                Duration: <strong>{durationHours} hour{durationHours > 1 ? 's' : ''}</strong>
              </p>
            )}
          </section>
        )}

        {loading && <p className="text-center text-2xl text-orange-400 mb-12">Loading availability...</p>}

        {/* 4. Available Vehicles */}
        {availableVehicles.length > 0 && (
          <section className="mb-16">
            <h2 className="text-4xl font-bold text-center mb-12">4. Select Vehicles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {availableVehicles.map(v => (
                <div key={v.code} className="bg-gray-800 p-8 rounded-2xl shadow-xl">
                  <h3 className="text-3xl font-bold mb-4">{v.name} — ${v.price}/hour</h3>
                  <div className="space-y-6">
                    <div>
                      <label className="text-xl block mb-2">
                        Quantity (Available: {v.availableQty})
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={v.availableQty}
                        value={selections[v.code]?.qty || 0}
                        onChange={(e) => updateSelection(v.code, parseInt(e.target.value) || 0, selections[v.code]?.waiver || false)}
                        className="p-4 bg-gray-700 rounded w-32 text-xl"
                      />
                    </div>
                    <label className="flex items-center text-xl">
                      <input
                        type="checkbox"
                        checked={selections[v.code]?.waiver || false}
                        onChange={(e) => updateSelection(v.code, selections[v.code]?.qty || 0, e.target.checked)}
                        className="mr-4 w-6 h-6"
                      />
                      Add Damage Waiver (${v.waiverPrice}/unit)
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 5. Goggles */}
        <section className="text-center mb-16">
          <label className="text-2xl block mb-4">Goggles ($4 each)</label>
          <input
            type="number"
            min="0"
            value={goggles}
            onChange={(e) => setGoggles(parseInt(e.target.value) || 0)}
            className="p-4 bg-gray-700 rounded w-32 text-xl"
          />
        </section>

        {/* 6. Secure Checkout */}
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
    </div>
  );
}