// app/api/pismo/times/route.ts

import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server'; // Your server Supabase client (uses service_role safely)
import SunCalc from 'suncalc';

const PISMO_LAT = 35.1428;
const PISMO_LNG = -120.6413;
const SLOT_INTERVAL_MINUTES = 30; // Or whatever interval you want for starts

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dateStr = searchParams.get('date');
  if (!dateStr) return NextResponse.json({ error: 'Date required' }, { status: 400 });

  const supabase = createClient();

  const { data: rules } = await supabase
    .from('pismo_rental_rules')
    .select('*')
    .order('created_at', { ascending: false });

  if (!rules || rules.length === 0) return NextResponse.json({ startTimes: [] });

  const targetDate = new Date(dateStr);
  const dayOfWeek = targetDate.getDay() + 1; // 1=Mon, 7=Sun

  // Find most recent applicable rule
  const activeRule = rules.find(rule => {
    const start = new Date(rule.start_date);
    const end = new Date(rule.end_date);
    return targetDate >= start && targetDate <= end && rule.days_of_week.includes(dayOfWeek);
  });

  if (!activeRule) return NextResponse.json({ startTimes: [] });

  // Sunset
  const sunTimes = SunCalc.getTimes(targetDate, PISMO_LAT, PISMO_LNG);
  const sunset = sunTimes.sunset;

  // Last allowed end time
  const lastEndTime = new Date(sunset.getTime() - activeRule.last_end_offset_minutes * 60 * 1000);

  // First start from rule (e.g., "08:00:00" -> 8:00)
  const [hours, minutes] = activeRule.first_start_time.split(':').map(Number);
  let currentTime = new Date(targetDate);
  currentTime.setHours(hours, minutes, 0, 0);

  const startTimes: string[] = [];

  // Generate starts every 30 min until a 4-hour ride would end after lastEndTime
  while (true) {
    const rideEnd = new Date(currentTime.getTime() + 4 * 60 * 60 * 1000); // Max duration check
    if (rideEnd > lastEndTime) break;

    startTimes.push(currentTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }));

    currentTime = new Date(currentTime.getTime() + SLOT_INTERVAL_MINUTES * 60 * 1000);
  }

  return NextResponse.json({
    startTimes,
    offsetMinutes: activeRule.last_end_offset_minutes,
    firstStartTime: activeRule.first_start_time.slice(0, 5),
  });
}