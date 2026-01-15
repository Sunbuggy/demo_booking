// app/biz/pismo-times/page.tsx - Recurring Rules Manager
'use client';

import { useState, useEffect } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { createClient } from '@/utils/supabase/client';

// ------------------------------------------------------------------
// TYPE DEFINITIONS
// ------------------------------------------------------------------

interface RentalRule {
  id: number;
  created_at: string;
  start_date: string; // ISO date string (YYYY-MM-DD)
  end_date: string | null; // Can be null if ongoing
  days_of_week: number[]; // Array of integers (1-7)
  first_start_time: string; // Time string (HH:MM:SS)
  last_end_offset_minutes: number;
}

interface SelectedDateInfo {
  date: string;
  rule: RentalRule;
}

export default function PismoTimesManager() {
  // ----------------------------------------------------------------
  // STATE MANAGEMENT
  // ----------------------------------------------------------------
  
  const [rules, setRules] = useState<RentalRule[]>([]);
  
  const [range, setRange] = useState<{ from: Date | null; to: Date | null }>({ 
    from: null, 
    to: null 
  });
  
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]); // 1=Mon ... 7=Sun
  const [firstStart, setFirstStart] = useState<string>('10:00');
  const [offsetMins, setOffsetMins] = useState<number>(45);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  
  const [selectedDateInfo, setSelectedDateInfo] = useState<SelectedDateInfo | null>(null);

  const supabase = createClient();

  // ----------------------------------------------------------------
  // UTILITY: TIMEZONE SAFE DATE STRING
  // This replaces toISOString() to fix the "Day Off" bug.
  // It extracts the Year/Month/Day exactly as they exist in the user's local browser time.
  // ----------------------------------------------------------------
  const getLocalDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // ----------------------------------------------------------------
  // HANDLERS
  // ----------------------------------------------------------------

  const handleStartDateChange = (date: Date | null) => {
    setRange((prev) => ({ ...prev, from: date }));
  };

  const handleEndDateChange = (date: Date | null) => {
    setRange((prev) => ({ ...prev, to: date }));
  };

  // ----------------------------------------------------------------
  // DATA FETCHING & LOGIC
  // ----------------------------------------------------------------

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('pismo_rental_rules')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch error:', error);
    }
    
    setRules((data as RentalRule[]) || []);
    setLoading(false);
  };

  const saveRule = async () => {
    if (!range.from || daysOfWeek.length === 0) {
      alert('Please select start date and days of week');
      return;
    }

    setSaving(true);

    // FIXED: Use getLocalDateString to ensure the saved date matches the selected date
    const payload = {
      start_date: getLocalDateString(range.from),
      end_date: range.to ? getLocalDateString(range.to) : null,
      days_of_week: daysOfWeek,
      first_start_time: firstStart + ':00',
      last_end_offset_minutes: offsetMins,
    };

    const { error } = await supabase.from('pismo_rental_rules').insert(payload);

    if (error) {
      alert('Error saving rule: ' + error.message);
    } else {
      await fetchRules();
      // Reset form
      setRange({ from: null, to: null });
      setDaysOfWeek([]);
      setFirstStart('10:00');
      setOffsetMins(45);
      alert('Rule saved successfully!');
    }

    setSaving(false);
  };

  /**
   * Client-side rule finder for calendar highlight.
   */
  const getActiveRuleForDate = (dateStr: string): RentalRule | null => {
    // We append T00:00:00 to force local interpretation for the math, 
    // but the inputs are already strictly YYYY-MM-DD string comparisons logic below.
    const checkDate = new Date(dateStr + 'T00:00:00'); 
    
    // getDay() returns 0 for Sunday, we want 7.
    const jsDay = checkDate.getDay(); 
    const ruleDay = jsDay === 0 ? 7 : jsDay; 

    const applicable = rules.filter(rule => {
      // Create date objects for comparison, ensuring we treat them as "start of day"
      const start = new Date(rule.start_date + 'T00:00:00');
      const end = rule.end_date ? new Date(rule.end_date + 'T00:00:00') : new Date('2999-12-31T00:00:00');
      
      return checkDate >= start && checkDate <= end && rule.days_of_week.includes(ruleDay);
    });

    if (applicable.length === 0) return null;

    // If multiple rules apply, pick the most recently created one
    return applicable.reduce((latest, curr) =>
      new Date(curr.created_at) > new Date(latest.created_at) ? curr : latest
    );
  };

  // Build affected dates for calendar visualization
  const affectedDates = new Set<string>();
  const dateToRuleMap = new Map<string, RentalRule>();

  const today = new Date();
  const startYear = today.getFullYear() - 1;
  const endYear = today.getFullYear() + 2;

  // Loop through dates to pre-calculate which ones have active rules
  for (let y = startYear; y <= endYear; y++) {
    for (let m = 0; m < 12; m++) {
      const days = new Date(y, m + 1, 0).getDate();
      for (let d = 1; d <= days; d++) {
        // Construct standard YYYY-MM-DD string manually
        const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const rule = getActiveRuleForDate(dateStr);
        if (rule) {
          // We must store the specific date string, not a Date object, in the Set for logic
          // But react-day-picker modifiers need Date objects.
          affectedDates.add(dateStr);
          dateToRuleMap.set(dateStr, rule);
        }
      }
    }
  }

  // Helper to safely parse YYYY-MM-DD string back to Date for the DayPicker modifiers
  const parseDateStr = (str: string) => new Date(str + 'T00:00:00');

  const modifiers = { 
    affected: Array.from(affectedDates).map(d => parseDateStr(d)) 
  };
  
  const modifiersStyles = { 
    affected: { 
      backgroundColor: 'hsl(var(--primary))', 
      color: 'hsl(var(--primary-foreground))', 
      fontWeight: 'bold' 
    } 
  };

  if (loading) return <div className="p-8 text-center text-2xl text-foreground animate-pulse">Loading rules...</div>;

  return (
    <div className="max-w-5xl mx-auto p-8 bg-background text-foreground min-h-screen">
      
      <h1 className="text-4xl font-bold text-center mb-8 text-primary">
        Pismo Times Manager
      </h1>

      {/* CALENDAR SECTION */}
      <div className="bg-card text-card-foreground p-8 rounded-2xl mb-12 shadow-sm border border-border">
        <DayPicker
          modifiers={modifiers}
          modifiersStyles={modifiersStyles}
          className="mx-auto p-4 bg-background rounded-xl border border-border"
          onDayClick={(date) => {
            // FIXED: Use getLocalDateString instead of toISOString()
            // This guarantees that if you click "28th", you get "202X-XX-28"
            const dateStr = getLocalDateString(date);
            const rule = dateToRuleMap.get(dateStr) || getActiveRuleForDate(dateStr);
            setSelectedDateInfo(rule ? { date: dateStr, rule } : null);
          }}
        />

        {selectedDateInfo && (
          <div className="mt-10 p-6 bg-primary/10 rounded-xl border-2 border-primary text-foreground">
            <h3 className="text-2xl font-bold mb-4">
              {/* Parse the YYYY-MM-DD string explicitly to display cleanly */}
              Active Rule for {new Date(selectedDateInfo.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-lg">
              <div><strong>First Start:</strong> {selectedDateInfo.rule.first_start_time.slice(0, 5)}</div>
              <div><strong>Offset:</strong> {selectedDateInfo.rule.last_end_offset_minutes} min before sunset</div>
              <div><strong>Days:</strong> {['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
                .filter((_, i) => selectedDateInfo.rule.days_of_week.includes(i + 1))
                .join(', ')}</div>
              {/* Ensure displayed start/end dates are also timezone corrected by appending T00:00:00 */}
              <div><strong>Period:</strong> {new Date(selectedDateInfo.rule.start_date + 'T00:00:00').toLocaleDateString()} → {selectedDateInfo.rule.end_date ? new Date(selectedDateInfo.rule.end_date + 'T00:00:00').toLocaleDateString() : 'Ongoing'}</div>
            </div>
            <div className="mt-6 text-center">
              <button 
                onClick={() => setSelectedDateInfo(null)} 
                className="px-6 py-3 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CREATE RULE FORM */}
      <div className="bg-card text-card-foreground p-8 rounded-2xl shadow-sm border border-border">
        <h2 className="text-3xl font-bold mb-8 text-center text-foreground">Create Recurring Rule</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <label className="block text-xl mb-2 text-muted-foreground">Start Date</label>
            <DatePicker 
              selected={range.from} 
              onChange={handleStartDateChange} 
              className="p-4 bg-background border border-input rounded w-full text-xl focus:ring-2 focus:ring-ring focus:outline-none text-foreground" 
              placeholderText="Select start date" 
            />
          </div>

          <div>
            <label className="block text-xl mb-2 text-muted-foreground">End Date (optional)</label>
            <DatePicker 
              selected={range.to} 
              onChange={handleEndDateChange} 
              className="p-4 bg-background border border-input rounded w-full text-xl focus:ring-2 focus:ring-ring focus:outline-none text-foreground" 
              placeholderText="Select end date (or leave blank)" 
            />
          </div>
        </div>

        <div className="mb-8">
          <label className="block text-xl mb-4 text-muted-foreground">Days of Week</label>
          <div className="grid grid-cols-7 gap-4">
            {['M','T','W','T','F','S','S'].map((day, i) => (
              <label key={i} className="text-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={daysOfWeek.includes(i + 1)} 
                  onChange={e => {
                    if (e.target.checked) setDaysOfWeek(prev => [...prev, i + 1]);
                    else setDaysOfWeek(prev => prev.filter(d => d !== i + 1));
                  }} 
                  className="mr-2 accent-primary h-5 w-5" 
                />
                <span className="block mt-1 font-medium">{day}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <label className="block text-xl mb-2 text-muted-foreground">First Start Time</label>
            <input 
              type="time" 
              value={firstStart} 
              onChange={e => setFirstStart(e.target.value)} 
              className="p-4 bg-background border border-input rounded w-full text-xl focus:ring-2 focus:ring-ring focus:outline-none text-foreground" 
            />
          </div>
          <div>
            <label className="block text-xl mb-2 text-muted-foreground">Minutes before sunset for last end</label>
            <select 
              value={offsetMins} 
              onChange={e => setOffsetMins(parseInt(e.target.value))} 
              className="p-4 bg-background border border-input rounded w-full text-xl focus:ring-2 focus:ring-ring focus:outline-none text-foreground"
            >
              <option value={0}>0 minutes</option>
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
            disabled={saving} 
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-12 py-6 rounded text-3xl font-bold disabled:opacity-50 transition-colors shadow-md"
          >
            {saving ? 'Saving...' : 'Save Recurring Rule'}
          </button>
        </div>
      </div>
    </div>
  );
}