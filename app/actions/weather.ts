'use server';

import { addDays, format, isBefore, subDays } from 'date-fns';

/**
 * ------------------------------------------------------------------
 * TYPES & INTERFACES
 * ------------------------------------------------------------------
 */
export interface HourlyData {
  time: string; // "HH:mm" (24h format or AM/PM based on preference, using "h a" here)
  temp: number;
  wind: number;
  precip: number;
  code: number;
}

export interface TideData {
  time: string; // "h:mm a"
  type: 'High' | 'Low';
  height: string; // "4.5 ft"
}

export interface DailyWeather {
  date: string; // YYYY-MM-DD
  min_temp: number;
  max_temp: number;
  code: number;
  condition: string;
  // New Fields for Detailed View
  sunrise?: string;
  sunset?: string;
  hourly?: HourlyData[];
  tides?: TideData[];
}

// Coordinate Mapping for SunBuggy Locations
const COORDS: Record<string, { lat: number; lng: number }> = {
  'Las Vegas': { lat: 36.1699, lng: -115.1398 },
  'Pismo':     { lat: 35.1428, lng: -120.6412 }, // Pismo Beach
  'Michigan':  { lat: 43.6667, lng: -86.5000 },  // Silver Lake Sand Dunes
};

// NOAA Station ID for Pismo (Port San Luis)
const PISMO_STATION_ID = '9412110'; 

/**
 * ------------------------------------------------------------------
 * HELPER: WMO Weather Code to String
 * ------------------------------------------------------------------
 */
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
 * ------------------------------------------------------------------
 * FETCH TIDES (NOAA API) - Pismo Only
 * ------------------------------------------------------------------
 */
async function fetchTides(dateStr: string): Promise<TideData[]> {
  try {
    // Format date for NOAA: YYYYMMDD
    const noaaDate = dateStr.replace(/-/g, '');
    
    // NOAA CO-OPS API: Predictions for High/Low tides
    const url = `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?date=${noaaDate}&station=${PISMO_STATION_ID}&product=predictions&datum=MLLW&time_zone=lst_ldt&units=english&interval=hilo&format=json`;
    
    const res = await fetch(url, { next: { revalidate: 3600 } }); // Cache for 1 hour
    const data = await res.json();

    if (!data.predictions) return [];

    return data.predictions.map((p: any) => ({
      time: format(new Date(`${dateStr}T${p.t}`.slice(0, 16)), 'h:mm a'), // Convert 'HH:mm' to 'h:mm a'
      type: p.type === 'H' ? 'High' : 'Low',
      height: `${parseFloat(p.v).toFixed(1)} ft`
    }));

  } catch (error) {
    console.error("Error fetching tides:", error);
    return [];
  }
}

/**
 * ------------------------------------------------------------------
 * MAIN ACTION: Get Location Weather (Real Data)
 * ------------------------------------------------------------------
 */
export async function getLocationWeather(
  location: string, 
  startDate: string, 
  days = 7
): Promise<DailyWeather[]> {
  
  // 1. Get Coordinates
  const locKey = Object.keys(COORDS).find(k => location.includes(k)) || 'Las Vegas';
  const { lat, lng } = COORDS[locKey];

  // 2. Determine Date Range
  // Open-Meteo supports past days (historical) and forecast
  const start = new Date(startDate);
  const end = addDays(start, days - 1);
  const startStr = format(start, 'yyyy-MM-dd');
  const endStr = format(end, 'yyyy-MM-dd');

  try {
    // 3. Construct Open-Meteo URL
    // We request daily max/min, sunrise/sunset, and hourly temp/wind/precip/weathercode
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&start_date=${startStr}&end_date=${endStr}&daily=temperature_2m_max,temperature_2m_min,weathercode,sunrise,sunset&hourly=temperature_2m,windspeed_10m,precipitation_probability,weathercode&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto`;

    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error("Weather API failed");
    
    const data = await res.json();
    const daily = data.daily;
    const hourly = data.hourly;

    const result: DailyWeather[] = [];

    // 4. Process Each Day
    for (let i = 0; i < daily.time.length; i++) {
      const date = daily.time[i];
      
      // -- Process Hourly Data for this specific date --
      const dayHourly: HourlyData[] = [];
      
      // Open-Meteo returns one giant flat array for hourly. We need to slice 24 hours per day.
      // Index math: Day 'i' corresponds to indices [i*24] to [(i+1)*24 - 1]
      const hourStartIdx = i * 24;
      
      // Filter for operating hours (e.g., 6 AM to 10 PM) to save frontend space?
      // Or just map all 24 hours. Let's map 6 AM to 10 PM (16 hours).
      for (let h = 6; h <= 22; h++) {
        const idx = hourStartIdx + h;
        if (hourly.time[idx]) {
           // Time string comes as "YYYY-MM-DDTHH:mm". We just want "9 AM"
           const rawTime = hourly.time[idx];
           const hourObj = new Date(rawTime);
           
           dayHourly.push({
             time: format(hourObj, 'h a'), // "9 AM"
             temp: Math.round(hourly.temperature_2m[idx]),
             wind: Math.round(hourly.windspeed_10m[idx]),
             precip: hourly.precipitation_probability[idx],
             code: hourly.weathercode[idx]
           });
        }
      }

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
        hourly: dayHourly,
        tides: tides
      });
    }

    return result;

  } catch (error) {
    console.error(`Weather Fetch Error for ${location}:`, error);
    
    // FALLBACK: Return Historical Norms if API fails
    return Array.from({ length: days }).map((_, i) => {
        const d = addDays(new Date(startDate), i);
        return getHistoricalNorm(location, d);
    });
  }
}

/**
 * ------------------------------------------------------------------
 * FALLBACK: Historical Norms (Simplified)
 * ------------------------------------------------------------------
 */
function getHistoricalNorm(location: string, date: Date): DailyWeather {
    const month = date.getMonth(); 
    const norms: Record<string, number[]> = {
        'Las Vegas': [58, 61, 70, 78, 88, 99, 105, 103, 95, 82, 67, 57],
        'Pismo':     [62, 62, 64, 66, 67, 69, 70, 71, 72, 71, 68, 62],
        'Michigan':  [30, 34, 45, 58, 69, 79, 83, 81, 74, 61, 47, 35]
    };
    const locKey = Object.keys(norms).find(k => location.includes(k)) || 'Las Vegas';
    const maxTemp = norms[locKey][month] || 70;
    
    return { 
        date: format(date, 'yyyy-MM-dd'), 
        min_temp: maxTemp - 15, 
        max_temp: maxTemp, 
        code: 1, 
        condition: 'Seasonal Norm',
        sunrise: '6:00 AM',
        sunset: '8:00 PM',
        hourly: [],
        tides: []
    };
}