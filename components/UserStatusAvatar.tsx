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
  LogOut, Sun, Moon, User, Play, Square, Calendar,
  Shield, AlertTriangle, Briefcase, ChevronRight // Standardized Icons
} from 'lucide-react';
import moment from 'moment';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useToast } from '@/components/ui/use-toast';

import SmartTimeClock from '@/app/(biz)/biz/users/admin/tables/employee/time-clock/clock-in';

// Define the License Status Types
export type FunLicenseStatus = 'active' | 'pending' | 'missing'; 

type TimeStatus = 'online' | 'break' | 'offline' | 'late';

export default function UserStatusAvatar({ 
  user, 
  currentUserLevel = 0,
  isCurrentUser = false,
  size = 'md',
  funLicenseStatus = 'missing'
}: { 
  user: any; 
  currentUserLevel?: number;
  isCurrentUser?: boolean;
  size?: 'sm' | 'md' | 'lg';
  funLicenseStatus?: FunLicenseStatus;
}) {
  const supabase = createClient();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  
  const [status, setStatus] = useState<TimeStatus>('offline');
  const [activeEntry, setActiveEntry] = useState<any>(null);
  const [todayShift, setTodayShift] = useState<any>(null);
  const [now, setNow] = useState(moment());
  
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isTimeClockOpen, setIsTimeClockOpen] = useState(false);
  const [clockKey, setClockKey] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const isEmployee = (user?.user_level || 0) >= 300;
  const canEdit = currentUserLevel >= 650; 

  // --- 1. DATA FETCHING ---
  const fetchData = useCallback(async () => {
    if (!user?.id || !isEmployee) return;

    // A. Active Entry
    const { data: timeData } = await supabase
      .from('time_entries')
      .select('*')
      .eq('user_id', user.id)
      .is('end_time', null)
      .maybeSingle();

    // B. Today's Schedule
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

    // C. Status Logic
    if (timeData) {
      setStatus(timeData.is_on_break ? 'break' : 'online');
    } else if (shiftData) {
      const currentTime = moment();
      const shiftStart = moment(shiftData.start_time);
      const shiftEnd = moment(shiftData.end_time);
      setStatus(currentTime.isBetween(shiftStart, shiftEnd) ? 'late' : 'offline');
    } else {
      setStatus('offline');
    }
  }, [user?.id, supabase, isEmployee]);

  // --- 2. SUBSCRIPTIONS (CRITICAL FIX) ---
  useEffect(() => {
    if (!isEmployee) return;
    
    // Initial Fetch for everyone (one-time)
    fetchData();

    // PERFORMANCE GUARD: Only subscribe to Realtime if it's ME.
    // Prevents crashing the Roster page with 50+ websocket connections.
    if (!isCurrentUser) return;

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
  }, [user?.id, supabase, fetchData, isEmployee, isCurrentUser]);

  // --- 3. TIMERS ---
  useEffect(() => {
    if (!isEmployee || !isCurrentUser) return; // Only tick timer for self
    const timer = setInterval(() => {
        setNow(moment());
    }, 60000); 
    return () => clearInterval(timer);
  }, [isEmployee, isCurrentUser]);

  // --- 4. ACTIONS ---
  const closePopover = () => setIsPopoverOpen(false);

  const handleSignOut = async () => {
      closePopover();
      await supabase.auth.signOut();
      window.location.href = '/signin';
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
        toast({ title: action === 'start' ? "Break Started" : "Welcome Back" });
        closePopover();
    } catch (err) {
        toast({ title: "Error", variant: "destructive" });
    } finally {
        setIsProcessing(false);
    }
  };

  // --- 5. VISUAL HELPERS ---
  const durationStr = useMemo(() => {
    let startTime = null;
    if (status === 'break' && activeEntry?.break_start) startTime = moment(activeEntry.break_start);
    else if (status === 'online' && activeEntry?.start_time) startTime = moment(activeEntry.start_time);
    
    if (!startTime) return null;
    const diff = moment.duration(now.diff(startTime));
    const hours = Math.floor(diff.asHours());
    const minutes = diff.minutes();
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  }, [activeEntry, status, now]);

  const dims = size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-16 h-16' : 'w-10 h-10';
  
  const getLicenseColorClass = (s: FunLicenseStatus) => {
    if (s === 'active') return 'ring-2 ring-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]';
    if (s === 'pending') return 'ring-2 ring-yellow-400';
    return 'ring-2 ring-red-500';
  };

  const timeStatusColors = {
      online: 'bg-green-500',
      break: 'bg-orange-500',
      late: 'bg-red-600',
      offline: 'bg-slate-300' 
  };

  if (!user) return null;

  return (
    <>
    {isCurrentUser && isEmployee && (
        <Dialog open={isTimeClockOpen} onOpenChange={setIsTimeClockOpen}>
            <DialogContent className="max-w-md p-0 border-none bg-transparent shadow-none">
                <DialogTitle className="sr-only">Time Clock</DialogTitle>
                <DialogDescription className="sr-only">Verify Time Entry</DialogDescription>
                <SmartTimeClock key={clockKey} employeeId={user.id} onClose={() => { setIsTimeClockOpen(false); fetchData(); }} />
            </DialogContent>
        </Dialog>
    )}

    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>
        <div className="relative cursor-pointer hover:opacity-80 transition-opacity" onClick={(e) => e.stopPropagation()}>
          <div className={cn(dims, "rounded-full overflow-hidden bg-slate-200 relative", getLicenseColorClass(funLicenseStatus))}>
            {user.avatar_url ? (
              <Image src={user.avatar_url} alt={user.full_name || 'User'} fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-bold text-slate-500 text-xs">
                {user.full_name?.substring(0, 2).toUpperCase() || '??'}
              </div>
            )}
          </div>
          {isEmployee && (
            <span className={cn("absolute bottom-0 right-0 block rounded-full ring-2 ring-white h-3 w-3", timeStatusColors[status])} />
          )}
        </div>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0 shadow-xl border-slate-200 dark:border-slate-800" align="end" sideOffset={5}>
        
        {/* === HEADER: IDENTITY === */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b dark:border-slate-800 flex justify-between items-start">
          <div className="flex gap-3 items-center">
             <div className={cn("w-12 h-12 rounded-full overflow-hidden border relative bg-slate-200", getLicenseColorClass(funLicenseStatus))}>
                {user.avatar_url ? (
                    <Image src={user.avatar_url} alt={user.full_name} fill className="object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-slate-400">
                        {user.full_name?.substring(0, 2).toUpperCase()}
                    </div>
                )}
             </div>
             <div className="overflow-hidden">
                <h4 className="font-bold text-lg leading-none text-slate-900 dark:text-slate-100 truncate w-40">{user.full_name}</h4>
                <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider font-semibold">
                  {user.job_title || (isEmployee ? 'Staff' : 'Customer')}
                </p>
             </div>
          </div>
          {(canEdit && !isCurrentUser) && (
            <Link href={`/account?userId=${user.id}`} onClick={closePopover}>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-100"><Pencil className="w-4 h-4" /></Button>
            </Link>
          )}
        </div>

        {/* === SECTION A: FUN LICENSE (The "Wallet Card") === */}
        {isCurrentUser && (
            <div className="p-3 bg-white dark:bg-black">
                <Button 
                   variant="ghost" 
                   className={cn(
                     "w-full justify-between px-3 h-12 font-bold border-2 transition-all",
                     funLicenseStatus === 'active' 
                        ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100 dark:bg-green-900/10 dark:border-green-800" 
                        : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100 dark:bg-red-900/10 dark:border-red-800"
                   )}
                   asChild onClick={closePopover}
                >
                    <Link href="/fun-license">
                        <div className="flex items-center gap-2">
                            {funLicenseStatus === 'active' ? <Shield className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                            <div className="flex flex-col items-start">
                                <span className="text-[10px] uppercase tracking-wider opacity-70 leading-none mb-0.5">Identity</span>
                                <span className="text-sm leading-none">{funLicenseStatus === 'active' ? 'FUN LICENSE ACTIVE' : 'LICENSE MISSING'}</span>
                            </div>
                        </div>
                        <ChevronRight className="w-4 h-4 opacity-50" />
                    </Link>
                </Button>
            </div>
        )}

        <div className="h-px bg-slate-100 dark:bg-slate-800" />

        <div className="p-4 space-y-4">
          
          {/* === SECTION B: SHIFT STATUS (For Employees) === */}
          {isEmployee && (
            <>
                <div className={cn("flex items-center justify-between p-3 rounded-lg border shadow-sm select-none", 
                    status === 'late' ? "bg-red-50 border-red-200 dark:bg-red-900/20" : 
                    status === 'break' ? "bg-orange-50 border-orange-200 dark:bg-orange-900/20" :
                    status === 'online' ? "bg-green-50 border-green-200 dark:bg-green-900/20" :
                    "bg-slate-50 border-slate-200 dark:bg-slate-900/50"
                )}>
                <div className="flex items-center gap-2">
                    {status === 'online' && <Clock className="w-4 h-4 text-green-600" />}
                    {status === 'break' && <Coffee className="w-4 h-4 text-orange-600 animate-pulse" />}
                    {status === 'late' && <AlertCircle className="w-4 h-4 text-red-600" />}
                    {status === 'offline' && <Moon className="w-4 h-4 text-slate-400" />}
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-slate-400 leading-none mb-0.5">Status</span>
                        <span className="text-sm font-bold capitalize leading-none text-slate-900 dark:text-slate-100">
                            {status === 'late' ? 'Absent / Late' : status === 'online' ? 'Clocked In' : status}
                        </span>
                    </div>
                </div>
                {durationStr && status !== 'offline' && (
                    <div className="flex items-center gap-1 text-[11px] font-mono font-bold bg-white/50 px-2 py-0.5 rounded border border-black/5">
                    <Timer className="w-3 h-3" /> {durationStr}
                    </div>
                )}
                </div>

                {/* === SECTION C: CONTROLS (Only for ME) === */}
                {isCurrentUser && (
                    <>
                    {(status === 'offline' || status === 'late') ? (
                        <Button className="w-full h-12 gap-2 bg-green-600 hover:bg-green-700 text-white font-bold text-lg shadow-sm" onClick={openTimeClockModal}>
                            <Play className="w-5 h-5 fill-current" /> CLOCK IN
                        </Button>
                    ) : (
                        <div className="rounded-xl border-2 border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-3 shadow-inner">
                            <div className="flex items-center justify-center gap-2 mb-3 opacity-60">
                                <Briefcase size={12} className="text-slate-500" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Shift Controls</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {status === 'online' ? (
                                    <Button variant="outline" className="h-14 flex-col gap-1 border-orange-200 bg-white text-orange-700" onClick={() => handleBreakToggle('start')} disabled={isProcessing}>
                                        <Coffee className="w-5 h-5 mb-0.5" /> <span className="text-xs font-bold">START BREAK</span>
                                    </Button>
                                ) : (
                                    <Button className="h-14 flex-col gap-1 bg-orange-500 text-white" onClick={() => handleBreakToggle('end')} disabled={isProcessing}>
                                        <Play className="w-5 h-5 fill-current" /> <span className="text-xs font-bold">RESUME</span>
                                    </Button>
                                )}
                                <Button variant="destructive" className="h-14 flex-col gap-1 bg-red-600 border-b-4 border-red-800 active:border-b-0 active:translate-y-1" onClick={openTimeClockModal}>
                                    <Square className="w-5 h-5 fill-current" /> <span className="text-xs font-black">CLOCK OUT</span>
                                </Button>
                            </div>
                        </div>
                    )}
                    </>
                )}
            </>
          )}

          {/* === FOOTER: TOOLS (User vs Other) === */}
          {isCurrentUser ? (
            <div className="grid grid-cols-2 gap-2 pt-2 border-t dark:border-slate-800 mt-2">
                {isEmployee && (
                  <Button variant="ghost" className="w-full justify-start px-2 gap-2 text-xs h-9 text-blue-600" asChild onClick={closePopover}>
                      <Link href="/biz/my-schedule"><Calendar className="w-4 h-4" /> My Schedule</Link>
                  </Button>
                )}
                <Button variant="ghost" className="justify-start px-2 gap-2 text-xs h-9" asChild onClick={closePopover}>
                    <Link href={`/account?userId=${user.id}`}><User className="w-4 h-4 text-slate-500" /> Account</Link>
                </Button>
                <Button variant="ghost" className="justify-start px-2 gap-2 text-xs h-9" onClick={() => { setTheme(theme === 'dark' ? 'light' : 'dark'); closePopover(); }}>
                    {theme === 'dark' ? <Sun className="w-4 h-4 text-slate-500" /> : <Moon className="w-4 h-4 text-slate-500" />} Theme
                </Button>
                <Button variant="ghost" className="justify-start px-2 gap-2 text-xs h-9 text-slate-400 hover:text-red-600" onClick={handleSignOut}>
                    <LogOut className="w-4 h-4" /> Sign Out
                </Button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 pt-2 border-t dark:border-slate-800">
                 <Button variant="outline" size="sm" className="flex flex-col h-12 gap-0.5" onClick={closePopover} asChild><a href={`tel:${user.phone}`}><Phone className="w-4 h-4"/><span className="text-[10px]">Call</span></a></Button>
                 <Button variant="outline" size="sm" className="flex flex-col h-12 gap-0.5" onClick={closePopover} asChild><a href={`sms:${user.phone}`}><MessageSquare className="w-4 h-4"/><span className="text-[10px]">Text</span></a></Button>
                 <Button variant="outline" size="sm" className="flex flex-col h-12 gap-0.5" onClick={closePopover} asChild><a href={`mailto:${user.email}`}><Mail className="w-4 h-4"/><span className="text-[10px]">Email</span></a></Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
    </>
  );
}