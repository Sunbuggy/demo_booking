// app/biz/pismo-params/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { createClient } from '@/utils/supabase/client';  // Client-side, sync
import { useRouter } from 'next/navigation';

export default function PismoParamsManager() {
  const [params, setParams] = useState<Record<string, any>>({});
  const [selectedDay, setSelectedDay] = useState<Date | undefined>(undefined);
  const [isBusy, setIsBusy] = useState<boolean>(false);
  const [offsetMins, setOffsetMins] = useState<number>(60);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  const supabase = createClient();  // ← No await here
  const router = useRouter();

  useEffect(() => {
    const fetchParams = async () => {
      const { data, error } = supabase.from('pismo_rental_params').select('*');
      if (error) {
        console.error(error);
        setLoading(false);
        return;
      }
      const map: Record<string, any> = {};
      data?.forEach(p => (map[p.rental_date] = p));
      setParams(map);
      setLoading(false);
    };
    fetchParams();
  }, []);

  const saveParam = async () => {
    if (!selectedDay) return;
    setSaving(true);
    const dateStr = selectedDay.toISOString().split('T')[0];

    const { error } = await supabase
      .from('pismo_rental_params')
      .upsert({
        rental_date: dateStr,
        is_busy_day: isBusy,
        last_end_offset_minutes: offsetMins
      });

    if (!error) {
      setParams(prev => ({
        ...prev,
        [dateStr]: { is_busy_day: isBusy, last_end_offset_minutes: offsetMins }
      }));
      setSelectedDay(undefined);
    } else {
      alert('Error saving: ' + error.message);
    }
    setSaving(false);
  };

  const modifiers = {
    busy: Object.keys(params)
      .filter(d => params[d].is_busy_day)
      .map(d => new Date(d)),
    slow: Object.keys(params)
      .filter(d => !params[d].is_busy_day)
      .map(d => new Date(d))
  };

  const modifiersStyles = {
    busy: { backgroundColor: '#ff6900', color: 'white', fontWeight: 'bold' },
    slow: { backgroundColor: '#10b981', color: 'white', fontWeight: 'bold' }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading parameters...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-8 bg-gray-900 text-white min-h-screen">
      <h1 className="text-4xl font-bold text-center mb-8 text-orange-500">
        Pismo Rental Parameters Manager
      </h1>
      <p className="text-center mb-12 text-xl">
        Click a day to set busy (orange) or slow (green) mode.<br />
        Busy: last end 30 min before sunset, earlier first start<br />
        Slow: last end 60 min before sunset, later first start
      </p>

      <div className="bg-gray-800 p-8 rounded-2xl">
        <DayPicker
          modifiers={modifiers}
          modifiersStyles={modifiersStyles}
          onDayClick={day => {
            const dateStr = day.toISOString().split('T')[0];
            const existing = params[dateStr];
            setSelectedDay(day);
            setIsBusy(existing?.is_busy_day ?? false);
            setOffsetMins(existing?.last_end_offset_minutes ?? 60);
          }}
          className="mx-auto"
        />
      </div>

      {selectedDay && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-10 rounded-3xl max-w-md w-full">
            <h2 className="text-3xl font-bold mb-6 text-center">
              {selectedDay.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </h2>

            <div className="space-y-6">
              <label className="flex items-center text-xl">
                <input
                  type="checkbox"
                  checked={isBusy}
                  onChange={e => setIsBusy(e.target.checked)}
                  className="mr-4 w-6 h-6"
                />
                Busy Day (30 min before sunset, earlier start times)
              </label>

              <div>
                <label className="block text-xl mb-2">Minutes before sunset for last end time</label>
                <select
                  value={offsetMins}
                  onChange={e => setOffsetMins(parseInt(e.target.value))}
                  className="p-4 bg-gray-700 rounded w-full text-xl"
                >
                  <option value={30}>30 minutes</option>
                  <option value={60}>60 minutes</option>
                </select>
              </div>
            </div>

            <div className="flex justify-center gap-6 mt-10">
              <button
                onClick={saveParam}
                disabled={saving}
                className="bg-orange-600 hover:bg-orange-700 px-8 py-4 rounded text-2xl"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => setSelectedDay(undefined)}
                className="bg-gray-600 hover:bg-gray-700 px-8 py-4 rounded text-2xl"
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