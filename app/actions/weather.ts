'use server';

import { addDays, format } from 'date-fns';

/**
 * ------------------------------------------------------------------
 * TYPES & INTERFACES
 * ------------------------------------------------------------------
 */
export interface HourlyData {
  time: string; // "9 AM"
  temp: number;
  wind: number;
  precip: number;
  code: number;
}

export interface TideData {
  time: string; 
  type: 'High' | 'Low';
  height: string; 
}

export interface DailyWeather {
  date: string; 
  min_temp: number;
  max_temp: number;
  code: number;
  condition: string;
  sunrise?: string;
  sunset?: string;
  // Metrics for the Summary Cards
  avg_wind?: number;          
  precip_chance?: number;     
  uv_index?: number; 
  hourly?: HourlyData[];
  tides?: TideData[];
}

// Coordinate Mapping
const COORDS: Record<string, { lat: number; lng: number }> = {
  'Las Vegas': { lat: 36.1699, lng: -115.1398 },
  'Pismo':     { lat: 35.1428, lng: -120.6412 },
  'Michigan':  { lat: 43.6667, lng: -86.5000 },
};

// NOAA Station: Port San Luis (9412110)
const PISMO_STATION_ID = '9412110'; 

const getWeatherCondition = (code: number): string => {
  if (code === 0) return 'Clear Sky';
  if (code >= 1 && code <= 3) return 'Partly Cloudy';
  if (code >= 45 && code <= 48) return 'Foggy';
  if (code >= 51 && code <= 55) return 'Drizzle';
  if (code >= 61 && code <= 65) return 'Rain';
  if (code >= 71 && code <= 77) return 'Snow';
  if (code >= 80 && code <= 82) return 'Showers';
  if (code >= 95) return 'Thunderstorm';
  return 'Unknown';
};

/**
 * FETCH TIDES (NOAA API)
 * FIXED: Uses 'begin_date' and 'end_date' instead of 'date' to allow specific dates.
 */
async function fetchTides(dateStr: string): Promise<TideData[]> {
  try {
    // 1. Prepare Date Format: YYYYMMDD
    // Ensure we strip any time component or timezone issues by slicing first
    const cleanDateStr = dateStr.slice(0, 10); 
    const noaaDate = cleanDateStr.replace(/-/g, ''); // 2026-01-07 -> 20260107
    
    // 2. Construct URL with begin_date and end_date
    const url = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?begin_date=${noaaDate}&end_date=${noaaDate}&station=${PISMO_STATION_ID}&product=predictions&datum=MLLW&time_zone=lst_ldt&units=english&interval=hilo&format=json`;
    
    const res = await fetch(url, { next: { revalidate: 3600 } });
    
    if (!res.ok) {
        console.error(`[TIDE ERROR] NOAA API Status: ${res.status}`);
        return [];
    }
    
    const data = await res.json();

    if (data.error) {
        console.error(`[TIDE ERROR] NOAA Message: ${data.error.message}`);
        return [];
    }
    
    if (!data.predictions) {
         return [];
    }

    return data.predictions.map((p: any) => ({
      time: format(new Date(`${cleanDateStr}T${p.t.split(' ')[1]}`), 'h:mm a'),
      type: p.type === 'H' ? 'High' : 'Low',
      height: `${parseFloat(p.v).toFixed(1)} ft`
    }));

  } catch (error) {
    console.error("Error fetching tides:", error);
    return [];
  }
}

/**
 * MAIN ACTION: Get Live Weather
 */
export async function getLocationWeather(
  location: string, 
  startDate: string, 
  days = 7
): Promise<DailyWeather[]> {
  
  const locKey = Object.keys(COORDS).find(k => location.includes(k)) || 'Las Vegas';
  const { lat, lng } = COORDS[locKey];

  const start = new Date(startDate);
  const end = addDays(start, days - 1);
  const startStr = format(start, 'yyyy-MM-dd');
  const endStr = format(end, 'yyyy-MM-dd');

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&start_date=${startStr}&end_date=${endStr}&daily=temperature_2m_max,temperature_2m_min,weathercode,sunrise,sunset,precipitation_probability_max,windspeed_10m_max,uv_index_max&hourly=temperature_2m,windspeed_10m,precipitation_probability,weathercode&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto`;

    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error(`Weather API failed`);
    
    const data = await res.json();
    const daily = data.daily;
    const hourly = data.hourly;

    const result: DailyWeather[] = [];

    for (let i = 0; i < daily.time.length; i++) {
      const date = daily.time[i];
      
      // -- Process Hourly & Calculate Average Wind --
      const dayHourly: HourlyData[] = [];
      let totalWind = 0;
      let count = 0;
      const hourStartIdx = i * 24;
      
      // Loop through 6 AM to 10 PM (Operating Hours)
      for (let h = 6; h <= 22; h++) {
        const idx = hourStartIdx + h;
        if (hourly.time[idx]) {
           const rawTime = hourly.time[idx];
           const wind = hourly.windspeed_10m[idx];
           
           // Accumulate for Average
           totalWind += wind;
           count++;

           dayHourly.push({
             time: format(new Date(rawTime), 'h a'),
             temp: Math.round(hourly.temperature_2m[idx]),
             wind: Math.round(wind),
             precip: hourly.precipitation_probability[idx],
             code: hourly.weathercode[idx]
           });
        }
      }

      const avgWind = count > 0 ? Math.round(totalWind / count) : 0;

      // -- Process Tides (Pismo Only) --
      let tides: TideData[] = [];
      if (locKey === 'Pismo') {
        tides = await fetchTides(date);
      }

      result.push({
        date: date,
        min_temp: Math.round(daily.temperature_2m_min[i]),
        max_temp: Math.round(daily.temperature_2m_max[i]),
        code: daily.weathercode[i],
        condition: getWeatherCondition(daily.weathercode[i]),
        sunrise: format(new Date(daily.sunrise[i]), 'h:mm a'),
        sunset: format(new Date(daily.sunset[i]), 'h:mm a'),
        // Average Wind from hourly calculation
        avg_wind: avgWind,
        // Max Precip from daily forecast (Industry Standard for "% Chance")
        precip_chance: daily.precipitation_probability_max[i],
        uv_index: Math.round(daily.uv_index_max[i]),
        hourly: dayHourly,
        tides: tides
      });
    }

    return result;

  } catch (error) {
    console.error(`Weather Fetch Error for ${location}:`, error);
    // Return Fallback
    return Array.from({ length: days }).map((_, i) => ({
        date: format(addDays(new Date(startDate), i), 'yyyy-MM-dd'), 
        min_temp: 60, max_temp: 80, code: 1, condition: 'Data Unavailable',
        sunrise: '--:--', sunset: '--:--', avg_wind: 0, precip_chance: 0,
        hourly: [], tides: []
    }));
  }
}