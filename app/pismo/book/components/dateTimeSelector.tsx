'use client';

import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useEffect, useState, useRef } from 'react';

export default function DateTimeSelector({ 
  selectedDate, setSelectedDate, 
  startTime, setStartTime, 
  endTime, setEndTime, 
  setDurationHours, setPricingCategories, 
  setLoading, setMessage,
  initialData 
}: any) {
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [possibleEndTimes, setPossibleEndTimes] = useState<string[]>([]);
  
  // Track if we have already initialized the edit mode data to prevent infinite loops
  const hasInitialized = useRef(false);

  // 1. Fetch available start times when date changes
  useEffect(() => {
    if (!selectedDate) {
      setAvailableTimes([]);
      return;
    }

    const fetchTimes = async () => {
      setLoading(true);
      const dateStr = selectedDate.toISOString().split('T')[0];
      
      try {
        const res = await fetch(`/api/pismo/times?date=${dateStr}`);
        if (res.ok) {
          const data = await res.json();
          let times = data.startTimes || [];

          if (initialData && initialData.start_time) {
             if (!times.includes(initialData.start_time)) {
                times = [initialData.start_time, ...times].sort();
             }
          }
          setAvailableTimes(times);
        }
      } catch (err) {
        console.error("Error fetching times:", err);
      }
      setLoading(false);
    };

    fetchTimes();
  }, [selectedDate, setLoading, initialData]);

  // 2. Initialize Data on Load (Only for Edit Mode)
  useEffect(() => {
    if (initialData && !hasInitialized.current) {
        // Pre-fill the start and end times from the DB
        setStartTime(initialData.start_time);
        setEndTime(initialData.end_time);
        hasInitialized.current = true;
    }
  }, [initialData, setStartTime, setEndTime]);

  // 3. Calculate possible end times (1-4 hours ahead)
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
      let endHour = (hours + i) % 24;
      let displayHour = endHour % 12 || 12;
      let displayPeriod = endHour >= 12 ? 'PM' : 'AM';
      ends.push(`${displayHour.toString().padStart(2, '0')}:00 ${displayPeriod}`);
    }
    setPossibleEndTimes(ends);
  }, [startTime]);

  // 4. Calculate Duration & Fetch Pricing
  useEffect(() => {
    if (!endTime || !selectedDate || !startTime) {
      // Don't clear pricing if we are in the middle of initializing edit data
      if (!initialData) {
          setPricingCategories([]);
          setDurationHours(null);
      }
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

    // If we passed pricingRules from the server (Edit Mode), we might skip this fetch 
    // BUT fetching again ensures if they change the time, the price updates correctly.
    const fetchPricing = async () => {
      setLoading(true);
      const dateStr = selectedDate.toISOString().split('T')[0];
      try {
        const res = await fetch(`/api/pismo/pricing?date=${dateStr}&start=${startTime}&end=${endTime}`);
        if (res.ok) {
          const data = await res.json();
          const sorted = data.sort((a: any, b: any) => (a.sort_order || 100) - (b.sort_order || 100));
          setPricingCategories(sorted);
        } else {
          setMessage('No vehicles available for this time slot.');
        }
      } catch (err) {
        console.error("Pricing fetch error", err);
      }
      setLoading(false);
    };

    // Debounce slightly to prevent double-firing on load
    const timer = setTimeout(() => {
        fetchPricing();
    }, 100);

    return () => clearTimeout(timer);

  }, [endTime, selectedDate, startTime, setDurationHours, setPricingCategories, setLoading, setMessage]);

  return (
    <section className="text-center space-y-12 mb-12">
      {/* Date Selection */}
      <div>
        <label className="text-2xl block mb-4 font-bold text-orange-500">1. Choose Reservation Date</label>
        <div className="flex justify-center">
            <DatePicker
            selected={selectedDate}
            onChange={(date: Date | null) => {
                if (date) {
                setSelectedDate(date);
                // Only reset times if the date actually changed significantly (not just re-render)
                if (!initialData || date.toISOString().split('T')[0] !== initialData.booking_date) {
                    setStartTime('');
                    setEndTime('');
                }
                }
            }}
            // If editing, allow past dates? Usually strictly future unless admin.
            minDate={new Date()} 
            className="p-4 text-black text-xl rounded-lg cursor-pointer w-full max-w-xs border-2 border-orange-500 text-center font-bold"
            placeholderText="Click to select date"
            dateFormat="MMMM d, yyyy"
            />
        </div>
      </div>

      {/* Start Time Selection */}
      <div className={`transition-all duration-500 ${availableTimes.length > 0 ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
        <label className="text-2xl block mb-4 font-bold text-orange-500">2. Choose Start Time</label>
        <select
          value={startTime}
          onChange={e => {
            setStartTime(e.target.value);
            setEndTime('');
          }}
          className="p-4 bg-gray-800 rounded-lg w-full max-w-md mx-auto text-xl border border-gray-600 focus:ring-2 focus:ring-orange-500 outline-none text-white appearance-none text-center font-bold cursor-pointer hover:bg-gray-700 transition-colors"
        >
          <option value="">-- Select Start Time --</option>
          {availableTimes.map(time => (
            <option key={time} value={time}>{time}</option>
          ))}
        </select>
      </div>

      {/* End Time Selection */}
      <div className={`transition-all duration-500 ${startTime && possibleEndTimes.length > 0 ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
        <label className="text-2xl block mb-4 font-bold text-orange-500">3. Choose End Time</label>
        <select
          value={endTime}
          onChange={e => setEndTime(e.target.value)}
          className="p-4 bg-gray-800 rounded-lg w-full max-w-md mx-auto text-xl border border-gray-600 focus:ring-2 focus:ring-orange-500 outline-none text-white appearance-none text-center font-bold cursor-pointer hover:bg-gray-700 transition-colors"
        >
          <option value="">-- Select End Time --</option>
          {possibleEndTimes.map(time => (
            <option key={time} value={time}>{time}</option>
          ))}
        </select>
      </div>
    </section>
  );
}