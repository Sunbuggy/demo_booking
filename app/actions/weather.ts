'use server';

import { createClient } from '@/utils/supabase/server';
import moment from 'moment';

export interface DailyWeather {
  date: string;
  min_temp: number;
  max_temp: number;
  code: number;
  precip_chance: number;
}

const COORDINATES: Record<string, { lat: number; lon: number }> = {
  'Las Vegas': { lat: 36.1716, lon: -115.1391 },
  'Pismo': { lat: 35.1428, lon: -120.6413 },
  'Michigan': { lat: 43.6606, lon: -86.4906 } 
};

export async function getLocationWeather(location: string, startDate: string, days: number = 7): Promise<DailyWeather[]> {
  console.log(`🌤️ [Weather] Request for ${location} starting ${startDate}`); // DEBUG
  
  const supabase = await createClient();
  const coords = COORDINATES[location];
  
  if (!coords) {
    console.error(`❌ [Weather] No coords found for ${location}`);
    return [];
  }

  const endDate = moment(startDate).add(days - 1, 'days').format('YYYY-MM-DD');

  // 1. Check Cache
  const { data: cached, error: cacheError } = await supabase.from('weather_cache')
    .select('*')
    .eq('location', location)
    .gte('date', startDate)
    .lte('date', endDate);

  if (cacheError) console.error("⚠️ [Weather] Cache Read Error:", cacheError);

  // Check staleness
  const isStale = !cached || cached.length < days || cached.some(d => moment().diff(moment(d.updated_at), 'hours') > 4);

  if (!isStale && cached) {
    console.log(`✅ [Weather] Returning cached data for ${location}`);
    return cached.map(d => ({
      date: d.date, 
      min_temp: d.min_temp_f, 
      max_temp: d.max_temp_f, 
      code: d.weather_code, 
      precip_chance: d.precipitation_chance
    }));
  }

  // 2. Fetch External (Open-Meteo)
  console.log(`🔄 [Weather] Fetching fresh data from API for ${location}...`);
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&temperature_unit=fahrenheit&timezone=auto&start_date=${startDate}&end_date=${endDate}`;
    
    const res = await fetch(url, { next: { revalidate: 0 } });
    
    if (!res.ok) {
        console.error(`❌ [Weather] API Failed: ${res.statusText}`);
        return [];
    }

    const data = await res.json();
    
    if (!data.daily) {
        console.error("❌ [Weather] No 'daily' key in API response:", data);
        return [];
    }

    const forecasts: DailyWeather[] = data.daily.time.map((t: string, i: number) => ({
      date: t,
      min_temp: Math.round(data.daily.temperature_2m_min[i]),
      max_temp: Math.round(data.daily.temperature_2m_max[i]),
      code: data.daily.weather_code[i],
      precip_chance: data.daily.precipitation_probability_max[i]
    }));

    // 3. Update Cache
    const { error: upsertError } = await supabase.from('weather_cache').upsert(forecasts.map(f => ({
      location, 
      date: f.date, 
      min_temp_f: f.min_temp, 
      max_temp_f: f.max_temp,
      weather_code: f.code, 
      precipitation_chance: f.precip_chance, 
      updated_at: new Date().toISOString()
    })), { onConflict: 'location,date' });

    if (upsertError) {
        console.error("⚠️ [Weather] Cache Write Error (RLS?):", upsertError);
    } else {
        console.log("💾 [Weather] Cache updated successfully");
    }

    return forecasts;

  } catch (e) {
    console.error("❌ [Weather] Critical Error:", e);
    return [];
  }
}