'use client';

// ============================================================================
// SUNBUGGY ROSTER PAGE (Print Master v5 - Fixed Location Breaks)
// ============================================================================
// Features: 
// - Visual Roster & Live Status
// - Weather Integration & Resource Planning
// - Shift Management
// - PRINT PERFECT: 
//    - Yellow Location Headers
//    - Locations start on fresh pages (Fixed Break Logic)
//    - Departments stay together
//    - "2025 Week #" Header
// ============================================================================

import { useState, useEffect, Fragment, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { getLocationWeather, DailyWeather } from '@/app/actions/weather'; 
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
    Ban, Copy, Loader2, Plane, Filter, LayoutList, 
    Table as TableIcon, Info, History, Clock,
    Sun, Cloud, CloudRain, Snowflake, CloudLightning, Wind, Printer,
    Flame, Wrench, Shield, CheckSquare, Mountain
} from 'lucide-react';
import { toast } from 'sonner';
import moment from 'moment';
import { Badge } from '@/components/ui/badge';
import ContactMenu from '@/components/ContactMenu';
import Image from 'next/image';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import PublishButton from './components/publish-button';


// ============================================================================
// 1. CONFIGURATION & TYPES
// ============================================================================

const LOCATIONS: Record<string, string[]> = {
  'Las Vegas': ['ADMIN', 'OFFICE', 'DUNES', 'SHUTTLES', 'SHOP'],
  'Pismo': ['ADMIN', 'CSR', 'BEACH', 'SHOP'],
  'Michigan': ['ADMIN', 'SHOP', 'GUIDES', 'OFFICE']
};

// Colors for Specific Departments (Tailwind Classes)
const DEPT_STYLES: Record<string, string> = {
  'OFFICE': 'bg-orange-100 dark:bg-orange-950/30 border-orange-200 text-orange-900 dark:text-orange-100',
  'SHOP': 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 text-zinc-900 dark:text-zinc-100',
  'SHUTTLES': 'bg-blue-100 dark:bg-blue-950/30 border-blue-200 text-blue-900 dark:text-blue-100',
  'DEFAULT': 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 text-slate-700'
};

// Role Ordering / Configuration within Departments
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

const TASKS: Record<string, { label: string, color: string, code: string, icon: any }> = {
  'TORCH': { label: 'TORCH (Dispatch)', color: 'bg-red-600', code: 'T', icon: Flame },
  'SST': { label: 'SST (Support)', color: 'bg-blue-600', code: 'S', icon: Wrench },
  'SITE_MGR': { label: 'Site Manager', color: 'bg-green-600', code: 'SM', icon: Shield },
  'CHECK_IN': { label: 'Check-In', color: 'bg-purple-600', code: 'C', icon: CheckSquare },
  'VOF': { label: 'Valley of Fire', color: 'bg-orange-500', code: 'V', icon: Mountain }
};

interface Employee {
  id: string;
  full_name: string;
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

// ============================================================================
// 2. HELPER COMPONENTS
// ============================================================================

const UserAvatar = ({ emp, isOnline, size = 'md' }: { emp: Employee, isOnline: boolean, size?: 'sm'|'md'|'lg' }) => {
    const dims = size === 'sm' ? 'w-8 h-8 print:w-5 print:h-5' : size === 'lg' ? 'w-16 h-16' : 'w-10 h-10 print:w-6 print:h-6';
    const fontSize = size === 'sm' ? 'text-[10px]' : size === 'lg' ? 'text-lg' : 'text-xs';
    const initials = emp.full_name ? emp.full_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : '??';

    return (
        <div className="relative inline-block">
            <div className={`${dims} rounded-full overflow-hidden bg-slate-200 border border-slate-300 flex items-center justify-center relative`}>
                {emp.avatar_url ? (
                    <Image src={emp.avatar_url} alt={emp.full_name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw"/>
                ) : (
                    <span className={`font-bold text-slate-500 ${fontSize}`}>{initials}</span>
                )}
            </div>
            <span className={`print:hidden absolute bottom-0 right-0 block h-3 w-3 rounded-full ring-2 ring-white ${isOnline ? 'bg-green-500' : 'bg-slate-300'}`} 
                  title={isOnline ? "Clocked In" : "Clocked Out"}/>
        </div>
    );
};

const WeatherCell = ({ data }: { data: DailyWeather | undefined }) => {
    if (!data) return <div className="text-[10px] text-muted-foreground h-full flex items-center justify-center">-</div>;

    let Icon = Sun;
    let color = "text-yellow-500";
    if (data.code >= 1 && data.code <= 3) { Icon = Cloud; color = "text-gray-400"; }
    else if (data.code >= 45 && data.code <= 48) { Icon = Wind; color = "text-blue-300"; }
    else if (data.code >= 51 && data.code <= 67) { Icon = CloudRain; color = "text-blue-500"; }
    else if (data.code >= 71 && data.code <= 77) { Icon = Snowflake; color = "text-cyan-400"; }
    else if (data.code >= 95) { Icon = CloudLightning; color = "text-purple-500"; }

    const isExtremeHeat = data.max_temp >= 105;
    const isExtremeCold = data.max_temp <= 40;

    return (
        <div className="flex flex-row items-center justify-center h-full w-full gap-1" title={`${data.min_temp}° - ${data.max_temp}°`}>
            <Icon className={`w-3.5 h-3.5 ${color} print:text-black`} />
            <span className={`text-[11px] font-bold ${isExtremeHeat ? 'text-red-600' : isExtremeCold ? 'text-blue-600' : 'text-slate-700 dark:text-slate-300'} print:text-black print:text-[9px]`}>
                {data.max_temp}°
            </span>
            {data.precip_chance > 20 && (
                <span className="text-[9px] text-blue-500 font-semibold print:text-black print:text-[8px] border-l pl-1 ml-0.5 border-slate-300">
                    {data.precip_chance}%
                </span>
            )}
        </div>
    );
};

const TaskBadge = ({ taskKey }: { taskKey: string }) => {
    const task = TASKS[taskKey];
    if (!task) return null;
    return (
        <div 
            className={`${task.color} text-white text-[9px] font-bold px-1 rounded-sm flex items-center justify-center h-4 min-w-[14px] print-color-exact`} 
            title={task.label}
        >
            {task.code}
        </div>
    );
};

// ============================================================================
// 3. MAIN COMPONENT
// ============================================================================

export default function RosterPage() {
  const supabase = createClient();
  const [isMounted, setIsMounted] = useState(false);

  // -- STATE --
  const [currentDate, setCurrentDate] = useState(moment());
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');
  
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [liveStatus, setLiveStatus] = useState<Record<string, boolean>>({});
  const [weatherData, setWeatherData] = useState<Record<string, DailyWeather[]>>({});
  
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [currentUserLevel, setCurrentUserLevel] = useState<number>(0);

  const [loading, setLoading] = useState(true);
  const [copying, setCopying] = useState(false);
  const [visibleLocs, setVisibleLocs] = useState<Record<string, boolean>>({
      'Las Vegas': true, 'Pismo': true, 'Michigan': true
  });
  
  const [lastRoles, setLastRoles] = useState<Record<string, string>>({});
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
  
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const startOfWeek = currentDate.clone().startOf('isoWeek');
  const weekDays = Array.from({ length: 7 }, (_, i) => startOfWeek.clone().add(i, 'days'));

  const isManager = currentUserLevel >= 500;
  const isAdmin = currentUserLevel >= 900;

  // ==========================================================================
  // 4. EFFECTS & DATA FETCHING
  // ==========================================================================

  useEffect(() => {
      setIsMounted(true);
      const saved = localStorage.getItem('roster_filters');
      if (saved) try { setVisibleLocs(JSON.parse(saved)); } catch (e) { console.error(e); }
      if (window.innerWidth < 768) setViewMode('day');
  }, []);

  useEffect(() => { 
      if (isMounted) fetchData(); 
  }, [currentDate, isMounted]);

  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        setCurrentUserId(user.id);
        const { data: userData } = await supabase.from('users').select('user_level').eq('id', user.id).single();
        if (userData) setCurrentUserLevel(userData.user_level || 0);
    }

    const { data: empData, error: empError } = await supabase
        .from('users')
        .select('id, full_name, location, department, job_title, hire_date, user_level, timeclock_blocked, email, phone, avatar_url')
        .gte('user_level', 300).order('full_name'); 

    if (empError) {
        // Fallback for schema mismatch
        const { data: fallbackData } = await supabase.from('users').select('id, full_name, location, department, hire_date, user_level, timeclock_blocked, email, phone, avatar_url').gte('user_level', 300).order('full_name');
        if (fallbackData) {
             const cleanEmps = fallbackData.map(e => ({ ...e, job_title: 'STAFF', location: e.location || 'Las Vegas', department: e.department || 'General', timeclock_blocked: e.timeclock_blocked || false }));
            setEmployees(cleanEmps);
        }
    } else if (empData) {
        const cleanEmps = empData.map(e => ({ 
            ...e, 
            location: e.location || 'Las Vegas', 
            department: e.department || 'General', 
            job_title: e.job_title || 'STAFF',
            timeclock_blocked: e.timeclock_blocked || false 
        }));
        cleanEmps.sort((a, b) => {
            if (!a.hire_date) return 1; if (!b.hire_date) return -1;
            return new Date(a.hire_date).getTime() - new Date(b.hire_date).getTime();
        });
        setEmployees(cleanEmps);
    }
    
    const startIso = startOfWeek.toISOString();
    const endIso = startOfWeek.clone().endOf('isoWeek').toISOString();
    
    const { data: shiftData } = await supabase.from('employee_schedules').select('*').gte('start_time', startIso).lte('start_time', endIso);
    if (shiftData) setShifts(shiftData);

    const knownLocations = Object.keys(LOCATIONS);
    if (knownLocations.length > 0) {
        const { data: activeEntries } = await supabase.from('time_entries').select('user_id, employee_id').in('location', knownLocations).is('clock_out', null);
        if (activeEntries) {
            const statusMap: Record<string, boolean> = {};
            activeEntries.forEach((entry: {user_id?: string; employee_id?: string}) => {
                const uid = entry.user_id || entry.employee_id;
                if (uid) statusMap[uid] = true;
            });
            setLiveStatus(statusMap);
        }
    }

    const weatherUpdates: Record<string, DailyWeather[]> = {};
    await Promise.all(Object.keys(LOCATIONS).map(async (loc) => {
        if (!visibleLocs[loc]) return;
        const weatherDate = viewMode === 'week' ? startOfWeek.format('YYYY-MM-DD') : currentDate.format('YYYY-MM-DD');
        const daysToFetch = viewMode === 'week' ? 7 : 1;
        try {
            const data = await getLocationWeather(loc, weatherDate, daysToFetch);
            if (data && data.length > 0) weatherUpdates[loc] = data;
        } catch (e) {
            console.error(`Weather fetch error for ${loc}`, e);
        }
    }));
    setWeatherData(weatherUpdates);
    setLoading(false);
  };

  // ==========================================================================
  // 5. HELPER FUNCTIONS
  // ==========================================================================

  const getHours = (start: string, end: string): number => moment.duration(moment(end).diff(moment(start))).asHours();
  
  const sumDailyHours = (shiftList: Shift[], dateStr: string): number => {
      const dailyShifts = shiftList.filter(s => moment(s.start_time).format('YYYY-MM-DD') === dateStr);
      return dailyShifts.reduce((acc, s) => acc + getHours(s.start_time, s.end_time), 0);
  };

  const sumWeeklyHours = (shiftList: Shift[]): number => {
      const weekStart = startOfWeek.toISOString();
      const weekEnd = startOfWeek.clone().endOf('isoWeek').toISOString();
      const relevantShifts = shiftList.filter(s => s.start_time >= weekStart && s.start_time <= weekEnd);
      return relevantShifts.reduce((acc, s) => acc + getHours(s.start_time, s.end_time), 0);
  };

  const fetchLogs = async (tableName: string, rowId: string) => {
      setLoadingLogs(true);
      const { data: logs, error } = await supabase.from('audit_logs').select('id, created_at, action, user_id, table_name, row').eq('table_name', tableName).eq('row', rowId).order('created_at', { ascending: false });
      if (!error && logs) {
          const actorIds = [...new Set(logs.map(l => l.user_id))];
          const { data: actors } = await supabase.from('users').select('id, full_name').in('id', actorIds);
          const enrichedLogs = logs.map(log => ({ ...log, actor_name: actors?.find(a => a.id === log.user_id)?.full_name || 'Unknown' }));
          setAuditLogs(enrichedLogs);
      }
      setLoadingLogs(false);
  };

  const logChange = async (action: string, table: string, rowId: string) => {
      if (!currentUserId) return;
      await supabase.from('audit_logs').insert({ action: action, table_name: table, row: rowId, user_id: currentUserId });
  };

  // --- ACTIONS ---

  const handlePrint = () => {
    const originalTitle = document.title;
    const activeLocs = Object.keys(visibleLocs).filter(k => visibleLocs[k]);
    const locTitle = activeLocs.length === 1 ? activeLocs[0] : "All Locations";
    const year = startOfWeek.format('YYYY');
    const week = startOfWeek.isoWeek();
    document.title = `SunBuggy ${year} Week ${week} ${locTitle} Staff Schedule`;
    window.print();
    document.title = originalTitle;
  };

  const handleCellClick = (emp: Employee, dateStr: string, existingShift?: Shift) => {
    setSelectedEmpId(emp.id); setSelectedEmpName(emp.full_name); setSelectedDate(dateStr);
    
    if (existingShift) {
      setSelectedShiftId(existingShift.id); 
      setFormRole(existingShift.role); 
      setFormTask(existingShift.task || 'NONE'); 
      setFormLocation(existingShift.location || emp.location);
      setFormStart(moment(existingShift.start_time).format('HH:mm')); 
      setFormEnd(moment(existingShift.end_time).format('HH:mm'));
    } else {
      setSelectedShiftId(null); 
      const defaults = lastShiftParams[emp.id];
      if (defaults) { 
          setFormRole(defaults.role); 
          setFormTask(defaults.task || 'NONE');
          setFormStart(defaults.start); 
          setFormEnd(defaults.end); 
          setFormLocation(defaults.location); 
      }
      else { 
          setFormRole('Guide'); 
          setFormTask('NONE');
          setFormLocation(emp.location); 
          setFormStart('09:00'); 
          setFormEnd('17:00'); 
      }
    }
    setIsShiftModalOpen(true);
  };

  const handleSaveShift = async () => {
    if (!isManager) return;
    const startDateTime = moment(`${selectedDate} ${formStart}`, 'YYYY-MM-DD HH:mm').toISOString();
    const endDateTime = moment(`${selectedDate} ${formEnd}`, 'YYYY-MM-DD HH:mm').toISOString();
    
    const payload = { 
        user_id: selectedEmpId, 
        start_time: startDateTime, 
        end_time: endDateTime, 
        role: formRole, 
        location: formLocation,
        task: formTask === 'NONE' ? null : formTask 
    };

    let shiftId = selectedShiftId;
    let action = '';
    if (selectedShiftId) {
        const { error } = await supabase.from('employee_schedules').update(payload).eq('id', selectedShiftId);
        if (error) { toast.error("Failed to update"); return; }
        action = `Updated shift: ${formRole} (${formStart}-${formEnd})`;
    } else {
        const { data, error } = await supabase.from('employee_schedules').insert([payload]).select().single();
        if (error || !data) { toast.error("Failed to create"); return; }
        shiftId = data.id;
        action = `Created shift: ${formRole} (${formStart}-${formEnd})`;
    }
    if (shiftId) await logChange(action, 'employee_schedules', shiftId);
    
    setLastShiftParams(prev => ({ 
        ...prev, 
        [selectedEmpId]: { 
            role: formRole, 
            task: formTask === 'NONE' ? undefined : formTask,
            start: formStart, 
            end: formEnd, 
            location: formLocation 
        } 
    }));
    
    fetchData(); setIsShiftModalOpen(false); toast.success("Saved");
  };

  const handleDeleteShift = async () => {
    if (!isManager || !selectedShiftId) return;
    await logChange(`Deleted shift`, 'employee_schedules', selectedShiftId);
    await supabase.from('employee_schedules').delete().eq('id', selectedShiftId); toast.success("Deleted"); fetchData(); setIsShiftModalOpen(false);
  };

  const handleCopyWeek = async () => {
      if (!isManager) return;
      if (shifts.length === 0) { toast.error("No shifts"); return; }
      const targetStart = startOfWeek.clone().add(1, 'week').format('MMM Do');
      if (!confirm(`Copy ${shifts.length} shifts to next week (${targetStart})?`)) return;
      setCopying(true);
      const newShifts = shifts.map(s => ({ 
          user_id: s.user_id, 
          role: s.role, 
          task: s.task,
          start_time: moment(s.start_time).add(7, 'days').toISOString(), 
          end_time: moment(s.end_time).add(7, 'days').toISOString(), 
          location: s.location || 'Las Vegas' 
      }));
      const { error } = await supabase.from('employee_schedules').insert(newShifts);
      setCopying(false); if (error) toast.error("Failed"); else { await logChange(`Copied ${newShifts.length} shifts`, 'employee_schedules', 'BULK_COPY'); toast.success("Copied!"); setCurrentDate(currentDate.clone().add(1, 'week')); }
  };

  const handleSaveProfile = async () => {
      if (!isManager || !profileEmp) return;
      const { error } = await supabase.from('users').update({ 
          hire_date: profileEmp.hire_date, 
          location: profileEmp.location, 
          department: profileEmp.department, 
          job_title: profileEmp.job_title,
          timeclock_blocked: profileEmp.timeclock_blocked, 
          phone: profileEmp.phone, 
          avatar_url: profileEmp.avatar_url 
      }).eq('id', profileEmp.id);
      if (error) toast.error("Failed"); else { await logChange(`Updated profile`, 'users', profileEmp.id); toast.success("Saved"); fetchData(); setIsProfileModalOpen(false); }
  };

  const handleArchiveEmployee = async () => {
      if (!isAdmin || !profileEmp) return;
      if (!confirm(`Archive ${profileEmp.full_name}?`)) return;
      const { error } = await supabase.from('users').update({ user_level: 100 }).eq('id', profileEmp.id);
      if (error) { toast.error("Failed"); } else { await logChange(`Archived Employee`, 'users', profileEmp.id); toast.success("Archived"); fetchData(); setIsProfileModalOpen(false); }
  };

  // ==========================================================================
  // 6. RENDER HELPERS
  // ==========================================================================

  const groupedEmployees = useMemo(() => {
      const groups: Record<string, Record<string, Record<string, Employee[]>>> = {};

      Object.keys(LOCATIONS).forEach(loc => {
          groups[loc] = {};
          LOCATIONS[loc].forEach(dept => {
              groups[loc][dept] = {};
              const knownRoles = ROLE_GROUPS[dept] || [];
              knownRoles.forEach(role => groups[loc][dept][role] = []);
              groups[loc][dept]['General'] = [];
          });
          groups[loc]['Visiting Staff'] = { 'General': [] };
      });
      groups['Unassigned'] = { 'General': { 'General': [] } };

      employees.forEach(emp => {
          const loc = LOCATIONS[emp.location] ? emp.location : 'Unassigned';
          let dept = emp.department;
          
          if (loc !== 'Unassigned' && !groups[loc][dept]) dept = Object.keys(groups[loc])[0];
          if (loc === 'Unassigned') dept = 'General';

          let roleGroup = 'General';
          const knownRoles = ROLE_GROUPS[dept] || [];
          const title = (emp.job_title || '').toUpperCase();
          const match = knownRoles.find(r => title.includes(r));
          if (match) roleGroup = match;
          
          if (!groups[loc][dept]) groups[loc][dept] = {};
          if (!groups[loc][dept][roleGroup]) groups[loc][dept][roleGroup] = [];
          
          groups[loc][dept][roleGroup].push(emp);
      });

      shifts.forEach(shift => {
          const emp = employees.find(e => e.id === shift.user_id);
          if (!emp) return;
          if (shift.location && shift.location !== emp.location && groups[shift.location]) {
              const targetLoc = shift.location;
              const visitingBucket = groups[targetLoc]['Visiting Staff']['General'];
              if (!visitingBucket.find(v => v.id === emp.id)) visitingBucket.push(emp);
          }
      });
      return groups;
  }, [employees, shifts]);

  const ChangeLogViewer = ({ tableName, rowId }: { tableName: string, rowId: string }) => {
      return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 ml-2" onClick={() => fetchLogs(tableName, rowId)}>
                    <Info className="w-4 h-4 text-muted-foreground" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
                <div className="space-y-2">
                    <h4 className="font-medium leading-none flex items-center"><History className="w-4 h-4 mr-2"/> Change Log</h4>
                    <ScrollArea className="h-48 w-full rounded border p-2">
                        {loadingLogs ? <div className="flex justify-center p-4"><Loader2 className="w-4 h-4 animate-spin"/></div> : auditLogs.length === 0 ? <div className="text-xs text-muted-foreground text-center p-2">No history.</div> : <div className="space-y-3">{auditLogs.map(log => (<div key={log.id} className="text-xs border-b pb-2 last:border-0"><div className="font-bold">{log.action}</div><div className="text-muted-foreground flex justify-between mt-1"><span>{log.actor_name}</span><span>{moment(log.created_at).format('MM/DD HH:mm')}</span></div></div>))}</div>}
                    </ScrollArea>
                </div>
            </PopoverContent>
        </Popover>
      );
  };

  if (!isMounted) return null;

  return (
    <div id="roster-container" className="p-4 h-screen flex flex-col bg-background text-foreground print:p-0 print:bg-white print:h-auto print:block print:w-full">
      
      {/* PRINT STYLES */}
      <style jsx global>{`
        @media print {
            @page { size: landscape; margin: 0.25cm; }
            
            body, .bg-slate-900, .bg-slate-100, .bg-card, .bg-background, .dark { 
                background-color: white !important; 
                color: black !important; 
                border-color: #000 !important;
            }

            #roster-container, #roster-container * { visibility: visible; }
            #roster-container { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; }
            nav, header, aside, .print-hide { display: none !important; }

            /* YELLOW LOCATION ROWS */
            .print-yellow {
                background-color: #fde047 !important; /* Tailwind yellow-300 */
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }

            .print-color-exact {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }

            div[class*="rounded-r"] {
                background-color: white !important;
                border: 1px solid black !important;
                color: black !important;
            }

            /* BREAK LOGIC */
            /* Force break before a new location row (except the first one) */
            .print-break-before-page { break-before: page; page-break-before: always; }
            
            /* Keep header with its content */
            .print-break-after-avoid { break-after: avoid; page-break-after: avoid; }
            
            /* Keep Departments Together */
            .dept-block { break-inside: avoid; page-break-inside: avoid; }
            
            .print-show-phone { display: block !important; }
            tr { height: auto !important; }
            td, th { padding: 1px 2px !important; font-size: 10px !important; vertical-align: middle !important; }
            .print-no-avatar { display: none !important; }
        }
      `}</style>

      {/* --- HEADER --- */}
      <div className="flex flex-col gap-4 mb-4 print-hide">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold">Schedule & Roster</h1>
              <div className="text-muted-foreground text-sm flex items-center gap-2">
                {viewMode === 'week' 
                    ? `${startOfWeek.format('MMM D')} - ${startOfWeek.clone().add(6, 'days').format('MMM D, YYYY')}`
                    : currentDate.format('dddd, MMMM Do YYYY')
                }
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-between md:justify-end">
              <div className="flex items-center bg-muted p-1 rounded-lg border">
                  <Button variant={viewMode === 'day' ? 'secondary' : 'ghost'} size="sm" className="h-7 px-3 text-xs" onClick={() => setViewMode('day')}><LayoutList className="w-3 h-3 mr-1" /> Day</Button>
                  <Button variant={viewMode === 'week' ? 'secondary' : 'ghost'} size="sm" className="h-7 px-3 text-xs" onClick={() => setViewMode('week')}><TableIcon className="w-3 h-3 mr-1" /> Week</Button>
              </div>

              <div className="flex items-center gap-2">
                   <Button variant="outline" size="sm" onClick={handlePrint} className="hidden md:flex">
                        <Printer className="w-4 h-4 mr-2" /> Print
                   </Button>

                  {viewMode === 'week' && isManager && (
                    <>
        <Button variant="secondary" size="sm" onClick={handleCopyWeek} disabled={copying || shifts.length === 0} className="hidden md:flex">
            {copying ? <Loader2 className="w-3 h-3 animate-spin" /> : <Copy className="w-3 h-3 mr-2" />} Copy Week
        </Button>

        <PublishButton weekStart={startOfWeek.format('YYYY-MM-DD')} />
    </>
                    
                  )}
                  <div className="flex items-center border rounded-md bg-card shadow-sm">
                    <Button variant="ghost" size="icon" onClick={() => setCurrentDate(currentDate.clone().subtract(1, viewMode === 'week' ? 'week' : 'day'))}><ChevronLeft className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => setCurrentDate(moment())}>Today</Button>
                    <Button variant="ghost" size="icon" onClick={() => setCurrentDate(currentDate.clone().add(1, viewMode === 'week' ? 'week' : 'day'))}><ChevronRight className="w-4 h-4" /></Button>
                    
                  </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pb-2 overflow-x-auto">
             <Filter className="w-4 h-4 text-muted-foreground mr-1" />
             {Object.keys(LOCATIONS).map(loc => (
                 <Badge key={loc} variant={visibleLocs[loc] ? 'default' : 'outline'} className={`cursor-pointer select-none px-3 py-1 ${visibleLocs[loc] ? 'bg-primary hover:bg-primary/90' : 'bg-transparent text-muted-foreground hover:bg-accent'}`} onClick={() => {
                     const newState = { ...visibleLocs, [loc]: !visibleLocs[loc] };
                     setVisibleLocs(newState); localStorage.setItem('roster_filters', JSON.stringify(newState));
                 }}>{loc}</Badge>
             ))}
          </div>
      </div>

      {/* --- LEGEND (Visible on Screen & Print) --- */}
      <div className="mb-4 flex flex-wrap gap-2 text-xs border p-2 rounded bg-white print:border-black print:mb-2 print:border-b-2">
        <span className="font-bold mr-2 self-center">Task Legend:</span>
        {Object.values(TASKS).map(task => (
            <div key={task.code} className="flex items-center gap-1 border px-2 py-1 rounded print:border-black">
                <div className={`w-3 h-3 ${task.color} rounded-sm flex items-center justify-center text-[8px] text-white font-bold print-color-exact`}>{task.code}</div>
                <span className="text-muted-foreground print:text-black">{task.label}</span>
            </div>
        ))}
      </div>

      {/* --- CONTENT AREA (Grid) --- */}
      <div className="flex-1 overflow-auto border rounded-lg shadow-sm bg-card print:overflow-visible print:h-auto print:border-none print:shadow-none print:bg-white">
        
        {/* --- WEEK VIEW (TABLE) --- */}
        {viewMode === 'week' && (
        <table className="w-full border-collapse min-w-[1000px] text-sm print:w-full print:min-w-0 print:text-[10px]">
          <thead className="sticky top-0 bg-muted z-20 shadow-sm print:static print:bg-white print:border-b-2 print:border-black">
            <tr>
                <th className="p-2 text-left w-64 border-b font-bold text-muted-foreground bg-muted pl-4 print:pl-1 print:bg-white print:text-black">
                    {startOfWeek.format('YYYY')} Week {startOfWeek.isoWeek()} Staff
                </th>
                {weekDays.map(day => (
                    <th key={day.toString()} className="p-2 text-center border-b min-w-[100px] border-l bg-muted print:bg-white print:text-black print:w-[12%]">
                        <div className="font-semibold">{day.format('ddd')}</div>
                        <div className="text-[10px] text-muted-foreground print:text-black">{day.format('MMM D')}</div>
                    </th>
                ))}
            </tr>
          </thead>
          
          {Object.entries(groupedEmployees).map(([locName, departments], locIndex) => {
                if (!visibleLocs[locName]) return null;
                if (!Object.values(departments).some(roleGroups => Object.values(roleGroups).some(e => e.length > 0))) return null;

                const allEmpIdsInLoc = Object.values(departments).flatMap(roleGroups => Object.values(roleGroups)).flat().map(e => e.id);
                const locShifts = shifts.filter(s => (s.location === locName) || (!s.location && allEmpIdsInLoc.includes(s.user_id)));
                const locWeather = weatherData[locName] || [];

                return (
                    <Fragment key={locName}>
                        {/* 1. LOCATION HEADER + WEATHER (GROUPED TBODY) */}
                        <tbody className="print:break-after-avoid">
                            {/* Location Header Row (Yellow) - Break page BEFORE new location (except first) */}
                            <tr className={`bg-yellow-400 text-black print-yellow border-b-2 border-black ${locIndex > 0 ? 'print-break-before-page' : ''}`}>
                                <td className="p-2 font-bold uppercase tracking-wider text-xs border-b border-black sticky left-0 z-10 bg-yellow-400 print-yellow print:static print:text-black print:text-sm">
                                    <div className="flex justify-between items-center">
                                        <span><MapPin className="w-3 h-3 inline mr-2 print:hidden" /> {locName}</span>
                                        <span className="bg-white/50 text-[10px] px-1.5 py-0.5 rounded text-black font-mono border border-black/20">{sumWeeklyHours(locShifts).toFixed(1)}h</span>
                                    </div>
                                </td>
                                {weekDays.map(day => {
                                    const dailyTotal = sumDailyHours(locShifts, day.format('YYYY-MM-DD'));
                                    return (
                                        <td key={day.toString()} className="border-l border-black bg-yellow-400 print-yellow text-center text-[10px] font-mono text-black">
                                            {dailyTotal > 0 && <span>{dailyTotal.toFixed(1)}h</span>}
                                        </td>
                                    );
                                })}
                            </tr>

                            {/* Weather Row - Glue to Header */}
                            <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 h-12 print:h-auto print:border-black print:break-after-avoid">
                                <td className="p-2 text-[10px] font-semibold text-muted-foreground uppercase border-r sticky left-0 z-10 bg-slate-50 dark:bg-slate-900 print:bg-white print:static print:text-black">
                                    Forecast
                                </td>
                                {weekDays.map(day => {
                                    const dateStr = day.format('YYYY-MM-DD');
                                    const dayData = locWeather.find(w => w.date === dateStr);
                                    return (<td key={dateStr} className="border-l p-0 text-center print:border-gray-300"><WeatherCell data={dayData} /></td>);
                                })}
                            </tr>
                        </tbody>

                        {/* 2. DEPARTMENTS (SEPARATE TBODY PER DEPT FOR PAGINATION) */}
                        {Object.entries(departments).map(([deptName, roleGroups], deptIndex) => {
                            if (!Object.values(roleGroups).some(g => g.length > 0)) return null;
                            const isVisiting = deptName === 'Visiting Staff';
                            const deptEmps = Object.values(roleGroups).flat();
                            const deptEmpIds = deptEmps.map(e => e.id);
                            const deptShifts = locShifts.filter(s => deptEmpIds.includes(s.user_id));

                            const deptColorClass = DEPT_STYLES[deptName] || DEPT_STYLES['DEFAULT'];

                            return (
                                // Use 'dept-block' class to prevent breaking inside the department
                                <tbody key={`${locName}-${deptName}`} className="dept-block">
                                    {/* Department Header */}
                                    <tr className={`${isVisiting ? 'bg-amber-50 dark:bg-amber-950/30' : deptColorClass} print-color-exact border-t-2 border-slate-200 print:border-black`}>
                                        <td className={`p-1 pl-4 font-bold text-xs uppercase border-b sticky left-0 z-10 ${isVisiting ? 'text-amber-600' : ''} print:static print:text-black print:border-black print:pl-1`}>
                                            <div className="flex justify-between items-center pr-2">
                                                <span>{isVisiting && <Plane className="w-3 h-3 inline mr-1 mb-0.5" />} {deptName}</span>
                                                <span className="text-[10px] opacity-70 bg-black/5 dark:bg-white/10 px-1 rounded print:bg-white print:text-black print:border print:border-black">{sumWeeklyHours(deptShifts).toFixed(1)}h</span>
                                            </div>
                                        </td>
                                        {weekDays.map(day => {
                                            const dailyDeptTotal = sumDailyHours(deptShifts, day.format('YYYY-MM-DD'));
                                            return (
                                                <td key={day.toString()} className="border-l border-b bg-inherit text-center text-[10px] font-mono opacity-70 print:text-black print:border-black">
                                                    {dailyDeptTotal > 0 && <span>{dailyDeptTotal.toFixed(1)}h</span>}
                                                </td>
                                            );
                                        })}
                                    </tr>

                                    {/* ROLE SUB-GROUPS */}
                                    {Object.entries(roleGroups).map(([roleName, emps]) => {
                                        if (emps.length === 0) return null;
                                        const isGeneralRole = roleName === 'General';

                                        return (
                                            <Fragment key={roleName}>
                                                {!isGeneralRole && (
                                                    <tr className="bg-slate-50/50 dark:bg-slate-900/20 print:bg-white">
                                                        <td colSpan={8} className="px-4 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider print:text-black print:pl-2">
                                                            ↳ {roleName}
                                                        </td>
                                                    </tr>
                                                )}

                                                {emps.map(emp => {
                                                    const empShifts = shifts.filter(s => s.user_id === emp.id);
                                                    return (
                                                    <tr key={`${locName}-${emp.id}`} className="hover:bg-muted/20 transition-colors border-b print:border-gray-400 print:h-auto">
                                                        <td className="p-0 border-r border-r-slate-100 dark:border-r-slate-800 sticky left-0 z-10 bg-card print:static print:border-r print:border-black print:p-0">
                                                            <div className="p-2 w-64 cursor-pointer flex flex-col min-w-0 flex-1 h-full gap-1 print:p-1 print:w-auto" onClick={(e) => { e.stopPropagation(); setProfileEmp(emp); setIsProfileModalOpen(true); }}>
                                                                
                                                                {/* SCREEN VIEW */}
                                                                <div className="flex flex-row items-center gap-3 print:hidden">
                                                                    <div className="flex-shrink-0"><UserAvatar emp={emp} isOnline={liveStatus[emp.id]} /></div>
                                                                    <div className="flex flex-col min-w-0 flex-1">
                                                                        <div className="font-medium flex items-center gap-1"><span className={`truncate ${isVisiting ? "italic text-amber-700" : ""}`}>{emp.full_name}</span>{emp.timeclock_blocked && <Ban className="w-3 h-3 text-red-500 flex-shrink-0" />}</div>
                                                                        <div className="flex items-center justify-between mt-0.5"><div onClick={(e) => e.stopPropagation()}><ContactMenu user={emp} iconOnly={true} size="xs" /></div>{sumWeeklyHours(empShifts) > 0 && <span className="text-[10px] bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-200 px-1.5 rounded-sm font-mono">{sumWeeklyHours(empShifts).toFixed(1)}h</span>}</div>
                                                                    </div>
                                                                </div>

                                                                {/* PRINT VIEW */}
                                                                <div className="hidden print:flex flex-row items-center justify-between w-full">
                                                                    <div className="flex items-center gap-1.5 overflow-hidden">
                                                                        <UserAvatar emp={emp} isOnline={liveStatus[emp.id]} size="sm" />
                                                                        <div className="flex flex-col leading-none">
                                                                            <span className="font-bold text-[10px] truncate">{emp.full_name}</span>
                                                                            <span className="text-[9px] font-mono text-gray-800 truncate">{emp.phone}</span>
                                                                        </div>
                                                                    </div>
                                                                    {sumWeeklyHours(empShifts) > 0 && (
                                                                        <span className="text-[10px] font-mono font-bold border border-black px-1 ml-1 whitespace-nowrap">
                                                                            {sumWeeklyHours(empShifts).toFixed(1)}h
                                                                        </span>
                                                                    )}
                                                                </div>

                                                            </div>
                                                        </td>
                                                        {weekDays.map(day => {
                                                            const dateStr = day.format('YYYY-MM-DD');
                                                            const shift = shifts.find(s => s.user_id === emp.id && moment(s.start_time).format('YYYY-MM-DD') === dateStr);
                                                            const shouldRender = shift && (!isVisiting || shift.location === locName);
                                                            const isAway = shift && shift.location !== emp.location && !isVisiting;
                                                            return (
                                                                <td key={dateStr} className={`p-1 border-l relative h-14 print:h-auto print:border-black ${isManager ? 'cursor-pointer group' : ''}`} onClick={() => isManager && handleCellClick(emp, dateStr, shift)}>
                                                                    {shouldRender ? (
                                                                        <div className={`h-full w-full border-l-2 rounded-r p-1 flex flex-col justify-center print:bg-white print:border print:border-black print:p-0.5 print:rounded-none ${isAway ? 'bg-amber-50 border-l-amber-500' : 'bg-blue-100 border-l-blue-500 dark:bg-blue-900'}`}>
                                                                            {shift.task && <div className="absolute top-0 right-0 p-0.5"><TaskBadge taskKey={shift.task} /></div>}
                                                                            <span className="font-bold text-foreground text-xs leading-none mb-0.5 print:text-black">{moment(shift.start_time).format('h:mmA')}</span>
                                                                            <span className="text-[10px] text-muted-foreground leading-none print:text-black">- {moment(shift.end_time).format('h:mmA')}</span>
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

        {/* --- DAY VIEW (LIST) - Hidden in Print --- */}
        {viewMode === 'day' && (
            <div className="p-4 space-y-6 print:space-y-4">
                {Object.entries(groupedEmployees).map(([locName, departments]) => {
                    if (!visibleLocs[locName]) return null;
                    const activeDepts = Object.entries(departments).filter(([deptName, roleGroups]) => 
                         Object.values(roleGroups).some(group => group.some(emp => shifts.some(s => s.user_id === emp.id && moment(s.start_time).format('YYYY-MM-DD') === currentDate.format('YYYY-MM-DD'))))
                    );

                    if (activeDepts.length === 0) return null;
                    const todayWeather = weatherData[locName]?.find(w => w.date === currentDate.format('YYYY-MM-DD'));

                    return (
                        <div key={locName} className="border rounded-lg overflow-hidden bg-card shadow-sm print:border-black print:shadow-none">
                            <div className="bg-slate-900 text-white p-3 font-bold uppercase flex justify-between items-center print:bg-white print:text-black print:border-b print:border-black">
                                <div className="flex items-center"><MapPin className="w-4 h-4 inline mr-2" /> {locName}</div>
                                {todayWeather && (<div className="flex items-center gap-2 bg-slate-800 px-3 py-1 rounded-full border border-slate-700 print:bg-white print:text-black print:border-black"><WeatherCell data={todayWeather} /></div>)}
                            </div>
                            <div className="divide-y divide-slate-100 dark:divide-slate-800 print:divide-black">
                                {activeDepts.map(([deptName, roleGroups]) => {
                                    const allDeptEmps = Object.values(roleGroups).flat();
                                    return (
                                    <div key={deptName} className="p-0 print:break-before">
                                        <div className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider border-b ${DEPT_STYLES[deptName] || 'bg-muted'} print:bg-gray-100 print:text-black print:border-black`}>
                                            {deptName === 'Visiting Staff' && <Plane className="w-3 h-3 inline mr-1" />} {deptName}
                                        </div>
                                        <div className="divide-y divide-slate-100 dark:divide-slate-800 print:divide-black">
                                            {allDeptEmps.map(emp => {
                                                const dateStr = currentDate.format('YYYY-MM-DD');
                                                const shift = shifts.find(s => s.user_id === emp.id && moment(s.start_time).format('YYYY-MM-DD') === dateStr);
                                                if (!shift) return null;
                                                return (
                                                    <div key={emp.id} className="flex items-center justify-between p-3 hover:bg-muted/10 cursor-pointer print:p-2 print:border-b print:border-gray-200" onClick={() => isManager && handleCellClick(emp, dateStr, shift)}>
                                                        <div className="flex items-center gap-3">
                                                            <UserAvatar emp={emp} isOnline={liveStatus[emp.id]} />
                                                            <div>
                                                                <div className="font-semibold text-sm flex items-center gap-2"><span className="">{emp.full_name}</span></div>
                                                                <div className="hidden print:block text-[9px] font-mono leading-tight">{emp.phone}</div>
                                                                <div className="text-xs text-muted-foreground flex items-center gap-1 print:text-black">
                                                                    <Badge variant="outline" className="text-[10px] h-5 px-1 print:border-black">{shift.role}</Badge>
                                                                    {shift.task && <TaskBadge taskKey={shift.task} />}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="font-mono font-bold text-sm bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-100 px-2 py-1 rounded border border-blue-100 dark:border-blue-900 print:bg-white print:text-black print:border-black">{moment(shift.start_time).format('h:mm A')} - {moment(shift.end_time).format('h:mm A')}</div>
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

      <div className="print-hide">
          <Dialog open={isShiftModalOpen} onOpenChange={setIsShiftModalOpen}>
            <DialogContent className="max-w-sm">
                <DialogHeader><DialogTitle className="flex items-center justify-between"><span>Shift Details</span>{selectedShiftId && <ChangeLogViewer tableName="employee_schedules" rowId={selectedShiftId} />}</DialogTitle></DialogHeader>
                <div className="grid gap-4 py-2">
                    <div className="text-sm font-semibold">{selectedEmpName} <span className="font-normal text-muted-foreground">- {moment(selectedDate).format('MMM Do')}</span></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-xs">Start</label><Input type="time" disabled={!isManager} value={formStart} onChange={(e) => {setFormStart(e.target.value); if(e.target.value) setFormEnd(moment(e.target.value, 'HH:mm').add(8, 'hours').format('HH:mm'));}} /></div>
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
                <DialogFooter className="flex justify-between w-full">{selectedShiftId && isManager ? <Button variant="destructive" size="sm" onClick={handleDeleteShift}><Trash2 className="w-4 h-4 mr-2" /> Delete</Button> : <div/>}{isManager && <Button size="sm" onClick={handleSaveShift}>Save</Button>}</DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Dialog open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen}>
            <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle className="flex items-center justify-between"><span>Edit Employee</span>{profileEmp && <ChangeLogViewer tableName="users" rowId={profileEmp.id} />}</DialogTitle></DialogHeader>
                {profileEmp && (
                <div className="grid gap-4 py-2">
                    <div className="flex items-center gap-4 border-b pb-4 mb-2"><UserAvatar emp={profileEmp} isOnline={liveStatus[profileEmp.id]} size="lg" /><div><div className="text-lg font-bold">{profileEmp.full_name}</div><div className="text-xs text-muted-foreground">{profileEmp.email}</div></div></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-xs">Location</label><Select value={profileEmp.location} onValueChange={(v)=>setProfileEmp({...profileEmp,location:v})} disabled={!isManager}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{Object.keys(LOCATIONS).map(l=><SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent></Select></div>
                        <div><label className="text-xs">Department</label><Select value={profileEmp.department} onValueChange={(v)=>setProfileEmp({...profileEmp,department:v})} disabled={!isManager}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{(LOCATIONS[profileEmp.location as keyof typeof LOCATIONS]||[]).map(d=><SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select></div>
                    </div>
                    {/* Dynamic Role Dropdown */}
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