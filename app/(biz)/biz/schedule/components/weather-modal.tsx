'use client';

import { useEffect, useRef } from 'react';
import { format, parseISO } from 'date-fns';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  ChevronLeft, ChevronRight, Wind, Sun, Cloud, CloudRain, 
  Snowflake, CloudLightning, Sunrise, Sunset, Droplets, Waves, LucideIcon 
} from 'lucide-react';
import { DailyWeather } from '@/app/actions/weather';

// --- HELPER: Map WMO Weather Codes to Lucide Icons ---
const getWeatherIcon = (code: number): LucideIcon => {
  if (code >= 95) return CloudLightning;
  if (code >= 71) return Snowflake;
  if (code >= 51) return CloudRain;
  if (code >= 45) return Wind;
  if (code >= 1 && code <= 3) return Cloud;
  return Sun;
};

interface WeatherModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  locationName: string;
  data: DailyWeather | null;
  onNavigate: (direction: 'prev' | 'next') => void;
}

export function WeatherModal({ 
  isOpen, 
  onOpenChange, 
  locationName, 
  data, 
  onNavigate 
}: WeatherModalProps) {
  
  const hourlyScrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to current hour
  useEffect(() => {
    if (isOpen && hourlyScrollRef.current) {
        const currentHour = new Date().getHours();
        const hourIndex = Math.max(0, currentHour - 6);
        const scrollPos = Math.max(0, (hourIndex * 88) - 40); 
        setTimeout(() => {
            if(hourlyScrollRef.current) {
                hourlyScrollRef.current.scrollTo({ left: scrollPos, behavior: 'smooth' });
            }
        }, 200);
    }
  }, [isOpen, data]);

  // Desktop Scroll Handler
  const scrollHourly = (dir: 'left' | 'right') => {
      if(hourlyScrollRef.current) {
          const scrollAmount = 200;
          const currentLeft = hourlyScrollRef.current.scrollLeft;
          hourlyScrollRef.current.scrollTo({
              left: dir === 'left' ? currentLeft - scrollAmount : currentLeft + scrollAmount,
              behavior: 'smooth'
          });
      }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {/* SEMANTIC: Use 'bg-background' and 'border-border' for modal container */}
      <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0 bg-background border-border">
          
          {/* HEADER */}
          <DialogHeader className="p-4 pb-2 border-b border-border shrink-0 bg-background z-10">
              <DialogTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xl">
                      {data?.code && data.code > 50 ? (
                        <CloudRain className="w-8 h-8 text-blue-500 dark:text-blue-400" />
                      ) : (
                        <Sun className="w-8 h-8 text-yellow-500 dark:text-yellow-400" />
                      )}
                      <div className="flex flex-col">
                          <div className="text-sm uppercase tracking-wide opacity-70 text-muted-foreground">{locationName}</div>
                          <div className="flex items-center gap-2 mt-1">
                              <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={() => onNavigate('prev')}><ChevronLeft className="w-4 h-4"/></Button>
                              <span className="text-lg font-bold min-w-[120px] text-center text-foreground">{data?.date ? format(parseISO(data.date), 'EEE, MMM do') : ''}</span>
                              <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={() => onNavigate('next')}><ChevronRight className="w-4 h-4"/></Button>
                          </div>
                      </div>
                  </div>
                  {/* Sunrise / Sunset */}
                  <div className="flex flex-col items-end gap-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1"><Sunrise className="w-3 h-3 text-amber-500"/> <span>{data?.sunrise || '--:--'}</span></div>
                      <div className="flex items-center gap-1"><Sunset className="w-3 h-3 text-indigo-500"/> <span>{data?.sunset || '--:--'}</span></div>
                  </div>
              </DialogTitle>
          </DialogHeader>
          
          {/* SCROLLABLE BODY */}
          <div className="overflow-y-auto p-4 space-y-6 max-w-[calc(100vw-32px)]">
          {data ? (
              <>
                  {/* Top Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {/* TEMP CARD: Use 'bg-card' or 'bg-muted' */}
                      <div className="bg-card dark:bg-muted/30 p-4 rounded-xl flex flex-col items-center justify-center text-center border border-border col-span-2 md:col-span-1">
                          <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-widest mb-1">Temp</span>
                          <div className="flex items-baseline gap-1">
                              <span className="text-3xl font-black text-foreground">{data.max_temp}°</span>
                              <span className="text-lg text-muted-foreground font-medium">/ {data.min_temp}°</span>
                          </div>
                      </div>
                      
                      {/* WIND */}
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg flex flex-col items-center justify-center border border-blue-100 dark:border-blue-800">
                          <Wind className="w-5 h-5 text-blue-500 dark:text-blue-400 mb-1" />
                          <span className="font-mono font-bold text-sm text-foreground">{data.avg_wind ?? '--'} mph</span>
                          <span className="text-[10px] text-muted-foreground uppercase">Avg Wind</span>
                      </div>
                      
                      {/* RAIN */}
                      <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg flex flex-col items-center justify-center border border-purple-100 dark:border-purple-800">
                          <CloudRain className="w-5 h-5 text-purple-500 dark:text-purple-400 mb-1" />
                          <span className="font-mono font-bold text-sm text-foreground">{data.precip_chance ?? 0}%</span>
                          <span className="text-[10px] text-muted-foreground uppercase">Chance Rain</span>
                      </div>
                      
                      {/* UV */}
                      <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg flex flex-col items-center justify-center border border-amber-100 dark:border-amber-800">
                          <Sun className="w-5 h-5 text-amber-500 dark:text-amber-400 mb-1" />
                          <span className="font-mono font-bold text-sm text-foreground">{data.uv_index ?? '-'}</span>
                          <span className="text-[10px] text-muted-foreground uppercase">UV Index</span>
                      </div>
                  </div>

                  {/* HOURLY FORECAST */}
                  <div className="relative group">
                      <div className="text-xs font-bold text-muted-foreground uppercase mb-2 flex justify-between items-center">
                          <span>Hourly Timeline</span>
                          <span className="text-[10px] font-normal opacity-50 md:hidden">Swipe to see more</span>
                      </div>
                      
                      {/* Desktop Arrows */}
                      <Button variant="secondary" size="icon" className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => scrollHourly('left')}>
                          <ChevronLeft className="w-4 h-4"/>
                      </Button>
                      <Button variant="secondary" size="icon" className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => scrollHourly('right')}>
                          <ChevronRight className="w-4 h-4"/>
                      </Button>

                      {/* HOURLY SCROLL STRIP */}
                      <div ref={hourlyScrollRef} className="flex overflow-x-auto gap-2 pb-4 w-full snap-x touch-pan-x relative no-scrollbar md:scrollbar-thin">
                          {data.hourly && data.hourly.length > 0 ? data.hourly.map((h, i) => {
                              const Icon = getWeatherIcon(h.code);
                              return (
                                  // SEMANTIC: Hourly card styling
                                  <div key={i} className="snap-center flex-shrink-0 w-20 flex flex-col items-center gap-1 p-2 rounded-lg border border-border bg-card hover:bg-accent transition-colors">
                                      <span className="text-[10px] text-muted-foreground font-bold">{h.time}</span>
                                      <Icon className={`w-5 h-5 ${h.code > 50 ? 'text-blue-500 dark:text-blue-400' : 'text-yellow-500 dark:text-yellow-400'}`} />
                                      <span className="text-sm font-bold text-foreground">{h.temp}°</span>
                                      <div className="flex items-center gap-1 text-[9px] text-blue-500 dark:text-blue-400 font-mono">
                                          <Wind className="w-2 h-2" /> {h.wind}
                                      </div>
                                  </div>
                              );
                          }) : (
                              <div className="w-full text-center text-xs text-muted-foreground py-4">Hourly data unavailable</div>
                          )}
                      </div>
                  </div>

                  {/* PISMO TIDES */}
                  {locationName.includes('Pismo') && (
                      <div className="border border-border rounded-xl overflow-hidden">
                          {/* Header: Use primary color if desired, or 'bg-muted' for neutral */}
                          <div className="bg-blue-600 dark:bg-blue-700 text-white p-2 px-4 flex items-center gap-2">
                              <Waves className="w-4 h-4" />
                              <span className="font-bold text-sm uppercase tracking-wide">Tide Chart (NOAA)</span>
                          </div>
                          
                          <div className="bg-blue-50/50 dark:bg-blue-900/10 p-0 grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-border">
                              {data.tides && data.tides.length > 0 ? data.tides.map((tide, idx) => (
                                  <div key={idx} className="flex flex-col items-center justify-center p-3 hover:bg-white/50 dark:hover:bg-white/5 transition-colors">
                                      <div className="text-xs text-muted-foreground font-bold mb-1">{tide.type} Tide</div>
                                      <div className="flex items-center gap-1 mb-1">
                                          {tide.type === 'High' ? (
                                            <ChevronLeft className="w-3 h-3 rotate-90 text-blue-600 dark:text-blue-400" />
                                          ) : (
                                            <ChevronLeft className="w-3 h-3 -rotate-90 text-slate-400" />
                                          )}
                                          <span className="font-mono font-bold text-sm text-foreground">{tide.height}</span>
                                      </div>
                                      {/* Time Pill */}
                                      <div className="text-[10px] bg-muted px-1.5 rounded text-muted-foreground font-medium">
                                        {tide.time}
                                      </div>
                                  </div>
                              )) : (
                                  <div className="col-span-4 p-4 text-center text-xs text-muted-foreground">Tide data unavailable for this date</div>
                              )}
                          </div>
                      </div>
                  )}
              </>
          ) : (
              <div className="py-10 text-center text-muted-foreground">
                  <Cloud className="w-12 h-12 mx-auto mb-2 opacity-20" />
                  <p>No forecast data available for this date.</p>
              </div>
          )}
          </div>
      </DialogContent>
    </Dialog>
  );
}