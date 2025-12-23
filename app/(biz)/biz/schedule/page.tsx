'use client';

// ============================================================================
// SUNBUGGY ROSTER PAGE
// ============================================================================
// Purpose: A comprehensive Schedule and HR management dashboard.
// Access Control: 
//   - Admin (900+): Full Access + Archive.
//   - Manager (500+): Schedule Editing, Profile Editing.
//   - Employee (<500): Read-only view.
// ============================================================================

import { useState, useEffect, Fragment, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client'; // Client-side Supabase instance
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
    Table as TableIcon, Info, History
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
// 1. TYPE DEFINITIONS
// ============================================================================
// Defining strict interfaces ensures we don't access properties that don't exist.

/** Represents a user/employee fetched from the 'users' table */
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

/** Represents a scheduled shift from 'employee_schedules' */
interface Shift {
  id: string;
  user_id: string;
  start_time: string; // Stored as ISO Strings in DB
  end_time: string;
  role: string;
  location?: string;
}

/** Represents an entry in the 'audit_logs' table for tracking changes */
interface AuditLog {
  id: string;
  created_at: string;
  action: string;
  user_id: string; // The ID of the person who MADE the change
  table_name: string;
  row: string; // The ID of the record that was changed
  actor_name?: string; // We manually join this to show "Who did it"
}

// Configuration: Maps Locations to their specific Departments
const LOCATIONS = {
  'Las Vegas': ['OFFICE', 'SHUTTLES', 'DUNES', 'SHOP'],
  'Pismo': ['ADMIN', 'CSR', 'SHOP', 'BEACH'],
  'Michigan': ['ADMIN', 'SHOP', 'GUIDES', 'OFFICE']
};

// ============================================================================
// 2. HELPER COMPONENTS (Small reusable UI parts)
// ============================================================================

/**
 * Renders the Employee Avatar with a green/grey dot indicating live clock-in status.
 */
const UserAvatar = ({ emp, isOnline, size = 'md' }: { emp: Employee, isOnline: boolean, size?: 'sm'|'md'|'lg' }) => {
    const dims = size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-16 h-16' : 'w-10 h-10';
    // Generates initials (e.g., "John Doe" -> "JD") for when no image exists
    const initials = emp.full_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

    return (
        <div className="relative inline-block">
            <div className={`${dims} rounded-full overflow-hidden bg-slate-200 border border-slate-300 flex items-center justify-center relative`}>
                {emp.avatar_url ? (
                    <Image src={emp.avatar_url} alt={emp.full_name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw"/>
                ) : (
                    <span className={`font-bold text-slate-500 text-xs`}>{initials}</span>
                )}
            </div>
            {/* Live Status Indicator Dot */}
            <span className={`absolute bottom-0 right-0 block h-3 w-3 rounded-full ring-2 ring-white ${isOnline ? 'bg-green-500' : 'bg-slate-300'}`} 
                  title={isOnline ? "Clocked In" : "Clocked Out"}/>
        </div>
    );
};

// ============================================================================
// 3. MAIN COMPONENT
// ============================================================================

export default function RosterPage() {
  const supabase = createClient();
  
  // -- HYDRATION FIX --
  // We use this to ensure date-heavy UI only renders on the client to avoid
  // "Text content does not match server-rendered HTML" errors.
  const [isMounted, setIsMounted] = useState(false);

  // -- APP DATA STATE --
  const [currentDate, setCurrentDate] = useState(moment());
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [liveStatus, setLiveStatus] = useState<Record<string, boolean>>({}); // Map: UserId -> isClockedIn
  
  // -- USER PERMISSION STATE --
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [currentUserLevel, setCurrentUserLevel] = useState<number>(0);

  // -- UI STATE --
  const [loading, setLoading] = useState(true);
  const [copying, setCopying] = useState(false);
  const [visibleLocs, setVisibleLocs] = useState<Record<string, boolean>>({
      'Las Vegas': true, 'Pismo': true, 'Michigan': true
  });
  // We remember the last role assigned to a specific user to speed up data entry
  const [lastRoles, setLastRoles] = useState<Record<string, string>>({});

  // -- SHIFT MODAL STATE --
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState<string>('');
  const [selectedEmpName, setSelectedEmpName] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);
  
  // -- SHIFT FORM INPUTS --
  const [formRole, setFormRole] = useState('Guide');
  const [formStart, setFormStart] = useState('09:00');
  const [formEnd, setFormEnd] = useState('17:00');
  const [formLocation, setFormLocation] = useState('Las Vegas');
  
  // -- PROFILE MODAL STATE --
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileEmp, setProfileEmp] = useState<Employee | null>(null);

  // -- AUDIT LOG STATE --
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // -- CALCULATED DATES --
  const startOfWeek = currentDate.clone().startOf('isoWeek');
  // Generate array of 7 days for the header
  const weekDays = Array.from({ length: 7 }, (_, i) => startOfWeek.clone().add(i, 'days'));

  // ==========================================================================
  // 4. PERMISSION CHECKS
  // ==========================================================================
  const isManager = currentUserLevel >= 500; // Can Edit Schedule & Profiles
  const isAdmin = currentUserLevel >= 900;   // Can Archive Employees

  // ==========================================================================
  // 5. EFFECTS (Data Loading)
  // ==========================================================================

  // On Mount: Load filters from local storage & set hydration flag
  useEffect(() => {
      setIsMounted(true);
      const saved = localStorage.getItem('roster_filters');
      if (saved) try { setVisibleLocs(JSON.parse(saved)); } catch (e) { console.error(e); }
      // Auto-switch to day view on mobile
      if (window.innerWidth < 768) setViewMode('day');
  }, []);

  // When date changes or component mounts: Fetch fresh data
  useEffect(() => { 
      if (isMounted) fetchData(); 
  }, [currentDate, isMounted]);

  /**
   * Main Data Fetching Function
   * Fetches: User Info, Employees list, Shifts for the week, and Live Clock status.
   */
  const fetchData = async () => {
    setLoading(true);
    
    // 1. Get Current User & Level (For RBAC)
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        setCurrentUserId(user.id);
        const { data: userData } = await supabase.from('users').select('user_level').eq('id', user.id).single();
        if (userData) setCurrentUserLevel(userData.user_level || 0);
    }

    // 2. Fetch Active Employees (Level 300+)
    const { data: empData } = await supabase
        .from('users')
        .select('id, full_name, location, department, hire_date, user_level, timeclock_blocked, email, phone, avatar_url')
        .gte('user_level', 300)
        .order('full_name'); 

    if (empData) {
        // Sanitize defaults
        const cleanEmps = empData.map(e => ({ 
            ...e, 
            location: e.location || 'Las Vegas', 
            department: e.department || 'General', 
            timeclock_blocked: e.timeclock_blocked || false 
        }));
        // Sort by Seniority (Hire Date)
        cleanEmps.sort((a, b) => {
            if (!a.hire_date) return 1; if (!b.hire_date) return -1;
            return new Date(a.hire_date).getTime() - new Date(b.hire_date).getTime();
        });
        setEmployees(cleanEmps);
    }
    
    // 3. Fetch Shifts for current view window
    const startStr = startOfWeek.toISOString();
    const endStr = startOfWeek.clone().endOf('isoWeek').toISOString();
    const { data: shiftData } = await supabase
        .from('employee_schedules')
        .select('*')
        .gte('start_time', startStr)
        .lte('start_time', endStr);
    
    if (shiftData) setShifts(shiftData);

    // 4. Live Status (Who is clocked in RIGHT NOW?)
    const knownLocations = Object.keys(LOCATIONS);
    const { data: activeEntries } = await supabase
        .from('time_entries')
        .select('user_id, employee_id')
        .in('location', knownLocations)
        .is('clock_out', null); // If clock_out is null, they are working.

    if (activeEntries) {
        const statusMap: Record<string, boolean> = {};
        activeEntries.forEach((entry: any) => {
            const uid = entry.user_id || entry.employee_id;
            if (uid) statusMap[uid] = true;
        });
        setLiveStatus(statusMap);
    }
    setLoading(false);
  };

  // ==========================================================================
  // 6. AUDIT & LOGGING FUNCTIONS
  // ==========================================================================

  /**
   * Fetches audit logs for a specific row (Shift or User) and joins actor names.
   */
  const fetchLogs = async (tableName: string, rowId: string) => {
      setLoadingLogs(true);
      const { data: logs, error } = await supabase
          .from('audit_logs')
          .select('id, created_at, action, user_id, table_name, row')
          .eq('table_name', tableName)
          .eq('row', rowId)
          .order('created_at', { ascending: false });

      if (!error && logs) {
          // Get unique user IDs of people who made changes to look up their names
          const actorIds = [...new Set(logs.map(l => l.user_id))];
          const { data: actors } = await supabase.from('users').select('id, full_name').in('id', actorIds);
          
          // Combine log data with actor names
          const enrichedLogs = logs.map(log => ({
              ...log,
              actor_name: actors?.find(a => a.id === log.user_id)?.full_name || 'Unknown'
          }));
          setAuditLogs(enrichedLogs);
      }
      setLoadingLogs(false);
  };

  /**
   * Records an action to the database.
   */
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
  // 7. USER INTERACTION HANDLERS
  // ==========================================================================

  /** Opens the Shift Modal (Create or Edit) */
  const handleCellClick = (emp: Employee, dateStr: string, existingShift?: Shift) => {
    setSelectedEmpId(emp.id); 
    setSelectedEmpName(emp.full_name); 
    setSelectedDate(dateStr);
    
    // If clicking an existing shift, pre-fill form
    if (existingShift) {
      setSelectedShiftId(existingShift.id); 
      setFormRole(existingShift.role); 
      setFormLocation(existingShift.location || emp.location);
      setFormStart(moment(existingShift.start_time).format('HH:mm')); 
      setFormEnd(moment(existingShift.end_time).format('HH:mm'));
    } else {
      // New shift: Use defaults or last role used for this person
      setSelectedShiftId(null); 
      setFormRole(lastRoles[emp.id] || 'Guide'); 
      setFormLocation(emp.location); 
      setFormStart('09:00'); 
      setFormEnd('17:00');
    }
    setIsShiftModalOpen(true);
  };

  /** Saves (Create or Update) a shift */
  const handleSaveShift = async () => {
    if (!isManager) return; // Security Check
    
    // Combine Date + Time input to get Full ISO String
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
        // UPDATE Existing
        const { error } = await supabase.from('employee_schedules').update(payload).eq('id', selectedShiftId);
        if (error) { toast.error("Failed to update"); return; }
        action = `Updated shift: ${formRole} (${formStart}-${formEnd})`;
    } else {
        // INSERT New
        const { data, error } = await supabase.from('employee_schedules').insert([payload]).select().single();
        if (error || !data) { toast.error("Failed to create"); return; }
        shiftId = data.id;
        action = `Created shift: ${formRole} (${formStart}-${formEnd})`;
    }

    // Log the change
    if (shiftId) await logChange(action, 'employee_schedules', shiftId);
    
    // Optimization: Remember this role for next time we click this user
    setLastRoles(prev => ({ ...prev, [selectedEmpId]: formRole })); 
    
    fetchData(); 
    setIsShiftModalOpen(false); 
    toast.success("Saved");
  };

  const handleDeleteShift = async () => {
    if (!isManager || !selectedShiftId) return;
    
    await logChange(`Deleted shift`, 'employee_schedules', selectedShiftId);
    await supabase.from('employee_schedules').delete().eq('id', selectedShiftId); 
    
    toast.success("Deleted"); 
    fetchData(); 
    setIsShiftModalOpen(false);
  };

  /** Copies current week's schedule to next week (Manager Only) */
  const handleCopyWeek = async () => {
      if (!isManager) return;
      if (shifts.length === 0) { toast.error("No shifts"); return; }
      const targetStart = startOfWeek.clone().add(1, 'week').format('MMM Do');
      
      if (!confirm(`Copy ${shifts.length} shifts to next week (${targetStart})?`)) return;
      
      setCopying(true);
      const newShifts = shifts.map(s => ({ 
          user_id: s.user_id, 
          role: s.role, 
          // Shift times forward by exactly 7 days
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
          setCurrentDate(currentDate.clone().add(1, 'week')); // Navigate to the new week
      }
  };

  /** Updates Employee Profile Data */
  const handleSaveProfile = async () => {
      if (!isManager || !profileEmp) return;
      
      // Update User table
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
          await logChange(`Updated profile: ${profileEmp.location}, ${profileEmp.department}`, 'users', profileEmp.id);
          toast.success("Saved"); 
          fetchData(); 
          setIsProfileModalOpen(false); 
      }
  };

  // ==========================================================================
  // 8. DATA TRANSFORMATION (Grouping)
  // ==========================================================================
  // We group employees by Location -> Department -> Array[Employees]
  // This memoized object drives the entire table rendering.
  const groupedEmployees = useMemo(() => {
      const groups: Record<string, Record<string, Employee[]>> = {};
      
      // Initialize structure based on Constants
      Object.keys(LOCATIONS).forEach(loc => {
          groups[loc] = {}; 
          LOCATIONS[loc as keyof typeof LOCATIONS].forEach(dept => { groups[loc][dept] = []; });
          groups[loc]['Visiting Staff'] = [];
      });
      groups['Unassigned'] = { 'General': [] };
      
      // Sort employees into groups
      employees.forEach(emp => {
          const loc = LOCATIONS[emp.location as keyof typeof LOCATIONS] ? emp.location : 'Unassigned';
          let dept = emp.department;
          
          // Fallback if department doesn't match location config
          if (loc !== 'Unassigned' && !groups[loc][dept]) dept = Object.keys(groups[loc])[0];
          if (loc === 'Unassigned') dept = 'General';
          
          if (!groups[loc][dept]) groups[loc][dept] = [];
          groups[loc][dept].push(emp);
      });
      
      // Handle "Visiting Staff" (Employees working a shift in a location not their own)
      shifts.forEach(shift => {
          const emp = employees.find(e => e.id === shift.user_id);
          if (!emp) return;
          if (shift.location && shift.location !== emp.location && groups[shift.location]) {
              const targetLoc = shift.location; 
              const visitingBucket = groups[targetLoc]['Visiting Staff'];
              // Add only if not already in the bucket
              if (!visitingBucket.find(v => v.id === emp.id)) visitingBucket.push(emp);
          }
      });
      return groups;
  }, [employees, shifts]);


  // ==========================================================================
  // 9. SUB-COMPONENTS (Defined locally for access to main state)
  // ==========================================================================

  /** Shows the 'History/Info' icon that opens the Audit Log Popover */
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

  /** Calculates total hours for a set of shifts */
  const getHours = (start: string, end: string) => moment.duration(moment(end).diff(moment(start))).asHours();
  
  const sumWeeklyHours = (shiftList: Shift[]) => {
      const weekStart = startOfWeek.toISOString();
      const weekEnd = startOfWeek.clone().endOf('isoWeek').toISOString();
      const relevantShifts = shiftList.filter(s => s.start_time >= weekStart && s.start_time <= weekEnd);
      return relevantShifts.reduce((acc, s) => acc + getHours(s.start_time, s.end_time), 0).toFixed(1);
  };

  // ==========================================================================
  // 10. MAIN RENDER
  // ==========================================================================
  
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
                  {/* Copy Week Button (Manager Only) */}
                  {viewMode === 'week' && isManager && (
                    <Button variant="secondary" size="sm" onClick={handleCopyWeek} disabled={copying || shifts.length === 0} className="hidden md:flex">
                        {copying ? <Loader2 className="w-3 h-3 animate-spin" /> : <Copy className="w-3 h-3 mr-2" />} Copy Week
                    </Button>
                  )}
                  {/* Date Navigation */}
                  <div className="flex items-center border rounded-md bg-card shadow-sm">
                    <Button variant="ghost" size="icon" onClick={() => setCurrentDate(currentDate.clone().subtract(1, viewMode === 'week' ? 'week' : 'day'))}><ChevronLeft className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => setCurrentDate(moment())}>Today</Button>
                    <Button variant="ghost" size="icon" onClick={() => setCurrentDate(currentDate.clone().add(1, viewMode === 'week' ? 'week' : 'day'))}><ChevronRight className="w-4 h-4" /></Button>
                  </div>
              </div>
            </div>
          </div>

          {/* Location Filters */}
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

      {/* --- WEEK VIEW TABLE --- */}
      <div className="flex-1 overflow-auto border rounded-lg shadow-sm bg-card">
        {viewMode === 'week' && (
        <table className="w-full border-collapse min-w-[1000px] text-sm">
          {/* Table Header with Dates */}
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
            {/* 1. Loop through Locations */}
            {Object.entries(groupedEmployees).map(([locName, departments]) => {
                // Apply Filter
                if (!visibleLocs[locName]) return null;
                // Don't show empty locations
                if (!Object.values(departments).some(arr => arr.length > 0)) return null;

                const allEmpIdsInLoc = Object.values(departments).flat().map(e => e.id);
                const locShifts = shifts.filter(s => (s.location === locName) || (!s.location && allEmpIdsInLoc.includes(s.user_id)));
                
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
                        {/* Empty cells for location header */}
                        {weekDays.map(d => <td key={d.toString()} className="border-l border-slate-700 bg-slate-900"></td>)}
                    </tr>

                    {/* 2. Loop through Departments within Location */}
                    {Object.entries(departments).map(([deptName, deptEmps]) => {
                        if (deptEmps.length === 0) return null;
                        
                        const isVisiting = deptName === 'Visiting Staff';
                        
                        return (
                            <Fragment key={`${locName}-${deptName}`}>
                            {/* Department Header */}
                            <tr className={isVisiting ? 'bg-amber-50 dark:bg-amber-950/30' : 'bg-slate-100 dark:bg-slate-800'}>
                                <td className={`p-1 pl-4 font-semibold text-xs uppercase border-b sticky left-0 z-10 ${isVisiting ? 'text-amber-600' : 'text-slate-500'}`}>
                                    <div className="flex justify-between items-center pr-2">
                                        <span>{isVisiting && <Plane className="w-3 h-3 inline mr-1 mb-0.5" />} {deptName}</span>
                                    </div>
                                </td>
                                {weekDays.map(d => <td key={d.toString()} className="border-l border-b bg-inherit" />)}
                            </tr>

                            {/* 3. Loop through Employees */}
                            {deptEmps.map(emp => {
                                const empShifts = shifts.filter(s => s.user_id === emp.id);
                                return (
                                <tr key={`${locName}-${emp.id}`} className="hover:bg-muted/20 transition-colors border-b">
                                    {/* Employee Name Column (Clickable for Manager) */}
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
                                    
                                    {/* 4. Days Grid */}
                                    {weekDays.map(day => {
                                        const dateStr = day.format('YYYY-MM-DD');
                                        const shift = shifts.find(s => s.user_id === emp.id && moment(s.start_time).format('YYYY-MM-DD') === dateStr);
                                        
                                        // Logic: Is this employee working at THIS location today?
                                        const shouldRender = shift && (!isVisiting || shift.location === locName);
                                        // Logic: Are they sent somewhere else?
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
      </div>

      {/* --- SHIFT MODAL --- */}
      <Dialog open={isShiftModalOpen} onOpenChange={setIsShiftModalOpen}>
        <DialogContent className="max-w-sm">
            <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                    <span>Shift Details</span>
                    {/* INFO ICON: Shows Audit History if shift exists */}
                    {selectedShiftId && <ChangeLogViewer tableName="employee_schedules" rowId={selectedShiftId} />}
                </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-2">
                <div className="text-sm font-semibold">{selectedEmpName} <span className="font-normal text-muted-foreground">- {moment(selectedDate).format('MMM Do')}</span></div>
                
                {/* Time Inputs */}
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

                {/* Role Select */}
                <div>
                    <label className="text-xs">Role</label>
                    <Select value={formRole} onValueChange={setFormRole} disabled={!isManager}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{['Guide','Desk','Driver','Mechanic','Manager'].map(r=><SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
                
                {/* Location Select */}
                <div>
                    <label className="text-xs">Location</label>
                    <Select value={formLocation} onValueChange={setFormLocation} disabled={!isManager}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{Object.keys(LOCATIONS).map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
            </div>
            
            {/* Footer Buttons (Hidden for Employees) */}
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
                {/* Header with Avatar */}
                <div className="flex items-center gap-4 border-b pb-4 mb-2">
                    <UserAvatar emp={profileEmp} isOnline={liveStatus[profileEmp.id]} size="lg" />
                    <div>
                        <div className="text-lg font-bold">{profileEmp.full_name}</div>
                        <div className="text-xs text-muted-foreground">{profileEmp.email}</div>
                    </div>
                </div>

                {/* Location & Dept */}
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

                {/* Details */}
                <div><label className="text-xs">Hire Date</label><Input type="date" disabled={!isManager} value={profileEmp.hire_date||''} onChange={(e)=>setProfileEmp({...profileEmp,hire_date:e.target.value})} /></div>
                <div><label className="text-xs">Phone Number</label><Input type="tel" disabled={!isManager} value={profileEmp.phone || ''} onChange={(e) => setProfileEmp({...profileEmp, phone: e.target.value})} /></div>
                <div><label className="text-xs">Avatar URL</label><Input type="text" disabled={!isManager} value={profileEmp.avatar_url || ''} onChange={(e) => setProfileEmp({...profileEmp, avatar_url: e.target.value})} /></div>

                {/* Controls (Manager Only) */}
                {isManager && (
                    <div className="flex items-center justify-between border p-3 rounded bg-slate-50 dark:bg-slate-900/50">
                        <div><h4 className="text-sm font-bold flex items-center gap-2"><Ban className="w-4 h-4 text-red-500"/> Block Timeclock</h4></div>
                        <Switch checked={profileEmp.timeclock_blocked} onCheckedChange={(c)=>setProfileEmp({...profileEmp,timeclock_blocked:c})} disabled={!isManager} />
                    </div>
                )}
                
                {/* ARCHIVE BUTTON - ADMIN ONLY */}
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