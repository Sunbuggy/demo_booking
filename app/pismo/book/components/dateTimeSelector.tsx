'use client';

import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useEffect, useState, useRef } from 'react';
import { Calendar as CalendarIcon, Clock, Hourglass } from 'lucide-react';

export default function DateTimeSelector({ 
  selectedDate, setSelectedDate, 
  startTime, setStartTime, 
  endTime, setEndTime, 
  durationHours, setDurationHours, // Added durationHours to props
  setPricingCategories, 
  setLoading, setMessage,
  initialData 
}: any) {
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  
  // Track initialization to prevent loops
  const hasInitialized = useRef(false);

  // 1. Fetch available start times when date changes
  useEffect(() => {
    if (!selectedDate) {
      setAvailableTimes([]);
      return;
    }

    const fetchTimes = async () => {
      setLoading(true);
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

  // 2. Initialize Data (Edit Mode)
  useEffect(() => {
    if (initialData && !hasInitialized.current) {
        setStartTime(initialData.start_time);
        setEndTime(initialData.end_time);
        setDurationHours(Number(initialData.duration_hours)); // Set initial duration
        hasInitialized.current = true;
    }
  }, [initialData, setStartTime, setEndTime, setDurationHours]);

  // Helper: Add hours to a time string (e.g., "10:00 AM" + 2 -> "12:00 PM")
  const calculateEndTime = (start: string, hoursToAdd: number) => {
    const match = start.match(/(\d+):(\d+) (\w+)/);
    if (!match) return '';

    let hours = parseInt(match[1]);
    const period = match[3].toUpperCase();
    
    // Convert to 24h for math
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;

    let endHour = (hours + hoursToAdd);
    
    // Convert back to 12h display
    const displayPeriod = endHour >= 12 && endHour < 24 ? 'PM' : 'AM'; // Simple check, assumes <24h operation
    // Handle crossing midnight slightly gracefully if needed, though mostly daytime
    if (endHour >= 24) endHour -= 24; 

    let displayHour = endHour % 12 || 12;
    
    return `${displayHour.toString().padStart(2, '0')}:00 ${displayPeriod}`;
  };

  // 3. Handle Duration Change -> Update End Time
  const handleDurationChange = (hours: number) => {
    setDurationHours(hours);
    if (startTime) {
        const newEndTime = calculateEndTime(startTime, hours);
        setEndTime(newEndTime);
    }
  };

  // 4. If Start Time changes, re-calculate End Time based on current Duration
  useEffect(() => {
    if (startTime && durationHours) {
        const newEndTime = calculateEndTime(startTime, durationHours);
        // Only update if it's different to avoid loops
        if (newEndTime !== endTime) {
            setEndTime(newEndTime);
        }
    }
  }, [startTime, durationHours]); // Removed endTime from dependency to avoid loop

  // 5. Fetch Pricing when everything is ready
  useEffect(() => {
    if (!endTime || !selectedDate || !startTime || !durationHours) {
      if (!initialData) {
          setPricingCategories([]);
      }
      return;
    }

    const fetchPricing = async () => {
      setLoading(true);
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

    // Debounce slightly
    const timer = setTimeout(() => {
        fetchPricing();
    }, 100);

    return () => clearTimeout(timer);

  }, [endTime, selectedDate, startTime, durationHours, setPricingCategories, setLoading, setMessage]);

  const durationOptions = [1, 2, 3, 4];

  return (
    <section className="text-center space-y-12 mb-12">
      
      {/* 1. Date Selection */}
      <div className="relative group">
        <label className="text-2xl flex items-center justify-center gap-2 mb-4 font-bold text-primary">
          <CalendarIcon className="w-6 h-6" /> 
          1. Choose Reservation Date
        </label>
        <div className="flex justify-center relative z-10">
            <DatePicker
                selected={selectedDate}
                onChange={(date: Date | null) => {
                    if (date) {
                        setSelectedDate(date);
                        // Reset times on date change unless it matches initial
                        if (!initialData || date.toISOString().split('T')[0] !== initialData.booking_date) {
                            setStartTime('');
                            setEndTime('');
                            setDurationHours(null);
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
        <div className="relative max-w-md mx-auto">
            <select
            value={startTime}
            onChange={e => setStartTime(e.target.value)}
            className="w-full p-4 bg-background rounded-lg text-xl border border-input focus:border-primary focus:ring-4 focus:ring-primary/20 outline-none text-foreground appearance-none text-center font-bold cursor-pointer hover:bg-muted/30 transition-colors shadow-sm"
            >
            <option value="">-- Select Start Time --</option>
            {availableTimes.map(time => (
                <option key={time} value={time} className="bg-background text-foreground">{time}</option>
            ))}
            </select>
        </div>
      </div>

      {/* 3. Duration Selection (Replaces End Time) */}
      <div className={`transition-all duration-500 ease-in-out ${startTime ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 h-0 overflow-hidden'}`}>
        <label className="text-2xl flex items-center justify-center gap-2 mb-4 font-bold text-primary">
          <Hourglass className="w-6 h-6" />
          3. Choose Duration
        </label>
        <div className="relative max-w-md mx-auto">
            <select
            value={durationHours || ''}
            onChange={e => handleDurationChange(Number(e.target.value))}
            className="w-full p-4 bg-background rounded-lg text-xl border border-input focus:border-primary focus:ring-4 focus:ring-primary/20 outline-none text-foreground appearance-none text-center font-bold cursor-pointer hover:bg-muted/30 transition-colors shadow-sm"
            >
            <option value="">-- Select Duration --</option>
            {durationOptions.map(hours => (
                <option key={hours} value={hours} className="bg-background text-foreground">
                    {hours} Hour{hours > 1 ? 's' : ''} {endTime && durationHours === hours ? `(Ends ${endTime})` : ''}
                </option>
            ))}
            </select>
        </div>
      </div>
    </section>
  );
}