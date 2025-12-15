// app/biz/pismo-times/page.tsx - Recurring Rules Manager

'use client';

import { useState, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import DatePicker from 'react-datepicker';
import { createClient } from '@/utils/supabase/client';

export default function PismoTimesManager() {
  const [rules, setRules] = useState<any[]>([]);
  const [range, setRange] = useState<{ from: Date | null; to: Date | null }>({ from: null, to: null });
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
  const [firstStart, setFirstStart] = useState<string>('10:00');
  const [offsetMins, setOffsetMins] = useState<number>(45); // ← Default now 45
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedDateInfo, setSelectedDateInfo] = useState<{
    date: string;
    rule: any;
  } | null>(null);

  const supabase = createClient();

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    const { data } = await supabase
      .from('pismo_rental_rules')
      .select('*')
      .order('created_at', { ascending: false });

    setRules(data || []);
    setLoading(false);
  };

  const saveRule = async () => {
    if (!range.from || !range.to || daysOfWeek.length === 0) {
      alert('Please select date range and days of week');
      return;
    }

    const { error } = await supabase.from('pismo_rental_rules').insert({
      start_date: range.from.toISOString().split('T')[0],
      end_date: range.to.toISOString().split('T')[0],
      days_of_week: daysOfWeek,
      first_start_time: firstStart + ':00',
      last_end_offset_minutes: offsetMins,
    }, { returning: 'minimal' });

    if (!error) {
      fetchRules();
      setRange({ from: null, to: null });
      setDaysOfWeek([]);
      setFirstStart('10:00');
      setOffsetMins(45); // ← Reset to 45 after save
      setSelectedDateInfo(null);
    } else {
      alert('Error saving rule: ' + error.message);
    }
  };

  // Helper: Get the most recent applicable rule for a specific date
  const getActiveRuleForDate = (dateStr: string): any | null => {
    const checkDate = new Date(dateStr);
    const dayOfWeek = checkDate.getDay() + 1;

    const applicableRules = rules.filter(rule => {
      const start = new Date(rule.start_date);
      const end = new Date(rule.end_date);
      return checkDate >= start && checkDate <= end && rule.days_of_week.includes(dayOfWeek);
    });

    if (applicableRules.length === 0) return null;

    return applicableRules.reduce((latest, current) =>
      new Date(current.created_at) > new Date(latest.created_at) ? current : latest
    );
  };

  // Build affected dates (unchanged from previous version)
  const affectedDates = new Set<string>();
  const dateToRuleMap = new Map<string, any>();

  const today = new Date();
  const startYear = today.getFullYear() - 1;
  const endYear = today.getFullYear() + 2;

  for (let year = startYear; year <= endYear; year++) {
    for (let month = 0; month < 12; month++) {
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const activeRule = getActiveRuleForDate(dateStr);
        if (activeRule) {
          affectedDates.add(dateStr);
          dateToRuleMap.set(dateStr, activeRule);
        }
      }
    }
  }

  const modifiers = { affected: Array.from(affectedDates).map(d => new Date(d)) };
  const modifiersStyles = { affected: { backgroundColor: '#ff6900', color: 'white', fontWeight: 'bold' } };

  if (loading) {
    return <div className="p-8 text-center text-2xl">Loading rules...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto p-8 bg-gray-900 text-white min-h-screen">
      <h1 className="text-4xl font-bold text-center mb-8 text-orange-500">Pismo Times Manager</h1>

      <div className="bg-gray-800 p-8 rounded-2xl mb-12 shadow-2xl">
        <DayPicker
          modifiers={modifiers}
          modifiersStyles={modifiersStyles}
          className="mx-auto"
          onDayClick={(date) => {
            const dateStr = date.toISOString().split('T')[0];
            const activeRule = dateToRuleMap.get(dateStr) || getActiveRuleForDate(dateStr);

            if (activeRule) {
              setSelectedDateInfo({ date: dateStr, rule: activeRule });
            } else {
              setSelectedDateInfo(null);
            }
          }}
        />

        {selectedDateInfo && (
          <div className="mt-10 p-6 bg-orange-900 rounded-xl border-2 border-orange-500">
            <h3 className="text-2xl font-bold mb-4">
              Active Rule for{' '}
              {new Date(selectedDateInfo.date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-lg">
              <div>
                <strong>First Start Time:</strong>{' '}
                {selectedDateInfo.rule.first_start_time.slice(0, 5)}
              </div>
              <div>
                <strong>Last End Offset:</strong>{' '}
                {selectedDateInfo.rule.last_end_offset_minutes} minutes before sunset
              </div>
              <div>
                <strong>Days of Week:</strong>{' '}
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
                  .filter((_, i) => selectedDateInfo.rule.days_of_week.includes(i + 1))
                  .join(', ')}
              </div>
              <div>
                <strong>Rule Active Period:</strong>{' '}
                {new Date(selectedDateInfo.rule.start_date).toLocaleDateString()} →{' '}
                {new Date(selectedDateInfo.rule.end_date).toLocaleDateString()}
              </div>
              <div className="md:col-span-2 text-sm text-orange-200">
                <strong>Created:</strong>{' '}
                {new Date(selectedDateInfo.rule.created_at).toLocaleString()}
              </div>
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={() => setSelectedDateInfo(null)}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-medium"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl">
        <h2 className="text-3xl font-bold mb-8 text-center">Create Recurring Rule</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <label className="block text-xl mb-2">Start Date</label>
            <DatePicker
              selected={range.from}
              onChange={d => setRange(prev => ({ ...prev, from: d }))}
              className="p-4 bg-gray-700 text-white border border-gray-600 rounded w-full text-xl"
              placeholderText="Select start date"
            />
          </div>
          <div>
            <label className="block text-xl mb-2">End Date</label>
            <DatePicker
              selected={range.to}
              onChange={d => setRange(prev => ({ ...prev, to: d }))}
              className="p-4 bg-gray-700 text-white border border-gray-600 rounded w-full text-xl"
              placeholderText="Select end date"
            />
          </div>
        </div>

        <div className="mb-8">
          <label className="block text-xl mb-4">Days of Week</label>
          <div className="grid grid-cols-7 gap-4">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
              <label key={i} className="text-center">
                <input
                  type="checkbox"
                  checked={daysOfWeek.includes(i + 1)}
                  onChange={e => {
                    if (e.target.checked) {
                      setDaysOfWeek(prev => [...prev, i + 1]);
                    } else {
                      setDaysOfWeek(prev => prev.filter(d => d !== i + 1));
                    }
                  }}
                  className="mr-2"
                />
                {day}
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <label className="block text-xl mb-2">First Start Time</label>
            <input
              type="time"
              value={firstStart}
              onChange={e => setFirstStart(e.target.value)}
              className="p-4 bg-gray-700 text-white border border-gray-600 rounded w-full text-xl"
            />
          </div>
          <div>
            <label className="block text-xl mb-2">Minutes before sunset for last end</label>
            <select
              value={offsetMins}
              onChange={e => setOffsetMins(parseInt(e.target.value))}
              className="p-4 bg-gray-700 text-white border border-gray-600 rounded w-full text-xl"
            >
              <option value={0}>0 minutes (end at sunset)</option>
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>60 minutes</option>
              <option value={90}>90 minutes</option>
            </select>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={saveRule}
            className="bg-orange-600 hover:bg-orange-700 px-12 py-6 rounded text-3xl font-bold"
          >
            Save Recurring Rule
          </button>
        </div>
      </div>
    </div>
  );
}