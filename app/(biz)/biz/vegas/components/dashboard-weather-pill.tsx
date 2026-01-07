'use client';

import { useState } from 'react';
import { Sun, Cloud, CloudRain, Snowflake, CloudLightning, Wind } from 'lucide-react';
import { DailyWeather } from '@/app/actions/weather';
import { WeatherModal } from '../../schedule/components/weather-modal'; // Import from your existing location

// Helper to map icons (same as your modal logic)
const getWeatherIcon = (code: number) => {
  if (code >= 95) return CloudLightning;
  if (code >= 71) return Snowflake;
  if (code >= 51) return CloudRain;
  if (code >= 45) return Wind;
  if (code >= 1 && code <= 3) return Cloud;
  return Sun;
};

export default function DashboardWeatherPill({ 
  data, 
  location = 'Las Vegas' 
}: { 
  data: DailyWeather, 
  location?: string 
}) {
  const [isOpen, setIsOpen] = useState(false);
  
  if (!data) return null;

  const Icon = getWeatherIcon(data.code);
  const color = data.code > 50 ? "text-blue-400" : "text-yellow-400";

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="group flex items-center gap-2 bg-slate-900/80 hover:bg-slate-800 border border-slate-700 hover:border-slate-500 text-slate-200 px-3 py-1.5 rounded-full transition-all shadow-sm backdrop-blur-md"
        title="View Hourly Forecast"
      >
        <Icon className={`w-4 h-4 ${color} group-hover:scale-110 transition-transform`} />
        <span className="text-sm font-bold font-mono">{data.max_temp}°</span>
        <span className="text-xs text-slate-500 group-hover:text-slate-400">/ {data.min_temp}°</span>
      </button>

      <WeatherModal 
        isOpen={isOpen} 
        onOpenChange={setIsOpen}
        locationName={location}
        data={data}
        onNavigate={() => {}} // Navigation disabled for single-day dashboard view
      />
    </>
  );
}