// app/api/pismo/pricing/route.ts - Return most recent applicable pricing rule(s) for date/time

import { NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');        // YYYY-MM-DD
  const start = searchParams.get('start');      // e.g., "10:00 AM"
  const end = searchParams.get('end');          // e.g., "14:00 PM"

  if (!date) {
    return Response.json({ error: 'Date is required' }, { status: 400 });
  }

  const supabase = await createClient();

  // Find rules that are active on the date
  const { data: rules, error } = await supabase
    .from('pismo_pricing_rules')
    .select('*')
    .lte('start_date', date)
    .or(`end_date.gte.${date},end_date.is.null`)
    .order('created_at', { ascending: false }); // Most recent first

  if (error) {
    console.error('Error fetching pricing rules:', error);
    return Response.json({ error: 'Failed to load pricing' }, { status: 500 });
  }

  if (rules.length === 0) {
    return Response.json([]);
  }

  // Convert start/end time to 24-hour for comparison
  const timeToMinutes = (timeStr: string | null) => {
    if (!timeStr) return null;
    const match = timeStr.match(/(\d+):(\d+) (\w+)/);
    if (!match) return null;
    let hours = parseInt(match[1]);
    const mins = parseInt(match[2]);
    if (match[3] === 'PM' && hours !== 12) hours += 12;
    if (match[3] === 'AM' && hours === 12) hours = 0;
    return hours * 60 + mins;
  };

  const startMins = start ? timeToMinutes(start) : null;
  const endMins = end ? timeToMinutes(end) : null;

  // Filter rules that match day of week and time range (if specified)
  const targetDay = new Date(date).getDay(); // 0=Sun ... 6=Sat
  const ruleDay = targetDay === 0 ? 7 : targetDay; // Convert to 1=Mon ... 7=Sun

  const applicable = rules.filter(rule => {
    if (!rule.days_of_week?.includes(ruleDay)) return false;

    const ruleStart = rule.start_time ? timeToMinutes(rule.start_time) : null;
    const ruleEnd = rule.end_time ? timeToMinutes(rule.end_time) : null;

    // If rule has time range, check if selected slot fits
    if (ruleStart !== null && startMins !== null && startMins < ruleStart) return false;
    if (ruleEnd !== null && endMins !== null && endMins > ruleEnd) return false;

    return true;
  });

  if (applicable.length === 0) {
    return Response.json([]);
  }

  // Most recent rule wins, then sort by sort_order
  const mostRecent = applicable[0]; // already sorted by created_at desc
  const sorted = applicable.sort((a, b) => (a.sort_order || 100) - (b.sort_order || 100));

  return Response.json(sorted);
}