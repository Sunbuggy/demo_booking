'use client';

import { useState, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';
import DatePicker from 'react-datepicker';
import { createClient } from '@/utils/supabase/client';
import { RRule, rrulestr } from 'rrule';

export default function PismoRulesAdmin() {
  const [rules, setRules] = useState<any[]>([]);
  const [selectedRange, setSelectedRange] = useState<{ from: Date | null; to: Date | null }>({ from: null, to: null });
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
  const [firstStart, setFirstStart] = useState<string>('10:00');
  const [offsetMins, setOffsetMins] = useState<number>(60);
  const [loading, setLoading] = useState(true);

  const supabase = await createClient();

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    const { data } = await supabase.from('pismo_rental_rules').select('*');
    setRules(data || []);
    setLoading(false);
  };

  const saveRule = async () => {
    if (!selectedRange.from || !selectedRange.to || daysOfWeek.length === 0) return;
    const { error } = await supabase.from('pismo_rental_rules').insert({
      start_date: selectedRange.from.toISOString().split('T')[0],
      end_date: selectedRange.to.toISOString().split('T')[0],
      days_of_week: daysOfWeek,
      first_start_time: firstStart + ':00',
      last_end_offset_minutes: offsetMins
    });
    if (!error) {
      fetchRules();
      setSelectedRange({ from: null, to: null });
      setDaysOfWeek([]);
    }
  };

  // Compute affected dates for coloring calendar
  const affectedDates = new Set<string>();
  rules.forEach(rule => {
    const rrule = new RRule({
      freq: RRule.WEEKLY,
      byweekday: rule.days_of_week.map((d: number) => d - 1), // 0=Mon in rrule
      dtstart: new Date(rule.start_date),
      until: new Date(rule.end_date)
    });
    rrule.all().forEach(d => affectedDates.add(d.toISOString().split('T')[0]));
  });

  const modifiers = { affected: Array.from(affectedDates).map(d => new Date(d)) };
  const modifiersStyles = { affected: { backgroundColor: '#ff6900', color: 'white' } };

  if (loading) return <p>Loading rules...</p>;

  return (
    <div className="max-w-6xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Pismo Rental Schedule Rules (Manager)</h1>

      <DayPicker modifiers={modifiers} modifiersStyles={modifiersStyles} />

      <div className="mt-12 bg-gray-100 p-8 rounded-lg">
        <h2 className="text-2xl mb-6">Create New Rule</h2>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <label>Start Date</label>
            <DatePicker selected={selectedRange.from} onChange={d => setSelectedRange(prev => ({ ...prev, from: d }))} className="p-4 border rounded w-full" />
          </div>
          <div>
            <label>End Date</label>
            <DatePicker selected={selectedRange.to} onChange={d => setSelectedRange(prev => ({ ...prev, to: d }))} className="p-4 border rounded w-full" />
          </div>
        </div>

        <div className="mb-6">
          <label>Days of Week</label>
          <div className="grid grid-cols-7 gap-4 mt-4">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
              <label key={i} className="text-center">
                <input
                  type="checkbox"
                  checked={daysOfWeek.includes(i + 1)}
                  onChange={e => e.target.checked ? setDaysOfWeek(prev => [...prev, i + 1]) : setDaysOfWeek(prev => prev.filter(d => d !== i + 1))}
                />
                {day}
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <label>First Start Time</label>
            <input type="time" value={firstStart} onChange={e => setFirstStart(e.target.value)} className="ml-4 p-4 border rounded" />
          </div>
          <div>
            <label>Minutes Before Sunset for Last End</label>
            <select value={offsetMins} onChange={e => setOffsetMins(parseInt(e.target.value))} className="ml-4 p-4 border rounded">
              <option value={30}>30</option>
              <option value={60}>60</option>
            </select>
          </div>
        </div>

        <button onClick={saveRule} className="bg-orange-600 text-white px-8 py-4 rounded text-xl">Save Rule</button>
      </div>
    </div>
  );
}