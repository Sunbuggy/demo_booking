'use client';

import { useState, useEffect, Fragment } from 'react';
import { createClient } from '@/utils/supabase/client';
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
    UserCog, CalendarDays, Ban, Copy, Loader2, Plane, Filter, LayoutList, Table as TableIcon, Clock
} from 'lucide-react';
import { toast } from 'sonner';
import moment from 'moment';
import { Badge } from '@/components/ui/badge';
import ContactMenu from '@/components/ContactMenu';

// --- TYPES ---
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
}

interface Shift {
  id: string;
  user_id: string;
  start_time: string;
  end_time: string;
  role: string;
  location?: string;
}

const LOCATIONS = {
  'Las Vegas': ['OFFICE', 'SHUTTLES', 'DUNES', 'SHOP'],
  'Pismo': ['ADMIN', 'CSR', 'SHOP', 'BEACH'],
  'Michigan': ['ADMIN', 'SHOP', 'GUIDES', 'OFFICE']
};

export default function RosterPage() {
  const supabase = createClient();
  const [currentDate, setCurrentDate] = useState(moment());
  
  // View Mode State: 'week' (Desktop Table) or 'day' (Mobile List)
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');
  
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [copying, setCopying] = useState(false);
  const [visibleLocs, setVisibleLocs] = useState<Record<string, boolean>>({
      'Las Vegas': true, 'Pismo': true, 'Michigan': true
  });
  const [lastRoles, setLastRoles] = useState<Record<string, string>>({});
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState<string>('');
  const [selectedEmpName, setSelectedEmpName] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);
  const [formRole, setFormRole] = useState('Guide');
  const [formStart, setFormStart] = useState('09:00');
  const [formEnd, setFormEnd] = useState('17:00');
  const [formLocation, setFormLocation] = useState('Las Vegas');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileEmp, setProfileEmp] = useState<Employee | null>(null);

  // If in 'Day' mode, we use currentDate as the specific day. 
  // If in 'Week' mode, we use startOfWeek.
  const startOfWeek = currentDate.clone().startOf('isoWeek');
  const weekDays = Array.from({ length: 7 }, (_, i) => startOfWeek.clone().add(i, 'days'));

  // --- HELPERS ---
  const getHours = (start: string, end: string) => moment.duration(moment(end).diff(moment(start))).asHours();
  
  const sumDailyHours = (shiftList: Shift[], dateStr: string) => {
      const dailyShifts = shiftList.filter(s => moment(s.start_time).format('YYYY-MM-DD') === dateStr);
      const total = dailyShifts.reduce((acc, s) => acc + getHours(s.start_time, s.end_time), 0);
      return total > 0 ? total.toFixed(1) : null;
  };

  // Sum hours for the entire visible week
  const sumWeeklyHours = (shiftList: Shift[]) => {
      const weekStart = startOfWeek.toISOString();
      const weekEnd = startOfWeek.clone().endOf('isoWeek').toISOString();
      
      const relevantShifts = shiftList.filter(s => 
          s.start_time >= weekStart && s.start_time <= weekEnd
      );

      const total = relevantShifts.reduce((acc, s) => acc + getHours(s.start_time, s.end_time), 0);
      return total > 0 ? total.toFixed(1) : 0;
  };

  useEffect(() => {
      const saved = localStorage.getItem('roster_filters');
      if (saved) try { setVisibleLocs(JSON.parse(saved)); } catch (e) { console.error(e); }
      
      // Auto-switch to Day view on mobile
      if (window.innerWidth < 768) setViewMode('day');
  }, []);

  const toggleLocation = (loc: string) => {
      const newState = { ...visibleLocs, [loc]: !visibleLocs[loc] };
      setVisibleLocs(newState);
      localStorage.setItem('roster_filters', JSON.stringify(newState));
  };

  useEffect(() => { fetchData(); }, [currentDate]);

  const fetchData = async () => {
    setLoading(true);
    const { data: empData } = await supabase.from('users').select('id, full_name, location, department, hire_date, user_level, timeclock_blocked, email, phone').gte('user_level', 300).order('full_name'); 
    if (empData) {
        const cleanEmps = empData.map(e => ({ ...e, location: e.location || 'Las Vegas', department: e.department || 'General', timeclock_blocked: e.timeclock_blocked || false }));
        cleanEmps.sort((a, b) => {
            if (!a.hire_date) return 1; if (!b.hire_date) return -1;
            return new Date(a.hire_date).getTime() - new Date(b.hire_date).getTime();
        });
        setEmployees(cleanEmps);
    }
    
    // Always fetch the surrounding week to support week totals
    const startStr = startOfWeek.toISOString();
    const endStr = startOfWeek.clone().endOf('isoWeek').toISOString();
    const { data: shiftData } = await supabase.from('employee_schedules').select('*').gte('start_time', startStr).lte('start_time', endStr);
    
    if (shiftData) setShifts(shiftData);
    setLoading(false);
  };

  const handleCellClick = (emp: Employee, dateStr: string, existingShift?: Shift) => {
    setSelectedEmpId(emp.id); setSelectedEmpName(emp.full_name); setSelectedDate(dateStr);
    if (existingShift) {
      setSelectedShiftId(existingShift.id); setFormRole(existingShift.role); setFormLocation(existingShift.location || emp.location);
      setFormStart(moment(existingShift.start_time).format('HH:mm')); setFormEnd(moment(existingShift.end_time).format('HH:mm'));
    } else {
      setSelectedShiftId(null); setFormRole(lastRoles[emp.id] || 'Guide'); setFormLocation(emp.location); setFormStart('09:00'); setFormEnd('17:00');
    }
    setIsShiftModalOpen(true);
  };

  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newStart = e.target.value; setFormStart(newStart);
      if(newStart) { const m = moment(newStart, 'HH:mm'); if(m.isValid()) setFormEnd(m.add(8, 'hours').format('HH:mm')); }
  };

  const handleSaveShift = async () => {
    const startDateTime = moment(`${selectedDate} ${formStart}`, 'YYYY-MM-DD HH:mm').toISOString();
    const endDateTime = moment(`${selectedDate} ${formEnd}`, 'YYYY-MM-DD HH:mm').toISOString();
    const payload = { user_id: selectedEmpId, start_time: startDateTime, end_time: endDateTime, role: formRole, location: formLocation };
    if (selectedShiftId) await supabase.from('employee_schedules').update(payload).eq('id', selectedShiftId);
    else await supabase.from('employee_schedules').insert([payload]);
    setLastRoles(prev => ({ ...prev, [selectedEmpId]: formRole })); fetchData(); setIsShiftModalOpen(false); toast.success("Saved");
  };

  const handleDeleteShift = async () => {
    if (!selectedShiftId) return; await supabase.from('employee_schedules').delete().eq('id', selectedShiftId); toast.success("Deleted"); fetchData(); setIsShiftModalOpen(false);
  };

  const handleCopyWeek = async () => {
      if (shifts.length === 0) { toast.error("No shifts"); return; }
      const targetStart = startOfWeek.clone().add(1, 'week').format('MMM Do');
      if (!confirm(`Copy ${shifts.length} shifts to next week (${targetStart})?`)) return;
      setCopying(true);
      const newShifts = shifts.map(s => ({ user_id: s.user_id, role: s.role, start_time: moment(s.start_time).add(7, 'days').toISOString(), end_time: moment(s.end_time).add(7, 'days').toISOString(), location: s.location || 'Las Vegas' }));
      const { error } = await supabase.from('employee_schedules').insert(newShifts);
      setCopying(false); if (error) toast.error("Failed"); else { toast.success("Copied!"); setCurrentDate(currentDate.clone().add(1, 'week')); }
  };

  const handleSaveProfile = async () => {
      if (!profileEmp) return;
      const { error } = await supabase.from('users').update({ 
          hire_date: profileEmp.hire_date, 
          location: profileEmp.location, 
          department: profileEmp.department, 
          timeclock_blocked: profileEmp.timeclock_blocked,
          phone: profileEmp.phone
      }).eq('id', profileEmp.id);
      if (error) toast.error("Failed"); else { toast.success("Saved"); fetchData(); setIsProfileModalOpen(false); }
  };
  const handleArchiveEmployee = async () => {
      if (!profileEmp) return; if (!confirm(`Archive ${profileEmp.full_name}?`)) return;
      await supabase.from('users').update({ user_level: 100 }).eq('id', profileEmp.id); toast.success("Archived"); fetchData(); setIsProfileModalOpen(false);
  };

  // --- GROUPING LOGIC ---
  const groupedEmployees: Record<string, Record<string, Employee[]>> = {};
  Object.keys(LOCATIONS).forEach(loc => {
      groupedEmployees[loc] = {}; LOCATIONS[loc as keyof typeof LOCATIONS].forEach(dept => { groupedEmployees[loc][dept] = []; });
      groupedEmployees[loc]['Visiting Staff'] = [];
  });
  groupedEmployees['Unassigned'] = { 'General': [] };
  employees.forEach(emp => {
      const loc = LOCATIONS[emp.location as keyof typeof LOCATIONS] ? emp.location : 'Unassigned';
      let dept = emp.department;
      if (loc !== 'Unassigned' && !groupedEmployees[loc][dept]) dept = Object.keys(groupedEmployees[loc])[0];
      if (loc === 'Unassigned') dept = 'General';
      if (!groupedEmployees[loc][dept]) groupedEmployees[loc][dept] = [];
      groupedEmployees[loc][dept].push(emp);
  });
  shifts.forEach(shift => {
      const emp = employees.find(e => e.id === shift.user_id);
      if (!emp) return;
      if (shift.location && shift.location !== emp.location && groupedEmployees[shift.location]) {
          const targetLoc = shift.location; const visitingBucket = groupedEmployees[targetLoc]['Visiting Staff'];
          if (!visitingBucket.find(v => v.id === emp.id)) visitingBucket.push(emp);
      }
  });

  return (
    <div className="p-4 h-screen flex flex-col bg-background text-foreground">
      {/* HEADER */}
      <div className="flex flex-col gap-4 mb-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold">SunBuggy Roster</h1>
              <div className="text-muted-foreground text-sm flex items-center gap-2">
                {viewMode === 'week' 
                    ? `${startOfWeek.format('MMM D')} - ${startOfWeek.clone().add(6, 'days').format('MMM D, YYYY')}`
                    : currentDate.format('dddd, MMMM Do YYYY')
                }
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-between md:justify-end">
              
              {/* VIEW TOGGLE */}
              <div className="flex items-center bg-muted p-1 rounded-lg border">
                  <Button variant={viewMode === 'day' ? 'secondary' : 'ghost'} size="sm" className="h-7 px-3 text-xs" onClick={() => setViewMode('day')}>
                    <LayoutList className="w-3 h-3 mr-1" /> Day
                  </Button>
                  <Button variant={viewMode === 'week' ? 'secondary' : 'ghost'} size="sm" className="h-7 px-3 text-xs" onClick={() => setViewMode('week')}>
                    <TableIcon className="w-3 h-3 mr-1" /> Week
                  </Button>
              </div>

              {/* DATE NAV */}
              <div className="flex items-center gap-2">
                  {viewMode === 'week' && (
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

          {/* LOCATION TOGGLES */}
          <div className="flex items-center gap-2 pb-2 overflow-x-auto">
             <Filter className="w-4 h-4 text-muted-foreground mr-1" />
             {Object.keys(LOCATIONS).map(loc => (
                 <Badge key={loc} variant={visibleLocs[loc] ? 'default' : 'outline'} className={`cursor-pointer select-none px-3 py-1 ${visibleLocs[loc] ? 'bg-primary hover:bg-primary/90' : 'bg-transparent text-muted-foreground hover:bg-accent'}`} onClick={() => toggleLocation(loc)}>{loc}</Badge>
             ))}
          </div>
      </div>

      {/* CONTENT AREA */}
      <div className="flex-1 overflow-auto border rounded-lg shadow-sm bg-card">
        
        {/* ======================= */}
        {/* WEEK VIEW (TABLE)  */}
        {/* ======================= */}
        {viewMode === 'week' && (
        <table className="w-full border-collapse min-w-[1000px] text-sm">
          <thead className="sticky top-0 bg-muted z-20 shadow-sm">
            <tr><th className="p-2 text-left w-56 border-b font-bold text-muted-foreground bg-muted pl-4">Staff</th>{weekDays.map(day => (<th key={day.toString()} className="p-2 text-center border-b min-w-[100px] border-l bg-muted"><div className="font-semibold">{day.format('ddd')}</div><div className="text-[10px] text-muted-foreground">{day.format('MMM D')}</div></th>))}</tr>
          </thead>
          <tbody>
            {Object.entries(groupedEmployees).map(([locName, departments]) => {
                if (!visibleLocs[locName]) return null;
                const hasPeople = Object.values(departments).some(arr => arr.length > 0);
                if (!hasPeople) return null;
                const allEmpIdsInLoc = Object.values(departments).flat().map(e => e.id);
                const locShifts = shifts.filter(s => (s.location === locName) || (!s.location && allEmpIdsInLoc.includes(s.user_id)));
                const locTotalHours = sumWeeklyHours(locShifts);

                return (
                    <Fragment key={locName}>
                    <tr className="bg-slate-900 text-white">
                        <td className="p-2 font-bold uppercase tracking-wider text-xs border-b border-slate-700 sticky left-0 z-10 bg-slate-900">
                            <div className="flex justify-between items-center">
                                <span><MapPin className="w-3 h-3 inline mr-2" /> {locName}</span>
                                <span className="bg-slate-800 text-[10px] px-1.5 py-0.5 rounded text-slate-200">{locTotalHours}h</span>
                            </div>
                        </td>
                        {weekDays.map(day => (<td key={day.toString()} className="text-center text-[10px] font-mono text-slate-400 border-l border-slate-700">{sumDailyHours(locShifts, day.format('YYYY-MM-DD')) && <span className="bg-slate-800 px-1 rounded">{sumDailyHours(locShifts, day.format('YYYY-MM-DD'))}h</span>}</td>))}
                    </tr>

                    {Object.entries(departments).map(([deptName, deptEmps]) => {
                        if (deptEmps.length === 0) return null;
                        const isVisitingSection = deptName === 'Visiting Staff';
                        const deptEmpIds = deptEmps.map(e => e.id);
                        const deptShifts = shifts.filter(s => deptEmpIds.includes(s.user_id));
                        let relevantDeptShifts = deptShifts;
                        if(isVisitingSection) relevantDeptShifts = deptShifts.filter(s => s.location === locName);
                        const deptTotalHours = sumWeeklyHours(relevantDeptShifts);

                        return (
                            <Fragment key={`${locName}-${deptName}`}>
                            <tr className={isVisitingSection ? 'bg-amber-50 dark:bg-amber-950/30' : 'bg-slate-100 dark:bg-slate-800'}>
                                <td className={`p-1 pl-4 font-semibold text-xs uppercase border-b sticky left-0 z-10 ${isVisitingSection ? 'text-amber-600' : 'text-slate-500'}`}>
                                    <div className="flex justify-between items-center pr-2">
                                        <span>{isVisitingSection && <Plane className="w-3 h-3 inline mr-1 mb-0.5" />} {deptName}</span>
                                        {deptTotalHours > 0 && <span className="opacity-70 text-[10px] bg-slate-200/50 dark:bg-slate-700/50 px-1 rounded">{deptTotalHours}h</span>}
                                    </div>
                                </td>
                                {weekDays.map(day => {
                                    const total = sumDailyHours(relevantDeptShifts, day.format('YYYY-MM-DD'));
                                    return <td key={day.toString()} className="text-center text-[10px] font-mono border-l border-b text-slate-400">{total && <span>{total}h</span>}</td>
                                })}
                            </tr>

                            {deptEmps.map(emp => {
                                const empShifts = shifts.filter(s => s.user_id === emp.id);
                                const empTotalHours = sumWeeklyHours(empShifts);
                                return (
                                <tr key={`${locName}-${emp.id}`} className="hover:bg-muted/20 transition-colors border-b">
                                    <td className="p-0 border-r border-r-slate-100 dark:border-r-slate-800 sticky left-0 z-10 bg-card">
                                        <div className="p-2 w-56 cursor-pointer flex flex-col justify-center h-full" onClick={(e) => { e.stopPropagation(); setProfileEmp(emp); setIsProfileModalOpen(true); }}>
                                            <div className="font-medium flex items-center gap-2">
                                                <span className={isVisitingSection ? "italic text-amber-700 dark:text-amber-500" : ""}>{emp.full_name}</span>
                                                <div onClick={(e) => e.stopPropagation()}><ContactMenu user={emp} iconOnly={true} /></div>
                                                {isVisitingSection && <span className="text-[9px] bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1 rounded">from {emp.location}</span>}
                                                {emp.timeclock_blocked && <Ban className="w-3 h-3 text-red-500 ml-1" />}
                                                {empTotalHours > 0 && <span className="ml-auto text-[10px] bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-200 px-1.5 rounded-sm font-mono">{empTotalHours}h</span>}
                                            </div>
                                        </div>
                                    </td>
                                    {weekDays.map(day => {
                                        const dateStr = day.format('YYYY-MM-DD');
                                        const shift = shifts.find(s => s.user_id === emp.id && moment(s.start_time).format('YYYY-MM-DD') === dateStr);
                                        let shouldRenderShift = false;
                                        const shiftLoc = shift?.location || emp.location;
                                        if (shift) {
                                            if (!isVisitingSection) shouldRenderShift = true;
                                            else if (shiftLoc === locName) shouldRenderShift = true;
                                        }
                                        const isAway = shift && shiftLoc !== emp.location && !isVisitingSection;
                                        return (
                                            <td key={dateStr} className={`p-1 border-l relative h-14 cursor-pointer group`} onClick={() => handleCellClick(emp, dateStr, shift)}>
                                                {shouldRenderShift && shift ? (
                                                    <div className={`h-full w-full border-l-2 rounded-r p-1 flex flex-col justify-center ${isAway ? 'bg-amber-50 border-l-amber-500 dark:bg-amber-900/40' : 'bg-blue-100 dark:bg-blue-900/40 border-l-blue-500'}`}>
                                                        <span className="font-bold text-foreground text-xs leading-none mb-0.5">{moment(shift.start_time).format('h:mmA')}</span>
                                                        <span className="text-[10px] text-muted-foreground leading-none">- {moment(shift.end_time).format('h:mmA')}</span>
                                                        {isAway && <div className="text-[9px] font-bold text-amber-700 dark:text-amber-500 mt-1 uppercase flex items-center"><Plane className="w-2 h-2 mr-1" /> {shiftLoc}</div>}
                                                    </div>
                                                ) : (!isVisitingSection && <div className="h-full w-full flex items-center justify-center opacity-0 group-hover:opacity-100"><Plus className="w-4 h-4 text-muted-foreground/30" /></div>)}
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

        {/* ======================= */}
        {/* DAY VIEW (MOBILE)  */}
        {/* ======================= */}
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

                    return (
                        <div key={locName} className="border rounded-lg overflow-hidden bg-card shadow-sm">
                            <div className="bg-slate-900 text-white p-3 font-bold uppercase flex justify-between items-center">
                                <span><MapPin className="w-4 h-4 inline mr-2" /> {locName}</span>
                            </div>
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {activeDepts.map(([deptName, deptEmps]) => (
                                    <div key={deptName} className="p-0">
                                        <div className="bg-muted/50 px-3 py-1.5 text-xs font-bold uppercase text-muted-foreground tracking-wider">
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
                                                    <div key={emp.id} className="flex items-center justify-between p-3 hover:bg-muted/10 cursor-pointer" onClick={() => handleCellClick(emp, dateStr, shift)}>
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 font-bold text-xs">
                                                                {emp.full_name.split(' ').map(n=>n[0]).join('')}
                                                            </div>
                                                            <div>
                                                                <div className="font-semibold text-sm flex items-center gap-2">
                                                                    <span className={isVisiting ? "italic text-amber-700 dark:text-amber-500" : ""}>{emp.full_name}</span>
                                                                    <div onClick={(e)=>e.stopPropagation()}><ContactMenu user={emp} iconOnly={true} /></div>
                                                                </div>
                                                                <div className="text-xs text-muted-foreground">{shift.role}</div>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            {/* --- FIX: Added dark mode classes for contrast --- */}
                                                            <div className="font-mono font-bold text-sm bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-100 px-2 py-1 rounded">
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
                <div className="text-center text-muted-foreground text-sm py-8">No other shifts found for this date.<br/><span className="text-xs opacity-50">Try switching to Week View to schedule more.</span></div>
            </div>
        )}

      </div>

      <Dialog open={isShiftModalOpen} onOpenChange={setIsShiftModalOpen}>
        <DialogContent className="max-w-sm"><DialogHeader><DialogTitle>Shift</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-2">
             <div className="grid grid-cols-2 gap-4"><div><label className="text-xs">Start</label><Input type="time" value={formStart} onChange={handleStartTimeChange} /></div><div><label className="text-xs">End</label><Input type="time" value={formEnd} onChange={e => setFormEnd(e.target.value)} /></div></div>
             <div><label className="text-xs">Role</label><Select value={formRole} onValueChange={setFormRole}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['Guide','Desk','Driver','Mechanic','Manager'].map(r=><SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select></div>
             <div><label className="text-xs">Location</label><Select value={formLocation} onValueChange={setFormLocation}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.keys(LOCATIONS).map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <DialogFooter className="flex justify-between w-full">{selectedShiftId ? <Button variant="destructive" size="sm" onClick={handleDeleteShift}><Trash2 className="w-4 h-4 mr-2" /> Delete</Button> : <div/>}<Button size="sm" onClick={handleSaveShift}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen}>
        <DialogContent className="max-w-md"><DialogHeader><DialogTitle>Edit Employee</DialogTitle></DialogHeader>
          {profileEmp && (
            <div className="grid gap-4 py-2">
                <div className="text-lg font-bold border-b pb-2">{profileEmp.full_name}</div>
                <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-xs">Location</label><Select value={profileEmp.location} onValueChange={(v)=>setProfileEmp({...profileEmp,location:v})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{Object.keys(LOCATIONS).map(l=><SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent></Select></div>
                    <div><label className="text-xs">Department</label><Select value={profileEmp.department} onValueChange={(v)=>setProfileEmp({...profileEmp,department:v})}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{(LOCATIONS[profileEmp.location as keyof typeof LOCATIONS]||[]).map(d=><SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select></div>
                </div>
                <div><label className="text-xs">Hire Date</label><Input type="date" value={profileEmp.hire_date||''} onChange={(e)=>setProfileEmp({...profileEmp,hire_date:e.target.value})} /></div>
                <div><label className="text-xs">Phone Number</label><Input type="tel" value={profileEmp.phone || ''} onChange={(e) => setProfileEmp({...profileEmp, phone: e.target.value})} placeholder="555-123-4567" /></div>
                <div className="flex items-center justify-between border p-3 rounded bg-slate-50 dark:bg-slate-900/50"><div><h4 className="text-sm font-bold flex items-center gap-2"><Ban className="w-4 h-4 text-red-500"/> Block Timeclock</h4></div><Switch checked={profileEmp.timeclock_blocked} onCheckedChange={(c)=>setProfileEmp({...profileEmp,timeclock_blocked:c})} /></div>
                <div className="bg-red-50 p-3 rounded-md border border-red-100 mt-2"><Button variant="destructive" size="sm" className="w-full" onClick={handleArchiveEmployee}>Archive Employee</Button></div>
            </div>
          )}
          <DialogFooter><Button variant="outline" onClick={()=>setIsProfileModalOpen(false)}>Cancel</Button><Button onClick={handleSaveProfile}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}