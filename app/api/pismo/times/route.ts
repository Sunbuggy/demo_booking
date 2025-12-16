// app/api/pismo/times/route.ts
import { NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// Pismo Beach coordinates for sunset
const PISMO_LAT = 35.1428;
const PISMO_LNG = -120.6413;

function getSunsetTime(date: Date): Date {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  const J = day - 32075 + Math.floor(1461 * (year + 4800 + Math.floor((month - 14) / 12)) / 4)
           + Math.floor(367 * (month - 2 - Math.floor((month - 14) / 12) * 12) / 12)
           - Math.floor(3 * Math.floor((year + 4900 + Math.floor((month - 14) / 12)) / 100) / 4);

  const n = J - 2451545;
  const L = (n + 0.0009 + PISMO_LNG / 360) % 1;
  const M = (357.5291 + 0.98560028 * n) % 360;
  const C = 1.9148 * Math.sin(M * Math.PI / 180) + 0.0200 * Math.sin(2 * M * Math.PI / 180) + 0.0003 * Math.sin(3 * M * Math.PI / 180);
  const lambda = (L + C / 360 + 1.9148 * Math.sin(M * Math.PI / 180) + 0.0200 * Math.sin(2 * M * Math.PI / 180)) % 1;

  const declination = Math.asin(Math.sin(23.4393 * Math.PI / 180) * Math.sin(lambda * 360 * Math.PI / 180));
  const hourAngle = Math.acos((Math.sin(-0.83 * Math.PI / 180) - Math.sin(PISMO_LAT * Math.PI / 180) * Math.sin(declination)) /
                              (Math.cos(PISMO_LAT * Math.PI / 180) * Math.cos(declination)));

  const sunsetHours = 12 + (hourAngle * 180 / Math.PI / 15);
  const sunset = new Date(date);
  sunset.setHours(Math.floor(sunsetHours));
  sunset.setMinutes(Math.round((sunsetHours % 1) * 60));
  return sunset;
}

function timeStrToHours(timeStr: string): number {
  const match = timeStr.match(/(\d+):(\d+)/);
  if (!match) return 9;
  let hours = parseInt(match[1]);
  if (timeStr.includes('PM') && hours !== 12) hours += 12;
  if (timeStr.includes('AM') && hours === 12) hours = 0;
  return hours;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const dateStr = searchParams.get('date');

  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return Response.json({ error: 'Invalid date' }, { status: 400 });
  }

  const targetDate = new Date(dateStr);
  const jsDay = targetDate.getDay(); // 0=Sun ... 6=Sat
  const ruleDay = jsDay === 0 ? 7 : jsDay; // 1=Mon ... 7=Sun
  const sunset = getSunsetTime(targetDate);

  const supabase = await createClient();

  const { data: rules, error } = await supabase
    .from('pismo_rental_rules')
    .select('*')
    .lte('start_date', dateStr)
    .or(`end_date.gte.${dateStr},end_date.is.null`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching rules:', error);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }

  const rule = rules?.find(r => r.days_of_week.includes(ruleDay));

  if (!rule) {
    return Response.json({ startTimes: [] });
  }

  const firstStartHours = timeStrToHours(rule.first_start_time || '10:00:00');
  const offsetMins = rule.last_end_offset_minutes || 45;

  const lastEnd = new Date(sunset);
  lastEnd.setMinutes(lastEnd.getMinutes() - offsetMins);

  const startTimes: string[] = [];
  let current = new Date(targetDate);
  current.setHours(Math.floor(firstStartHours), 0, 0, 0);

  const maxStart = new Date(lastEnd);
  maxStart.setHours(maxStart.getHours() - 1);

  while (current <= maxStart) {
    const h = current.getHours();
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
    startTimes.push(`${displayH.toString().padStart(2, '0')}:00 ${period}`);
    current.setHours(current.getHours() + 1);
  }

  return Response.json({ startTimes });
}