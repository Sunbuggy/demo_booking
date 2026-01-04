'use client';

// ============================================================================
// SUNBUGGY ROSTER PAGE (v10.8 - Locked Viewport & Tight Layout)
// ============================================================================
// CHANGELOG v10.8:
// 1. LAYOUT ARCHITECTURE: Changed main container to `h-[calc(100vh-65px)]`.
//    - This forces the scrollbar onto the TABLE ONLY, not the window.
//    - Result: The "Control Bar" is physically unable to scroll away.
// 2. SPACING: Reduced global padding (p-4 -> p-2) and removed margins.
//    - The controls now sit tight against the top nav.
// 3. LAYER MANAGEMENT: Enforced opaque backgrounds on headers to prevent 
//    "visual bleed" when elements slide under one another.

import { useState, useEffect, Fragment, useMemo } from 'react';
import Link from 'next/link'; 
import { createClient } from '@/utils/supabase/client';
import { getStaffRoster } from '@/utils/supabase/queries'; 
import { getLocationWeather, DailyWeather } from '@/app/actions/weather'; 

// --- DATE-FNS IMPORTS ---
import { 
  format, 
  addDays, 
  subDays, 
  addWeeks, 
  subWeeks, 
  addMonths,
  subMonths,
  startOfISOWeek, 
  differenceInMinutes, 
  parseISO, 
  startOfMonth,
  endOfMonth,
  startOfWeek as startOfLocalWeek,
  endOfWeek as endOfLocalWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday
} from 'date-fns';

import UserStatusAvatar from '@/components/UserStatusAvatar';
import { fetch_from_old_db } from '@/utils/old_db/actions';
import { vehiclesList } from '@/utils/old_db/helpers';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { 
    ChevronLeft, ChevronRight, Plus, Trash2, MapPin, 
    Ban, Copy, Loader2, Plane, Filter, 
    History, Users, 
    Sun, Cloud, CloudRain, Snowflake, CloudLightning, Wind, Printer,
    Flame, Wrench, Shield, CheckSquare, Mountain, LucideIcon,
    Settings, Info, BarChart3, Calendar as CalendarIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import PublishButton from './components/publish-button';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

// --- CONSTANTS ---
const LOCATIONS: Record<string, string[]> = {
  'Las Vegas': ['ADMIN', 'OFFICE', 'DUNES', 'SHUTTLES', 'SHOP'],
  'Pismo': ['ADMIN', 'CLUBHOUSE', 'BEACH', 'SHOP'],
  'Michigan': ['ADMIN', 'SHOP', 'GUIDES', 'OFFICE']
};

const DEPT_STYLES: Record<string, string> = {
  'OFFICE': 'bg-orange-100 dark:bg-orange-950/30 border-orange-200 text-orange-900 dark:text-orange-100',
  'SHOP': 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 text-zinc-900 dark:text-zinc-100',
  'SHUTTLES': 'bg-blue-100 dark:bg-blue-950/30 border-blue-200 text-blue-900 dark:text-blue-100',
  'DEFAULT': 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 text-slate-700'
};

const ROLE_GROUPS: Record<string, string[]> = {
  'OFFICE': ['ADMIN', 'OPPS', 'CSR', 'PROD DEV'],
  'SHOP': ['BUGGIES', 'OHVS', 'FLEET', 'FAB', 'HELPER'],
  'SHUTTLES': ['DRIVER', 'DISPATCH'],
  'DUNES': ['GUIDE', 'LEAD', 'SWEEP'],
  'BEACH': ['RENTAL', 'GUIDE'],
  'ADMIN': ['MANAGER', 'HR', 'OWNER'],
  'CSR': ['RECEPTION', 'PHONES'],
  'GUIDES': ['GUIDE', 'LEAD']
};

const TASKS: Record<string, { label: string, color: string, code: string, icon: LucideIcon }> = {
  'TORCH': { label: 'TORCH (Dispatch)', color: 'bg-red-600', code: 'T', icon: Flame },
  'SST': { label: 'SST (Support)', color: 'bg-blue-600', code: 'S', icon: Wrench },
  'SITE_MGR': { label: 'Site Manager', color: 'bg-green-600', code: 'SM', icon: Shield },
  'CHECK_IN': { label: 'Check-In', color: 'bg-purple-600', code: 'C', icon: CheckSquare },
  'VOF': { label: 'Valley of Fire', color: 'bg-orange-500', code: 'V', icon: Mountain }
};

// --- INTERFACES ---
interface Employee {
  id: string;
  full_name: string;
  stage_name: string;
  location: string;
  department: string;
  job_title: string;
  hire_date: string | null;
  user_level: number;
  timeclock_blocked: boolean;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
}

interface Shift {
  id: string;
  user_id: string;
  start_time: string;
  end_time: string;
  role: string;
  location?: string;
  task?: string;
  last_notified?: string | null;
}

interface AuditLog {
  id: string;
  created_at: string;
  action: string;
  user_id: string;
  table_name: string;
  row: string;
  actor_name?: string;
}

interface ShiftDefaults {
    role: string;
    start: string;
    end: string;
    location: string;
    task?: string;
}

interface ReservationStat {
  sch_date: string | Date; 
  ppl_count: string | number;
  [key: string]: string | number | boolean | Date | null | undefined; 
}

// --- HELPER FUNCTIONS ---

const getDashboardLink = (locationName: string, dateStr: string) => {
    if (locationName === 'Las Vegas') {
        return `/biz/${dateStr}`;
    }
    const slug = locationName.toLowerCase().replace(/\s+/g, '-');
    return `/biz/${slug}/${dateStr}`;
};

const getDurationHours = (start: string, end: string): number => {
    const diffMinutes = differenceInMinutes(parseISO(end), parseISO(start));
    return diffMinutes / 60;
};

// --- HELPER COMPONENTS ---

// Custom Mini Calendar Component
const MiniCalendar = ({ selectedDate, onSelect }: { selectedDate: Date, onSelect: (d: Date) => void }) => {
    const [viewDate, setViewDate] = useState(startOfMonth(selectedDate));

    const days = useMemo(() => {
        const start = startOfLocalWeek(startOfMonth(viewDate));
        const end = endOfLocalWeek(endOfMonth(viewDate));
        return eachDayOfInterval({ start, end });
    }, [viewDate]);

    return (
        <div className="p-3 w-64">
            <div className="flex items-center justify-between mb-4">
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setViewDate(subMonths(viewDate, 1))}>
                    <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="font-bold text-sm">{format(viewDate, 'MMMM yyyy')}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setViewDate(addMonths(viewDate, 1))}>
                    <ChevronRight className="w-4 h-4" />
                </Button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-[10px]">
                {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => <div key={d} className="text-muted-foreground font-bold pb-1">{d}</div>)}
                {days.map(day => {
                    const isSelected = isSameDay(day, selectedDate);
                    const isCurrentMonth = isSameMonth(day, viewDate);
                    const isTodayDate = isToday(day);
                    return (
                        <button
                            key={day.toISOString()}
                            onClick={() => onSelect(day)}
                            className={cn(
                                "h-8 w-8 rounded-md flex items-center justify-center transition-colors hover:bg-muted",
                                !isCurrentMonth && "text-muted-foreground/30",
                                isSelected && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground font-bold",
                                isTodayDate && !isSelected && "border border-primary text-primary font-bold"
                            )}
                        >
                            {format(day, 'd')}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

const ChangeLogViewer = ({ tableName, rowId }: { tableName: string, rowId: string }) => {
    const [open, setOpen] = useState(false);
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(false);
    const supabase = createClient();

    const loadLogs = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('audit_logs')
            .select('id, created_at, action, user_id, table_name, row')
            .eq('table_name', tableName)
            .eq('row', rowId)
            .order('created_at', { ascending: false });
        
        if (data) setLogs(data as AuditLog[]);
        setLoading(false);
    };

    return (
        <Popover open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if(isOpen) loadLogs(); }}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground"><History className="h-4 w-4" /></Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="p-4 space-y-2">
                    <h4 className="font-medium leading-none mb-2">Change History</h4>
                    {loading ? <div className="flex justify-center p-4"><Loader2 className="h-4 w-4 animate-spin" /></div> : (
                        <div className="max-h-[200px] overflow-y-auto text-xs space-y-2">
                            {logs.length === 0 ? <div className="text-muted-foreground italic">No history found.</div> : 
                                logs.map(log => (
                                    <div key={log.id} className="border-b pb-1 last:border-0">
                                        <div className="font-bold text-foreground">{log.action}</div>
                                        <div className="text-[10px] text-muted-foreground">{format(parseISO(log.created_at), 'MMM d, h:mm a')}</div>
                                    </div>
                                ))
                            }
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
};

const WeatherCell = ({ data }: { data: DailyWeather | undefined }) => {
    if (!data) return <div className="text-[10px] text-muted-foreground h-full flex items-center justify-center">-</div>;
    let Icon = Sun; let color = "text-yellow-500";
    if (data.code >= 1 && data.code <= 3) { Icon = Cloud; color = "text-gray-400"; }
    else if (data.code >= 45 && data.code <= 48) { Icon = Wind; color = "text-blue-300"; }
    else if (data.code >= 51 && data.code <= 67) { Icon = CloudRain; color = "text-blue-500"; }
    else if (data.code >= 71 && data.code <= 77) { Icon = Snowflake; color = "text-cyan-400"; }
    else if (data.code >= 95) { Icon = CloudLightning; color = "text-purple-500"; }
    return (
        <div className="flex flex-row items-center justify-center h-full w-full gap-1" title={`${data.min_temp}° - ${data.max_temp}°`}>
            <Icon className={`w-3.5 h-3.5 ${color} print:text-black`} />
            <span className={`text-[11px] font-bold ${data.max_temp >= 105 ? 'text-red-600' : data.max_temp <= 40 ? 'text-blue-600' : 'text-slate-700 dark:text-slate-300'} print:text-black print:text-[9px]`}>{data.max_temp}°</span>
        </div>
    );
};

const TaskBadge = ({ taskKey }: { taskKey: string }) => {
    const task = TASKS[taskKey];
    if (!task) return null;
    return <div className={`${task.color} text-white text-[9px] font-bold px-1 rounded-sm flex items-center justify-center h-4 min-w-[14px] print-color-exact`} title={task.label}>{task.code}</div>;
};

// --- MAIN COMPONENT ---
export default function RosterPage() {
  const supabase = createClient();
  const [isMounted, setIsMounted] = useState(false);

  // -- STATE --
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [weatherData, setWeatherData] = useState<Record<string, DailyWeather[]>>({});
  const [dailyStats, setDailyStats] = useState<Record<string, { people: number, vehicles: string, fullString: string }>>({});
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [currentUserLevel, setCurrentUserLevel] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [copying, setCopying] = useState(false);
  const [visibleLocs, setVisibleLocs] = useState<Record<string, boolean>>({ 'Las Vegas': true, 'Pismo': true, 'Michigan': true });
  const [lastShiftParams, setLastShiftParams] = useState<Record<string, ShiftDefaults>>({});

  // -- MODALS --
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState<string>('');
  const [selectedEmpName, setSelectedEmpName] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);
  const [formRole, setFormRole] = useState('Guide');
  const [formTask, setFormTask] = useState<string>('NONE');
  const [formStart, setFormStart] = useState('09:00');
  const [formEnd, setFormEnd] = useState('17:00');
  const [formLocation, setFormLocation] = useState('Las Vegas');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileEmp, setProfileEmp] = useState<Employee | null>(null);

  // DATE-FNS Helpers
  const startOfWeek = startOfISOWeek(currentDate);
  const endOfWeek = addDays(startOfWeek, 6);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startOfWeek, i));
  const weekNumber = parseInt(format(startOfWeek, 'I')); 
  
  const isManager = currentUserLevel >= 500;
  const isAdmin = currentUserLevel >= 900;

  useEffect(() => {
      setIsMounted(true);
      const saved = localStorage.getItem('roster_filters');
      if (saved) try { setVisibleLocs(JSON.parse(saved)); } catch (e) {}
      if (window.innerWidth < 768) setViewMode('day');
  }, []);

  useEffect(() => { if (isMounted) fetchData(); }, [currentDate, isMounted]);

  const calculateDailyStats = (reservations: ReservationStat[]) => {
    const totalPeople = reservations.reduce((acc, r) => acc + (Number(r.ppl_count) || 0), 0);
    const breakdown = vehiclesList.map((key) => {
        const count = reservations.reduce((acc, r) => acc + (Number(r[key]) || 0), 0);
        return count > 0 ? `${count}-${key}` : null;
    }).filter(Boolean).join(', ');
    return { people: totalPeople, vehicles: '', fullString: breakdown };
  };

  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        setCurrentUserId(user.id);
        const { data: userData } = await supabase.from('users').select('user_level').eq('id', user.id).single();
        if (userData) setCurrentUserLevel(userData.user_level || 0);
    }

    const locationsToFetch = Object.keys(LOCATIONS);
    let aggregatedStaff: Employee[] = [];

    await Promise.all(locationsToFetch.map(async (loc) => {
        const roster = await getStaffRoster(supabase, loc);
        const mapped = roster.map((u: any) => ({
            id: u.id,
            full_name: u.full_name,
            stage_name: u.stage_name || u.full_name.split(' ')[0], 
            location: u.primary_work_location || loc,
            department: u.department || 'General',
            job_title: u.job_title || 'STAFF',
            hire_date: u.hire_date || null,
            user_level: u.user_level,
            timeclock_blocked: !!u.timeclock_blocked,
            email: u.email,
            phone: u.phone,
            avatar_url: u.avatar_url
        }));
        aggregatedStaff = [...aggregatedStaff, ...mapped];
    }));

    const uniqueStaff = Array.from(new Map(aggregatedStaff.map(item => [item.id, item])).values());
    const sortedEmps = uniqueStaff.sort((a, b) => {
         if (b.user_level !== a.user_level) return b.user_level - a.user_level;
         if (!a.hire_date) return 1; if (!b.hire_date) return -1;
         return new Date(a.hire_date).getTime() - new Date(b.hire_date).getTime();
    });
    setEmployees(sortedEmps);
    
    const { data: shiftData } = await supabase.from('employee_schedules')
      .select('*')
      .gte('start_time', startOfWeek.toISOString())
      .lte('start_time', addDays(startOfWeek, 7).toISOString());
    if (shiftData) setShifts(shiftData);

    if (visibleLocs['Las Vegas']) {
        const start = viewMode === 'week' ? format(startOfWeek, 'yyyy-MM-dd') : format(currentDate, 'yyyy-MM-dd');
        const end = format(addDays(startOfWeek, 6), 'yyyy-MM-dd');
        const query = `SELECT * FROM reservations_modified WHERE sch_date >= '${start}' AND sch_date <= '${end}'`;
        try {
            const resData = (await fetch_from_old_db(query)) as ReservationStat[];
            if (Array.isArray(resData)) {
                const newStats: Record<string, any> = {};
                weekDays.forEach(day => {
                    const dateKey = format(day, 'yyyy-MM-dd');
                    const daysRes = resData.filter(r => {
                        if (!r.sch_date) return false;
                        const rawDate = typeof r.sch_date === 'string' ? r.sch_date : (r.sch_date as Date).toISOString();
                        return rawDate.substring(0, 10) === dateKey;
                    });
                    newStats[dateKey] = calculateDailyStats(daysRes);
                });
                setDailyStats(newStats);
            }
        } catch (e) { console.error("Legacy fetch failed", e); }
    }

    const weatherUpdates: Record<string, DailyWeather[]> = {};
    await Promise.all(Object.keys(LOCATIONS).map(async (loc) => {
        if (!visibleLocs[loc]) return;
        const data = await getLocationWeather(loc, format(startOfWeek, 'yyyy-MM-dd'), 7);
        if (data) weatherUpdates[loc] = data;
    }));
    setWeatherData(weatherUpdates);
    setLoading(false);
  };

  const sumDailyHours = (shiftList: Shift[], dateStr: string): number => {
      const dailyShifts = shiftList.filter(s => {
          return format(parseISO(s.start_time), 'yyyy-MM-dd') === dateStr;
      });
      return dailyShifts.reduce((acc, s) => acc + getDurationHours(s.start_time, s.end_time), 0);
  };
  
  const sumWeeklyHours = (shiftList: Shift[]): number => {
      return shiftList.reduce((acc, s) => acc + getDurationHours(s.start_time, s.end_time), 0);
  };

  const logChange = async (action: string, table: string, rowId: string) => {
      if (!currentUserId) return;
      await supabase.from('audit_logs').insert({ action, table_name: table, row: rowId, user_id: currentUserId });
  };

  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = `SunBuggy Schedule - Week ${weekNumber}`;
    window.print();
    document.title = originalTitle;
  };

  const handleCellClick = (emp: Employee, dateStr: string, existingShift?: Shift) => {
    if (!isManager) return;
    setSelectedEmpId(emp.id); setSelectedEmpName(emp.full_name); setSelectedDate(dateStr);
    if (existingShift) {
      setSelectedShiftId(existingShift.id); 
      setFormRole(existingShift.role); 
      setFormTask(existingShift.task || 'NONE'); 
      setFormLocation(existingShift.location || emp.location); 
      setFormStart(format(parseISO(existingShift.start_time), 'HH:mm')); 
      setFormEnd(format(parseISO(existingShift.end_time), 'HH:mm'));
    } else {
      setSelectedShiftId(null); const defaults = lastShiftParams[emp.id];
      if (defaults) { setFormRole(defaults.role); setFormTask(defaults.task || 'NONE'); setFormStart(defaults.start); setFormEnd(defaults.end); setFormLocation(defaults.location); }
      else { setFormRole('Guide'); setFormTask('NONE'); setFormLocation(emp.location); setFormStart('09:00'); setFormEnd('17:00'); }
    }
    setIsShiftModalOpen(true);
  };

  const handleSaveShift = async () => {
    if (!isManager) return;
    setLoading(true);

    try {
        const startISO = `${selectedDate}T${formStart}:00`;
        let endISO = `${selectedDate}T${formEnd}:00`;

        if (formEnd < formStart) {
            const nextDay = addDays(parseISO(selectedDate), 1);
            endISO = `${format(nextDay, 'yyyy-MM-dd')}T${formEnd}:00`;
        }

        const payload = {
            user_id: selectedEmpId,
            start_time: new Date(startISO).toISOString(),
            end_time: new Date(endISO).toISOString(),
            role: formRole,
            location: formLocation,
            task: formTask === 'NONE' ? null : formTask
        };

        let error = null;
        let resultData = null;

        if (selectedShiftId) {
            const response = await supabase
                .from('employee_schedules')
                .update(payload)
                .eq('id', selectedShiftId)
                .select()
                .single();
            error = response.error;
            resultData = response.data;
            if (!error && resultData) await logChange('Updated Shift', 'employee_schedules', selectedShiftId);
        } else {
            const response = await supabase
                .from('employee_schedules')
                .insert([payload])
                .select()
                .single();
            error = response.error;
            resultData = response.data;
            if (!error && resultData) await logChange('Created Shift', 'employee_schedules', resultData.id);
        }

        if (error) {
            console.error('Supabase Save Error:', error);
            toast.error(`Save Failed: ${error.message}`);
            setLoading(false);
            return;
        }

        setLastShiftParams(p => ({
            ...p,
            [selectedEmpId]: {
                role: formRole,
                task: formTask === 'NONE' ? undefined : formTask,
                start: formStart,
                end: formEnd,
                location: formLocation
            }
        }));

        toast.success("Shift Saved Successfully");
        setIsShiftModalOpen(false);
        await fetchData();

    } catch (err) {
        console.error("Unexpected error:", err);
        toast.error("An unexpected error occurred.");
    } finally {
        setLoading(false);
    }
  };

  const handleDeleteShift = async () => {
    if (!isManager || !selectedShiftId) return;

    await logChange(`Deleted shift`, 'employee_schedules', selectedShiftId);
    
    const { error } = await supabase
        .from('employee_schedules')
        .delete()
        .eq('id', selectedShiftId);

    if (error) {
        console.error("Deletion error:", error);
        toast.error("Deletion Failed");
        return;
    }

    setShifts((prevShifts) => prevShifts.filter(s => s.id !== selectedShiftId));
    setIsShiftModalOpen(false); 
    toast.success("Shift Deleted");
    fetchData(); 
  };

 const handleCopyWeek = async () => {
      if (!isManager || shifts.length === 0) return;
      if (!confirm(`Copy current shifts to next week?`)) return;
      
      setCopying(true);
      
      try {
        const newShifts = shifts.map(s => ({ 
            user_id: s.user_id, 
            role: s.role, 
            task: s.task, 
            start_time: addWeeks(parseISO(s.start_time), 1).toISOString(), 
            end_time: addWeeks(parseISO(s.end_time), 1).toISOString(), 
            location: s.location || 'Las Vegas' 
        }));

        const { error } = await supabase.from('employee_schedules').insert(newShifts);
        if (error) throw error;
        toast.success("Week Copied Successfully");
        const nextWeek = addWeeks(currentDate, 1);
        setCurrentDate(nextWeek);
      } catch (e: any) {
          console.error("Copy Error:", e);
          toast.error(`Copy Failed: ${e.message}`);
      } finally {
          setCopying(false);
      }
  };

const handleSaveProfile = async () => {
      if (!isManager || !profileEmp) return;

      const { error: userError } = await supabase.from('users').update({ 
          phone: profileEmp.phone, 
          avatar_url: profileEmp.avatar_url,
      }).eq('id', profileEmp.id);
      
      if (userError) {
          toast.error("Error updating user profile");
          return;
      }

      const { error: empError } = await supabase.from('employee_details').upsert({
          user_id: profileEmp.id,
          hire_date: profileEmp.hire_date || null,
          department: profileEmp.department,         
          primary_position: profileEmp.job_title,    
          primary_work_location: profileEmp.location,
          timeclock_blocked: profileEmp.timeclock_blocked
      }, { onConflict: 'user_id' });

      if (empError) {
          console.error(empError);
          toast.error("Error updating employment details");
          return;
      }

      fetchData(); 
      setIsProfileModalOpen(false); 
      toast.success("Saved");
  };

  const handleArchiveEmployee = async () => {
      if (!isAdmin || !profileEmp) return;
      if (!confirm(`Archive ${profileEmp.full_name}?`)) return;
      await supabase.from('users').update({ user_level: 100 }).eq('id', profileEmp.id);
      fetchData(); setIsProfileModalOpen(false); toast.success("Archived");
  };

  const groupedEmployees = useMemo(() => {
      const groups: Record<string, any> = {};
      Object.keys(LOCATIONS).forEach(loc => {
          groups[loc] = {};
          LOCATIONS[loc].forEach(dept => {
              groups[loc][dept] = { 'General': [] };
              (ROLE_GROUPS[dept] || []).forEach(role => groups[loc][dept][role] = []);
          });
          groups[loc]['Visiting Staff'] = { 'General': [] };
      });
      employees.forEach(emp => {
          const loc = LOCATIONS[emp.location] ? emp.location : 'Las Vegas';
          let dept = emp.department; if (!groups[loc][dept]) dept = Object.keys(groups[loc])[0];
          let role = 'General'; const match = (ROLE_GROUPS[dept] || []).find(r => emp.job_title.toUpperCase().includes(r));
          if (match) role = match;
          groups[loc][dept][role].push(emp);
      });
      return groups;
  }, [employees]);

  if (!isMounted) return null;

  return (
    <div id="roster-container" className="p-2 h-[calc(100vh-65px)] flex flex-col bg-background text-foreground print:p-0 print:bg-white print:h-auto print:block print:w-full">
      <style jsx global>{`
        @media print {
            @page { size: landscape; margin: 0.25cm; }
            body, .bg-slate-900, .bg-slate-100, .bg-card, .bg-background, .dark { background-color: white !important; color: black !important; border-color: #000 !important; }
            #roster-container { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; }
            nav, header, aside, .print-hide { display: none !important; }
            .print-yellow { background-color: #fde047 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            .print-color-exact { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            div[class*="rounded-r"] { background-color: white !important; border: 1px solid black !important; color: black !important; }
            .print-break-before-page { break-before: page; page-break-before: always; }
            .print-break-after-avoid { break-after: avoid; page-break-after: avoid; }
            .dept-block { break-inside: avoid; page-break-inside: avoid; }
            .print-show-phone { display: block !important; }
            tr { height: auto !important; }
            td, th { padding: 1px 2px !important; font-size: 10px !important; vertical-align: middle !important; }
            .print-no-avatar { display: none !important; }
        }
      `}</style>

      {/* COMPACT HEADER V9.1 (Mobile Responsive) */}
      <div className="flex flex-col gap-2 print-hide z-[60] sticky top-0 bg-background/95 backdrop-blur pb-2 pt-1">
          <div className="min-h-[3.5rem] h-auto flex flex-col md:flex-row items-center justify-between gap-y-3 p-2 border rounded-lg bg-card shadow-sm relative">
            
            {/* LEFT SECTION: Title & Filters */}
            <div className="w-full md:w-auto order-2 md:order-1 flex items-center gap-3">
               <h1 className="text-lg font-bold hidden lg:block">Roster</h1>
               <Separator orientation="vertical" className="h-6 hidden lg:block" />
               <div className="flex items-center gap-1 overflow-x-auto no-scrollbar w-full md:w-auto">
                <Filter className="w-3.5 h-3.5 text-muted-foreground mr-1 flex-shrink-0" />
                {Object.keys(LOCATIONS).map(loc => (
                    <Badge 
                        key={loc} 
                        variant={visibleLocs[loc] ? 'default' : 'outline'} 
                        className={`cursor-pointer select-none px-2 py-0.5 text-[10px] whitespace-nowrap ${visibleLocs[loc] ? 'bg-primary hover:bg-primary/90' : 'bg-transparent text-muted-foreground hover:bg-accent'}`} 
                        onClick={() => { const newState = { ...visibleLocs, [loc]: !visibleLocs[loc] }; setVisibleLocs(newState); localStorage.setItem('roster_filters', JSON.stringify(newState)); }}
                    >
                        {loc}
                    </Badge>
                ))}
               </div>
            </div>

            {/* CENTER SECTION: UNIFIED DATE COMMAND CENTER (v10.6 Fix) */}
            <div className="w-full md:w-auto order-1 md:order-2 flex justify-center md:absolute md:left-1/2 md:-translate-x-1/2 z-10">
                <div className="flex flex-col items-center gap-1">
                    
                    {/* TOP: Date Display (Text) */}
                    <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                        <PopoverTrigger asChild>
                            <div className="text-xs font-bold text-foreground leading-none cursor-pointer hover:underline text-center">
                                {viewMode === 'week' 
                                    ? `${format(startOfWeek, 'yyyy')} Week ${weekNumber} ${format(startOfWeek, 'MMM d')} - ${format(endOfWeek, 'd')}` 
                                    : format(currentDate, 'yyyy MMM do')
                                }
                            </div>
                        </PopoverTrigger>
                        
                        {/* CUSTOM MINI CALENDAR CONTENT */}
                        <PopoverContent className="w-auto p-0" align="center">
                            <MiniCalendar 
                                selectedDate={currentDate} 
                                onSelect={(d) => {
                                    setCurrentDate(d);
                                    setIsCalendarOpen(false);
                                }} 
                            />
                        </PopoverContent>
                    </Popover>

                    {/* BOTTOM: Nav Controls */}
                    <div className="flex items-center gap-1">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6" 
                            onClick={() => setCurrentDate(viewMode === 'week' ? subWeeks(currentDate, 1) : subDays(currentDate, 1))}
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </Button>

                        {/* Calendar Icon Button (Triggers Popover) */}
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6" 
                            onClick={() => setIsCalendarOpen(true)}
                        >
                            <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                        </Button>

                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6" 
                            onClick={() => setCurrentDate(viewMode === 'week' ? addWeeks(currentDate, 1) : addDays(currentDate, 1))}
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Button>

                        {/* NOW Button */}
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 px-2 text-[10px] uppercase font-bold text-muted-foreground ml-1"
                            onClick={() => setCurrentDate(new Date())}
                            title="Jump to Today"
                        >
                            Now
                        </Button>
                    </div>

                </div>
            </div>

            {/* RIGHT SECTION: Tools */}
            <div className="w-full md:w-auto order-3 md:order-3 flex items-center justify-between md:justify-end gap-2">
                <div className="flex items-center bg-muted p-0.5 rounded-lg border">
                  <Button variant={viewMode === 'day' ? 'secondary' : 'ghost'} size="sm" className="h-7 px-2 text-[10px]" onClick={() => setViewMode('day')}>Day</Button>
                  <Button variant={viewMode === 'week' ? 'secondary' : 'ghost'} size="sm" className="h-7 px-2 text-[10px]" onClick={() => setViewMode('week')}>Week</Button>
                </div>
                <div className="flex items-center gap-2">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 gap-1 px-2 text-xs">
                            <Info className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Key</span>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-3" align="end">
                            <h4 className="font-bold text-xs mb-2 text-muted-foreground">Task Legend</h4>
                            <div className="grid grid-cols-2 gap-2">
                                {Object.values(TASKS).map(task => (
                                    <div key={task.code} className="flex items-center gap-2">
                                        <div className={`w-4 h-4 ${task.color} rounded flex items-center justify-center text-[9px] text-white font-bold`}>{task.code}</div>
                                        <span className="text-xs">{task.label}</span>
                                    </div>
                                ))}
                            </div>
                        </PopoverContent>
                    </Popover>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 gap-1 px-2 text-xs">
                                <Settings className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Manage</span>
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-48 p-2" align="end">
                            <div className="flex flex-col gap-1">
                                <Button variant="ghost" size="sm" onClick={handlePrint} className="justify-start h-8 text-xs w-full"><Printer className="w-3.5 h-3.5 mr-2" /> Print Schedule</Button>
                                {isManager && (
                                    <>
                                        <Button variant="ghost" size="sm" onClick={handleCopyWeek} disabled={copying || shifts.length === 0} className="justify-start h-8 text-xs w-full">
                                            {copying ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : <Copy className="w-3.5 h-3.5 mr-2" />} Copy Previous Week
                                        </Button>
                                        <div className="pt-1 mt-1 border-t">
                                            <PublishButton weekStart={format(startOfWeek, 'yyyy-MM-dd')} />
                                        </div>
                                    </>
                                )}
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
            </div>
          </div>
      </div>

      {/* TABLE GRID */}
      <div className="flex-1 overflow-auto border rounded-lg shadow-sm bg-card print:overflow-visible print:h-auto print:border-none print:shadow-none print:bg-white relative">
        {viewMode === 'week' && (
        <table className="w-full border-collapse min-w-[1000px] text-sm print:w-full print:min-w-0 print:text-[10px]">
          {/* MAIN HEADER: Sticky Top-0, Z-50 (Highest) */}
          <thead className="sticky top-0 bg-muted z-50 shadow-sm print:static print:bg-white print:border-b-2 print:border-black h-8">
            <tr>
                {/* UPDATED HEADER CELL (v9.5): Fixed Width: w-32 (128px) */}
                <th className="p-1 h-8 text-center w-32 border-b font-bold text-muted-foreground bg-muted print:pl-1 print:bg-white print:text-black z-50">
                    <div className="flex flex-row items-center justify-center gap-1">
                         <Users className="w-4 h-4" />
                         <span className="text-[10px] uppercase">Staff</span>
                    </div>
                </th>
                {weekDays.map(day => (
                    // UPDATED DATE CELL (v10.7)
                    <th key={day.toISOString()} className="p-1 h-8 text-center border-b min-w-[100px] border-l bg-muted print:bg-white print:text-black print:w-[12%]">
                        <span className="text-xs font-bold text-foreground">{format(day, 'EEE')}</span>
                        <span className="text-xs ml-1 text-muted-foreground">{format(day, 'd')}</span>
                    </th>
                ))}
            </tr>
          </thead>
          
          {Object.entries(groupedEmployees).map(([locName, departments], locIndex) => {
                if (!visibleLocs[locName]) return null;
                const locShifts = shifts.filter(s => (s.location === locName));
                const locWeather = weatherData[locName] || [];

                return (
                    <Fragment key={locName}>
                        <tbody className="print:break-after-avoid relative">
                            {/* LOCATION HEADER: Sticky Top-8 (Just under Main Header), Z-40 */}
                            <tr className={`bg-yellow-400 text-black print-yellow border-b-2 border-black sticky top-8 z-40 ${locIndex > 0 ? 'print-break-before-page' : ''}`}>
                                <td className="p-2 font-bold uppercase tracking-wider text-xs border-b border-black sticky left-0 z-40 bg-yellow-400 print-yellow print:static print:text-black print:text-sm">
                                    <div className="flex flex-col justify-center items-center text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            <MapPin className="w-3 h-3 print:hidden" /> 
                                            <span className="text-[10px]">{locName}</span>
                                        </div>
                                        <span className="bg-white/50 text-[10px] px-1.5 py-0.5 rounded text-black font-mono border border-black/20 mt-1">{sumWeeklyHours(locShifts).toFixed(1)}h</span>
                                    </div>
                                </td>
                                {weekDays.map(day => {
                                    const dateStr = format(day, 'yyyy-MM-dd');
                                    const dailyTotal = sumDailyHours(locShifts, dateStr);
                                    const stats = locName === 'Las Vegas' ? dailyStats[dateStr] : null;
                                    return (
                                        <td key={dateStr} className="border-l border-black bg-yellow-400 print-yellow text-center text-[10px] font-mono text-black align-top p-1 sticky top-8 z-30">
                                            <div className="font-bold">{dailyTotal > 0 ? `${dailyTotal.toFixed(1)}h` : '-'}</div>
                                            {stats && stats.people > 0 && (
                                                /* UPDATED DASHBOARD LINK (v9.7) - Uses getDashboardLink helper */
                                                <Button 
                                                    asChild 
                                                    variant="ghost" 
                                                    className="mt-1 h-auto py-1 px-1.5 border border-black/10 hover:bg-black/10 text-orange-900 rounded-sm w-full flex flex-col items-center gap-0.5"
                                                    title={stats.fullString}
                                                >
                                                    <Link href={getDashboardLink(locName, dateStr)}>
                                                        <div className="font-bold flex items-center gap-1 text-xs">
                                                            <BarChart3 className="w-3 h-3 opacity-50" />
                                                            {stats.people} <span className="text-[8px] uppercase opacity-70">ppl</span>
                                                        </div>
                                                        <div className="text-[8px] leading-none opacity-80 whitespace-nowrap overflow-hidden text-ellipsis w-full max-w-[60px] text-center">
                                                            {stats.fullString}
                                                        </div>
                                                    </Link>
                                                </Button>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                            {/* FORECAST ROW: Scrolls under the sticky headers */}
                            <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 h-8 print:h-auto print:border-black print:break-after-avoid">
                                <td className="p-1 text-[10px] font-semibold text-muted-foreground uppercase border-r sticky left-0 z-30 bg-slate-50 dark:bg-slate-900 print:bg-white print:static print:text-black text-center">Forecast</td>
                                {weekDays.map(day => (<td key={day.toISOString()} className="border-l p-0 text-center print:border-gray-300"><WeatherCell data={locWeather.find(w => w.date === format(day, 'yyyy-MM-dd'))} /></td>))}
                            </tr>
                        </tbody>

                        {Object.entries(departments).map(([deptName, roleGroups]) => {
                            if (!Object.values(roleGroups as Record<string, Employee[]>).some(g => (g).length > 0)) return null;
                            const deptEmps = Object.values(roleGroups as Record<string, Employee[]>).flat();
                            const deptShifts = locShifts.filter(s => (deptEmps as any[]).some(e => e.id === s.user_id));
                            const isVisiting = deptName === 'Visiting Staff';
                            const deptColorClass = DEPT_STYLES[deptName] || DEPT_STYLES['DEFAULT'];

                            return (
                                <tbody key={`${locName}-${deptName}`} className="dept-block">
                                    <tr className={`${isVisiting ? 'bg-amber-50 dark:bg-amber-950/30' : deptColorClass} print-color-exact border-t-2 border-slate-200 print:border-black`}>
                                        <td className={`p-1 font-bold text-xs uppercase border-b sticky left-0 z-30 w-32 ${isVisiting ? 'text-amber-600' : ''} print:static print:text-black print:border-black`}>
                                            <div className="flex flex-col justify-center items-center text-center w-full whitespace-normal leading-tight">
                                                <span>{isVisiting && <Plane className="w-3 h-3 inline mr-1 mb-0.5" />} {deptName}</span>
                                                <span className="text-[10px] opacity-70 bg-black/5 dark:bg-white/10 px-1 rounded print:bg-white print:text-black print:border print:border-black mt-0.5">{sumWeeklyHours(deptShifts).toFixed(1)}h</span>
                                            </div>
                                        </td>
                                        {weekDays.map(day => (
                                            <td key={day.toISOString()} className="border-l border-b bg-inherit text-center text-[10px] font-mono opacity-70 print:text-black print:border-black">
                                                {sumDailyHours(deptShifts, format(day, 'yyyy-MM-dd')) > 0 && <span>{sumDailyHours(deptShifts, format(day, 'yyyy-MM-dd')).toFixed(1)}h</span>}
                                            </td>
                                        ))}
                                    </tr>

                                    {Object.entries(roleGroups as Record<string, Employee[]>).map(([roleName, emps]) => {
                                        if (emps.length === 0) return null;
                                        return (
                                            <Fragment key={roleName}>
                                                {roleName !== 'General' && (
                                                    <tr className="bg-slate-50/50 dark:bg-slate-900/20 print:bg-white">
                                                        <td colSpan={8} className="px-4 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider print:text-black print:pl-2">↳ {roleName}</td>
                                                    </tr>
                                                )}
                                                {emps.map((emp: Employee) => {
                                                    const empShifts = shifts.filter(s => s.user_id === emp.id);
                                                    return (
                                                    <tr key={`${locName}-${emp.id}`} className="hover:bg-muted/20 transition-colors border-b print:border-gray-400 print:h-auto">
                                                        {/* EMPLOYEE CELL (v9.4 layout preserved): w-32, Side-by-Side */}
                                                        <td className="p-0 border-r border-r-slate-100 dark:border-r-slate-800 sticky left-0 z-30 bg-card print:static print:border-r print:border-black print:p-0">
                                                            <div className="p-1 w-32 flex flex-row items-center justify-start h-full gap-2 print:w-auto">
                                                                <div className="flex-shrink-0 print:hidden ml-1">
                                                                    <UserStatusAvatar 
                                                                        user={emp} 
                                                                        currentUserLevel={currentUserLevel} 
                                                                        isCurrentUser={currentUserId === emp.id}
                                                                        size="md" 
                                                                    />
                                                                </div>
                                                                <div className="flex flex-col items-start justify-center min-w-0 overflow-hidden">
                                                                    <div className="font-bold text-xs truncate w-full text-left" title={emp.full_name}>
                                                                        {emp.stage_name}
                                                                        {emp.timeclock_blocked && <Ban className="w-3 h-3 text-red-500 inline ml-1" />}
                                                                    </div>
                                                                    <div className="mt-0.5">
                                                                        {sumWeeklyHours(empShifts) > 0 && (
                                                                            <span className="text-[10px] bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-200 px-1.5 py-0.5 rounded-sm font-mono inline-block">
                                                                                {sumWeeklyHours(empShifts).toFixed(1)}h
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                
                                                                <div className="hidden print:flex flex-row items-center justify-between w-full">
                                                                    <div className="flex items-center gap-1.5 overflow-hidden">
                                                                        <span className="font-bold text-[10px] truncate">{emp.stage_name}</span>
                                                                    </div>
                                                                    {sumWeeklyHours(empShifts) > 0 && <span className="text-[10px] font-mono font-bold border border-black px-1 ml-1 whitespace-nowrap">{sumWeeklyHours(empShifts).toFixed(1)}h</span>}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        {weekDays.map(day => {
                                                            const dateStr = format(day, 'yyyy-MM-dd');
                                                            const shift = shifts.find(s => s.user_id === emp.id && format(parseISO(s.start_time), 'yyyy-MM-dd') === dateStr);
                                                            const shouldRender = shift && (!isVisiting || shift.location === locName);
                                                            const isAway = shift && shift.location !== emp.location && !isVisiting;
                                                            return (
                                                                <td key={dateStr} className={`p-1 border-l relative h-14 print:h-auto print:border-black ${isManager ? 'cursor-pointer group' : ''}`} onClick={() => isManager && handleCellClick(emp, dateStr, shift)}>
                                                                    {shouldRender ? (
                                                                        <div className={`h-full w-full border-l-2 rounded-r p-1 flex flex-col justify-center print:bg-white print:border print:border-black print:p-0.5 print:rounded-none ${isAway ? 'bg-amber-50 border-l-amber-500' : 'bg-blue-100 border-l-blue-500 dark:bg-blue-900'}`}>
                                                                            {shift.task && <div className="absolute top-0 right-0 p-0.5"><TaskBadge taskKey={shift.task} /></div>}
                                                                            <span className="font-bold text-foreground text-xs leading-none mb-0.5 print:text-black">{format(parseISO(shift.start_time), 'h:mma')}</span>
                                                                            <span className="text-[10px] text-muted-foreground leading-none print:text-black">- {format(parseISO(shift.end_time), 'h:mma')}</span>
                                                                            {isAway && <div className="text-[9px] font-bold text-amber-700 mt-1 uppercase print:text-black"><Plane className="w-2 h-2 inline" /> {shift.location}</div>}
                                                                        </div>
                                                                    ) : (!isVisiting && isManager && <div className="h-full w-full flex items-center justify-center opacity-0 group-hover:opacity-100 print:hidden"><Plus className="w-4 h-4 text-muted-foreground/30" /></div>)}
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                    );
                                                })}
                                            </Fragment>
                                        );
                                    })}
                                </tbody>
                            );
                        })}
                    </Fragment>
                );
            })}
        </table>
        )}

        {/* --- DAY VIEW (Refactored to date-fns) --- */}
        {viewMode === 'day' && (
            <div className="p-4 space-y-6 print:space-y-4">
                {Object.entries(groupedEmployees).map(([locName, departments]) => {
                    if (!visibleLocs[locName]) return null;
                    const dateKey = format(currentDate, 'yyyy-MM-dd');
                    const activeDepts = Object.entries(departments).filter(([deptName, roleGroups]) => 
                         Object.values(roleGroups as Record<string, Employee[]>).some((group: any) => group.some((emp: any) => shifts.some(s => s.user_id === emp.id && format(parseISO(s.start_time), 'yyyy-MM-dd') === dateKey)))
                    );

                    if (activeDepts.length === 0) return null;
                    const todayWeather = weatherData[locName]?.find(w => w.date === dateKey);

                    return (
                        <div key={locName} className="border rounded-lg overflow-hidden bg-card shadow-sm print:border-black print:shadow-none">
                            <div className="bg-slate-900 text-white p-3 font-bold uppercase flex justify-between items-center print:bg-white print:text-black print:border-b print:border-black">
                                <div className="flex flex-col">
                                    <div className="flex items-center"><MapPin className="w-4 h-4 inline mr-2" /> {locName}</div>
                                    {locName === 'Las Vegas' && dailyStats[dateKey] && (
                                        <div className="text-xs font-normal text-orange-300 normal-case mt-1 font-mono">
                                            People: {dailyStats[dateKey].people} — {dailyStats[dateKey].fullString}
                                        </div>
                                    )}
                                </div>
                                {todayWeather && (<div className="flex items-center gap-2 bg-slate-800 px-3 py-1 rounded-full border border-slate-700 print:bg-white print:text-black print:border-black"><WeatherCell data={todayWeather} /></div>)}
                            </div>
                            <div className="divide-y divide-slate-100 dark:divide-slate-800 print:divide-black">
                                {activeDepts.map(([deptName, roleGroups]) => {
                                    const allDeptEmps = Object.values(roleGroups as Record<string, Employee[]>).flat();
                                    return (
                                    <div key={deptName} className="p-0 print:break-before">
                                        <div className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider border-b ${DEPT_STYLES[deptName] || 'bg-muted'} print:bg-gray-100 print:text-black print:border-black`}>
                                            {deptName === 'Visiting Staff' && <Plane className="w-3 h-3 inline mr-1" />} {deptName}
                                        </div>
                                        <div className="divide-y divide-slate-100 dark:divide-slate-800 print:divide-black">
                                            {allDeptEmps.map((emp: any) => {
                                                const shift = shifts.find(s => s.user_id === emp.id && format(parseISO(s.start_time), 'yyyy-MM-dd') === dateKey);
                                                if (!shift) return null;
                                                return (
                                                    <div key={emp.id} className="flex items-center justify-between p-3 hover:bg-muted/10 print:p-2 print:border-b print:border-gray-200">
                                                        <div className="flex items-center gap-3">
                                                            <UserStatusAvatar 
                                                                user={emp} 
                                                                currentUserLevel={currentUserLevel} 
                                                                isCurrentUser={currentUserId === emp.id}
                                                                size="md" 
                                                            />
                                                            <div>
                                                                <div className="font-semibold text-sm flex items-center gap-2"><span className="">{emp.stage_name}</span></div>
                                                                <div className="hidden print:block text-[9px] font-mono leading-tight">{emp.phone}</div>
                                                                <div className="text-xs text-muted-foreground flex items-center gap-1 print:text-black">
                                                                    <Badge variant="outline" className="text-[10px] h-5 px-1 print:border-black">{shift.role}</Badge>
                                                                    {shift.task && <TaskBadge taskKey={shift.task} />}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="font-mono font-bold text-sm bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-100 px-2 py-1 rounded border border-blue-100 dark:border-blue-900 print:bg-white print:text-black print:border-black">
                                                                {format(parseISO(shift.start_time), 'h:mm a')} - {format(parseISO(shift.end_time), 'h:mm a')}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )})}
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
      </div>

      {/* MODALS */}
      <div className="print-hide">
          {/* SHIFT EDITOR MODAL */}
          <Dialog open={isShiftModalOpen} onOpenChange={setIsShiftModalOpen}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between w-full">
                        <span>Shift Details</span>
                        {selectedShiftId && <ChangeLogViewer tableName="employee_schedules" rowId={selectedShiftId} />}
                    </DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-2">
                    <div className="text-sm font-semibold">{selectedEmpName} <span className="font-normal text-muted-foreground">- {selectedDate ? format(parseISO(selectedDate), 'MMM do') : ''}</span></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-xs">Start</label><Input type="time" disabled={!isManager} value={formStart} onChange={(e) => {setFormStart(e.target.value); if(e.target.value) setFormEnd(format(addDays(parseISO(`${selectedDate}T${e.target.value}`), 0), 'HH:mm'));}} /></div>
                        <div><label className="text-xs">End</label><Input type="time" disabled={!isManager} value={formEnd} onChange={e => setFormEnd(e.target.value)} /></div>
                    </div>
                    <div><label className="text-xs">Role</label><Select value={formRole} onValueChange={setFormRole} disabled={!isManager}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['Guide','Desk','Driver','Mechanic','Manager'].map(r=><SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select></div>
                    
                    <div>
                        <label className="text-xs">Special Task</label>
                        <Select value={formTask} onValueChange={setFormTask} disabled={!isManager}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="NONE">None</SelectItem>{Object.entries(TASKS).map(([key, task]) => (<SelectItem key={key} value={key}><div className="flex items-center gap-2"><div className={`w-3 h-3 ${task.color} rounded-sm`}></div>{task.label}</div></SelectItem>))}</SelectContent></Select></div>
                    <div><label className="text-xs">Location</label><Select value={formLocation} onValueChange={setFormLocation} disabled={!isManager}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.keys(LOCATIONS).map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent></Select></div>
                </div>
                <DialogFooter className="flex justify-between w-full">
                    {selectedShiftId && isManager ? (
                        <Button variant="destructive" size="sm" onClick={handleDeleteShift}>
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </Button>
                    ) : <div/>}
                    
                    {isManager && <Button size="sm" onClick={handleSaveShift}>Save</Button>}
                </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {/* PROFILE EDITOR MODAL */}
          <Dialog open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between w-full">
                        <span>Edit Employee</span>
                        {profileEmp && <ChangeLogViewer tableName="users" rowId={profileEmp.id} />}
                    </DialogTitle>
                </DialogHeader>
                {profileEmp && (
                <div className="grid gap-4 py-2">
                    <div className="flex items-center gap-4 border-b pb-4 mb-2"><UserStatusAvatar user={profileEmp} currentUserLevel={currentUserLevel} size="lg" /><div><div className="text-lg font-bold">{profileEmp.full_name}</div><div className="text-xs text-muted-foreground">{profileEmp.email}</div></div></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-xs">Location</label><Select value={profileEmp.location} onValueChange={(v)=>setProfileEmp({...profileEmp,location:v})} disabled={!isManager}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{Object.keys(LOCATIONS).map(l=><SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent></Select></div>
                        <div><label className="text-xs">Department</label><Select value={profileEmp.department} onValueChange={(v)=>setProfileEmp({...profileEmp,department:v})} disabled={!isManager}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{(LOCATIONS[profileEmp.location as keyof typeof LOCATIONS]||[]).map(d=><SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select></div>
                    </div>
                    <div>
                        <label className="text-xs">Job Title / Role</label>
                        <Select 
                            value={profileEmp.job_title} 
                            onValueChange={(v) => setProfileEmp({ ...profileEmp, job_title: v })} 
                            disabled={!isManager}
                        >
                            <SelectTrigger><SelectValue placeholder="Select Role" /></SelectTrigger>
                            <SelectContent>
                                {(ROLE_GROUPS[profileEmp.department] || ['STAFF']).map(role => (
                                    <SelectItem key={role} value={role}>{role}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-xs">Hire Date</label><Input type="date" disabled={!isManager} value={profileEmp.hire_date||''} onChange={(e)=>setProfileEmp({...profileEmp,hire_date:e.target.value})} /></div>
                        <div><label className="text-xs">Phone Number</label><Input type="tel" disabled={!isManager} value={profileEmp.phone || ''} onChange={(e) => setProfileEmp({...profileEmp, phone: e.target.value})} /></div>
                    </div>
                    <div><label className="text-xs">Avatar URL</label><Input type="text" disabled={!isManager} value={profileEmp.avatar_url || ''} onChange={(e) => setProfileEmp({...profileEmp, avatar_url: e.target.value})} /></div>
                    {isManager && (<div className="flex items-center justify-between border p-3 rounded bg-slate-50 dark:bg-slate-900/50"><div><h4 className="text-sm font-bold flex items-center gap-2"><Ban className="w-4 h-4 text-red-500"/> Block Timeclock</h4></div><Switch checked={profileEmp.timeclock_blocked} onCheckedChange={(c)=>setProfileEmp({...profileEmp,timeclock_blocked:c})} disabled={!isManager} /></div>)}
                    {isAdmin && (<div className="bg-red-50 p-3 rounded-md border border-red-100 mt-2"><Button variant="destructive" size="sm" className="w-full" onClick={handleArchiveEmployee}>Archive Employee</Button></div>)}
                </div>
                )}
                <DialogFooter><Button variant="outline" onClick={()=>setIsProfileModalOpen(false)}>Cancel</Button>{isManager && <Button onClick={handleSaveProfile}>Save</Button>}</DialogFooter>
            </DialogContent>
          </Dialog>
      </div>
    </div>
  );
}