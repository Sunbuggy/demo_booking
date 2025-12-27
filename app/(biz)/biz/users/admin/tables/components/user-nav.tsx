'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { usePathname, useRouter } from 'next/navigation';
import { SignOut } from '@/utils/auth-helpers/server';
import Link from 'next/link';
import { ImNewTab } from 'react-icons/im';
import { getRedirectMethod } from '@/utils/auth-helpers/settings';
import { handleRequest } from '@/utils/auth-helpers/client';
import { PowerCircleIcon, Clock, Coffee, User as UserIcon, Sun, Moon, CalendarDays } from 'lucide-react';
import moment from 'moment';
import { useTheme } from "next-themes"

// ✅ FIX: Updated Interface to accept the new props
export function UserNav({
  email,
  userInitials,
  userImage,
  userName,
  user_id,
  user_level = 0,
  status,              // <--- ADDED
  clockInTimeStamp     // <--- ADDED
}: {
  email: string | undefined;
  userInitials: string;
  userImage: string;
  userName: string;
  user_id: string;
  user_level?: number;
  status?: string | null;       // <--- ADDED (Allows null to fix build error)
  clockInTimeStamp?: string;    // <--- ADDED
}) {
  const router = getRedirectMethod() === 'client' ? useRouter() : null;
  const path = usePathname();
  const supabase = createClient();
  const { theme, setTheme } = useTheme();

  // State
  // We initialize state with the passed prop if available to avoid "layout shift"
  const [tcStatus, setTcStatus] = useState<'active' | 'break' | 'closed' | 'loading'>(
    status ? (status as 'active' | 'break' | 'closed') : 'loading'
  );
  
  const [timerText, setTimerText] = useState('');
  const [shiftStart, setShiftStart] = useState<string | null>(clockInTimeStamp || null);
  const [breakStart, setBreakStart] = useState<string | null>(null);
  const [internalLevel, setInternalLevel] = useState(user_level);

  // 1. Core Data Fetching Logic
  useEffect(() => {
    let mounted = true;

    const refreshData = async () => {
        if (!user_id) return;

        // A. Ensure we know the user level
        let currentLevel = internalLevel;
        if (currentLevel < 300) {
            const { data: uData } = await supabase.from('users').select('user_level').eq('id', user_id).maybeSingle();
            if (uData && mounted) {
                currentLevel = uData.user_level;
                setInternalLevel(uData.user_level);
            }
        }

        if (currentLevel < 300) {
            if(mounted) setTcStatus('closed');
            return;
        }

        // B. Fetch Time Status
        const { data: timeData, error } = await supabase
            .from('time_entries')
            .select('*')
            .eq('user_id', user_id)
            .is('end_time', null)
            .order('start_time', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (!mounted) return;
        
        if (error) console.error("UserNav Fetch Error:", error);

        if (timeData) {
            setTcStatus(timeData.status as 'active' | 'break');
            setShiftStart(timeData.start_time);
            setBreakStart(timeData.break_start);
        } else {
            setTcStatus('closed');
            setShiftStart(null);
            setBreakStart(null);
        }
    };

    // Initial Load
    refreshData();

    // C. Subscribe to Realtime Changes
    const channel = supabase
      .channel(`user_nav_updates:${user_id}`)
      .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'time_entries', filter: `user_id=eq.${user_id}` }, 
          (payload) => { 
            console.log('Realtime update received:', payload); 
            refreshData(); 
          }
      )
      .subscribe();

    // D. Aggressive Polling (Every 5s) & Window Focus
    const poller = setInterval(refreshData, 5000);
    const onFocus = () => refreshData();
    window.addEventListener('focus', onFocus);

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
      clearInterval(poller);
      window.removeEventListener('focus', onFocus);
    };
  }, [user_id]); 

  // 2. Timer Logic (Pure UI update)
  useEffect(() => {
    if (tcStatus === 'closed' || tcStatus === 'loading') return;

    const updateTimer = () => {
      let start = tcStatus === 'break' ? breakStart : shiftStart;
      if (!start) return;
      const duration = moment.duration(moment().diff(moment(start)));
      const hours = Math.floor(duration.asHours());
      const mins = duration.minutes();
      setTimerText(`${hours}h ${mins}m`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, [tcStatus, shiftStart, breakStart]);


  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-9 w-9 border border-slate-200 dark:border-slate-800">
            <AvatarImage src={userImage} alt={userName} />
            <AvatarFallback>{userInitials}</AvatarFallback>
          </Avatar>
          
          {internalLevel >= 300 && (
            <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background transition-colors duration-500 ${
               tcStatus === 'active' ? 'bg-green-500' : 
               tcStatus === 'break' ? 'bg-orange-500' : 
               'bg-slate-400'
            }`} />
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-64" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{userName}</p>
            <p className="text-xs leading-none text-muted-foreground">{email}</p>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />

        {internalLevel >= 300 && (
          <>
            <div className="p-2 bg-slate-50 dark:bg-slate-900/50 rounded-md m-1 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Status</span>
                {tcStatus === 'active' && <span className="text-[10px] font-bold text-green-600 dark:text-green-400 flex items-center gap-1"><span className="animate-pulse w-1.5 h-1.5 bg-green-500 rounded-full"/> Clocked In</span>}
                {tcStatus === 'break' && <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 flex items-center gap-1"><Coffee className="w-3 h-3"/> On Break</span>}
                {tcStatus === 'closed' && <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">Clocked Out</span>}
              </div>

              {tcStatus !== 'closed' && tcStatus !== 'loading' && (
                 <div className="text-center py-2">
                    <div className="text-2xl font-mono font-bold text-foreground">{timerText}</div>
                    <div className="text-[10px] text-muted-foreground uppercase">{tcStatus === 'break' ? 'Break Duration' : 'Shift Duration'}</div>
                 </div>
              )}

              <Button asChild className={`w-full mt-2 font-bold h-8 text-xs ${ tcStatus === 'active' ? 'bg-green-600 hover:bg-green-700 text-white' : tcStatus === 'break' ? 'bg-orange-600 hover:bg-orange-700 text-white' : 'bg-slate-800 hover:bg-slate-700 text-white' }`}>
                 <Link href="/biz/users/admin/tables/employee/time-clock">
                    <Clock className="w-3 h-3 mr-2" />
                    {tcStatus === 'closed' ? 'Clock In' : 'Manage Shift'}
                 </Link>
              </Button>

              <Button asChild variant="outline" className="w-full mt-2 h-8 text-xs border-slate-300 dark:border-slate-700 text-muted-foreground hover:text-foreground">
                 <Link href="/biz/my-schedule">
                    <CalendarDays className="w-3 h-3 mr-2" />
                    View My Schedule
                 </Link>
              </Button>

            </div>
            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuItem className="cursor-pointer" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
           <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 mr-2" />
           <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 mr-2" />
           <span>Switch Theme</span>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/account" className="cursor-pointer flex items-center">
            <UserIcon className="w-4 h-4 mr-2" /> Profile <ImNewTab className="ml-auto opacity-50"/>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <form className="w-full" onSubmit={(e) => handleRequest(e, SignOut, router)}>
          <input type="hidden" name="pathName" value={path} />
          <Button type="submit" variant={'ghost'} className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 justify-start h-8 px-2">
            <PowerCircleIcon className="w-4 h-4 mr-2" /> Log Out
          </Button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}