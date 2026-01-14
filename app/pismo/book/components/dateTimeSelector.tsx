'use client';

import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useEffect, useState, useRef } from 'react';
import { Calendar as CalendarIcon, Clock, Hourglass } from 'lucide-react';

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
      // Use local date string to avoid timezone shifts
      const offset = selectedDate.getTimezoneOffset() * 60000;
      const localDate = new Date(selectedDate.getTime() - offset);
      const dateStr = localDate.toISOString().split('T')[0];
      
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

    const fetchPricing = async () => {
      setLoading(true);
      // Use local date string
      const offset = selectedDate.getTimezoneOffset() * 60000;
      const localDate = new Date(selectedDate.getTime() - offset);
      const dateStr = localDate.toISOString().split('T')[0];

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

    const timer = setTimeout(() => {
        fetchPricing();
    }, 100);

    return () => clearTimeout(timer);

  }, [endTime, selectedDate, startTime, setDurationHours, setPricingCategories, setLoading, setMessage]);

  return (
    <section className="text-center space-y-12 mb-12">
      
      {/* 1. Date Selection */}
      <div className="relative group">
        <label className="text-2xl flex items-center justify-center gap-2 mb-4 font-bold text-primary">
          <CalendarIcon className="w-6 h-6" /> 
          1. Choose Reservation Date
        </label>
        <div className="flex justify-center relative z-10">
            {/* SEMANTIC: DatePicker Styling
               - Text Color: text-foreground
               - Background: bg-background
               - Border: border-primary (to highlight active step)
            */}
            <DatePicker
                selected={selectedDate}
                onChange={(date: Date | null) => {
                    if (date) {
                    setSelectedDate(date);
                    if (!initialData || date.toISOString().split('T')[0] !== initialData.booking_date) {
                        setStartTime('');
                        setEndTime('');
                    }
                    }
                }}
                minDate={new Date()} 
                className="p-4 text-foreground bg-background text-xl rounded-lg cursor-pointer w-full max-w-xs border-2 border-primary text-center font-bold focus:outline-none focus:ring-4 focus:ring-primary/20 transition-all shadow-sm"
                placeholderText="Click to select date"
                dateFormat="MMMM d, yyyy"
            />
        </div>
      </div>

      {/* 2. Start Time Selection */}
      <div className={`transition-all duration-500 ease-in-out ${availableTimes.length > 0 ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 h-0 overflow-hidden'}`}>
        <label className="text-2xl flex items-center justify-center gap-2 mb-4 font-bold text-primary">
          <Clock className="w-6 h-6" />
          2. Choose Start Time
        </label>
        {/* SEMANTIC: Select Styling (bg-background, text-foreground, border-input) */}
        <div className="relative max-w-md mx-auto">
            <select
            value={startTime}
            onChange={e => {
                setStartTime(e.target.value);
                setEndTime('');
            }}
            className="w-full p-4 bg-background rounded-lg text-xl border border-input focus:border-primary focus:ring-4 focus:ring-primary/20 outline-none text-foreground appearance-none text-center font-bold cursor-pointer hover:bg-muted/30 transition-colors shadow-sm"
            >
            <option value="">-- Select Start Time --</option>
            {availableTimes.map(time => (
                <option key={time} value={time} className="bg-background text-foreground">{time}</option>
            ))}
            </select>
            {/* Custom Arrow Indicator if needed, or rely on browser default/appearance-none + CSS */}
        </div>
      </div>

      {/* 3. End Time Selection */}
      <div className={`transition-all duration-500 ease-in-out ${startTime && possibleEndTimes.length > 0 ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 h-0 overflow-hidden'}`}>
        <label className="text-2xl flex items-center justify-center gap-2 mb-4 font-bold text-primary">
          <Hourglass className="w-6 h-6" />
          3. Choose End Time
        </label>
        <div className="relative max-w-md mx-auto">
            <select
            value={endTime}
            onChange={e => setEndTime(e.target.value)}
            className="w-full p-4 bg-background rounded-lg text-xl border border-input focus:border-primary focus:ring-4 focus:ring-primary/20 outline-none text-foreground appearance-none text-center font-bold cursor-pointer hover:bg-muted/30 transition-colors shadow-sm"
            >
            <option value="">-- Select End Time --</option>
            {possibleEndTimes.map(time => (
                <option key={time} value={time} className="bg-background text-foreground">{time}</option>
            ))}
            </select>
        </div>
      </div>
    </section>
  );
}