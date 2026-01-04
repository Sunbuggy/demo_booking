'use client'; 

import { useState, useEffect, useMemo, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { 
  Popover, PopoverContent, PopoverTrigger 
} from "@/components/ui/popover";
import { 
  Dialog, DialogContent, DialogTitle, DialogDescription 
} from "@/components/ui/dialog"; 
import { Button } from '@/components/ui/button';
import { 
  Phone, Mail, MessageSquare, Pencil, 
  Clock, Coffee, Timer, AlertCircle, 
  LogOut, Sun, Moon, User, Play, Square, Calendar 
} from 'lucide-react';
import moment from 'moment';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';

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
  size?: 'sm' | 'md' | 'lg' 
}) {
  const supabase = createClient();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  
  const [status, setStatus] = useState<Status>('offline');
  const [activeEntry, setActiveEntry] = useState<any>(null);
  const [todayShift, setTodayShift] = useState<any>(null);
  const [now, setNow] = useState(moment());
  
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isTimeClockOpen, setIsTimeClockOpen] = useState(false);
  
  const [clockKey, setClockKey] = useState(0);
  
  const [isProcessing, setIsProcessing] = useState(false);

  // Permission Checks
  // Employees are Level 300+. Customers are typically 0 or 100.
  const isEmployee = (user?.user_level || 0) >= 300;
  const canEdit = currentUserLevel >= 650; // Managers (650) and up can edit users

  // --- 1. DATA FETCHING (Employees Only) ---
  const fetchData = useCallback(async () => {
    if (!user?.id || !isEmployee) return;

    // A. Get Active Time Entry
    const { data: timeData } = await supabase
      .from('time_entries')
      .select('*')
      .eq('user_id', user.id)
      .is('end_time', null)
      .maybeSingle();

    // B. Get Today's Schedule
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

    // C. Determine Status
    if (timeData) {
      if (timeData.is_on_break) {
         setStatus('break');
      } else {
         setStatus('online');
      }
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
  }, [user?.id, supabase, isEmployee]);

  // --- 2. REALTIME SUBSCRIPTION (Employees Only) ---
  useEffect(() => {
    if (!isEmployee) return;
    fetchData();

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
  }, [user?.id, supabase, fetchData, isEmployee]);

  // --- 3. TIMERS ---
  useEffect(() => {
    if (!isEmployee) return;
    const timer = setInterval(() => {
        setNow(moment());
        if ((status === 'offline' || status === 'late') && todayShift && !activeEntry) {
            const currentTime = moment();
            const shiftStart = moment(todayShift.start_time);
            const shiftEnd = moment(todayShift.end_time);
            if (currentTime.isBetween(shiftStart, shiftEnd)) setStatus('late');
        }
    }, 60000); 
    return () => clearInterval(timer);
  }, [status, todayShift, activeEntry, isEmployee]);

  // --- 4. ACTIONS ---

  const closePopover = () => setIsPopoverOpen(false);

  const handleSignOut = async () => {
      closePopover();
      await supabase.auth.signOut();
      router.push('/login');
  };

  const openTimeClockModal = () => {
      closePopover();
      setClockKey(prev => prev + 1); 
      setIsTimeClockOpen(true);
  };

  const handleBreakToggle = async (action: 'start' | 'end') => {
    if (!activeEntry) return;
    setIsProcessing(true);

    try {
        const timestamp = moment().toISOString();
        const updateData = action === 'start' 
            ? { is_on_break: true, break_start: timestamp }
            : { is_on_break: false, break_start: null };

        const { error } = await supabase
            .from('time_entries')
            .update(updateData)
            .eq('id', activeEntry.id);

        if (error) throw error;
        
        setActiveEntry({ ...activeEntry, ...updateData });
        setStatus(action === 'start' ? 'break' : 'online');
        
        toast({ 
          title: action === 'start' ? "Break Started" : "Welcome Back", 
          description: action === 'start' ? "Relax & Recharge!" : "You are back on the clock." 
        });
        
        closePopover();
    } catch (err) {
        console.error("Break Update Error:", err);
        toast({ title: "Error", description: "Failed to update break status", variant: "destructive" });
    } finally {
        setIsProcessing(false);
    }
  };

  // --- 5. COMPUTED ---
  const durationStr = useMemo(() => {
    let startTime = null;
    if (status === 'break' && activeEntry?.break_start) {
        startTime = moment(activeEntry.break_start);
    } else if (status === 'online' && activeEntry?.start_time) {
        startTime = moment(activeEntry.start_time);
    }
    
    if (!startTime) return null;
    
    const diff = moment.duration(now.diff(startTime));
    const hours = Math.floor(diff.asHours());
    const minutes = diff.minutes();
    
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  }, [activeEntry, status, now]);

  const dims = size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-16 h-16' : 'w-10 h-10';
  const dotSize = size === 'sm' ? 'h-2.5 w-2.5' : 'h-3.5 w-3.5';
  
  const statusColors = {
      online: 'bg-green-500',
      break: 'bg-orange-500',
      late: 'bg-red-600',
      offline: 'bg-slate-300'
  };

  if (!user) return null;

  return (
    <>
    {/* TIMECLOCK MODAL (Employees Only) */}
    {isCurrentUser && isEmployee && (
        <Dialog open={isTimeClockOpen} onOpenChange={setIsTimeClockOpen}>
            <DialogContent className="max-w-md p-0 border-none bg-transparent shadow-none">
                
                <DialogTitle className="sr-only">Time Clock</DialogTitle>
                <DialogDescription className="sr-only">
                    Interface for verifying time entry with camera.
                </DialogDescription>

                <SmartTimeClock 
                    key={clockKey} 
                    employeeId={user.id} 
                    onClose={() => {
                        setIsTimeClockOpen(false);
                        fetchData(); 
                    }} 
                />
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
          {/* Status Dot: Only show for Employees */}
          {isEmployee && (
            <span 
              className={cn(
                  "absolute bottom-0 right-0 block rounded-full ring-2 ring-white transition-colors duration-300",
                  dotSize,
                  statusColors[status]
              )} 
            />
          )}
        </div>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0 shadow-xl border-slate-200 dark:border-slate-800" align="end" sideOffset={5}>
        
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
                <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider font-semibold">
                  {user.job_title || (isEmployee ? 'Staff' : 'Customer')}
                </p>
             </div>
          </div>
          
          {/* EDIT BUTTON (Managers) */}
          {(canEdit && !isCurrentUser) && (
            <Link href={`/account?userId=${user.id}`} onClick={closePopover}>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/30">
                <Pencil className="w-4 h-4" />
              </Button>
            </Link>
          )}
        </div>

        <div className="p-4 space-y-4">
          
          {/* STATUS BAR (Employees Only) */}
          {isEmployee && (
            <div className={cn("flex items-center justify-between p-3 rounded-lg border shadow-sm select-none transition-colors", 
                status === 'late' ? "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-900" : 
                status === 'break' ? "bg-orange-50 border-orange-200 dark:bg-orange-900/20" :
                status === 'online' ? "bg-green-50 border-green-200 dark:bg-green-900/20" :
                "bg-white dark:bg-slate-950 dark:border-slate-800"
            )}>
              <div className="flex items-center gap-2">
                {status === 'online' && <Clock className="w-4 h-4 text-green-600" />}
                {status === 'break' && <Coffee className="w-4 h-4 text-orange-600 animate-pulse" />}
                {status === 'late' && <AlertCircle className="w-4 h-4 text-red-600" />}
                {status === 'offline' && <Moon className="w-4 h-4 text-slate-400" />}
                
                <div className="flex flex-col">
                    <span className="text-sm font-bold capitalize leading-none text-slate-900 dark:text-slate-100">
                        {status === 'late' ? 'Absent / Late' : status === 'online' ? 'Clocked In' : status}
                    </span>
                    {status === 'break' && <span className="text-[10px] text-orange-600 font-medium">Relax & Recharge</span>}
                </div>
              </div>
              {durationStr && status !== 'offline' && (
                <div className="flex items-center gap-1 text-[11px] font-mono font-bold bg-white/50 px-2 py-0.5 rounded border border-black/5">
                  <Timer className="w-3 h-3" /> {durationStr}
                </div>
              )}
            </div>
          )}

          {/* === CONTROLS === */}
          {isCurrentUser ? (
            <div className="space-y-3 pt-1">
                
                {/* TIME CLOCK (Employees Only) */}
                {isEmployee && (
                  <div className="grid grid-cols-1 gap-2">
                      {/* SCENARIO 1: CLOCKED OUT */}
                      {(status === 'offline' || status === 'late') && (
                          <Button 
                              className="w-full h-12 gap-2 bg-green-600 hover:bg-green-700 text-white font-bold shadow-sm"
                              onClick={openTimeClockModal}
                          >
                              <Play className="w-4 h-4 fill-current" /> CLOCK IN
                          </Button>
                      )}

                      {/* SCENARIO 2: CLOCKED IN */}
                      {status === 'online' && (
                          <div className="grid grid-cols-2 gap-2">
                              <Button 
                                  variant="outline"
                                  className="h-12 gap-2 border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 hover:border-orange-300 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800"
                                  onClick={() => handleBreakToggle('start')}
                                  disabled={isProcessing}
                              >
                                  <Coffee className="w-4 h-4" /> Start Break
                              </Button>
                              
                              <Button 
                                  variant="outline"
                                  className="h-12 gap-2 border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:border-red-300 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800"
                                  onClick={openTimeClockModal} 
                              >
                                  <Square className="w-4 h-4 fill-current" /> Clock Out
                              </Button>
                          </div>
                      )}

                      {/* SCENARIO 3: ON BREAK */}
                      {status === 'break' && (
                          <Button 
                              className="w-full h-12 gap-2 bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-sm"
                              onClick={() => handleBreakToggle('end')}
                              disabled={isProcessing}
                          >
                              <Play className="w-4 h-4 fill-current" /> END BREAK
                          </Button>
                      )}
                  </div>
                )}

                {/* MENU LINKS */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t dark:border-slate-800">
                    <Button variant="ghost" className="justify-start px-2 gap-2 text-xs h-9" asChild onClick={closePopover}>
                        <Link href={`/account`}>
                            <User className="w-4 h-4 text-slate-500" /> ACCOUNT
                        </Link>
                    </Button>
                    
                    <Button 
                        variant="ghost" 
                        className="justify-start px-2 gap-2 text-xs h-9" 
                        onClick={() => { setTheme(theme === 'dark' ? 'light' : 'dark'); closePopover(); }}
                    >
                        {theme === 'dark' ? <Sun className="w-4 h-4 text-slate-500" /> : <Moon className="w-4 h-4 text-slate-500" />}
                        Theme
                    </Button>
                </div>

                {/* NEW: MY SCHEDULE LINK (Employees Only) */}
                {isEmployee && (
                  <Button variant="ghost" className="w-full justify-start px-2 gap-2 text-xs h-9 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20" asChild onClick={closePopover}>
                      <Link href="/biz/my-schedule">
                          <Calendar className="w-4 h-4" /> My Schedule
                      </Link>
                  </Button>
                )}

                <Button variant="ghost" className="w-full justify-start px-2 gap-2 text-xs h-9 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={handleSignOut}>
                    <LogOut className="w-4 h-4" /> Sign Out
                </Button>
            </div>
          ) : (
            <>
              {/* Other User View (Employees looking at Employees) */}
              {isEmployee && (
                <div className="space-y-1.5 select-none">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1"><Clock className="w-3 h-3"/> Today's Schedule</p>
                  {todayShift ? (
                    <div className="text-sm bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-2 rounded border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                      <span className="font-bold font-mono">
                          {moment(todayShift.start_time).format('h:mm A')} - {moment(todayShift.end_time).format('h:mm A')}
                      </span>
                    </div>
                  ) : (
                    <div className="text-sm text-slate-400 italic bg-slate-50 dark:bg-slate-900 p-2 rounded border border-dashed border-slate-200 dark:border-slate-800">
                        Not scheduled today
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-3 gap-2 pt-4 border-t dark:border-slate-800">
                 <Button variant="outline" size="sm" className="flex flex-col h-12 gap-0.5" onClick={closePopover} asChild><a href={`tel:${user.phone}`}><Phone className="w-4 h-4"/><span className="text-[10px]">Call</span></a></Button>
                 <Button variant="outline" size="sm" className="flex flex-col h-12 gap-0.5" onClick={closePopover} asChild><a href={`sms:${user.phone}`}><MessageSquare className="w-4 h-4"/><span className="text-[10px]">Text</span></a></Button>
                 <Button variant="outline" size="sm" className="flex flex-col h-12 gap-0.5" onClick={closePopover} asChild><a href={`mailto:${user.email}`} target="_blank"><Mail className="w-4 h-4"/><span className="text-[10px]">Email</span></a></Button>
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
    </>
  );
}