'use client';

// ============================================================================
// SUNBUGGY ROSTER PAGE (v15.0 - GRANULAR COPY & CONFLICT RESOLVER)
// ============================================================================
// History:
// v14.5: Added Conflict Detector for duplicate shifts.
// v15.0: Added Granular Copy-to-Next-Week by Location/Department.

import { useState, useEffect, Fragment, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; 
import { createClient } from '@/utils/supabase/client';
import { fetchFullRosterData } from '@/app/actions/fetch-roster';
import { getLocationWeather, DailyWeather } from '@/app/actions/weather';
import { approveTimeOffRequest } from '@/app/actions/approve-time-off';

// --- COMPONENTS ---
import UserStatusAvatar from '@/components/UserStatusAvatar';
import { WeatherModal } from './components/weather-modal';
import EmailSchedulerModal from './components/email-scheduler-modal';

import { fetch_from_old_db } from '@/utils/old_db/actions';
import { vehiclesList } from '@/utils/old_db/helpers';

// --- DATE-FNS & UTILS ---
import {
  format, addDays, subDays, addWeeks, subWeeks,
  startOfISOWeek, differenceInMinutes, parseISO,
  startOfMonth, endOfMonth, startOfWeek as startOfLocalWeek,
  endOfWeek as endOfLocalWeek, eachDayOfInterval,
  isSameMonth, isSameDay, isToday, differenceInDays, addHours, isWithinInterval, startOfDay, endOfDay
} from 'date-fns';
import { cn } from '@/lib/utils';

// --- UI IMPORTS ---
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ChevronLeft, ChevronRight, Plus, Trash2, MapPin,
  Ban, Filter, History, Users, BarChart3, Calendar as CalendarIcon,
  Clock, Shield, CheckSquare, Mountain, LucideIcon,
  Sun, Cloud, CloudRain, Snowflake, CloudLightning, Wind, Printer,
  Info, Settings, User, Plane,
  AlertCircle, Check, X, ThumbsDown, CalendarClock, Copy, Loader2,
  AlertTriangle, ChevronDown, ChevronUp
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from '@/components/ui/separator';

// --- FALLBACK STYLES (If DB is empty) ---
const DEFAULT_DEPT_STYLE = 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 text-slate-700';

// --- CONSTANT: TASKS ---
const TASKS: Record<string, { label: string, color: string, code: string, icon: LucideIcon }> = {
  'TORCH': { label: 'TORCH (Dispatch)', color: 'bg-red-600', code: 'T', icon: Clock },
  'SST': { label: 'SST (Support)', color: 'bg-blue-600', code: 'S', icon: Users },
  'SITE_MGR': { label: 'Site Manager', color: 'bg-green-600', code: 'SM', icon: Shield },
  'CHECK_IN': { label: 'Check-In', color: 'bg-purple-600', code: 'C', icon: CheckSquare },
  'VOF': { label: 'Valley of Fire', color: 'bg-orange-500', code: 'V', icon: Mountain }
};

// --- INTERFACES ---
interface Employee { id: string; full_name: string; stage_name: string; location: string; department: string; job_title: string; hire_date: string | null; user_level: number; timeclock_blocked: boolean; email: string | null; phone: string | null; avatar_url: string | null; }
interface Shift { id: string; user_id: string; start_time: string; end_time: string; role: string; location?: string; task?: string; last_notified?: string | null; }
interface TimeOffRequest { id: string; user_id: string; start_date: string; end_date: string; type: 'TIME_OFF' | 'PREFER_OFF'; status: string; reason: string | null; user_name?: string; }
interface AvailabilityRule { id: string; user_id: string; day_of_week: number; start_time: string; end_time: string; preference_level: 'unavailable' | 'available' | 'preferred_off'; }
interface AuditLog { id: string; created_at: string; action: string; user_id: string; table_name: string; row: string; actor_name?: string; }
interface ShiftDefaults { role: string; start: string; end: string; location: string; task?: string; }
interface ReservationStat { sch_date: string | Date; ppl_count: string | number; [key: string]: string | number | boolean | Date | null | undefined; }

interface HRLocation { id: string; name: string; sort_order: number; departments: HRDepartment[]; }
interface HRDepartment { id: string; name: string; sort_order: number; style_class?: string; positions: HRPosition[]; }
interface HRPosition { id: string; title: string; keyword?: string; sort_order: number; }

// --- HELPER FUNCTIONS ---
const getDashboardLink = (locationName: string, dateStr: string) => {
  if (locationName === 'Las Vegas') return `/biz/${dateStr}`;
  const slug = locationName.toLowerCase().replace(/\s+/g, '-');
  return `/biz/${slug}/${dateStr}`;
};

const getDurationHours = (start: string, end: string): number => {
  const diffMinutes = differenceInMinutes(parseISO(end), parseISO(start));
  return diffMinutes / 60;
};

const getWeatherIcon = (code: number): LucideIcon => {
  if (code >= 95) return CloudLightning;
  if (code >= 71) return Snowflake;
  if (code >= 51) return CloudRain;
  if (code >= 45) return Wind;
  if (code >= 1 && code <= 3) return Cloud;
  return Sun;
};

// --- SUB-COMPONENT: MINI CALENDAR ---
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
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setViewDate(subMonths(viewDate, 1))}><ChevronLeft className="w-4 h-4" /></Button>
        <span className="font-bold text-sm">{format(viewDate, 'MMMM yyyy')}</span>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setViewDate(addMonths(viewDate, 1))}><ChevronRight className="w-4 h-4" /></Button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px]">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <div key={d} className="text-muted-foreground font-bold pb-1">{d}</div>)}
        {days.map(day => {
          const isSelected = isSameDay(day, selectedDate);
          const isCurrentMonth = isSameMonth(day, viewDate);
          return (<button key={day.toISOString()} onClick={() => onSelect(day)} type="button" className={cn("h-8 w-8 rounded-md flex items-center justify-center transition-colors hover:bg-muted text-xs", !isCurrentMonth && "text-muted-foreground/30", isSelected && "bg-primary text-primary-foreground font-bold", isToday(day) && !isSelected && "border border-primary text-primary font-bold")}>{format(day, 'd')}</button>);
        })}
      </div>
    </div>
  );
};

// --- SUB-COMPONENT: COPY SCHEDULE MODAL (NEW v15.0) ---
// Allows selecting specific locations and departments to copy to next week
const CopyScheduleModal = ({ 
  isOpen, 
  onClose, 
  hrConfig, 
  employees,
  weekRangeText, 
  onExecute 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  hrConfig: HRLocation[]; 
  employees: Employee[];
  weekRangeText: string;
  onExecute: (selectedScope: Set<string>) => void;
}) => {
  // Store selections as "LocationName:DepartmentName" strings
  const [selections, setSelections] = useState<Set<string>>(new Set());
  const [expandedLocs, setExpandedLocs] = useState<Record<string, boolean>>({});

  // Initialize with all expanded and selected by default for convenience
  useEffect(() => {
    if (isOpen) {
      const allDepts = new Set<string>();
      const allLocs: Record<string, boolean> = {};
      hrConfig.forEach(loc => {
        allLocs[loc.name] = true;
        // Don't auto-select everything to avoid accidents, let user choose, 
        // OR auto-select all if that's the preferred workflow. 
        // Let's start CLEAN (nothing selected) to prevent accidents.
      });
      setExpandedLocs(allLocs);
      setSelections(new Set()); 
    }
  }, [isOpen, hrConfig]);

  const toggleLoc = (locName: string, depts: HRDepartment[]) => {
    const newSet = new Set(selections);
    const allSelected = depts.every(d => newSet.has(`${locName}:${d.name}`));
    
    depts.forEach(d => {
      const key = `${locName}:${d.name}`;
      if (allSelected) newSet.delete(key);
      else newSet.add(key);
    });
    setSelections(newSet);
  };

  const toggleDept = (key: string) => {
    const newSet = new Set(selections);
    if (newSet.has(key)) newSet.delete(key);
    else newSet.add(key);
    setSelections(newSet);
  };

  const employeeCount = employees.filter(e => {
    // Basic estimation of how many people are affected
    const key = `${e.location}:${e.department}`;
    return selections.has(key);
  }).length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Copy Schedule to Next Week</DialogTitle>
          <DialogDescription>
            Select the departments you want to copy from <strong>{weekRangeText}</strong> to the following week.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-2 pr-2 border rounded-md bg-muted/20">
          {hrConfig.map(loc => {
            const isExpanded = expandedLocs[loc.name];
            const allDeptsSelected = loc.departments.every(d => selections.has(`${loc.name}:${d.name}`));
            const someDeptsSelected = loc.departments.some(d => selections.has(`${loc.name}:${d.name}`));

            return (
              <div key={loc.id} className="mb-2 bg-card border rounded-md overflow-hidden">
                <div className="flex items-center justify-between p-2 bg-muted/50">
                  <div className="flex items-center gap-2">
                     <Checkbox 
                        checked={allDeptsSelected || (someDeptsSelected && "indeterminate")}
                        onCheckedChange={() => toggleLoc(loc.name, loc.departments)}
                     />
                     <span className="font-bold text-sm cursor-pointer" onClick={() => setExpandedLocs(p => ({...p, [loc.name]: !isExpanded}))}>
                       {loc.name}
                     </span>
                  </div>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setExpandedLocs(p => ({...p, [loc.name]: !isExpanded}))}>
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>
                
                {isExpanded && (
                  <div className="p-2 pl-8 space-y-2">
                    {loc.departments.map(dept => {
                      const key = `${loc.name}:${dept.name}`;
                      return (
                        <div key={dept.id} className="flex items-center gap-2">
                          <Checkbox id={key} checked={selections.has(key)} onCheckedChange={() => toggleDept(key)} />
                          <label htmlFor={key} className="text-sm cursor-pointer select-none">{dept.name}</label>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <DialogFooter className="flex-col sm:flex-row items-center gap-2 border-t pt-4">
          <div className="text-xs text-muted-foreground mr-auto">
             Approx. {employeeCount} employees selected
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
             <Button variant="outline" className="flex-1 sm:flex-none" onClick={onClose}>Cancel</Button>
             <Button 
                disabled={selections.size === 0}
                onClick={() => onExecute(selections)}
                className="flex-1 sm:flex-none"
             >
               <Copy className="w-4 h-4 mr-2" />
               Copy Selected
             </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// --- AUDIT LOG VIEWER ---
const ChangeLogViewer = ({ tableName, rowId }: { tableName: string, rowId: string }) => {
  const [open, setOpen] = useState(false);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const loadLogs = async () => {
    setLoading(true);
    const { data } = await supabase.from('audit_logs').select('*').eq('table_name', tableName).eq('row', rowId).order('created_at', { ascending: false });
    if (data) setLogs(data as AuditLog[]);
    setLoading(false);
  };
  return (
    <Popover open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (isOpen) loadLogs(); }}>
      <PopoverTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground"><History className="h-4 w-4" /></Button></PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 space-y-2">
          <h4 className="font-medium leading-none mb-2 text-sm">History</h4>
          {loading ? <div className="flex justify-center p-4"><Loader2 className="h-4 w-4 animate-spin" /></div> : (
            <div className="max-h-[200px] overflow-y-auto text-xs space-y-2">
              {logs.length === 0 ? <div className="italic opacity-50">No history.</div> : logs.map(log => (<div key={log.id} className="border-b pb-1 last:border-0"><div className="font-bold">{log.action}</div><div className="text-[10px] opacity-60">{format(parseISO(log.created_at), 'MMM d, h:mm a')}</div></div>))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

// --- WEATHER CELL ---
const WeatherCell = ({ data }: { data: DailyWeather | undefined }) => {
  if (!data) return <div className="text-[10px] text-muted-foreground h-full flex items-center justify-center">-</div>;
  const Icon = getWeatherIcon(data.code);
  const color = data.code > 50 ? "text-blue-500" : "text-yellow-500";
  return (
    <div className="flex flex-row items-center justify-center h-full w-full gap-1" title="Click for detailed forecast">
      <Icon className={`w-3.5 h-3.5 ${color} print:text-black`} />
      <span className={`text-[11px] font-bold ${data.max_temp >= 105 ? 'text-red-600' : data.max_temp <= 40 ? 'text-blue-600' : 'text-slate-700 dark:text-slate-300'} print:text-black print:text-[9px]`}>
        {data.max_temp}°
        {data.condition === 'Seasonal Norm' && <span className="text-[7px] align-top opacity-50 ml-0.5">Hist</span>}
      </span>
    </div>
  );
};

// --- TASK BADGE ---
const TaskBadge = ({ taskKey }: { taskKey: string }) => {
  const task = TASKS[taskKey];
  if (!task) return null;
  return <div className={`${task.color} text-white text-[9px] font-bold px-1 rounded-sm flex items-center justify-center h-3 min-w-[12px] print-color-exact`} title={task.label}>{task.code}</div>;
};

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================
export default function RosterPage() {
  const supabase = createClient();
  const router = useRouter(); 
  const [isMounted, setIsMounted] = useState(false);
  const dateInputRef = useRef<HTMLInputElement>(null);

  // -- STATE --
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  useEffect(() => { if (dateInputRef.current) dateInputRef.current.value = format(currentDate, 'yyyy-MM-dd'); }, [currentDate]);

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');
   
  // Data
  const [hrConfig, setHrConfig] = useState<HRLocation[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);

  // Metadata
  const [rosterMetadata, setRosterMetadata] = useState<Record<string, { requests: TimeOffRequest[], availability: AvailabilityRule[] }>>({});
  const [weatherData, setWeatherData] = useState<Record<string, DailyWeather[]>>({});
  const [dailyStats, setDailyStats] = useState<Record<string, { people: number, fullString: string }>>({});
   
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
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
   
  // --- CONFLICT RESOLUTION STATE (v14.5) ---
  const [conflictShifts, setConflictShifts] = useState<Shift[]>([]);

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<TimeOffRequest | null>(null);
  const [managerNote, setManagerNote] = useState('');

  const [isWeatherModalOpen, setIsWeatherModalOpen] = useState(false);
  const [selectedWeatherLoc, setSelectedWeatherLoc] = useState('');
  const [selectedWeatherDate, setSelectedWeatherDate] = useState<string>('');

  const [formRole, setFormRole] = useState('Guide');
  const [formTask, setFormTask] = useState<string>('NONE');
  const [formStart, setFormStart] = useState('09:00');
  const [formEnd, setFormEnd] = useState('17:00');
  const [formLocation, setFormLocation] = useState('Las Vegas');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileEmp, setProfileEmp] = useState<Employee | null>(null);

  const startOfWeekDate = startOfISOWeek(currentDate);
  const endOfWeekDate = addDays(startOfWeekDate, 6);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startOfWeekDate, i));
  const weekNumber = parseInt(format(startOfWeekDate, 'I'));
  const weekRangeText = `${format(startOfWeekDate, 'yyyy')} Week ${weekNumber} ${format(startOfWeekDate, 'MMM d')} - ${format(endOfWeekDate, 'd')}`;

  const isManager = currentUserLevel >= 500;
  const isAdmin = currentUserLevel >= 900;

  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem('roster_filters');
    if (saved) try { setVisibleLocs(JSON.parse(saved)); } catch (e) { }
    if (window.innerWidth < 768) setViewMode('day');
  }, []);

  useEffect(() => { if (isMounted) fetchData(); }, [currentDate, isMounted]);

  // --- DYNAMIC GROUPING ---
  const groupedEmployees = useMemo(() => {
    const groups: Record<string, Record<string, Record<string, Employee[]>>> = {};
    hrConfig.forEach(loc => {
      groups[loc.name] = {};
      loc.departments.forEach(dept => {
        groups[loc.name][dept.name] = { 'General': [] };
        dept.positions.forEach(pos => {
          groups[loc.name][dept.name][pos.title] = [];
        });
      });
      groups[loc.name]['Visiting Staff'] = { 'General': [] };
    });

    employees.forEach(emp => {
        const locName = hrConfig.find(l => l.name === emp.location)?.name || 'Las Vegas';
        if (!groups[locName]) groups[locName] = {};

        const activeLocConfig = hrConfig.find(l => l.name === locName);
        let deptName = emp.department;
        if (!groups[locName][deptName]) {
            deptName = activeLocConfig?.departments[0]?.name || 'OFFICE';
            if(!groups[locName][deptName]) groups[locName][deptName] = {'General': []};
        }

        let role = 'General';
        const activeDeptConfig = activeLocConfig?.departments.find(d => d.name === deptName);
        if (activeDeptConfig) {
            const empTitleUpper = (emp.job_title || '').toUpperCase();
            const matchedPos = activeDeptConfig.positions.find(p => {
               if (p.title.toUpperCase() === empTitleUpper) return true;
               if (p.keyword && empTitleUpper.includes(p.keyword.toUpperCase())) return true;
               return false;
            });
            if (matchedPos) role = matchedPos.title;
        }

        if (!groups[locName][deptName][role]) groups[locName][deptName][role] = [];
        groups[locName][deptName][role].push(emp);
    });
    return groups;
  }, [employees, hrConfig]);

  const calculateDailyStats = (reservations: ReservationStat[]) => {
    const totalPeople = reservations.reduce((acc, r) => acc + (Number(r.ppl_count) || 0), 0);
    const breakdown = vehiclesList.map((key) => {
      const count = reservations.reduce((acc, r) => acc + (Number(r[key]) || 0), 0);
      return count > 0 ? `${count}-${key}` : null;
    }).filter(Boolean).join(', ');
    return { people: totalPeople, vehicles: '', fullString: breakdown };
  };

  // --- FETCH DATA ---
  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    // ---------------------------------------------------------
    // THE SAFE FIX: REDIRECT TO /signin IF NO SESSION
    // ---------------------------------------------------------
    if (!user) {
      console.warn("No active session. Redirecting to signin...");
      window.location.href = '/signin'; 
      return; 
    }

    setCurrentUserId(user.id);
    const { data: userData } = await supabase.from('users').select('user_level').eq('id', user.id).single();
    if (userData) setCurrentUserLevel(userData.user_level || 0);
    
    const { data: hrData } = await supabase
      .from('locations')
      .select(`*, departments (*, positions (*))`)
      .order('sort_order', { ascending: true });

    if (hrData) {
        const sortedConfig = hrData.map((loc: any) => ({
            ...loc,
            departments: (loc.departments || [])
                .sort((a: any, b: any) => a.sort_order - b.sort_order)
                .map((dept: any) => ({
                    ...dept,
                    positions: (dept.positions || [])
                        .sort((a: any, b: any) => a.sort_order - b.sort_order)
                }))
        }));
        setHrConfig(sortedConfig);
        if (Object.keys(visibleLocs).length === 0) {
            const initialVis: any = {};
            sortedConfig.forEach((l: any) => initialVis[l.name] = true);
            setVisibleLocs(initialVis);
        }
    }

    const dateStr = format(startOfWeekDate, 'yyyy-MM-dd');
    const result = await fetchFullRosterData(dateStr);

    if (result.error) {
      toast.error("Failed to load roster data: " + result.error);
      setLoading(false);
      return;
    }

    const uniqueStaff = (result.employees || []).sort((a: any, b: any) => {
      if (b.user_level !== a.user_level) return b.user_level - a.user_level;
      if (!a.hire_date) return 1; if (!b.hire_date) return -1;
      return new Date(a.hire_date).getTime() - new Date(b.hire_date).getTime();
    });
    setEmployees(uniqueStaff);
    if (result.shifts) setShifts(result.shifts);

    const metaMap: Record<string, { requests: TimeOffRequest[], availability: AvailabilityRule[] }> = {};
    uniqueStaff.forEach((u: any) => { metaMap[u.id] = { requests: [], availability: [] }; });
    (result.requests || []).forEach((r: TimeOffRequest) => {
      if (metaMap[r.user_id]) metaMap[r.user_id].requests.push(r);
    });
    (result.availability || []).forEach((a: AvailabilityRule) => {
      if (metaMap[a.user_id]) metaMap[a.user_id].availability.push(a);
    });
    setRosterMetadata(metaMap);

    if (visibleLocs['Las Vegas']) {
      const query = `SELECT * FROM reservations_modified WHERE sch_date >= '${format(startOfWeekDate, 'yyyy-MM-dd')}' AND sch_date <= '${format(endOfWeekDate, 'yyyy-MM-dd')}'`;
      try {
        const resData = (await fetch_from_old_db(query)) as ReservationStat[];
        if (Array.isArray(resData)) {
          const newStats: Record<string, any> = {};
          weekDays.forEach(day => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const daysRes = resData.filter(r => (typeof r.sch_date === 'string' ? r.sch_date : (r.sch_date as Date).toISOString()).substring(0, 10) === dateKey);
            newStats[dateKey] = calculateDailyStats(daysRes);
          });
          setDailyStats(newStats);
        }
      } catch (e) { console.error(e); }
    }

    const weatherUpdates: Record<string, DailyWeather[]> = {};
    const daysUntilStart = differenceInDays(startOfWeekDate, new Date());
    const useHistorical = daysUntilStart > 10;
    const locList = hrData ? hrData.map((l:any) => l.name) : Object.keys(visibleLocs);

    await Promise.all(locList.map(async (loc: string) => {
      if (!visibleLocs[loc]) return;
      if (useHistorical) {
        const dummyData = weekDays.map(day => ({
          date: format(day, 'yyyy-MM-dd'),
          min_temp: 50, max_temp: 70, code: 1, condition: 'Historical',
          sunrise: '6:00 AM', sunset: '8:00 PM', hourly: [], tides: []
        }));
        weatherUpdates[loc] = dummyData;
      } else {
        const data = await getLocationWeather(loc, format(startOfWeekDate, 'yyyy-MM-dd'), 7);
        if (data) weatherUpdates[loc] = data;
      }
    }));
    setWeatherData(weatherUpdates);
    setLoading(false);
  };

  const sumDailyHours = (list: Shift[], date: string) => 
    list.filter(s => format(parseISO(s.start_time), 'yyyy-MM-dd') === date)
    .reduce((acc, s) => acc + getDurationHours(s.start_time, s.end_time), 0);

  // --- UPDATED: STRICTLY FILTER FOR CURRENT WEEK ---
  const sumWeeklyHours = (list: Shift[]) => {
    // We only sum shifts that START within the currently displayed week
    const rangeStart = startOfWeekDate; // Monday 00:00
    const rangeEnd = endOfWeekDate;     // Sunday 00:00 (actually endOfDay Sunday 23:59)
    const rangeEndFixed = endOfDay(endOfWeekDate);

    return list
      .filter(s => {
        const sDate = parseISO(s.start_time);
        return isWithinInterval(sDate, { start: rangeStart, end: rangeEndFixed });
      })
      .reduce((acc, s) => acc + getDurationHours(s.start_time, s.end_time), 0);
  };

  const handlePrint = () => { window.print(); };
  const logChange = async (action: string, table: string, rowId: string) => { if (!currentUserId) return; await supabase.from('audit_logs').insert({ action, table_name: table, row: rowId, user_id: currentUserId }); };

  const openReviewModal = (request: TimeOffRequest, e: React.MouseEvent) => { e.stopPropagation(); if (!isManager) return; setSelectedRequest(request); setManagerNote(''); setIsReviewModalOpen(true); };
  const submitReview = async (status: 'approved' | 'denied') => { if (!selectedRequest) return; const result = await approveTimeOffRequest(selectedRequest.id, status, managerNote); if (result.error) { toast.error(`Failed: ${result.error}`); } else { toast.success(`Request ${status}`); setIsReviewModalOpen(false); fetchData(); } };
  const handleRevokeTimeOff = async () => { if (!selectedRequest || !isManager) return; const { error } = await supabase.from('time_off_requests').delete().eq('id', selectedRequest.id); if (error) { toast.error("Failed to revoke request"); } else { await logChange(`Revoked/Deleted Time Off Request`, 'time_off_requests', selectedRequest.id); toast.success("Time Off Removed from Schedule"); setIsReviewModalOpen(false); fetchData(); } };

  const handleWeatherClick = (loc: string, dateStr: string) => { setSelectedWeatherLoc(loc); setSelectedWeatherDate(dateStr); setIsWeatherModalOpen(true); };
  const handleNavWeatherDay = (direction: 'prev' | 'next') => {
    const current = parseISO(selectedWeatherDate);
    const newDate = direction === 'next' ? addDays(current, 1) : subDays(current, 1);
    const newDateStr = format(newDate, 'yyyy-MM-dd');
    const hasData = weatherData[selectedWeatherLoc]?.some(d => d.date === newDateStr);
    if (hasData) setSelectedWeatherDate(newDateStr); else toast.error("No forecast data for that day.");
  };
  const getSelectedWeatherDayData = () => weatherData[selectedWeatherLoc]?.find(d => d.date === selectedWeatherDate) || null;

  // --- HELPER TO LOAD SHIFT INTO FORM ---
  const loadShiftIntoForm = (s: Shift) => {
    setSelectedShiftId(s.id); 
    setFormRole(s.role); 
    setFormTask(s.task || 'NONE'); 
    setFormLocation(s.location || 'Las Vegas'); // Default fallback
    setFormStart(format(parseISO(s.start_time), 'HH:mm')); 
    setFormEnd(format(parseISO(s.end_time), 'HH:mm'));
  };

  // --- UPDATED HANDLER: ACCEPTS ARRAY OF SHIFTS (CONFLICT DETECTOR) ---
  const handleCellClick = (emp: Employee, dateStr: string, dailyShifts: Shift[]) => {
    if (!isManager) return;
     
    setSelectedEmpId(emp.id); 
    setSelectedEmpName(emp.full_name); 
    setSelectedDate(dateStr);
     
    // Reset defaults
    setFormRole('Guide'); 
    setFormTask('NONE'); 
    setFormLocation(emp.location); 
    setFormStart('09:00'); 
    setFormEnd('17:00');

    // CONFLICT LOGIC:
    if (dailyShifts.length === 0) {
      // Create New
      setSelectedShiftId(null);
      setConflictShifts([]);
      // Load user defaults if any
      const defaults = lastShiftParams[emp.id];
      if (defaults) { setFormRole(defaults.role); setFormTask(defaults.task || 'NONE'); setFormStart(defaults.start); setFormEnd(defaults.end); setFormLocation(defaults.location); }

    } else if (dailyShifts.length === 1) {
      // Edit Single (Normal Mode)
      loadShiftIntoForm(dailyShifts[0]);
      setConflictShifts([]);

    } else {
      // CONFLICT MODE: Multiple shifts found
      setConflictShifts(dailyShifts);
      // Load the FIRST one into the form so it's not empty, but user will likely use the resolver list
      loadShiftIntoForm(dailyShifts[0]);
      // We set selectedShiftId to null initially to force user to choose or delete from list? 
      // Actually, keeping the first one selected allows for quick editing of one of them.
    }

    setIsShiftModalOpen(true);
  };

  const handleSaveShift = async () => {
    if (!isManager) return;
    setLoading(true);
    try {
      const startISO = `${selectedDate}T${formStart}:00`;
      let endISO = `${selectedDate}T${formEnd}:00`;
      if (formEnd < formStart) { const nextDay = addDays(parseISO(selectedDate), 1); endISO = `${format(nextDay, 'yyyy-MM-dd')}T${formEnd}:00`; }
      const payload = { user_id: selectedEmpId, start_time: new Date(startISO).toISOString(), end_time: new Date(endISO).toISOString(), role: formRole, location: formLocation, task: formTask === 'NONE' ? null : formTask };
      if (selectedShiftId) { await supabase.from('employee_schedules').update(payload).eq('id', selectedShiftId); await logChange('Updated Shift', 'employee_schedules', selectedShiftId); }
      else { const { data } = await supabase.from('employee_schedules').insert([payload]).select().single(); if (data) await logChange('Created Shift', 'employee_schedules', data.id); }
      setLastShiftParams(p => ({ ...p, [selectedEmpId]: { role: formRole, task: formTask === 'NONE' ? undefined : formTask, start: formStart, end: formEnd, location: formLocation } }));
      toast.success("Shift Saved"); setIsShiftModalOpen(false); fetchData();
    } catch (err) { toast.error("Error saving shift"); } finally { setLoading(false); }
  };

  const handleDeleteShift = async () => { if (!isManager || !selectedShiftId) return; await logChange(`Deleted shift`, 'employee_schedules', selectedShiftId); await supabase.from('employee_schedules').delete().eq('id', selectedShiftId); setShifts((prev) => prev.filter(s => s.id !== selectedShiftId)); setIsShiftModalOpen(false); toast.success("Shift Deleted"); };
   
  // --- CONFLICT RESOLVER: DELETE SPECIFIC GHOST SHIFT ---
  const handleResolveConflict = async (idToDelete: string) => {
    if (!isManager) return;
     
    // Optimistic Update
    const updatedConflicts = conflictShifts.filter(s => s.id !== idToDelete);
    setConflictShifts(updatedConflicts);
    setShifts(prev => prev.filter(s => s.id !== idToDelete)); // Update main grid immediately

    // DB Call
    const { error } = await supabase.from('employee_schedules').delete().eq('id', idToDelete);
    if (error) {
       toast.error("Failed to delete duplicate");
       fetchData(); // Revert on error
    } else {
       toast.success("Duplicate shift removed");
       await logChange('Resolved Duplicate', 'employee_schedules', idToDelete);
       
       // If only 1 remains, switch to normal edit mode
       if (updatedConflicts.length === 1) {
         loadShiftIntoForm(updatedConflicts[0]);
         setConflictShifts([]); // Exit conflict mode
       }
    }
  };

  // --- NEW (v15.0): GRANULAR COPY EXECUTION ---
  const handleExecuteCopy = async (selectedScope: Set<string>) => {
    setIsCopyModalOpen(false);
    if (!isManager || shifts.length === 0) return;

    setCopying(true);
    const sourceStart = startOfWeekDate; 
    const targetStart = addWeeks(sourceStart, 1); 
    const targetEnd = addWeeks(targetStart, 1); 

    try {
        // 1. Identify Employees based on selections (Location:Dept)
        const employeesToCopy = employees.filter(e => {
            const key = `${e.location}:${e.department}`;
            return selectedScope.has(key);
        });
        const userIdsToCopy = employeesToCopy.map(e => e.id);

        if (userIdsToCopy.length === 0) {
            toast.error("No employees found in selected departments.");
            setCopying(false);
            return;
        }

        // 2. Identify Shifts in Current View belonging to these users
        const sourceEnd = addWeeks(sourceStart, 1);
        const shiftsToCopy = shifts.filter(s => {
            const sTime = parseISO(s.start_time);
            return (
                userIdsToCopy.includes(s.user_id) && 
                sTime >= sourceStart && 
                sTime < sourceEnd
            );
        });

        if (shiftsToCopy.length === 0) {
            toast.info("No shifts found for selected departments in the current week.");
            setCopying(false);
            return;
        }

        // 3. Check for Conflicts in Target Week (Scoped to these users only)
        // We only block if the SPECIFIC users we are copying already have shifts.
        // We do NOT block if other departments have shifts.
        const { count, error: checkError } = await supabase
            .from('employee_schedules')
            .select('id', { count: 'exact', head: true })
            .gte('start_time', targetStart.toISOString())
            .lt('start_time', targetEnd.toISOString())
            .in('user_id', userIdsToCopy); // Critical: Scope check to selected users

        if (checkError) throw checkError;

        if (count && count > 0) {
             toast.error("Copy Aborted: Target Conflict", { 
                 description: `${count} shifts already exist next week for the selected departments. Please clear them first.` 
             });
             setCopying(false);
             return;
        }

        // 4. Prepare New Shifts
        const newShifts = shiftsToCopy.map(s => {
            const originalStart = parseISO(s.start_time);
            const originalEnd = parseISO(s.end_time);
            return {
                user_id: s.user_id, 
                role: s.role, 
                task: s.task,
                start_time: addWeeks(originalStart, 1).toISOString(),
                end_time: addWeeks(originalEnd, 1).toISOString(),
                location: s.location || 'Las Vegas'
            };
        });

        // 5. Insert
        const { error: insertError } = await supabase.from('employee_schedules').insert(newShifts);
        if (insertError) throw insertError;

        toast.success(`Copied ${newShifts.length} shifts to next week.`);
        
    } catch (e: any) {
        console.error("Copy Error:", e);
        toast.error(`Failed to copy: ${e.message}`);
    } finally {
        setCopying(false);
    }
  };

  const handleArchiveEmployee = async () => { if (!isAdmin || !profileEmp) return; if (!confirm(`Archive ${profileEmp.full_name}?`)) return; await supabase.from('users').update({ user_level: 100 }).eq('id', profileEmp.id); fetchData(); setIsProfileModalOpen(false); toast.success("Archived"); };
  const handleSaveProfile = async () => { if (!isManager || !profileEmp) return; const { error: userError } = await supabase.from('users').update({ phone: profileEmp.phone, avatar_url: profileEmp.avatar_url }).eq('id', profileEmp.id); if (userError) { toast.error("Error updating user profile"); return; } const { error: empError } = await supabase.from('employee_details').upsert({ user_id: profileEmp.id, hire_date: profileEmp.hire_date || null, department: profileEmp.department, primary_position: profileEmp.job_title, primary_work_location: profileEmp.location, timeclock_blocked: profileEmp.timeclock_blocked }, { onConflict: 'user_id' }); if (empError) { toast.error("Error updating details"); return; } fetchData(); setIsProfileModalOpen(false); toast.success("Saved"); };

  if (!isMounted) return null;

  return (
    <div id="roster-container" className="p-2 h-[calc(100vh-65px)] flex flex-col bg-background text-foreground overflow-hidden print:p-0 print:bg-white print:h-auto print:block print:w-full print:m-0 print:overflow-visible">
      <style jsx global>{`@media print { @page { size: landscape; margin: 5mm; } html, body, #roster-container, .bg-background, .bg-card, .dark { background-color: white !important; color: black !important; margin: 0 !important; padding: 0 !important; } * { box-shadow: none !important; border-radius: 0 !important; } nav, header, aside, .print-hide { display: none !important; } #roster-container { position: static !important; height: auto !important; overflow: visible !important; display: block !important; margin: 0 !important; padding: 0 !important; } .sticky { position: static !important; } .location-break { break-before: page; page-break-before: always; } tbody.dept-block { break-inside: avoid; page-break-inside: avoid; } .print-yellow { background-color: #fde047 !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } tr { height: auto !important; } td, th { padding: 0.5px 2px !important; font-size: 10px !important; vertical-align: middle !important; border-color: #000 !important; border-width: 1px !important; } .print-no-avatar { display: none !important; } }`}</style>

      {/* HEADER */}
      <div className="flex flex-col gap-2 print-hide z-[60] sticky top-0 bg-background/95 backdrop-blur pb-2 pt-1">
        <div className="min-h-[3.5rem] h-auto flex flex-col md:flex-row items-center justify-between gap-y-3 p-2 border rounded-lg bg-card shadow-sm relative">
          <div className="w-full md:w-auto order-2 md:order-1 flex items-center gap-3">
            <h1 className="text-lg font-bold hidden lg:block">Roster</h1>
            <Separator orientation="vertical" className="h-6 hidden lg:block" />
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar w-full md:w-auto">
              <Filter className="w-3.5 h-3.5 text-muted-foreground mr-1 flex-shrink-0" />
              {hrConfig.map(loc => (
                  <Badge key={loc.id} variant={visibleLocs[loc.name] ? 'default' : 'outline'} 
                         className={`cursor-pointer select-none px-2 py-0.5 text-[10px] whitespace-nowrap ${visibleLocs[loc.name] ? 'bg-primary hover:bg-primary/90' : 'bg-transparent text-muted-foreground hover:bg-accent'}`} 
                         onClick={() => { setVisibleLocs({ ...visibleLocs, [loc.name]: !visibleLocs[loc.name] }); }}>
                    {loc.name}
                  </Badge>
              ))}
            </div>
          </div>
          <div className="w-full md:w-auto order-1 md:order-2 flex justify-center md:absolute md:left-1/2 md:-translate-x-1/2 z-10">
            <div className="flex flex-col items-center gap-1">
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild><div className="text-xs font-bold text-foreground leading-none cursor-pointer hover:underline text-center">{viewMode === 'week' ? weekRangeText : format(currentDate, 'yyyy MMM do')}</div></PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="center"><MiniCalendar selectedDate={currentDate} onSelect={(d) => { setCurrentDate(d); setIsCalendarOpen(false); }} /></PopoverContent>
              </Popover>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setCurrentDate(viewMode === 'week' ? subWeeks(currentDate, 1) : subDays(currentDate, 1))}><ChevronLeft className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsCalendarOpen(true)}><CalendarIcon className="w-4 h-4 text-muted-foreground" /></Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setCurrentDate(viewMode === 'week' ? addWeeks(currentDate, 1) : addDays(currentDate, 1))}><ChevronRight className="w-4 h-4" /></Button>
                <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] uppercase font-bold text-muted-foreground ml-1" onClick={() => setCurrentDate(new Date())}>Now</Button>
              </div>
            </div>
          </div>
          <div className="w-full md:w-auto order-3 md:order-3 flex items-center justify-between md:justify-end gap-2">
            <div className="flex items-center bg-muted p-0.5 rounded-lg border">
              <Button variant={viewMode === 'day' ? 'secondary' : 'ghost'} size="sm" className="h-7 px-2 text-[10px]" onClick={() => setViewMode('day')}>Day</Button>
              <Button variant={viewMode === 'week' ? 'secondary' : 'ghost'} size="sm" className="h-7 px-2 text-[10px]" onClick={() => setViewMode('week')}>Week</Button>
            </div>
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild><Button variant="outline" size="sm" className="h-8 gap-1 px-2 text-xs"><Info className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Key</span></Button></PopoverTrigger>
                <PopoverContent className="w-auto p-3" align="end"><h4 className="font-bold text-xs mb-2 text-muted-foreground text-center">Task Legend</h4><div className="grid grid-cols-2 gap-2">{Object.values(TASKS).map(task => (<div key={task.code} className="flex items-center gap-2"><div className={`w-4 h-4 ${task.color} rounded flex items-center justify-center text-[9px] text-white font-bold`}>{task.code}</div><span className="text-xs">{task.label}</span></div>))}</div></PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild><Button variant="outline" size="sm" className="h-8 gap-1 px-2 text-xs"><Settings className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Manage</span></Button></PopoverTrigger>
                <PopoverContent className="w-48 p-2" align="end">
                    <div className="flex flex-col gap-1">
                        <Button variant="ghost" size="sm" onClick={handlePrint} className="justify-start h-8 text-xs w-full"><Printer className="w-3.5 h-3.5 mr-2" /> Print Schedule</Button>
                        {isManager && (
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                disabled={copying || shifts.length === 0} 
                                onClick={() => setIsCopyModalOpen(true)} // UPDATED: Open Modal instead of direct action
                                className="justify-start h-8 text-xs w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                                {copying ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : <Copy className="w-3.5 h-3.5 mr-2" />}
                                Copy to Next Week
                            </Button>
                        )}
                        <Separator className="my-1"/>
                        {isManager && (<EmailSchedulerModal 
   weekStart={format(startOfWeekDate, 'yyyy-MM-dd')} 
   employees={employees} 
   hrConfig={hrConfig} 
/>)}
                    </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </div>

      {/* TABLE GRID */}
      <div className={cn("flex-1 overflow-auto border rounded-lg shadow-sm bg-card print:overflow-visible print:h-auto print:border-none print:shadow-none print:bg-white relative", loading && "opacity-50 pointer-events-none")}>
        {viewMode === 'week' && (
          <table className="w-full border-collapse min-w-[1000px] text-sm print:w-full print:min-w-0 print:text-[10px]">
            <thead className="sticky top-0 bg-muted z-50 shadow-sm print:static print:bg-white print:border-b-2 print:border-black h-8">
              <tr className="hidden print:table-row h-6"><th colSpan={8} className="p-0 border-b-2 border-black bg-white text-black"><div className="flex justify-between items-center w-full px-1"><span className="text-sm font-bold">{weekRangeText}</span><span className="text-[9px] font-mono opacity-50 italic">Printed: {format(new Date(), 'M/d/yy h:mm a')}</span></div></th></tr>
              <tr>
                <th className="p-1 h-8 text-center w-32 border-b font-bold text-muted-foreground bg-muted print:pl-1 print:bg-white print:text-black z-50"><div className="flex row items-center justify-center gap-1"><Users className="w-4 h-4" /><span className="text-[10px] uppercase">Staff</span></div></th>
                {weekDays.map(day => (<th key={day.toISOString()} className="p-1 h-8 text-center border-b min-w-[100px] border-l bg-muted print:bg-white print:text-black print:w-[12%]"><span className="text-xs font-bold text-foreground flex items-center justify-center gap-1 print:text-black">{format(day, 'EEE')} {format(day, 'd')}</span></th>))}
              </tr>
            </thead>
            {Object.entries(groupedEmployees).map(([locName, departments], locIndex) => {
              if (!visibleLocs[locName]) return null;
              const locShifts = shifts.filter(s => (s.location === locName));
              const locWeather = weatherData[locName] || [];
              return (
                <Fragment key={locName}>
                  <tbody className="print:break-after-avoid relative">
                    <tr className={cn("bg-yellow-400 text-black print-yellow border-b-2 border-black sticky top-8 z-40", locIndex > 0 && "location-break")}>
                      <td className="p-2 font-bold uppercase tracking-wider text-xs border-b border-black sticky left-0 z-40 bg-yellow-400 print:static print:text-black print:text-sm">
                        <div className="flex flex-col justify-center items-center text-center">
                          <div className="flex items-center justify-center gap-1"><MapPin className="w-3 h-3 print:hidden" /> <span className="text-[10px]">{locName}</span></div>
                          <span className="bg-white/50 text-[10px] px-1.5 py-0.5 rounded text-black font-mono border border-black/20 mt-1">{sumWeeklyHours(locShifts).toFixed(1)}h</span>
                        </div>
                      </td>
                      {weekDays.map(day => {
                        const dateStr = format(day, 'yyyy-MM-dd');
                        const stats = locName === 'Las Vegas' ? dailyStats[dateStr] : null;
                        return (
                          <td key={dateStr} className="border-l border-black bg-yellow-400 print-yellow text-center text-[10px] font-mono text-black align-top p-1 sticky top-8 z-30">
                            <div className="font-bold">{sumDailyHours(locShifts, dateStr) > 0 ? `${sumDailyHours(locShifts, dateStr).toFixed(1)}h` : '-'}</div>
                            {stats && stats.people > 0 && (
                              <Button asChild variant="ghost" className="mt-1 h-auto py-1 px-1.5 border border-black/10 hover:bg-black/10 text-orange-900 rounded-sm w-full flex flex-col items-center gap-0.5 print:border-none print:p-0">
                                <Link href={getDashboardLink(locName, dateStr)}>
                                  <div className="font-bold flex items-center gap-1 text-xs"><BarChart3 className="w-3 h-3 opacity-50 print:hidden" />{stats.people} <span className="text-[8px] uppercase opacity-70">ppl</span></div>
                                  <div className="text-[8px] leading-none opacity-80 whitespace-nowrap overflow-hidden text-ellipsis w-full max-w-[60px] text-center">{stats.fullString}</div>
                                </Link>
                              </Button>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                    <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 h-8 print:h-auto print:border-black print:break-after-avoid">
                      <td className="p-1 text-[10px] font-semibold text-muted-foreground uppercase border-r sticky left-0 z-30 bg-slate-50 dark:bg-slate-900 print:bg-white print:static print:text-black text-center">Forecast</td>
                      {weekDays.map(day => {
                        const dStr = format(day, 'yyyy-MM-dd');
                        const wData = locWeather.find(w => w.date === dStr);
                        return (
                          <td key={dStr} className="border-l p-0 text-center print:border-gray-300">
                            <div onClick={() => wData && handleWeatherClick(locName, dStr)} className="cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors h-full w-full">
                              <WeatherCell data={wData} />
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  </tbody>
                  {Object.entries(departments).map(([deptName, roleGroups]) => {
                    if (!Object.values(roleGroups as Record<string, Employee[]>).some(g => (g).length > 0)) return null;
                    const deptEmps = Object.values(roleGroups as Record<string, Employee[]>).flat();
                    const deptShifts = locShifts.filter(s => deptEmps.some(e => e.id === s.user_id));
                    const isVisiting = deptName === 'Visiting Staff';
                    const deptConfig = hrConfig.find(l => l.name === locName)?.departments.find(d => d.name === deptName);
                    const deptStyle = deptConfig?.style_class || DEFAULT_DEPT_STYLE;

                    return (
                      <tbody key={`${locName}-${deptName}`} className="dept-block">
                        <tr className={`${isVisiting ? 'bg-amber-50 dark:bg-amber-950/30' : deptStyle} print-color-exact border-t-2 border-slate-200 print:border-black`}>
                          <td className={`p-1 font-bold text-xs uppercase border-b sticky left-0 z-30 w-32 ${isVisiting ? 'text-amber-600' : ''} print:static print:text-black print:border-black`}>
                            <div className="flex flex-row justify-between items-center w-full px-1">
                              <span>{isVisiting && <Plane className="w-3 h-3 inline mr-1 mb-0.5" />} {deptName}</span>
                              <span className="text-[10px] opacity-70 bg-black/5 dark:bg-white/10 px-1 rounded print:bg-white print:text-black print:border print:border-black">{sumWeeklyHours(deptShifts).toFixed(1)}h</span>
                            </div>
                          </td>
                          {weekDays.map(day => (<td key={day.toISOString()} className="border-l border-b bg-inherit text-center text-[10px] font-mono opacity-70 print:text-black print:border-black">{sumDailyHours(deptShifts, format(day, 'yyyy-MM-dd')) > 0 && <span>{sumDailyHours(deptShifts, format(day, 'yyyy-MM-dd')).toFixed(1)}h</span>}</td>))}
                        </tr>
                        {Object.entries(roleGroups as Record<string, Employee[]>).map(([roleName, emps]) => {
                          if (emps.length === 0) return null;
                          return (
                            <Fragment key={roleName}>
                              {roleName !== 'General' && (<tr className="bg-slate-50/50 dark:bg-slate-900/20 print:bg-white"><td colSpan={8} className="px-4 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider print:text-black print:pl-2">↳ {roleName}</td></tr>)}
                              {emps.map((emp: Employee) => {
                                const empShifts = shifts.filter(s => s.user_id === emp.id);
                                const empReqs = (rosterMetadata[emp.id]?.requests || []).sort((a, b) => a.start_date.localeCompare(b.start_date));
                                const empAvail = rosterMetadata[emp.id]?.availability || [];
                                return (
                                  <tr key={`${locName}-${emp.id}`} className="hover:bg-muted/20 transition-colors border-b print:border-gray-400 print:h-auto">
                                    <td className="p-0 border-r border-r-slate-100 dark:border-r-slate-800 sticky left-0 z-30 bg-card print:static print:border-r print:border-black print:p-0">
                                      <div className="p-1 w-32 flex flex-row items-center justify-start h-full gap-2 print:w-auto">
                                        <div className="flex-shrink-0 ml-1 print:hidden"><UserStatusAvatar user={emp} currentUserLevel={currentUserLevel} isCurrentUser={currentUserId === emp.id} size="md" /></div>
                                        <div className="hidden print:block flex-shrink-0 ml-1 h-5 w-5 rounded-full border border-black/20 overflow-hidden">{emp.avatar_url ? (<img src={emp.avatar_url} alt="" className="w-full h-full object-cover" />) : (<div className="w-full h-full bg-gray-100 flex items-center justify-center"><User className="w-3 h-3 text-gray-400" /></div>)}</div>
                                        <div className="flex flex-col items-start justify-center min-w-0 overflow-hidden print:justify-start">
                                          <div className="font-bold text-xs truncate w-full text-left" title={emp.full_name}>{emp.stage_name}{emp.timeclock_blocked && <Ban className="w-3 h-3 text-red-500 inline ml-1" />}</div>
                                          <div className="mt-0.5 print:hidden">{sumWeeklyHours(empShifts) > 0 && (<span className="text-[10px] bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-200 px-1.5 py-0.5 rounded-sm font-mono inline-block">{sumWeeklyHours(empShifts).toFixed(1)}h</span>)}</div>
                                          <div className="hidden print:block text-[8px] font-mono leading-none opacity-80 -mt-0.5">{emp.phone || 'No Phone'}</div>
                                        </div>
                                      </div>
                                    </td>
                                    {weekDays.map(day => {
                                      const dateStr = format(day, 'yyyy-MM-dd');
                                       
                                      // --- NEW: CONFLICT DETECTION LOGIC (v14.5) ---
                                      // Find ALL shifts for this day, not just the first one.
                                      const dailyShifts = shifts.filter(s => s.user_id === emp.id && format(parseISO(s.start_time), 'yyyy-MM-dd') === dateStr);
                                      const shift = dailyShifts[0]; // Primary shift to render
                                      const hasConflict = dailyShifts.length > 1;

                                      const isAway = shift && shift.location !== emp.location && !isVisiting;
                                      const request = empReqs.find(r => {
                                        const start = r.start_date.slice(0, 10);
                                        const end = r.end_date.slice(0, 10);
                                        return dateStr >= start && dateStr <= end;
                                      });
                                      const availRule = empAvail.find(a => a.day_of_week === day.getDay());
                                      const reqStatus = request?.status.trim().toUpperCase();
                                       
                                      return (
                                        <td key={dateStr} className={`p-1 border-l relative h-14 print:h-auto print:border-black ${isManager ? 'cursor-pointer group' : ''}`} onClick={() => isManager && handleCellClick(emp, dateStr, dailyShifts)}>
                                          {shift ? (
                                            <div className={`h-full w-full border-l-2 rounded-r p-1 flex flex-col justify-center relative print:bg-white print:border print:border-black print:p-0.5 print:rounded-none ${isAway ? 'bg-amber-50 border-l-amber-500' : 'bg-blue-100 border-l-blue-500 dark:bg-blue-900'}`}>
                                              {/* CONFLICT INDICATOR BADGE */}
                                              {hasConflict && (
                                                 <div className="absolute -top-2 -right-1 z-50 bg-purple-600 text-white border-2 border-white dark:border-slate-900 rounded-full w-5 h-5 flex items-center justify-center text-[9px] font-bold shadow-md animate-pulse print:hidden" title="Multiple shifts found! Click to resolve.">
                                                    x{dailyShifts.length}
                                                 </div>
                                              )}
                                               
                                              {reqStatus === 'APPROVED' && (<div className="absolute -top-1 -left-1 z-50 bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold shadow-sm" title="Conflict: Scheduled during Time Off">!</div>)}
                                              {reqStatus === 'PENDING' && (<div className="absolute inset-x-0 -top-2 z-50 flex justify-center cursor-pointer" onClick={(e) => openReviewModal(request!, e)}><div className="bg-orange-500 text-white text-[8px] px-1.5 py-0.5 rounded-full font-bold shadow-sm border border-orange-600 flex items-center gap-1 hover:bg-orange-600"><AlertCircle className="w-2 h-2" /> Pending</div></div>)}
                                              {shift.task && <div className="absolute top-0 right-0 p-0.5 print:p-0 print:top-0 print:right-0"><TaskBadge taskKey={shift.task} /></div>}
                                              <span className="font-bold text-foreground text-xs leading-none mb-0.5 print:text-black print:mb-0 print:text-[10px]">{format(parseISO(shift.start_time), 'h:mma')}</span>
                                              <span className="text-[10px] text-muted-foreground leading-none print:text-black print:text-[9px]">- {format(parseISO(shift.end_time), 'h:mma')}</span>
                                              {isAway && <div className="text-[9px] font-bold text-amber-700 mt-1 uppercase print:text-black print:mt-0 print:text-[8px]"><Plane className="w-2 h-2 inline" /> {shift.location}</div>}
                                            </div>
                                          ) : (
                                            reqStatus === 'APPROVED' ? (
                                              <div className={`h-full w-full bg-yellow-400 dark:bg-yellow-600 flex flex-col items-center justify-center p-1 border-l-4 border-yellow-600 dark:border-yellow-400 print-yellow ${isManager ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`} onClick={(e) => isManager && openReviewModal(request!, e)}>
                                                <span className="text-[10px] font-black uppercase text-black">OFF</span>
                                                <span className="text-[8px] leading-none text-black/70 font-bold truncate max-w-[60px] mx-auto">{request!.reason || 'Approved'}</span>
                                              </div>
                                            ) : reqStatus === 'PENDING' ? (
                                              <div className="h-full w-full bg-orange-100 dark:bg-orange-900/40 border border-orange-300 dark:border-orange-700 p-0.5 flex flex-col justify-center items-center animate-in fade-in cursor-pointer hover:bg-orange-200 dark:hover:bg-orange-900/60 transition-colors group/pending" onClick={(e) => openReviewModal(request!, e)}>
                                                <AlertCircle className="w-4 h-4 text-orange-600 mb-1" /><span className="text-[8px] font-bold text-orange-800 dark:text-orange-200 leading-tight text-center uppercase tracking-wide">REVIEW</span>
                                              </div>
                                            ) : availRule?.preference_level === 'unavailable' ? (<div className="h-full w-full bg-slate-100 dark:bg-slate-900/50 flex items-center justify-center opacity-70 cursor-not-allowed"><div className="flex flex-col items-center text-slate-400"><Ban className="w-3 h-3 mb-0.5" /><span className="text-[9px] font-bold uppercase">N/A</span></div></div>) :
                                              availRule?.preference_level === 'preferred_off' ? (
                                                <div className="h-full w-full relative group">
                                                  <div className="absolute inset-0 bg-slate-100 dark:bg-slate-800/20 opacity-30" />
                                                  <div className="absolute top-1 right-1"><Badge variant="secondary" className="text-[8px] h-4 px-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 flex items-center gap-0.5"><ThumbsDown className="w-2 h-2" /> Pref Off</Badge></div>
                                                  {isManager && <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100"><Plus className="w-4 h-4 text-muted-foreground/50" /></div>}
                                                </div>
                                              ) : (!isVisiting && isManager && <div className="h-full w-full flex items-center justify-center opacity-0 group-hover:opacity-100 print:hidden"><Plus className="w-4 h-4 text-muted-foreground/30" /></div>)
                                          )}
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

        {/* --- DAY VIEW --- */}
        {viewMode === 'day' && (
          <div className="p-4 space-y-6 print:space-y-4">
            {Object.entries(groupedEmployees).map(([locName, departments]) => {
              if (!visibleLocs[locName]) return null;
              const dateKey = format(currentDate, 'yyyy-MM-dd');
              const activeDepts = Object.entries(departments).filter(([deptName, roleGroups]) => Object.values(roleGroups as Record<string, Employee[]>).some((group: any) => group.some((emp: any) => shifts.some(s => s.user_id === emp.id && format(parseISO(s.start_time), 'yyyy-MM-dd') === dateKey))));
              if (activeDepts.length === 0) return null;
              const todayWeather = weatherData[locName]?.find(w => w.date === dateKey);

              return (
                <div key={locName} className="border rounded-lg overflow-hidden bg-card shadow-sm print:border-black print:shadow-none">
                  <div className="bg-slate-900 text-white p-3 font-bold uppercase flex justify-between items-center print:bg-white print:text-black print:border-b print:border-black">
                    <div className="flex flex-col">
                      <div className="flex items-center"><MapPin className="w-4 h-4 inline mr-2" /> {locName}</div>
                      {locName === 'Las Vegas' && dailyStats[dateKey] && (<div className="text-xs font-normal text-orange-300 normal-case mt-1 font-mono">People: {dailyStats[dateKey].people} — {dailyStats[dateKey].fullString}</div>)}
                    </div>
                    {todayWeather && (
                      <div onClick={() => handleWeatherClick(locName, dateKey)} className="cursor-pointer hover:scale-105 transition-transform flex items-center gap-2 bg-slate-800 px-3 py-1 rounded-full border border-slate-700 print:bg-white print:text-black print:border-black">
                        <WeatherCell data={todayWeather} />
                      </div>
                    )}
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 print:divide-black">
                    {activeDepts.map(([deptName, roleGroups]) => {
                      const allDeptEmps = Object.values(roleGroups as Record<string, Employee[]>).flat();
                      const deptConfig = hrConfig.find(l => l.name === locName)?.departments.find(d => d.name === deptName);
                      const deptStyle = deptConfig?.style_class || 'bg-muted';

                      return (
                        <div key={deptName} className="p-0 print:break-before">
                          <div className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider border-b ${deptStyle} print:bg-gray-100 print:text-black print:border-black`}>{deptName === 'Visiting Staff' && <Plane className="w-3 h-3 inline mr-1" />} {deptName}</div>
                          <div className="divide-y divide-slate-100 dark:divide-slate-800 print:divide-black">
                            {allDeptEmps.map((emp: any) => {
                              const shift = shifts.find(s => s.user_id === emp.id && format(parseISO(s.start_time), 'yyyy-MM-dd') === dateKey);
                              if (!shift) return null;
                              return (
                                <div key={emp.id} className="flex items-center justify-between p-3 hover:bg-muted/10 print:p-2 print:border-b print:border-gray-200">
                                  <div className="flex items-center gap-3">
                                    <UserStatusAvatar user={emp} currentUserLevel={currentUserLevel} isCurrentUser={currentUserId === emp.id} size="md" />
                                    <div><div className="font-semibold text-sm flex items-center gap-2"><span className="">{emp.stage_name}</span></div><div className="hidden print:block text-[9px] font-mono leading-tight">{emp.phone}</div><div className="text-xs text-muted-foreground flex items-center gap-1 print:text-black"><Badge variant="outline" className="text-[10px] h-5 px-1 print:border-black">{shift.role}</Badge>{shift.task && <TaskBadge taskKey={shift.task} />}</div></div>
                                  </div>
                                  <div className="text-right"><div className="font-mono font-bold text-sm bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-100 px-2 py-1 rounded border border-blue-100 dark:border-blue-900 print:bg-white print:text-black print:border-black">{format(parseISO(shift.start_time), 'h:mm a')} - {format(parseISO(shift.end_time), 'h:mm a')}</div></div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODALS */}
      <div className="print-hide">
        <WeatherModal
          isOpen={isWeatherModalOpen}
          onOpenChange={setIsWeatherModalOpen}
          locationName={selectedWeatherLoc}
          data={getSelectedWeatherDayData()}
          onNavigate={handleNavWeatherDay}
        />

        {/* --- NEW COPY MODAL --- */}
        <CopyScheduleModal 
          isOpen={isCopyModalOpen}
          onClose={() => setIsCopyModalOpen(false)}
          hrConfig={hrConfig}
          employees={employees}
          weekRangeText={weekRangeText}
          onExecute={handleExecuteCopy}
        />

        <Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle className={`flex items-center gap-2 ${selectedRequest?.status.toUpperCase() === 'APPROVED' ? 'text-zinc-600' : 'text-orange-600'}`}><CalendarClock className="w-5 h-5" /> {selectedRequest?.status.toUpperCase() === 'APPROVED' ? 'Manage Approved Time Off' : 'Review Request'}</DialogTitle><DialogDescription>Request for {selectedRequest?.user_name}</DialogDescription></DialogHeader>
            {selectedRequest && (<div className="space-y-4 py-2"><div className="bg-muted p-3 rounded-md text-sm space-y-2"><div className="flex justify-between"><span className="text-muted-foreground">Dates:</span><span className="font-mono font-bold">{format(parseISO(selectedRequest.start_date), 'MMM d')} - {format(parseISO(selectedRequest.end_date), 'MMM d')}</span></div><div className="flex justify-between"><span className="text-muted-foreground">Reason:</span><span className="italic">"{selectedRequest.reason || 'No reason provided'}"</span></div></div>{selectedRequest.status.toUpperCase() === 'APPROVED' ? (<div className="pt-2"><div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-3 rounded text-xs text-yellow-800 dark:text-yellow-200 mb-4 flex items-start gap-2"><Info className="w-4 h-4 shrink-0 mt-0.5" /><span>This time off is currently active on the schedule. Revoking it will remove the "OFF" block and allow you to schedule shifts for these dates.</span></div><Button variant="destructive" className="w-full" onClick={handleRevokeTimeOff}><Trash2 className="mr-2 h-4 w-4" /> Revoke Approval & Remove</Button></div>) : (<><div className="space-y-2"><label className="text-xs font-semibold uppercase">Manager Note (Optional)</label><Textarea placeholder="Reason for approval/denial..." value={managerNote} onChange={(e) => setManagerNote(e.target.value)} className="resize-none" /></div><div className="flex gap-2 pt-2"><Button variant="outline" className="flex-1 border-red-200 text-red-600 hover:bg-red-50" onClick={() => submitReview('denied')}><X className="w-4 h-4 mr-2" /> Deny</Button><Button className="flex-1 bg-green-600 hover:bg-green-500" onClick={() => submitReview('approved')}><Check className="w-4 h-4 mr-2" /> Approve</Button></div></>)}</div>)}
          </DialogContent>
        </Dialog>

        <Dialog open={isShiftModalOpen} onOpenChange={setIsShiftModalOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle className="flex items-center justify-between w-full"><span>Shift Details</span>{selectedShiftId && <ChangeLogViewer tableName="employee_schedules" rowId={selectedShiftId} />}</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-2">
               {/* --- CONFLICT RESOLUTION PANEL (v14.5) --- */}
               {conflictShifts.length > 1 && (
                  <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-md p-3 animate-in fade-in slide-in-from-top-2">
                      <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-bold text-xs mb-2">
                         <AlertTriangle className="w-4 h-4" /> 
                         <span>Resolve Conflicts ({conflictShifts.length})</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mb-2">Multiple shifts exist for this day. This causes incorrect hour totals. Delete the duplicates below:</p>
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                          {conflictShifts.map(s => (
                             <div key={s.id} className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded p-2 text-xs shadow-sm">
                                <div>
                                   <span className="font-bold block">{format(parseISO(s.start_time), 'h:mm a')} - {format(parseISO(s.end_time), 'h:mm a')}</span>
                                   <span className="text-[10px] text-muted-foreground">{s.role} {s.task ? `(${s.task})` : ''}</span>
                                </div>
                                <Button 
                                   size="sm" 
                                   variant="destructive" 
                                   className="h-6 w-6 p-0" 
                                   onClick={() => handleResolveConflict(s.id)}
                                   title="Delete this specific shift"
                                >
                                   <Trash2 className="w-3 h-3" />
                                </Button>
                             </div>
                          ))}
                      </div>
                    </div>
                 )}

              <div className="text-sm font-semibold">{selectedEmpName} <span className="font-normal text-muted-foreground">- {selectedDate ? format(parseISO(selectedDate), 'MMM do') : ''}</span></div>
              <div className="grid grid-cols-2 gap-4"><div><label className="text-xs">Start</label><Input type="time" disabled={!isManager} value={formStart} onChange={(e) => { const newStart = e.target.value; setFormStart(newStart); if (newStart && selectedDate) { const startDateTime = parseISO(`${selectedDate}T${newStart}`); const endDateTime = addHours(startDateTime, 8); setFormEnd(format(endDateTime, 'HH:mm')); } }} /></div><div><label className="text-xs">End</label><Input type="time" disabled={!isManager} value={formEnd} onChange={e => setFormEnd(e.target.value)} /></div></div><div><label className="text-xs">Role</label><Select value={formRole} onValueChange={setFormRole} disabled={!isManager}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['Guide', 'Desk', 'Driver', 'Mechanic', 'Manager'].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select></div><div><label className="text-xs">Special Task</label><Select value={formTask} onValueChange={setFormTask} disabled={!isManager}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="NONE">None</SelectItem>{Object.entries(TASKS).map(([key, task]) => (<SelectItem key={key} value={key}><div className="flex items-center gap-2"><div className={`w-3 h-3 ${task.color} rounded-sm`}></div>{task.label}</div></SelectItem>))}</SelectContent></Select></div><div><label className="text-xs">Location</label><Select value={formLocation} onValueChange={setFormLocation} disabled={!isManager}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{hrConfig.map(l => <SelectItem key={l.name} value={l.name}>{l.name}</SelectItem>)}</SelectContent></Select></div></div>
            <DialogFooter className="flex justify-between w-full">{selectedShiftId && isManager ? (<Button variant="destructive" size="sm" onClick={handleDeleteShift}><Trash2 className="w-4 h-4 mr-2" /> Delete</Button>) : <div />}{isManager && <Button size="sm" onClick={handleSaveShift}>Save</Button>}</DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle className="flex items-center justify-between w-full"><span>Edit Employee</span>{profileEmp && <ChangeLogViewer tableName="users" rowId={profileEmp.id} />}</DialogTitle></DialogHeader>
            {profileEmp && (<div className="grid gap-4 py-2"><div className="flex items-center gap-4 border-b pb-4 mb-2"><UserStatusAvatar user={profileEmp} currentUserLevel={currentUserLevel} size="lg" /><div><div className="text-lg font-bold">{profileEmp.full_name}</div><div className="text-xs text-muted-foreground">{profileEmp.email}</div></div></div><div className="grid grid-cols-2 gap-4"><div><label className="text-xs">Location</label><Select value={profileEmp.location} onValueChange={(v) => setProfileEmp({ ...profileEmp, location: v })} disabled={!isManager}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{hrConfig.map(l => <SelectItem key={l.name} value={l.name}>{l.name}</SelectItem>)}</SelectContent></Select></div><div><label className="text-xs">Department</label><Select value={profileEmp.department} onValueChange={(v) => setProfileEmp({ ...profileEmp, department: v })} disabled={!isManager}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(hrConfig.find(l => l.name === profileEmp.location)?.departments || []).map(d => <SelectItem key={d.name} value={d.name}>{d.name}</SelectItem>)}</SelectContent></Select></div></div><div><label className="text-xs">Job Title / Role</label><Select value={profileEmp.job_title} onValueChange={(v) => setProfileEmp({ ...profileEmp, job_title: v })} disabled={!isManager}><SelectTrigger><SelectValue placeholder="Select Role" /></SelectTrigger><SelectContent>{(hrConfig.find(l => l.name === profileEmp.location)?.departments.find(d => d.name === profileEmp.department)?.positions || []).map(p => (<SelectItem key={p.title} value={p.title}>{p.title}</SelectItem>))}</SelectContent></Select></div><div className="grid grid-cols-2 gap-4"><div><label className="text-xs">Hire Date</label><Input type="date" disabled={!isManager} value={profileEmp.hire_date || ''} onChange={(e) => setProfileEmp({ ...profileEmp, hire_date: e.target.value })} /></div><div><label className="text-xs">Phone Number</label><Input type="tel" disabled={!isManager} value={profileEmp.phone || ''} onChange={(e) => setProfileEmp({ ...profileEmp, phone: e.target.value })} /></div></div><div><label className="text-xs">Avatar URL</label><Input type="text" disabled={!isManager} value={profileEmp.avatar_url || ''} onChange={(e) => setProfileEmp({ ...profileEmp, avatar_url: e.target.value })} /></div>{isManager && (<div className="flex items-center justify-between border p-3 rounded bg-slate-50 dark:bg-slate-900/50"><div><h4 className="text-sm font-bold flex items-center gap-2"><Ban className="w-4 h-4 text-red-500" /> Block Timeclock</h4></div><Switch checked={profileEmp.timeclock_blocked} onCheckedChange={(c) => setProfileEmp({ ...profileEmp, timeclock_blocked: c })} disabled={!isManager} /></div>)}{isAdmin && (<div className="bg-red-50 p-3 rounded-md border border-red-100 mt-2"><Button variant="destructive" size="sm" className="w-full" onClick={handleArchiveEmployee}>Archive Employee</Button></div>)}</div>)}
            <DialogFooter><Button variant="outline" onClick={() => setIsProfileModalOpen(false)}>Cancel</Button>{isManager && <Button onClick={handleSaveProfile}>Save</Button>}</DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}