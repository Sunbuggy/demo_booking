'use client';

// ============================================================================
// SUNBUGGY ROSTER PAGE
// ============================================================================
// Purpose: Main schedule dashboard for managers and staff.
// Features: 
// - Visual Roster with Avatars and Live Clock-in Status
// - Weekly Calendar View (Desktop) & Daily List View (Mobile)
// - Integrated Weather Forecast (Cached via Supabase)
// - Shift Management (Create, Edit, Delete, Copy Week)
// - Employee Profile Management (Edit Info, Archive)
// - Audit Logging for all changes
// ============================================================================

import { useState, useEffect, Fragment, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
// Ensure app/actions/weather.ts exists. This handles the API calls securely.
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
    Sun, Cloud, CloudRain, Snowflake, CloudLightning, Wind
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

// ============================================================================
// 1. STRICT TYPE DEFINITIONS
// ============================================================================

/** Employee: Maps to the 'users' table in Supabase */
interface Employee {
  id: string;
  full_name: string;
  location: string;
  department: string;
  hire_date: string | null;
  user_level: number;
  timeclock_blocked: boolean;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
}

/** Shift: Maps to 'employee_schedules' table */
interface Shift {
  id: string;
  user_id: string;
  start_time: string; // ISO String (e.g. 2025-01-01T09:00:00Z)
  end_time: string;   // ISO String
  role: string;
  location?: string;
}

/** AuditLog: Maps to 'audit_logs' table for tracking history */
interface AuditLog {
  id: string;
  created_at: string;
  action: string;
  user_id: string;
  table_name: string;
  row: string;
  actor_name?: string; // Joined field (not in DB table directly)
}

// Configuration: Maps Locations to their specific Department lists
const LOCATIONS: Record<string, string[]> = {
  'Las Vegas': ['OFFICE', 'SHUTTLES', 'DUNES', 'SHOP'],
  'Pismo': ['ADMIN', 'CSR', 'SHOP', 'BEACH'],
  'Michigan': ['ADMIN', 'SHOP', 'GUIDES', 'OFFICE']
};

// ============================================================================
// 2. HELPER COMPONENTS
// ============================================================================

/**
 * Renders user avatar with live status indicator.
 * Fallback to initials if no image is provided.
 */
const UserAvatar = ({ emp, isOnline, size = 'md' }: { emp: Employee, isOnline: boolean, size?: 'sm'|'md'|'lg' }) => {
    const dims = size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-16 h-16' : 'w-10 h-10';
    const fontSize = size === 'sm' ? 'text-[10px]' : size === 'lg' ? 'text-lg' : 'text-xs';
    
    // Calculate initials safely
    const initials = emp.full_name 
        ? emp.full_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() 
        : '??';

    return (
        <div className="relative inline-block">
            <div className={`${dims} rounded-full overflow-hidden bg-slate-200 border border-slate-300 flex items-center justify-center relative`}>
                {emp.avatar_url ? (
                    <Image 
                        src={emp.avatar_url} 
                        alt={emp.full_name} 
                        fill 
                        className="object-cover" 
                        sizes="(max-width: 768px) 100vw, 33vw"
                    />
                ) : (
                    <span className={`font-bold text-slate-500 ${fontSize}`}>{initials}</span>
                )}
            </div>
            {/* Green Dot = Clocked In, Grey Dot = Clocked Out */}
            <span 
                className={`absolute bottom-0 right-0 block h-3 w-3 rounded-full ring-2 ring-white ${isOnline ? 'bg-green-500' : 'bg-slate-300'}`} 
                title={isOnline ? "Clocked In" : "Clocked Out"}
            />
        </div>
    );
};

/**
 * Renders a mini weather forecast cell.
 * Translates WMO Weather Codes into visual Icons.
 */
const WeatherCell = ({ data }: { data: DailyWeather | undefined }) => {
    if (!data) return <div className="text-[10px] text-muted-foreground h-full flex items-center justify-center">-</div>;

    let Icon = Sun;
    let color = "text-yellow-500";

    // WMO Code Interpretation (Standard Codes)
    if (data.code >= 1 && data.code <= 3) { Icon = Cloud; color = "text-gray-400"; }
    else if (data.code >= 45 && data.code <= 48) { Icon = Wind; color = "text-blue-300"; }
    else if (data.code >= 51 && data.code <= 67) { Icon = CloudRain; color = "text-blue-500"; }
    else if (data.code >= 71 && data.code <= 77) { Icon = Snowflake; color = "text-cyan-400"; }
    else if (data.code >= 95) { Icon = CloudLightning; color = "text-purple-500"; }

    // Business Logic: High heat affects dune buggies!
    const isExtremeHeat = data.max_temp >= 105;
    const isExtremeCold = data.max_temp <= 40;

    return (
        <div className="flex flex-col items-center justify-center h-full w-full py-1 gap-0.5" title={`${data.min_temp}° - ${data.max_temp}°`}>
            <div className="flex items-center gap-1">
                <Icon className={`w-3.5 h-3.5 ${color}`} />
                <span className={`text-[11px] font-bold ${isExtremeHeat ? 'text-red-600' : isExtremeCold ? 'text-blue-600' : 'text-slate-700 dark:text-slate-300'}`}>
                    {data.max_temp}°
                </span>
            </div>
            {/* Show precipitation chance only if significant (>20%) */}
            {data.precip_chance > 20 && (
                <div className="text-[9px] text-blue-500 font-semibold bg-blue-50 dark:bg-blue-900/30 px-1 rounded-sm">
                    {data.precip_chance}%
                </div>
            )}
        </div>
    );
};

// ============================================================================
// 3. MAIN PAGE COMPONENT
// ============================================================================

export default function RosterPage() {
  const supabase = createClient();
  const [isMounted, setIsMounted] = useState(false);

  // --- APP STATE ---
  const [currentDate, setCurrentDate] = useState(moment());
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');
  
  // Data Containers
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [liveStatus, setLiveStatus] = useState<Record<string, boolean>>({}); // Map UserID -> Boolean
  const [weatherData, setWeatherData] = useState<Record<string, DailyWeather[]>>({}); // Map Location -> Forecast[]
  
  // Permissions & Auth
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [currentUserLevel, setCurrentUserLevel] = useState<number>(0);

  // UI Toggles & Forms
  const [loading, setLoading] = useState(true);
  const [copying, setCopying] = useState(false);
  const [visibleLocs, setVisibleLocs] = useState<Record<string, boolean>>({
      'Las Vegas': true, 'Pismo': true, 'Michigan': true
  });
  // Optimization: Remember last role used per employee to speed up scheduling
  const [lastRoles, setLastRoles] = useState<Record<string, string>>({});

  // Modals
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState<string>('');
  const [selectedEmpName, setSelectedEmpName] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);
  
  // Shift Form
  const [formRole, setFormRole] = useState('Guide');
  const [formStart, setFormStart] = useState('09:00');
  const [formEnd, setFormEnd] = useState('17:00');
  const [formLocation, setFormLocation] = useState('Las Vegas');
  
  // Profile Form
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileEmp, setProfileEmp] = useState<Employee | null>(null);

  // Logging
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Calculated Dates
  const startOfWeek = currentDate.clone().startOf('isoWeek');
  const weekDays = Array.from({ length: 7 }, (_, i) => startOfWeek.clone().add(i, 'days'));

  // Role Access
  const isManager = currentUserLevel >= 500;
  const isAdmin = currentUserLevel >= 900;

  // ==========================================================================
  // 4. DATA FETCHING
  // ==========================================================================

  // Hydration fix & Load Settings
  useEffect(() => {
      setIsMounted(true);
      const saved = localStorage.getItem('roster_filters');
      if (saved) try { setVisibleLocs(JSON.parse(saved)); } catch (e) { console.error(e); }
      if (window.innerWidth < 768) setViewMode('day');
  }, []);

  // Fetch data when date changes
  useEffect(() => { 
      if (isMounted) fetchData(); 
  }, [currentDate, isMounted]);

  const fetchData = async () => {
    setLoading(true);
    
    // 1. Authenticate User
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        setCurrentUserId(user.id);
        const { data: userData } = await supabase.from('users').select('user_level').eq('id', user.id).single();
        if (userData) setCurrentUserLevel(userData.user_level || 0);
    }

    // 2. Fetch Employees (Filtered to Active Staff)
    const { data: empData } = await supabase
        .from('users')
        .select('id, full_name, location, department, hire_date, user_level, timeclock_blocked, email, phone, avatar_url')
        .gte('user_level', 300) // Only staff level 300+
        .order('full_name'); 

    if (empData) {
        const cleanEmps = empData.map(e => ({ 
            ...e, 
            location: e.location || 'Las Vegas', 
            department: e.department || 'General', 
            timeclock_blocked: e.timeclock_blocked || false 
        }));
        // Sort by Hire Date (Seniority)
        cleanEmps.sort((a, b) => {
            if (!a.hire_date) return 1; if (!b.hire_date) return -1;
            return new Date(a.hire_date).getTime() - new Date(b.hire_date).getTime();
        });
        setEmployees(cleanEmps);
    }
    
    // 3. Fetch Shifts (Within visible week)
    const startIso = startOfWeek.toISOString();
    const endIso = startOfWeek.clone().endOf('isoWeek').toISOString();
    
    const { data: shiftData } = await supabase
        .from('employee_schedules')
        .select('*')
        .gte('start_time', startIso)
        .lte('start_time', endIso);
    
    if (shiftData) setShifts(shiftData);

    // 4. Fetch Live Status (Who is clocked in NOW?)
    const knownLocations = Object.keys(LOCATIONS);
    const { data: activeEntries } = await supabase
        .from('time_entries')
        .select('user_id, employee_id')
        .in('location', knownLocations)
        .is('clock_out', null); // Active = No clock out time

    if (activeEntries) {
        const statusMap: Record<string, boolean> = {};
        activeEntries.forEach((entry: {user_id?: string; employee_id?: string}) => {
            const uid = entry.user_id || entry.employee_id;
            if (uid) statusMap[uid] = true;
        });
        setLiveStatus(statusMap);
    }

    // 5. FETCH WEATHER DATA (FIXED)
    // We fetch weather for all visible locations in parallel.
    const weatherUpdates: Record<string, DailyWeather[]> = {};
    
    await Promise.all(Object.keys(LOCATIONS).map(async (loc) => {
        if (!visibleLocs[loc]) return;
        
        // [FIX]: Ensure date format is YYYY-MM-DD for the weather API
        // Previously this was sending an ISO string which caused the error.
        const weatherDate = viewMode === 'week' 
            ? startOfWeek.format('YYYY-MM-DD') 
            : currentDate.format('YYYY-MM-DD');
            
        const daysToFetch = viewMode === 'week' ? 7 : 1;

        try {
            // Call the server action
            const data = await getLocationWeather(loc, weatherDate, daysToFetch);
            
            if (data && data.length > 0) {
                weatherUpdates[loc] = data;
            }
        } catch (e) {
            console.error(`❌ Weather fetch failed for ${loc}`, e);
        }
    }));
    
    console.log("🌤️ [Weather Debug] State:", weatherUpdates);
    setWeatherData(weatherUpdates);

    setLoading(false);
  };

  // ==========================================================================
  // 5. AUDIT & LOGGING ACTIONS
  // ==========================================================================

  const fetchLogs = async (tableName: string, rowId: string) => {
      setLoadingLogs(true);
      const { data: logs, error } = await supabase
          .from('audit_logs')
          .select('id, created_at, action, user_id, table_name, row')
          .eq('table_name', tableName)
          .eq('row', rowId)
          .order('created_at', { ascending: false });

      if (!error && logs) {
          // Resolve actor names (who performed the action)
          const actorIds = [...new Set(logs.map(l => l.user_id))];
          const { data: actors } = await supabase.from('users').select('id, full_name').in('id', actorIds);
          
          const enrichedLogs = logs.map(log => ({
              ...log,
              actor_name: actors?.find(a => a.id === log.user_id)?.full_name || 'Unknown'
          }));
          setAuditLogs(enrichedLogs);
      }
      setLoadingLogs(false);
  };

  const logChange = async (action: string, table: string, rowId: string) => {
      if (!currentUserId) return;
      await supabase.from('audit_logs').insert({
          action: action,
          table_name: table,
          row: rowId,
          user_id: currentUserId
      });
  };

  // ==========================================================================
  // 6. EVENT HANDLERS (Shifts & Profiles)
  // ==========================================================================

  // Opens the shift modal for editing or creating
  const handleCellClick = (emp: Employee, dateStr: string, existingShift?: Shift) => {
    setSelectedEmpId(emp.id); 
    setSelectedEmpName(emp.full_name); 
    setSelectedDate(dateStr);
    
    if (existingShift) {
      setSelectedShiftId(existingShift.id); 
      setFormRole(existingShift.role); 
      setFormLocation(existingShift.location || emp.location);
      setFormStart(moment(existingShift.start_time).format('HH:mm')); 
      setFormEnd(moment(existingShift.end_time).format('HH:mm'));
    } else {
      setSelectedShiftId(null); 
      // Default to last used role for this employee (UX Optimization)
      setFormRole(lastRoles[emp.id] || 'Guide'); 
      setFormLocation(emp.location); 
      setFormStart('09:00'); 
      setFormEnd('17:00');
    }
    setIsShiftModalOpen(true);
  };

  // Persists Shift Data
  const handleSaveShift = async () => {
    if (!isManager) return;
    
    const startDateTime = moment(`${selectedDate} ${formStart}`, 'YYYY-MM-DD HH:mm').toISOString();
    const endDateTime = moment(`${selectedDate} ${formEnd}`, 'YYYY-MM-DD HH:mm').toISOString();
    
    const payload = { 
        user_id: selectedEmpId, 
        start_time: startDateTime, 
        end_time: endDateTime, 
        role: formRole, 
        location: formLocation 
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
    setLastRoles(prev => ({ ...prev, [selectedEmpId]: formRole })); 
    
    fetchData(); 
    setIsShiftModalOpen(false); 
    toast.success("Saved");
  };

  // Deletes a Shift
  const handleDeleteShift = async () => {
    if (!isManager || !selectedShiftId) return;
    await logChange(`Deleted shift`, 'employee_schedules', selectedShiftId);
    await supabase.from('employee_schedules').delete().eq('id', selectedShiftId); 
    toast.success("Deleted"); 
    fetchData(); 
    setIsShiftModalOpen(false);
  };

  // Batch Operation: Copy previous week
  const handleCopyWeek = async () => {
      if (!isManager) return;
      if (shifts.length === 0) { toast.error("No shifts"); return; }
      const targetStart = startOfWeek.clone().add(1, 'week').format('MMM Do');
      
      if (!confirm(`Copy ${shifts.length} shifts to next week (${targetStart})?`)) return;
      
      setCopying(true);
      const newShifts = shifts.map(s => ({ 
          user_id: s.user_id, 
          role: s.role, 
          // Shift date forward by 7 days
          start_time: moment(s.start_time).add(7, 'days').toISOString(), 
          end_time: moment(s.end_time).add(7, 'days').toISOString(), 
          location: s.location || 'Las Vegas' 
      }));
      
      const { error } = await supabase.from('employee_schedules').insert(newShifts);
      setCopying(false); 
      
      if (error) toast.error("Failed"); 
      else { 
          await logChange(`Copied ${newShifts.length} shifts to next week`, 'employee_schedules', 'BULK_COPY');
          toast.success("Copied!"); 
          setCurrentDate(currentDate.clone().add(1, 'week')); 
      }
  };

  // Update Employee Profile
  const handleSaveProfile = async () => {
      if (!isManager || !profileEmp) return;
      const { error } = await supabase.from('users').update({ 
          hire_date: profileEmp.hire_date, 
          location: profileEmp.location, 
          department: profileEmp.department, 
          timeclock_blocked: profileEmp.timeclock_blocked,
          phone: profileEmp.phone,
          avatar_url: profileEmp.avatar_url 
      }).eq('id', profileEmp.id);
      
      if (error) toast.error("Failed"); 
      else { 
          await logChange(`Updated profile`, 'users', profileEmp.id);
          toast.success("Saved"); 
          fetchData(); 
          setIsProfileModalOpen(false); 
      }
  };

  // Soft Delete Employee
  const handleArchiveEmployee = async () => {
      if (!isAdmin || !profileEmp) return;
      if (!confirm(`Archive ${profileEmp.full_name}?`)) return;

      const { error } = await supabase.from('users').update({ user_level: 100 }).eq('id', profileEmp.id);
      if (error) {
          toast.error("Failed to archive");
      } else {
          await logChange(`Archived Employee`, 'users', profileEmp.id);
          toast.success("Employee Archived");
          fetchData();
          setIsProfileModalOpen(false);
      }
  };

  // ==========================================================================
  // 7. RENDERING HELPERS
  // ==========================================================================

  // Memoized Grouping: sorts employees into Location -> Dept buckets
  const groupedEmployees = useMemo(() => {
      const groups: Record<string, Record<string, Employee[]>> = {};
      
      // Initialize buckets
      Object.keys(LOCATIONS).forEach(loc => {
          groups[loc] = {}; 
          LOCATIONS[loc].forEach(dept => { groups[loc][dept] = []; });
          groups[loc]['Visiting Staff'] = [];
      });
      groups['Unassigned'] = { 'General': [] };
      
      // Sort Employees
      employees.forEach(emp => {
          const loc = LOCATIONS[emp.location] ? emp.location : 'Unassigned';
          let dept = emp.department;
          // Fallback if department doesn't match location config
          if (loc !== 'Unassigned' && !groups[loc][dept]) dept = Object.keys(groups[loc])[0];
          if (loc === 'Unassigned') dept = 'General';
          
          if (!groups[loc][dept]) groups[loc][dept] = [];
          groups[loc][dept].push(emp);
      });
      
      // Add 'Visiting Staff' if scheduled outside home location
      shifts.forEach(shift => {
          const emp = employees.find(e => e.id === shift.user_id);
          if (!emp) return;
          if (shift.location && shift.location !== emp.location && groups[shift.location]) {
              const targetLoc = shift.location; 
              const visitingBucket = groups[targetLoc]['Visiting Staff'];
              if (!visitingBucket.find(v => v.id === emp.id)) visitingBucket.push(emp);
          }
      });
      return groups;
  }, [employees, shifts]);

  // Shows history of a shift or user
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
                        {loadingLogs ? (
                            <div className="flex justify-center p-4"><Loader2 className="w-4 h-4 animate-spin"/></div>
                        ) : auditLogs.length === 0 ? (
                            <div className="text-xs text-muted-foreground text-center p-2">No history found.</div>
                        ) : (
                            <div className="space-y-3">
                                {auditLogs.map(log => (
                                    <div key={log.id} className="text-xs border-b pb-2 last:border-0">
                                        <div className="font-bold">{log.action}</div>
                                        <div className="text-muted-foreground flex justify-between mt-1">
                                            <span>{log.actor_name}</span>
                                            <span>{moment(log.created_at).format('MM/DD HH:mm')}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </div>
            </PopoverContent>
        </Popover>
      );
  };

  const getHours = (start: string, end: string) => moment.duration(moment(end).diff(moment(start))).asHours();
  
  const sumWeeklyHours = (shiftList: Shift[]) => {
      const weekStart = startOfWeek.toISOString();
      const weekEnd = startOfWeek.clone().endOf('isoWeek').toISOString();
      const relevantShifts = shiftList.filter(s => s.start_time >= weekStart && s.start_time <= weekEnd);
      return relevantShifts.reduce((acc, s) => acc + getHours(s.start_time, s.end_time), 0).toFixed(1);
  };

  if (!isMounted) return null;

  return (
    <div className="p-4 h-screen flex flex-col bg-background text-foreground">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col gap-4 mb-4">
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
                  {viewMode === 'week' && isManager && (
                    <Button variant="secondary" size="sm" onClick={handleCopyWeek} disabled={copying || shifts.length === 0} className="hidden md:flex">
                        {copying ? <Loader2 className="w-3 h-3 animate-spin" /> : <Copy className="w-3 h-3 mr-2" />} Copy Week
                    </Button>
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

      {/* --- CONTENT AREA --- */}
      <div className="flex-1 overflow-auto border rounded-lg shadow-sm bg-card">
        
        {/* --- WEEK VIEW (TABLE) --- */}
        {viewMode === 'week' && (
        <table className="w-full border-collapse min-w-[1000px] text-sm">
          <thead className="sticky top-0 bg-muted z-20 shadow-sm">
            <tr>
                <th className="p-2 text-left w-64 border-b font-bold text-muted-foreground bg-muted pl-4">Staff</th>
                {weekDays.map(day => (
                    <th key={day.toString()} className="p-2 text-center border-b min-w-[100px] border-l bg-muted">
                        <div className="font-semibold">{day.format('ddd')}</div>
                        <div className="text-[10px] text-muted-foreground">{day.format('MMM D')}</div>
                    </th>
                ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(groupedEmployees).map(([locName, departments]) => {
                if (!visibleLocs[locName]) return null;
                // Only show if there are employees (or if you want to show empty locations, remove this check)
                if (!Object.values(departments).some(arr => arr.length > 0)) return null;

                const allEmpIdsInLoc = Object.values(departments).flat().map(e => e.id);
                const locShifts = shifts.filter(s => (s.location === locName) || (!s.location && allEmpIdsInLoc.includes(s.user_id)));
                
                // Get weather data for this location
                const locWeather = weatherData[locName] || [];

                return (
                    <Fragment key={locName}>
                    {/* Location Header Row */}
                    <tr className="bg-slate-900 text-white">
                        <td className="p-2 font-bold uppercase tracking-wider text-xs border-b border-slate-700 sticky left-0 z-10 bg-slate-900">
                            <div className="flex justify-between items-center">
                                <span><MapPin className="w-3 h-3 inline mr-2" /> {locName}</span>
                                <span className="bg-slate-800 text-[10px] px-1.5 py-0.5 rounded text-slate-200">{sumWeeklyHours(locShifts)}h</span>
                            </div>
                        </td>
                        {weekDays.map(d => <td key={d.toString()} className="border-l border-slate-700 bg-slate-900"></td>)}
                    </tr>

                    {/* --- WEATHER ROW (FIXED & VISIBLE) --- */} 
                    <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 h-12">
                        <td className="p-2 text-[10px] font-semibold text-muted-foreground uppercase border-r sticky left-0 z-10 bg-slate-50 dark:bg-slate-900">
                            Forecast
                        </td>
                        {weekDays.map(day => {
                            const dateStr = day.format('YYYY-MM-DD');
                            const dayData = locWeather.find(w => w.date === dateStr);
                            return (
                                <td key={dateStr} className="border-l p-0 text-center">
                                    <WeatherCell data={dayData} />
                                </td>
                            );
                        })}
                    </tr>

                    {/* Departments Loop */}
                    {Object.entries(departments).map(([deptName, deptEmps]) => {
                        if (deptEmps.length === 0) return null;
                        const isVisiting = deptName === 'Visiting Staff';
                        
                        return (
                            <Fragment key={`${locName}-${deptName}`}>
                            <tr className={isVisiting ? 'bg-amber-50 dark:bg-amber-950/30' : 'bg-slate-100 dark:bg-slate-800'}>
                                <td className={`p-1 pl-4 font-semibold text-xs uppercase border-b sticky left-0 z-10 ${isVisiting ? 'text-amber-600' : 'text-slate-500'}`}>
                                    <div className="flex justify-between items-center pr-2">
                                        <span>{isVisiting && <Plane className="w-3 h-3 inline mr-1 mb-0.5" />} {deptName}</span>
                                    </div>
                                </td>
                                {weekDays.map(d => <td key={d.toString()} className="border-l border-b bg-inherit" />)}
                            </tr>

                            {/* Employees Loop */}
                            {deptEmps.map(emp => {
                                const empShifts = shifts.filter(s => s.user_id === emp.id);
                                return (
                                <tr key={`${locName}-${emp.id}`} className="hover:bg-muted/20 transition-colors border-b">
                                    <td className="p-0 border-r border-r-slate-100 dark:border-r-slate-800 sticky left-0 z-10 bg-card">
                                        <div className="p-2 w-64 cursor-pointer flex flex-row items-center h-full gap-3" 
                                             onClick={(e) => { e.stopPropagation(); setProfileEmp(emp); setIsProfileModalOpen(true); }}>
                                            <div className="flex-shrink-0"><UserAvatar emp={emp} isOnline={liveStatus[emp.id]} /></div>
                                            <div className="flex flex-col min-w-0 flex-1">
                                                <div className="font-medium flex items-center gap-1">
                                                    <span className={`truncate ${isVisiting ? "italic text-amber-700" : ""}`}>{emp.full_name}</span>
                                                    {emp.timeclock_blocked && <Ban className="w-3 h-3 text-red-500 flex-shrink-0" />}
                                                </div>
                                                <div className="flex items-center justify-between mt-0.5">
                                                    <div onClick={(e) => e.stopPropagation()}><ContactMenu user={emp} iconOnly={true} size="xs" /></div>
                                                    {Number(sumWeeklyHours(empShifts)) > 0 && 
                                                        <span className="text-[10px] bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-200 px-1.5 rounded-sm font-mono">{sumWeeklyHours(empShifts)}h</span>
                                                    }
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    {weekDays.map(day => {
                                        const dateStr = day.format('YYYY-MM-DD');
                                        const shift = shifts.find(s => s.user_id === emp.id && moment(s.start_time).format('YYYY-MM-DD') === dateStr);
                                        const shouldRender = shift && (!isVisiting || shift.location === locName);
                                        const isAway = shift && shift.location !== emp.location && !isVisiting;
                                        
                                        return (
                                            <td key={dateStr} className={`p-1 border-l relative h-14 ${isManager ? 'cursor-pointer group' : ''}`} onClick={() => isManager && handleCellClick(emp, dateStr, shift)}>
                                                {shouldRender ? (
                                                    <div className={`h-full w-full border-l-2 rounded-r p-1 flex flex-col justify-center ${isAway ? 'bg-amber-50 border-l-amber-500' : 'bg-blue-100 border-l-blue-500 dark:bg-blue-900'}`}>
                                                        <span className="font-bold text-foreground text-xs leading-none mb-0.5">{moment(shift.start_time).format('h:mmA')}</span>
                                                        <span className="text-[10px] text-muted-foreground leading-none">- {moment(shift.end_time).format('h:mmA')}</span>
                                                        {isAway && <div className="text-[9px] font-bold text-amber-700 mt-1 uppercase"><Plane className="w-2 h-2 inline" /> {shift.location}</div>}
                                                    </div>
                                                ) : (!isVisiting && isManager && <div className="h-full w-full flex items-center justify-center opacity-0 group-hover:opacity-100"><Plus className="w-4 h-4 text-muted-foreground/30" /></div>)}
                                            </td>
                                        );
                                    })}
                                </tr>
                            )})}
                            </Fragment>
                        );
                    })}
                    </Fragment>
                );
            })}
          </tbody>
        </table>
        )}

        {/* --- DAY VIEW (LIST) --- */}
        {viewMode === 'day' && (
            <div className="p-4 space-y-6">
                {Object.entries(groupedEmployees).map(([locName, departments]) => {
                    if (!visibleLocs[locName]) return null;
                    
                    const activeDepts = Object.entries(departments).filter(([deptName, emps]) => {
                        const dateStr = currentDate.format('YYYY-MM-DD');
                        return emps.some(emp => {
                            const shift = shifts.find(s => s.user_id === emp.id && moment(s.start_time).format('YYYY-MM-DD') === dateStr);
                            if(!shift) return false;
                            const isVisiting = deptName === 'Visiting Staff';
                            if (isVisiting && shift.location !== locName) return false;
                            return true;
                        });
                    });

                    if (activeDepts.length === 0) return null;

                    // Get Today's Weather for Card Header
                    const todayWeather = weatherData[locName]?.find(w => w.date === currentDate.format('YYYY-MM-DD'));

                    return (
                        <div key={locName} className="border rounded-lg overflow-hidden bg-card shadow-sm">
                            <div className="bg-slate-900 text-white p-3 font-bold uppercase flex justify-between items-center">
                                <div className="flex items-center">
                                    <MapPin className="w-4 h-4 inline mr-2" /> {locName}
                                </div>
                                {/* NEW: Weather Badge for Mobile */}
                                {todayWeather && (
                                    <div className="flex items-center gap-2 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
                                        <WeatherCell data={todayWeather} />
                                    </div>
                                )}
                            </div>
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {activeDepts.map(([deptName, deptEmps]) => (
                                    <div key={deptName} className="p-0">
                                        <div className="bg-muted/50 px-3 py-1.5 text-xs font-bold uppercase text-muted-foreground tracking-wider border-b">
                                            {deptName === 'Visiting Staff' && <Plane className="w-3 h-3 inline mr-1" />} {deptName}
                                        </div>
                                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {deptEmps.map(emp => {
                                                const dateStr = currentDate.format('YYYY-MM-DD');
                                                const shift = shifts.find(s => s.user_id === emp.id && moment(s.start_time).format('YYYY-MM-DD') === dateStr);
                                                
                                                if (!shift) return null;
                                                const isVisiting = deptName === 'Visiting Staff';
                                                if (isVisiting && shift.location !== locName) return null;
                                                const isAway = shift.location && shift.location !== emp.location && !isVisiting;

                                                return (
                                                    <div key={emp.id} className="flex items-center justify-between p-3 hover:bg-muted/10 cursor-pointer" 
                                                         onClick={() => isManager && handleCellClick(emp, dateStr, shift)}>
                                                        <div className="flex items-center gap-3">
                                                            <UserAvatar emp={emp} isOnline={liveStatus[emp.id]} />
                                                            <div>
                                                                <div className="font-semibold text-sm flex items-center gap-2">
                                                                    <span className={isVisiting ? "italic text-amber-700 dark:text-amber-500" : ""}>{emp.full_name}</span>
                                                                    <div onClick={(e)=>e.stopPropagation()}><ContactMenu user={emp} iconOnly={true} /></div>
                                                                </div>
                                                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                                    <Badge variant="outline" className="text-[10px] h-5 px-1">{shift.role}</Badge>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="font-mono font-bold text-sm bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-100 px-2 py-1 rounded border border-blue-100 dark:border-blue-900">
                                                                {moment(shift.start_time).format('h:mm A')} - {moment(shift.end_time).format('h:mm A')}
                                                            </div>
                                                            {isAway && <div className="text-[10px] text-amber-600 dark:text-amber-500 font-bold mt-1 uppercase"><Plane className="w-3 h-3 inline" /> {shift.location}</div>}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
                {/* Fallback if no one is scheduled today */}
                {!Object.entries(groupedEmployees).some(([loc, departments]) => {
                    if (!visibleLocs[loc]) return false;
                    return Object.entries(departments).some(([_, emps]) => {
                        const dateStr = currentDate.format('YYYY-MM-DD');
                        return emps.some(emp => shifts.some(s => s.user_id === emp.id && moment(s.start_time).format('YYYY-MM-DD') === dateStr));
                    });
                }) && (
                    <div className="text-center py-12 text-muted-foreground bg-card border rounded-lg border-dashed">
                        <Clock className="w-10 h-10 mx-auto mb-2 opacity-20" />
                        <p>No shifts scheduled for {currentDate.format('MMM Do')}</p>
                        <Button variant="link" size="sm" onClick={() => setViewMode('week')}>Switch to Week View</Button>
                    </div>
                )}
            </div>
        )}

      </div>

      {/* --- SHIFT MODAL --- */}
      <Dialog open={isShiftModalOpen} onOpenChange={setIsShiftModalOpen}>
        <DialogContent className="max-w-sm">
            <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                    <span>Shift Details</span>
                    {selectedShiftId && <ChangeLogViewer tableName="employee_schedules" rowId={selectedShiftId} />}
                </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-2">
                <div className="text-sm font-semibold">{selectedEmpName} <span className="font-normal text-muted-foreground">- {moment(selectedDate).format('MMM Do')}</span></div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs">Start</label>
                        <Input type="time" disabled={!isManager} value={formStart} 
                               onChange={(e) => {setFormStart(e.target.value); if(e.target.value) setFormEnd(moment(e.target.value, 'HH:mm').add(8, 'hours').format('HH:mm'));}} />
                    </div>
                    <div>
                        <label className="text-xs">End</label>
                        <Input type="time" disabled={!isManager} value={formEnd} onChange={e => setFormEnd(e.target.value)} />
                    </div>
                </div>
                <div>
                    <label className="text-xs">Role</label>
                    <Select value={formRole} onValueChange={setFormRole} disabled={!isManager}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{['Guide','Desk','Driver','Mechanic','Manager'].map(r=><SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
                <div>
                    <label className="text-xs">Location</label>
                    <Select value={formLocation} onValueChange={setFormLocation} disabled={!isManager}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{Object.keys(LOCATIONS).map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
            </div>
            <DialogFooter className="flex justify-between w-full">
                {selectedShiftId && isManager ? <Button variant="destructive" size="sm" onClick={handleDeleteShift}><Trash2 className="w-4 h-4 mr-2" /> Delete</Button> : <div/>}
                {isManager && <Button size="sm" onClick={handleSaveShift}>Save</Button>}
            </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* --- PROFILE MODAL --- */}
      <Dialog open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen}>
        <DialogContent className="max-w-md">
            <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                    <span>Edit Employee</span>
                    {profileEmp && <ChangeLogViewer tableName="users" rowId={profileEmp.id} />}
                </DialogTitle>
            </DialogHeader>
            {profileEmp && (
            <div className="grid gap-4 py-2">
                <div className="flex items-center gap-4 border-b pb-4 mb-2">
                    <UserAvatar emp={profileEmp} isOnline={liveStatus[profileEmp.id]} size="lg" />
                    <div>
                        <div className="text-lg font-bold">{profileEmp.full_name}</div>
                        <div className="text-xs text-muted-foreground">{profileEmp.email}</div>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs">Location</label>
                        <Select value={profileEmp.location} onValueChange={(v)=>setProfileEmp({...profileEmp,location:v})} disabled={!isManager}>
                            <SelectTrigger><SelectValue/></SelectTrigger>
                            <SelectContent>{Object.keys(LOCATIONS).map(l=><SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div>
                        <label className="text-xs">Department</label>
                        <Select value={profileEmp.department} onValueChange={(v)=>setProfileEmp({...profileEmp,department:v})} disabled={!isManager}>
                            <SelectTrigger><SelectValue/></SelectTrigger>
                            <SelectContent>{(LOCATIONS[profileEmp.location as keyof typeof LOCATIONS]||[]).map(d=><SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                </div>
                <div><label className="text-xs">Hire Date</label><Input type="date" disabled={!isManager} value={profileEmp.hire_date||''} onChange={(e)=>setProfileEmp({...profileEmp,hire_date:e.target.value})} /></div>
                <div><label className="text-xs">Phone Number</label><Input type="tel" disabled={!isManager} value={profileEmp.phone || ''} onChange={(e) => setProfileEmp({...profileEmp, phone: e.target.value})} /></div>
                <div><label className="text-xs">Avatar URL</label><Input type="text" disabled={!isManager} value={profileEmp.avatar_url || ''} onChange={(e) => setProfileEmp({...profileEmp, avatar_url: e.target.value})} /></div>
                {isManager && (
                    <div className="flex items-center justify-between border p-3 rounded bg-slate-50 dark:bg-slate-900/50">
                        <div><h4 className="text-sm font-bold flex items-center gap-2"><Ban className="w-4 h-4 text-red-500"/> Block Timeclock</h4></div>
                        <Switch checked={profileEmp.timeclock_blocked} onCheckedChange={(c)=>setProfileEmp({...profileEmp,timeclock_blocked:c})} disabled={!isManager} />
                    </div>
                )}
                {isAdmin && (
                    <div className="bg-red-50 p-3 rounded-md border border-red-100 mt-2">
                        <Button variant="destructive" size="sm" className="w-full" onClick={handleArchiveEmployee}>Archive Employee</Button>
                    </div>
                )}
            </div>
            )}
            <DialogFooter>
                <Button variant="outline" onClick={()=>setIsProfileModalOpen(false)}>Cancel</Button>
                {isManager && <Button onClick={handleSaveProfile}>Save</Button>}
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}