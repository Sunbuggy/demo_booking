'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarDays, Clock, Briefcase, Loader2, AlertTriangle } from 'lucide-react';
import moment from 'moment';
import Link from 'next/link';

interface Shift {
  id: string;
  start_time: string;
  end_time: string;
  role: string;
  location_id: string;
}

export default function MySchedulePage() {
  const supabase = createClient();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMySchedule = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        window.location.href = '/login'; 
        return;
      }

      // Show shifts starting from Yesterday so they can see recent history
      const yesterday = moment().subtract(1, 'day').startOf('day').toISOString();

      const { data } = await supabase
        .from('employee_schedules')
        .select('*')
        .eq('user_id', user.id)
        .gte('start_time', yesterday)
        .order('start_time', { ascending: true });

      if (data) setShifts(data);
      setLoading(false);
    };

    fetchMySchedule();
  }, []);

  // Helper: Group shifts by "Week of [Date]"
  const groupedShifts = shifts.reduce((acc, shift) => {
    const weekStart = moment(shift.start_time).startOf('isoWeek').format('MMM Do');
    if (!acc[weekStart]) acc[weekStart] = [];
    acc[weekStart].push(shift);
    return acc;
  }, {} as Record<string, Shift[]>);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4 min-h-screen pb-20 bg-background">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6 pt-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Schedule</h1>
          <p className="text-muted-foreground text-sm">Upcoming Shifts</p>
        </div>
        <Link href="/biz/users/admin/tables/employee/time-clock">
            <Button variant="outline" size="sm">
                <Clock className="w-4 h-4 mr-2" /> Time Clock
            </Button>
        </Link>
      </div>

      {/* Empty State */}
      {shifts.length === 0 && (
        <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed">
          <CalendarDays className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
          <h3 className="font-semibold text-foreground">No shifts found</h3>
          <p className="text-muted-foreground text-sm">You are not on the roster for upcoming weeks.</p>
        </div>
      )}

      {/* Schedule List */}
      <div className="space-y-8">
        {Object.entries(groupedShifts).map(([weekLabel, weekShifts]) => (
          <div key={weekLabel}>
            <div className="flex items-center gap-3 mb-4">
               <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                  Week of {weekLabel}
               </span>
               <div className="h-px bg-border flex-1"></div>
            </div>

            <div className="space-y-3">
              {weekShifts.map((shift) => {
                const start = moment(shift.start_time);
                const end = moment(shift.end_time);
                const isToday = start.isSame(moment(), 'day');
                const isPast = end.isBefore(moment());

                return (
                  <Card 
                    key={shift.id} 
                    className={`
                        border-l-4 shadow-sm transition-all
                        ${isToday ? 'border-l-blue-500 bg-blue-50/10 dark:bg-blue-900/10' : 'border-l-muted-foreground/30'}
                        ${isPast ? 'opacity-60 grayscale' : ''}
                    `}
                  >
                    <CardContent className="p-4 flex items-center justify-between">
                      
                      {/* Left: Date Box (Updated for Dark Mode) */}
                      <div className={`
                          flex flex-col items-center justify-center w-14 h-14 rounded-lg mr-4 border 
                          ${isToday ? 'bg-background border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400' : 'bg-muted/50 border-muted text-muted-foreground'}
                      `}>
                        <span className="text-xs font-bold uppercase">{start.format('ddd')}</span>
                        <span className="text-xl font-bold leading-none">{start.format('D')}</span>
                      </div>

                      {/* Middle: Details */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            {/* --- FIX: Changed text-slate-900 to text-foreground --- */}
                            <span className="font-bold text-foreground text-lg">
                                {start.format('h:mm A')} - {end.format('h:mm A')}
                            </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1 bg-muted px-2 py-1 rounded-full font-medium">
                                <Briefcase className="w-3 h-3" /> {shift.role}
                            </span>
                        </div>
                      </div>

                      {/* Right: Status Indicator */}
                      {isToday && (
                          <div className="text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-widest rotate-90 origin-center translate-x-2">
                              Today
                          </div>
                      )}

                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}