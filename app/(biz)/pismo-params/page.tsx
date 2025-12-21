// app/(biz)/pismo-params/page.tsx
// Pismo Rental Parameters Manager Page
// This is a client component that allows managers to define "busy" vs "slow" days
// for Pismo rental scheduling rules. Busy days have earlier first start and
// stricter last end time (30 min before sunset). Slow days allow later starts
// and last end 60 min before sunset.
//
// The rules are stored in the Supabase table 'pismo_rental_params' with columns:
// - rental_date (string, YYYY-MM-DD)
// - is_busy_day (boolean)
// - last_end_offset_minutes (number, 30 or 60)
//
// The calendar highlights busy days in orange and slow days in green.
// Clicking a day opens a modal to set the rule for that date.
//
// This component is a client component because it uses interactive UI libraries
// (react-day-picker, date inputs, modals) that require browser APIs.

'use client';

import { useState, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css'; // Correct import for react-day-picker v9+
import { createClient } from '@/utils/supabase/client'; // Client-side Supabase (no await at top level)

export default function PismoParamsManager() {
  // State for Supabase client — created in useEffect to avoid top-level await
  const [supabase, setSupabase] = useState<any>(null);

  // Loading state while fetching initial rules
  const [loading, setLoading] = useState<boolean>(true);

  // All loaded rules mapped by date string (e.g., "2025-12-20")
  const [params, setParams] = useState<Record<string, any>>({});

  // Currently selected day from calendar click
  const [selectedDay, setSelectedDay] = useState<Date | undefined>(undefined);

  // Values for the modal form
  const [isBusy, setIsBusy] = useState<boolean>(false);
  const [offsetMins, setOffsetMins] = useState<number>(60);

  // Saving state for the modal button
  const [saving, setSaving] = useState<boolean>(false);

  // Initialize Supabase client on component mount (client-side only)
  useEffect(() => {
    const client = createClient();
    setSupabase(client);
  }, []);

  // Fetch existing rules once Supabase client is ready
  useEffect(() => {
    if (!supabase) return;

    const fetchParams = async () => {
      setLoading(true);
      try {
        // Fetch all rows from pismo_rental_params table
        const { data, error } = await supabase
          .from('pismo_rental_params')
          .select('*');

        if (error) throw error;

        // Convert array to object keyed by rental_date for fast lookup
        const map: Record<string, any> = {};
        data?.forEach((row: any) => {
          map[row.rental_date] = row;
        });

        setParams(map);
      } catch (err) {
        console.error('Error fetching Pismo rental parameters:', err);
        alert('Failed to load existing rules. Check console for details.');
      } finally {
        setLoading(false);
      }
    };

    fetchParams();
  }, [supabase]);

  // Save or update a rule for the selected day
  const saveParam = async () => {
    if (!supabase || !selectedDay) return;

    setSaving(true);
    try {
      const dateStr = selectedDay.toISOString().split('T')[0]; // YYYY-MM-DD

      // Upsert (insert or update) the rule
      const { error } = await supabase
        .from('pismo_rental_params')
        .upsert({
          rental_date: dateStr,
          is_busy_day: isBusy,
          last_end_offset_minutes: offsetMins,
        });

      if (error) throw error;

      // Update local state optimistically
      setParams((prev) => ({
        ...prev,
        [dateStr]: { is_busy_day: isBusy, last_end_offset_minutes: offsetMins },
      }));

      // Close modal and reset form
      setSelectedDay(undefined);
      setIsBusy(false);
      setOffsetMins(60);
    } catch (err: any) {
      console.error('Error saving Pismo rental parameter:', err);
      alert(`Failed to save rule: ${err.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  // Calendar modifiers for visual highlighting
  const modifiers = {
    busy: Object.keys(params)
      .filter((date) => params[date].is_busy_day)
      .map((date) => new Date(date)),
    slow: Object.keys(params)
      .filter((date) => !params[date].is_busy_day)
      .map((date) => new Date(date)),
  };

  const modifiersStyles = {
    busy: { backgroundColor: '#ff6900', color: 'white', fontWeight: 'bold' },
    slow: { backgroundColor: '#10b981', color: 'white', fontWeight: 'bold' },
  };

  // Handle day click — open modal and pre-fill with existing rule (if any)
  const handleDayClick = (day: Date | undefined) => {
    if (!day) return;

    const dateStr = day.toISOString().split('T')[0];
    const existing = params[dateStr];

    setSelectedDay(day);
    setIsBusy(existing?.is_busy_day ?? false);
    setOffsetMins(existing?.last_end_offset_minutes ?? 60);
  };

  // Loading state while initial data is fetched
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center">
        <p className="text-xl text-gray-300">Loading Pismo rental parameters...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8 bg-gray-900 text-white min-h-screen">
      {/* Page header */}
      <h1 className="text-4xl font-bold text-center mb-8 text-orange-500">
        Pismo Rental Parameters Manager
      </h1>
      <p className="text-center mb-12 text-xl text-gray-300">
        Click a day to set busy (orange) or slow (green) mode.<br />
        Busy: last end 30 min before sunset, earlier first start<br />
        Slow: last end 60 min before sunset, later first start
      </p>

      {/* Calendar with highlighted rules */}
      <div className="bg-gray-800 p-8 rounded-2xl shadow-lg">
        <DayPicker
          modifiers={modifiers}
          modifiersStyles={modifiersStyles}
          onDayClick={handleDayClick}
          className="mx-auto"
        />
      </div>

      {/* Edit modal when a day is selected */}
      {selectedDay && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-10 rounded-3xl max-w-md w-full shadow-2xl">
            <h2 className="text-3xl font-bold mb-6 text-center text-orange-500">
              {selectedDay.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </h2>

            <div className="space-y-8">
              {/* Busy day checkbox */}
              <label className="flex items-center text-xl">
                <input
                  type="checkbox"
                  checked={isBusy}
                  onChange={(e) => setIsBusy(e.target.checked)}
                  className="mr-4 w-6 h-6 rounded"
                />
                Busy Day (30 min before sunset, earlier start times)
              </label>

              {/* Offset minutes selector */}
              <div>
                <label className="block text-xl mb-3">
                  Minutes before sunset for last end time
                </label>
                <select
                  value={offsetMins}
                  onChange={(e) => setOffsetMins(parseInt(e.target.value))}
                  className="w-full p-4 bg-gray-700 rounded text-xl"
                >
                  <option value={30}>30 minutes</option>
                  <option value={60}>60 minutes</option>
                </select>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex justify-center gap-6 mt-12">
              <button
                onClick={saveParam}
                disabled={saving}
                className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 px-10 py-4 rounded text-2xl font-bold transition"
              >
                {saving ? 'Saving...' : 'Save Rule'}
              </button>
              <button
                onClick={() => setSelectedDay(undefined)}
                className="bg-gray-600 hover:bg-gray-700 px-10 py-4 rounded text-2xl font-bold transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}