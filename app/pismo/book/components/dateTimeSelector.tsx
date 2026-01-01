import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useEffect, useState } from 'react';

export default function DateTimeSelector({ 
  selectedDate, setSelectedDate, 
  startTime, setStartTime, 
  endTime, setEndTime, 
  setDurationHours, setPricingCategories, 
  setLoading, setMessage 
}: any) {
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [possibleEndTimes, setPossibleEndTimes] = useState<string[]>([]);

  // 1. Fetch available start times when date changes
  useEffect(() => {
    if (!selectedDate) {
      setAvailableTimes([]);
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
  }, [selectedDate, setLoading]);

  // 2. Calculate possible end times (1-4 hours ahead)
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

  // 3. Calculate Duration & Fetch Pricing when End Time is chosen
  useEffect(() => {
    if (!endTime || !selectedDate || !startTime) {
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
  }, [endTime, selectedDate, startTime, setDurationHours, setPricingCategories, setLoading, setMessage]);

  return (
    <section className="text-center space-y-12 mb-12">
      {/* Date Selection */}
      <div>
        <label className="text-2xl block mb-4">1. Choose Reservation Date</label>
        <DatePicker
          selected={selectedDate}
          onChange={(date: Date | null) => {
            if (date) {
              setSelectedDate(date);
              setStartTime('');
              setEndTime('');
            }
          }}
          minDate={new Date()}
          className="p-4 text-black text-xl rounded-lg cursor-pointer w-full max-w-xs border-2 border-orange-500"
          placeholderText="Click to select date"
        />
      </div>

      {/* Start Time Selection */}
      {availableTimes.length > 0 && (
        <div>
          <label className="text-2xl block mb-4">2. Choose Start Time</label>
          <select
            value={startTime}
            onChange={e => {
              setStartTime(e.target.value);
              setEndTime('');
            }}
            className="p-4 bg-gray-800 rounded-lg w-full max-w-md mx-auto text-xl border border-gray-600"
          >
            <option value="">Select start time</option>
            {availableTimes.map(time => (
              <option key={time} value={time}>{time}</option>
            ))}
          </select>
        </div>
      )}

      {/* End Time Selection */}
      {startTime && possibleEndTimes.length > 0 && (
        <div>
          <label className="text-2xl block mb-4">3. Choose End Time</label>
          <select
            value={endTime}
            onChange={e => setEndTime(e.target.value)}
            className="p-4 bg-gray-800 rounded-lg w-full max-w-md mx-auto text-xl border border-gray-600"
          >
            <option value="">Select end time</option>
            {possibleEndTimes.map(time => (
              <option key={time} value={time}>{time}</option>
            ))}
          </select>
        </div>
      )}
    </section>
  );
}