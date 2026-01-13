'use client';

import { useState } from 'react';
import { Sun, Cloud, CloudRain, Snowflake, CloudLightning, Wind } from 'lucide-react';
import { DailyWeather } from '@/app/actions/weather';
import { WeatherModal } from '../../schedule/components/weather-modal'; 

// Helper to map icons
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
  
  // SEMANTIC: Dual-tone colors for icons (Darker for Light Mode, Lighter for Dark Mode)
  const color = data.code > 50 
    ? "text-blue-500 dark:text-blue-400" 
    : "text-yellow-600 dark:text-yellow-400";

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        // SEMANTIC: 
        // - Removed hard slate background -> hover:bg-accent (Ghost style)
        // - Text -> text-foreground
        // - Border -> Transparent by default, border-border on hover
        className="group flex items-center gap-2 bg-transparent hover:bg-accent text-foreground border border-transparent hover:border-border px-3 py-1.5 rounded-full transition-all"
        title="View Hourly Forecast"
      >
        <Icon className={`w-4 h-4 ${color} group-hover:scale-110 transition-transform`} />
        
        <span className="text-sm font-bold font-mono text-foreground">
          {data.max_temp}°
        </span>
        
        <span className="text-xs text-muted-foreground group-hover:text-foreground/80 transition-colors">
          / {data.min_temp}°
        </span>
      </button>

      <WeatherModal 
        isOpen={isOpen} 
        onOpenChange={setIsOpen}
        locationName={location}
        data={data}
        onNavigate={() => {}} 
      />
    </>
  );
}