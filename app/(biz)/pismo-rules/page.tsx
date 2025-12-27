'use client';

import { useState, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css'; // Fixed import path
import DatePicker from 'react-datepicker';
import { createClient } from '@/utils/supabase/client'; // Client-side Supabase
import { RRule, rrulestr } from 'rrule';

export default function PismoRulesAdmin() {
  const [supabase, setSupabase] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [rules, setRules] = useState<any[]>([]);
  const [selectedRange, setSelectedRange] = useState<{ from: Date | null; to: Date | null }>({ from: null, to: null });
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
  const [firstStart, setFirstStart] = useState<string>('10:00');
  const [offsetMins, setOffsetMins] = useState<number>(60);

  // Initialize Supabase client on mount (client-side only)
  useEffect(() => {
    const client = createClient();
    setSupabase(client);
    setLoading(false);
  }, []);

  // Fetch rules once Supabase is ready
  useEffect(() => {
    if (!supabase) return;

    const fetchRules = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('pismo_rental_rules')
          .select('*');

        if (error) throw error;

        setRules(data || []);
      } catch (err) {
        console.error('Error fetching Pismo rules:', err);
        alert('Failed to load rules. Check console.');
      } finally {
        setLoading(false);
      }
    };

    fetchRules();
  }, [supabase]);

  const saveRule = async () => {
    if (!supabase) {
      alert('System not ready');
      return;
    }
    if (!selectedRange.from || !selectedRange.to || daysOfWeek.length === 0) {
      alert('Please select date range and days');
      return;
    }

    try {
      const { error } = await supabase.from('pismo_rental_rules').insert({
        start_date: selectedRange.from.toISOString().split('T')[0],
        end_date: selectedRange.to.toISOString().split('T')[0],
        days_of_week: daysOfWeek,
        first_start_time: firstStart + ':00',
        last_end_offset_minutes: offsetMins
      });

      if (error) throw error;

      alert('Rule saved successfully!');
      // Reset form
      setSelectedRange({ from: null, to: null });
      setDaysOfWeek([]);
      setFirstStart('10:00');
      setOffsetMins(60);

      // Refetch rules
      const { data } = await supabase.from('pismo_rental_rules').select('*');
      setRules(data || []);
    } catch (err: any) {
      console.error('Error saving rule:', err);
      alert(`Error: ${err.message || 'Failed to save rule'}`);
    }
  };

  // Compute affected dates for calendar highlighting
  const affectedDates = new Set<string>();
  rules.forEach(rule => {
    const rrule = new RRule({
      freq: RRule.WEEKLY,
      byweekday: rule.days_of_week.map((d: number) => d - 1), // rrule uses 0=Mon
      dtstart: new Date(rule.start_date),
      until: new Date(rule.end_date)
    });
    rrule.all().forEach(d => affectedDates.add(d.toISOString().split('T')[0]));
  });

  const modifiers = { affected: Array.from(affectedDates).map(d => new Date(d)) };
  const modifiersStyles = { affected: { backgroundColor: '#ff6900', color: 'white' } };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-8 text-center">
        <p className="text-xl">Loading Pismo rental rules...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Pismo Rental Schedule Rules (Manager)</h1>

      {/* Calendar with highlighted affected dates */}
      <div className="mb-12">
        <DayPicker modifiers={modifiers} modifiersStyles={modifiersStyles} />
      </div>

      {/* Rule Creation Form */}
      <div className="mt-12 bg-gray-100 p-8 rounded-lg">
        <h2 className="text-2xl mb-6">Create New Rule</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">Start Date</label>
            <DatePicker
              selected={selectedRange.from}
              onChange={(d: Date | null) => setSelectedRange(prev => ({ ...prev, from: d }))}
              className="w-full p-3 border rounded bg-white"
              placeholderText="Select start date"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">End Date</label>
            <DatePicker
              selected={selectedRange.to}
              onChange={(d: Date | null) => setSelectedRange(prev => ({ ...prev, to: d }))}
              className="w-full p-3 border rounded bg-white"
              placeholderText="Select end date"
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Days of Week</label>
          <div className="grid grid-cols-7 gap-4 mt-4">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
              <label key={i} className="text-center">
                <input
                  type="checkbox"
                  checked={daysOfWeek.includes(i + 1)}
                  onChange={(e) =>
                    e.target.checked
                      ? setDaysOfWeek(prev => [...prev, i + 1])
                      : setDaysOfWeek(prev => prev.filter(d => d !== i + 1))
                  }
                  className="mr-1"
                />
                {day}
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-sm font-medium mb-2">First Start Time</label>
            <input
              type="time"
              value={firstStart}
              onChange={(e) => setFirstStart(e.target.value)}
              className="w-full p-3 border rounded bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Minutes Before Sunset for Last End</label>
            <select
              value={offsetMins}
              onChange={(e) => setOffsetMins(parseInt(e.target.value))}
              className="w-full p-3 border rounded bg-white"
            >
              <option value={30}>30</option>
              <option value={60}>60</option>
            </select>
          </div>
        </div>

        <button
          onClick={saveRule}
          className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-8 py-4 rounded text-xl transition"
        >
          Save Rule
        </button>
      </div>
    </div>
  );
}