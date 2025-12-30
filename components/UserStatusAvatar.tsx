'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { 
  Popover, PopoverContent, PopoverTrigger 
} from "@/components/ui/popover";
import { 
  Dialog, DialogContent 
} from "@/components/ui/dialog"; 
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Phone, Mail, MessageSquare, Pencil, 
  Clock, Coffee, Timer, AlertCircle, Smartphone,
  LogOut, Sun, Moon, User as UserIcon
} from 'lucide-react'; // Added UserIcon import
import moment from 'moment';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';

import SmartTimeClock from '@/app/(biz)/biz/users/admin/tables/employee/time-clock/clock-in';

type Status = 'online' | 'break' | 'offline' | 'late';

export default function UserStatusAvatar({ 
  user, 
  currentUserLevel = 0,
  isCurrentUser = false,
  size = 'md' 
}: { 
  user: any; 
  currentUserLevel?: number;
  isCurrentUser?: boolean;
  size?: 'sm' | 'md' | 'lg' ;
  onClick?: () => void;
}) {
  const supabase = createClient();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  
  const [status, setStatus] = useState<Status>('offline');
  const [activeEntry, setActiveEntry] = useState<any>(null);
  const [todayShift, setTodayShift] = useState<any>(null);
  const [now, setNow] = useState(moment());
  
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isTimeClockOpen, setIsTimeClockOpen] = useState(false);

  const isAdmin = currentUserLevel >= 900;

  useEffect(() => {
    if (!user?.id) return;

    const fetchData = async () => {
      // 1. Get Active Time Entry
      const { data: timeData } = await supabase
        .from('time_entries')
        .select('*')
        .eq('user_id', user.id)
        .is('end_time', null)
        .maybeSingle();

      // 2. Get Today's Schedule
      const startOfDay = moment().startOf('day').toISOString();
      const endOfDay = moment().endOf('day').toISOString();
      
      const { data: shiftData } = await supabase
        .from('employee_schedules')
        .select('*')
        .eq('user_id', user.id)
        .gte('start_time', startOfDay)
        .lte('start_time', endOfDay)
        .maybeSingle();
      
      setTodayShift(shiftData);
      setActiveEntry(timeData);

      // 3. Determine Status
      if (timeData) {
        setStatus(timeData.is_on_break === true ? 'break' : 'online');
      } else if (shiftData) {
        const currentTime = moment();
        const shiftStart = moment(shiftData.start_time);
        const shiftEnd = moment(shiftData.end_time);

        if (currentTime.isBetween(shiftStart, shiftEnd)) {
            setStatus('late'); 
        } else {
            setStatus('offline');
        }
      } else {
        setStatus('offline');
      }
    };

    fetchData();

    // 4. Real-Time Subscription
    const channel = supabase
      .channel(`live-status-${user.id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'time_entries', 
        filter: `user_id=eq.${user.id}` 
      }, () => fetchData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id, supabase]);

  // Timer Tick
  useEffect(() => {
    const timer = setInterval(() => {
        setNow(moment());
        if ((status === 'offline' || status === 'late') && todayShift) {
            const currentTime = moment();
            const shiftStart = moment(todayShift.start_time);
            const shiftEnd = moment(todayShift.end_time);
            if (currentTime.isBetween(shiftStart, shiftEnd) && !activeEntry) {
                setStatus('late');
            } else if (status === 'late' && !currentTime.isBetween(shiftStart, shiftEnd)) {
                setStatus('offline');
            }
        }
    }, 60000);
    return () => clearInterval(timer);
  }, [status, todayShift, activeEntry]);

  // Duration String
  const durationStr = useMemo(() => {
    let startTime = null;
    if (status === 'break' && activeEntry?.break_start) startTime = moment(activeEntry.break_start);
    else if (status === 'online' && activeEntry?.start_time) startTime = moment(activeEntry.start_time);
    else if (status === 'late' && todayShift?.start_time) startTime = moment(todayShift.start_time);

    if (!startTime) return null;
    const diff = moment.duration(now.diff(startTime));
    const hours = Math.floor(diff.asHours());
    const minutes = diff.minutes();
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  }, [activeEntry, status, todayShift, now]);

  const handleSignOut = async () => {
      await supabase.auth.signOut();
      router.push('/login');
  };

  // Visuals
  const dims = size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-16 h-16' : 'w-10 h-10';
  const dotSize = size === 'sm' ? 'h-2.5 w-2.5' : 'h-3.5 w-3.5';
  
  const statusColors = {
      online: 'bg-green-500',
      break: 'bg-orange-500',
      late: 'bg-red-600',
      offline: 'bg-slate-300'
  };

  const statusIcons = {
      online: <Clock className="w-4 h-4 text-green-600" />,
      break: <Coffee className="w-4 h-4 text-orange-600" />,
      late: <AlertCircle className="w-4 h-4 text-red-600" />,
      offline: <Clock className="w-4 h-4 text-slate-400" />
  };

  if (!user) return null;

  return (
    <>
    {/* TIMECLOCK MODAL */}
    {isCurrentUser && (
        <Dialog open={isTimeClockOpen} onOpenChange={setIsTimeClockOpen}>
            <DialogContent className="max-w-md p-0 border-none bg-transparent shadow-none">
                <SmartTimeClock employeeId={user.id} onClose={() => setIsTimeClockOpen(false)} />
            </DialogContent>
        </Dialog>
    )}

    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>
        <div className="relative cursor-pointer hover:opacity-80 transition-opacity" onClick={(e) => e.stopPropagation()}>
          <div className={cn(dims, "rounded-full overflow-hidden bg-slate-200 border border-slate-300 flex items-center justify-center relative")}>
            {user.avatar_url ? (
              <Image src={user.avatar_url} alt={user.full_name || 'User'} fill className="object-cover" />
            ) : (
              <span className="font-bold text-slate-500 text-xs">
                {user.full_name?.substring(0, 2).toUpperCase() || '??'}
              </span>
            )}
          </div>
          <span 
            className={cn(
                "absolute bottom-0 right-0 block rounded-full ring-2 ring-white transition-colors duration-300",
                dotSize,
                statusColors[status]
            )} 
            title={status.toUpperCase()}
          />
        </div>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0 shadow-xl border-slate-200 dark:border-slate-800" align="start">
        
        {/* HEADER */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b dark:border-slate-800 flex justify-between items-start">
          <div className="flex gap-3 items-center">
             <div className="w-12 h-12 rounded-full overflow-hidden border border-slate-300 relative bg-slate-200">
                {user.avatar_url ? (
                    <Image src={user.avatar_url} alt={user.full_name} fill className="object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-slate-400">
                        {user.full_name?.substring(0, 2).toUpperCase()}
                    </div>
                )}
             </div>
             <div>
                <h4 className="font-bold text-lg leading-none text-slate-900 dark:text-slate-100">{user.full_name}</h4>
                <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider font-semibold">{user.job_title}</p>
             </div>
          </div>
          {/* Admin Edit Shortcut (Only if not self) */}
          {(isAdmin && !isCurrentUser) && (
            <Link href={`/biz/users/admin/employee/${user.id}`}>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/30" title="Edit Profile">
                <Pencil className="w-4 h-4" />
              </Button>
            </Link>
          )}
        </div>

        <div className="p-4 space-y-4">
          
          {/* LIVE STATUS INDICATOR */}
          <div className={cn("flex items-center justify-between p-3 rounded-lg border shadow-sm select-none", 
              status === 'late' ? "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-900" : "bg-white dark:bg-slate-950 dark:border-slate-800"
          )}>
            <div className="flex items-center gap-2">
              {statusIcons[status]}
              <div className="flex flex-col">
                  <span className="text-sm font-bold capitalize leading-none text-slate-900 dark:text-slate-100">
                      {status === 'late' ? 'Absent / Late' : status === 'online' ? 'Clocked In' : status}
                  </span>
                  {status === 'late' && <span className="text-[10px] text-red-600 dark:text-red-400 font-medium">Should be working</span>}
              </div>
            </div>
            {durationStr && status !== 'offline' && (
              <div className={cn("flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded border",
                  status === 'late' ? "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-200" : 
                  status === 'break' ? "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/40 dark:text-orange-200" : 
                  "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/40 dark:text-green-200"
              )}>
                <Timer className="w-3 h-3" /> {durationStr}
              </div>
            )}
          </div>

          {/* === MODE A: SELF VIEW (Controls) === */}
          {isCurrentUser ? (
            <div className="space-y-2 pt-2">
                {/* 1. Timeclock - Primary Action */}
                <Button 
                    variant="outline" 
                    className="w-full h-16 flex flex-row items-center justify-center gap-2 border-blue-200 bg-blue-50/50 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/20" 
                    onClick={() => { setIsPopoverOpen(false); setIsTimeClockOpen(true); }}
                >
                    <Clock className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-bold text-blue-700 dark:text-blue-300">Timeclock</span>
                </Button>

                {/* 2. My Profile & Theme */}
                <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" className="flex justify-center gap-2 text-xs" asChild>
                        <Link href={`/biz/users/${user.id}`}>
                            <UserIcon className="w-4 h-4" /> My Profile
                        </Link>
                    </Button>
                    <Button 
                        variant="outline" 
                        className="flex justify-center gap-2 text-xs" 
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    >
                        {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                        Theme
                    </Button>
                </div>

                {/* 3. Sign Out */}
                <Button variant="destructive" className="w-full gap-2 text-xs mt-1" onClick={handleSignOut}>
                    <LogOut className="w-4 h-4" /> Sign Out
                </Button>
            </div>
          ) : (
            /* === MODE B: OTHER VIEW (Contact) === */
            <>
              {/* Today's Schedule */}
              <div className="space-y-1.5 select-none">
                <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1"><Clock className="w-3 h-3"/> Today's Schedule</p>
                {todayShift ? (
                  <div className="text-sm bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-2 rounded border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                    <span className="font-bold font-mono">
                        {moment(todayShift.start_time).format('h:mm A')} - {moment(todayShift.end_time).format('h:mm A')}
                    </span>
                    <Badge variant="outline" className="text-[10px] h-5 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700">{todayShift.role}</Badge>
                  </div>
                ) : (
                  <div className="text-sm text-slate-400 italic bg-slate-50 dark:bg-slate-900 p-2 rounded border border-dashed border-slate-200 dark:border-slate-800">
                      Not scheduled today
                  </div>
                )}
              </div>

              {/* Read-Only Contact Info */}
              <div className="space-y-2 pt-2 border-t dark:border-slate-800">
                <div className="grid grid-cols-1 gap-2">
                    <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 p-2 rounded border dark:border-slate-800">
                        <Smartphone className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="font-mono select-all">{user.phone || 'No Phone'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 p-2 rounded border dark:border-slate-800">
                        <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="truncate select-all">{user.email || 'No Email'}</span>
                    </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                <Button variant="outline" size="sm" className="flex flex-col h-12 gap-0.5 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 dark:hover:bg-blue-900/20" asChild>
                  <a href={`tel:${user.phone}`}>
                    <Phone className="w-4 h-4" />
                    <span className="text-[10px] font-medium">Call</span>
                  </a>
                </Button>
                
                <Button variant="outline" size="sm" className="flex flex-col h-12 gap-0.5 hover:bg-green-50 hover:text-green-600 hover:border-green-200 dark:hover:bg-green-900/20" asChild>
                    <a href={`sms:${user.phone}`}>
                        <MessageSquare className="w-4 h-4" />
                        <span className="text-[10px] font-medium">Text</span>
                    </a>
                </Button>

                {/* Email now opens in new tab */}
                <Button variant="outline" size="sm" className="flex flex-col h-12 gap-0.5 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200 dark:hover:bg-purple-900/20" asChild>
                  <a href={`mailto:${user.email}`} target="_blank" rel="noopener noreferrer">
                    <Mail className="w-4 h-4" />
                    <span className="text-[10px] font-medium">Email</span>
                  </a>
                </Button>
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
    </>
  );
}