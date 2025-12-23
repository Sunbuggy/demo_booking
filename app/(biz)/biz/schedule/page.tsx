'use client';

import { useState, useEffect } from 'react';
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
import { 
    ChevronLeft, ChevronRight, Plus, Trash2, MapPin, 
    UserCog, CalendarDays, Ban, Copy, Loader2, Plane 
} from 'lucide-react';
import { toast } from 'sonner';
import moment from 'moment';
import { Switch } from "@/components/ui/switch";

// --- TYPES ---
interface Employee {
  id: string;
  full_name: string;
  location: string;
  department: string;
  hire_date: string | null;
  user_level: number;
  timeclock_blocked: boolean;
}

interface Shift {
  id: string;
  user_id: string;
  start_time: string;
  end_time: string;
  role: string;
  location?: string; // The location this specific shift takes place
}

// --- CONFIGURATION ---
const LOCATIONS = {
  'Las Vegas': ['OFFICE', 'SHUTTLES', 'DUNES', 'SHOP'],
  'Pismo': ['ADMIN', 'CSR', 'SHOP', 'BEACH'],
  'Michigan': ['ADMIN', 'SHOP', 'GUIDES', 'OFFICE']
};

export default function RosterPage() {
  const supabase = createClient();

  // --- STATE ---
  const [currentDate, setCurrentDate] = useState(moment());
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [copying, setCopying] = useState(false);

  // "Sticky" Memory State (Remembers the last role selected for a specific person)
  const [lastRoles, setLastRoles] = useState<Record<string, string>>({});

  // Shift Modal State
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState<string>('');
  const [selectedEmpName, setSelectedEmpName] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);
  
  // Shift Form State
  const [formRole, setFormRole] = useState('Guide');
  const [formStart, setFormStart] = useState('09:00');
  const [formEnd, setFormEnd] = useState('17:00');
  const [formLocation, setFormLocation] = useState('Las Vegas'); // Default Shift Location

  // Employee Profile Modal State
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileEmp, setProfileEmp] = useState<Employee | null>(null);

  // --- HELPERS ---
  const startOfWeek = currentDate.clone().startOf('isoWeek');
  const weekDays = Array.from({ length: 7 }, (_, i) => startOfWeek.clone().add(i, 'days'));

  // --- FETCH DATA ---
  useEffect(() => {
    fetchData();
  }, [currentDate]);

  const fetchData = async () => {
    setLoading(true);
    
    // 1. Fetch Staff
    const { data: empData } = await supabase
      .from('users')
      .select('id, full_name, location, department, hire_date, user_level, timeclock_blocked')
      .gte('user_level', 300) 
      .order('full_name'); 

    if (empData) {
        const cleanEmps = empData.map(e => ({
            ...e,
            location: e.location || 'Las Vegas', // Default to prevent crash
            department: e.department || 'General'
        }));
        
        cleanEmps.sort((a, b) => {
            if (!a.hire_date) return 1;
            if (!b.hire_date) return -1;
            return new Date(a.hire_date).getTime() - new Date(b.hire_date).getTime();
        });

        setEmployees(cleanEmps);
    }

    // 2. Fetch Shifts (ensure we get the 'location' column if it exists in DB, otherwise we default)
    // Note: Ensure your DB table 'employee_schedules' has a 'location' column (text).
    const startStr = startOfWeek.toISOString();
    const endStr = startOfWeek.clone().endOf('isoWeek').toISOString();

    const { data: shiftData } = await supabase
      .from('employee_schedules')
      .select('*')
      .gte('start_time', startStr)
      .lte('start_time', endStr);

    if (shiftData) setShifts(shiftData);
    setLoading(false);
  };

  // --- HANDLERS: SHIFTS ---
  
  const handleCellClick = (emp: Employee, dateStr: string, existingShift?: Shift) => {
    setSelectedEmpId(emp.id);
    setSelectedEmpName(emp.full_name);
    setSelectedDate(dateStr);

    if (existingShift) {
      // EDIT MODE
      setSelectedShiftId(existingShift.id);
      setFormRole(existingShift.role);
      setFormLocation(existingShift.location || emp.location); // Use shift loc or fallback to home
      setFormStart(moment(existingShift.start_time).format('HH:mm'));
      setFormEnd(moment(existingShift.end_time).format('HH:mm'));
    } else {
      // CREATE MODE
      setSelectedShiftId(null);
      
      // STICKY ROLE LOGIC: Did we schedule this person recently? Use that role.
      // Otherwise default to Guide.
      const stickyRole = lastRoles[emp.id] || 'Guide';
      setFormRole(stickyRole);
      
      setFormLocation(emp.location); // Default to Home Location
      setFormStart('09:00');
      setFormEnd('17:00');
    }
    setIsShiftModalOpen(true);
  };

  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newStart = e.target.value;
      setFormStart(newStart);
      if(newStart) {
          const m = moment(newStart, 'HH:mm');
          if(m.isValid()) setFormEnd(m.add(8, 'hours').format('HH:mm'));
      }
  };

  const handleSaveShift = async () => {
    const startDateTime = moment(`${selectedDate} ${formStart}`, 'YYYY-MM-DD HH:mm').toISOString();
    const endDateTime = moment(`${selectedDate} ${formEnd}`, 'YYYY-MM-DD HH:mm').toISOString();

    const payload = {
      user_id: selectedEmpId,
      start_time: startDateTime,
      end_time: endDateTime,
      role: formRole,
      location: formLocation // Save the specific location for this shift
    };

    if (selectedShiftId) {
      await supabase.from('employee_schedules').update(payload).eq('id', selectedShiftId);
      toast.success("Shift Updated");
    } else {
      await supabase.from('employee_schedules').insert([payload]);
      toast.success("Shift Added");
    }

    // UPDATE STICKY MEMORY
    setLastRoles(prev => ({
        ...prev,
        [selectedEmpId]: formRole
    }));

    fetchData();
    setIsShiftModalOpen(false);
  };

  const handleDeleteShift = async () => {
    if (!selectedShiftId) return;
    await supabase.from('employee_schedules').delete().eq('id', selectedShiftId);
    toast.success("Shift Deleted");
    fetchData();
    setIsShiftModalOpen(false);
  };

  const handleCopyWeek = async () => {
      if (shifts.length === 0) {
          toast.error("No shifts to copy.");
          return;
      }
      
      const targetStart = startOfWeek.clone().add(1, 'week').format('MMM Do');
      if (!confirm(`Copy ${shifts.length} shifts to next week (${targetStart})?`)) return;

      setCopying(true);
      const newShifts = shifts.map(s => ({
          user_id: s.user_id,
          role: s.role,
          start_time: moment(s.start_time).add(7, 'days').toISOString(),
          end_time: moment(s.end_time).add(7, 'days').toISOString(),
          location: s.location || 'Las Vegas' // Copy location too
      }));

      const { error } = await supabase.from('employee_schedules').insert(newShifts);
      
      setCopying(false);
      if (error) toast.error("Failed to copy.");
      else {
          toast.success("Copied! Moving to next week...");
          setCurrentDate(currentDate.clone().add(1, 'week'));
      }
  };

  // --- HANDLERS: EMPLOYEE PROFILE ---
  const handleNameClick = (e: React.MouseEvent, emp: Employee) => {
      e.stopPropagation(); 
      setProfileEmp(emp);
      setIsProfileModalOpen(true);
  };

  const handleSaveProfile = async () => {
      if (!profileEmp) return;
      await supabase.from('users').update({
            hire_date: profileEmp.hire_date,
            location: profileEmp.location,
            department: profileEmp.department,
            timeclock_blocked: profileEmp.timeclock_blocked
        }).eq('id', profileEmp.id);
      toast.success("Profile Updated");
      fetchData();
      setIsProfileModalOpen(false);
  };

  const handleArchiveEmployee = async () => {
      if (!profileEmp) return;
      if (!confirm(`Archive ${profileEmp.full_name}?`)) return;
      await supabase.from('users').update({ user_level: 100 }).eq('id', profileEmp.id);
      toast.success("Employee Archived");
      fetchData();
      setIsProfileModalOpen(false);
  };

  // --- GROUPING LOGIC (With Visiting Staff) ---
  const groupedEmployees: Record<string, Record<string, Employee[]>> = {};
  
  // 1. Initialize Structure
  Object.keys(LOCATIONS).forEach(loc => {
      groupedEmployees[loc] = {};
      LOCATIONS[loc as keyof typeof LOCATIONS].forEach(dept => {
          groupedEmployees[loc][dept] = [];
      });
      // Add a special bucket for Visiting Staff in every location
      groupedEmployees[loc]['Visiting Staff'] = [];
  });
  groupedEmployees['Unassigned'] = { 'General': [] };

  // 2. Sort Employees into Home Bases
  employees.forEach(emp => {
      const loc = LOCATIONS[emp.location as keyof typeof LOCATIONS] ? emp.location : 'Unassigned';
      let dept = emp.department;
      if (loc !== 'Unassigned' && !groupedEmployees[loc][dept]) dept = Object.keys(groupedEmployees[loc])[0];
      if (loc === 'Unassigned') dept = 'General';
      if (!groupedEmployees[loc][dept]) groupedEmployees[loc][dept] = [];
      
      groupedEmployees[loc][dept].push(emp);
  });

  // 3. Detect & Inject Visiting Staff
  // Look for shifts where shift.location != employee.location
  shifts.forEach(shift => {
      const emp = employees.find(e => e.id === shift.user_id);
      if (!emp) return;

      // If shift has a location, and it's different from home
      if (shift.location && shift.location !== emp.location && LOCATIONS[shift.location as keyof typeof LOCATIONS]) {
          const targetLoc = shift.location;
          const visitingBucket = groupedEmployees[targetLoc]['Visiting Staff'];
          
          // Only add them once per location per week
          if (!visitingBucket.find(v => v.id === emp.id)) {
              visitingBucket.push(emp);
          }
      }
  });

  return (
    <div className="p-4 h-screen flex flex-col bg-background text-foreground">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
        <div>
          <h1 className="text-2xl font-bold">SunBuggy Roster</h1>
          <p className="text-muted-foreground text-sm flex items-center gap-2">
            {startOfWeek.format('MMM D')} - {startOfWeek.clone().add(6, 'days').format('MMM D, YYYY')}
          </p>
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Button variant="secondary" className="mr-2" onClick={handleCopyWeek} disabled={copying || shifts.length === 0}>
            {copying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4 mr-2" />} Copy Week
          </Button>
          <div className="flex items-center border rounded-md bg-card shadow-sm">
            <Button variant="ghost" size="icon" onClick={() => setCurrentDate(currentDate.clone().subtract(1, 'week'))}><ChevronLeft className="w-4 h-4" /></Button>
            <Button variant="ghost" size="sm" onClick={() => setCurrentDate(moment())}>Today</Button>
            <Button variant="ghost" size="icon" onClick={() => setCurrentDate(currentDate.clone().add(1, 'week'))}><ChevronRight className="w-4 h-4" /></Button>
          </div>
        </div>
      </div>

      {/* ROSTER TABLE */}
      <div className="flex-1 overflow-auto border rounded-lg shadow-sm bg-card">
        <table className="w-full border-collapse min-w-[1000px] text-sm">
          <thead className="sticky top-0 bg-muted z-20 shadow-sm">
            <tr>
              <th className="p-2 text-left w-56 border-b font-bold text-muted-foreground bg-muted pl-4">Staff</th>
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
                // Determine if we should show this Location block
                const hasPeople = Object.values(departments).some(arr => arr.length > 0);
                if (!hasPeople) return null;

                return (
                    <>
                    <tr key={locName} className="bg-slate-900 text-white">
                        <td colSpan={8} className="p-2 font-bold uppercase tracking-wider text-xs border-b border-slate-700">
                            <MapPin className="w-3 h-3 inline mr-2" /> {locName}
                        </td>
                    </tr>
                    {Object.entries(departments).map(([deptName, deptEmps]) => {
                        if (deptEmps.length === 0) return null;
                        
                        // Style check for Visiting Staff header
                        const isVisitingSection = deptName === 'Visiting Staff';

                        return (
                            <>
                            <tr key={`${locName}-${deptName}`} className={`
                                ${isVisitingSection ? 'bg-amber-50 dark:bg-amber-950/30' : 'bg-slate-100 dark:bg-slate-800'}
                            `}>
                                <td colSpan={8} className={`
                                    p-1 pl-4 font-semibold text-xs uppercase border-b
                                    ${isVisitingSection ? 'text-amber-600 dark:text-amber-500' : 'text-slate-500'}
                                `}>
                                    {isVisitingSection && <Plane className="w-3 h-3 inline mr-1 mb-0.5" />}
                                    {deptName}
                                </td>
                            </tr>
                            {deptEmps.map(emp => (
                                <tr key={`${locName}-${emp.id}`} className="hover:bg-muted/20 transition-colors border-b">
                                    <td className="p-0 border-r border-r-slate-100 dark:border-r-slate-800 sticky left-0 z-10 bg-card">
                                        <div 
                                            className="p-2 w-56 cursor-pointer hover:bg-blue-50 hover:text-blue-600 transition-colors flex flex-col justify-center h-full group"
                                            onClick={(e) => handleNameClick(e, emp)}
                                        >
                                            <div className="font-medium flex items-center gap-2">
                                                <span className={isVisitingSection ? "italic text-amber-700 dark:text-amber-400" : ""}>
                                                    {emp.full_name}
                                                </span>
                                                {/* Show Home Location badge if visiting */}
                                                {isVisitingSection && (
                                                    <span className="text-[9px] bg-slate-200 text-slate-600 px-1 rounded">from {emp.location}</span>
                                                )}
                                                <UserCog className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
                                            </div>
                                            {!isVisitingSection && (
                                                <div className="text-[10px] text-muted-foreground">
                                                    Joined: {emp.hire_date ? moment(emp.hire_date).format('MMM YYYY') : '-'}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    {weekDays.map(day => {
                                        const dateStr = day.format('YYYY-MM-DD');
                                        const shift = shifts.find(s => s.user_id === emp.id && moment(s.start_time).format('YYYY-MM-DD') === dateStr);
                                        
                                        // LOGIC: Should we show the shift here?
                                        // 1. If we are in Home Section, show ALL shifts (with note if away)
                                        // 2. If we are in Visiting Section, ONLY show shifts that match this location
                                        
                                        let shouldRenderShift = false;
                                        const shiftLoc = shift?.location || emp.location; // Default shift loc to home if null

                                        if (shift) {
                                            if (!isVisitingSection) {
                                                // Home Section: Always show
                                                shouldRenderShift = true;
                                            } else {
                                                // Visiting Section: Only show if shift matches this block's location
                                                if (shiftLoc === locName) shouldRenderShift = true;
                                            }
                                        }

                                        // Is Away Note? (Only for Home Section)
                                        const isAway = shift && shiftLoc !== emp.location && !isVisitingSection;

                                        return (
                                            <td 
                                                key={dateStr} 
                                                className={`
                                                    p-1 border-l relative h-14 cursor-pointer group
                                                    ${!isVisitingSection ? 'hover:bg-slate-50 dark:hover:bg-slate-800/50' : ''}
                                                `}
                                                // Disable clicking in Visiting section to prevent confusion? Or allow it? 
                                                // Let's allow it, but it edits the master shift.
                                                onClick={() => handleCellClick(emp, dateStr, shift)}
                                            >
                                                {shouldRenderShift && shift ? (
                                                    <div className={`
                                                        h-full w-full border-l-2 rounded-r p-1 flex flex-col justify-center
                                                        ${isAway ? 'bg-amber-50 border-l-amber-500' : 'bg-blue-100 dark:bg-blue-900/40 border-l-blue-500'}
                                                    `}>
                                                        <span className="font-bold text-foreground text-xs leading-none mb-0.5">
                                                            {moment(shift.start_time).format('h:mmA')}
                                                        </span>
                                                        <span className="text-[10px] text-muted-foreground leading-none">
                                                            - {moment(shift.end_time).format('h:mmA')}
                                                        </span>
                                                        
                                                        {/* NOTE: Show location if away */}
                                                        {isAway && (
                                                            <div className="text-[9px] font-bold text-amber-700 mt-1 uppercase flex items-center">
                                                                <Plane className="w-2 h-2 mr-1" />
                                                                {shiftLoc}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    // Only show "Plus" button in Home section
                                                    !isVisitingSection && (
                                                        <div className="h-full w-full flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                            <Plus className="w-4 h-4 text-muted-foreground/30" />
                                                        </div>
                                                    )
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                            </>
                        );
                    })}
                    </>
                );
            })}
          </tbody>
        </table>
      </div>

      {/* --- SHIFT MODAL --- */}
      <Dialog open={isShiftModalOpen} onOpenChange={setIsShiftModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Schedule Shift</DialogTitle>
            <div className="text-sm text-muted-foreground">{selectedEmpName} • {selectedDate}</div>
          </DialogHeader>
          <div className="grid gap-4 py-2">
             <div className="grid grid-cols-2 gap-4">
               <div><label className="text-xs font-bold text-muted-foreground">Start</label><Input type="time" value={formStart} onChange={handleStartTimeChange} /></div>
               <div><label className="text-xs font-bold text-muted-foreground">End</label><Input type="time" value={formEnd} onChange={e => setFormEnd(e.target.value)} /></div>
             </div>
             
             {/* ROLE SELECTOR */}
             <div>
                <label className="text-xs font-bold text-muted-foreground">Role</label>
                <Select value={formRole} onValueChange={setFormRole}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Guide">Tour Guide</SelectItem>
                    <SelectItem value="Desk">Front Desk</SelectItem>
                    <SelectItem value="Driver">Shuttle Driver</SelectItem>
                    <SelectItem value="Mechanic">Mechanic</SelectItem>
                    <SelectItem value="Manager">Manager</SelectItem>
                  </SelectContent>
                </Select>
             </div>

             {/* LOCATION SELECTOR */}
             <div>
                <label className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Work Location
                </label>
                <Select value={formLocation} onValueChange={setFormLocation}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.keys(LOCATIONS).map(loc => (
                        <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
             </div>

          </div>
          <DialogFooter className="flex justify-between sm:justify-between w-full">
            {selectedShiftId ? (
               <Button variant="destructive" size="sm" onClick={handleDeleteShift} type="button"><Trash2 className="w-4 h-4 mr-2" /> Delete</Button>
            ) : <div />} 
            <Button size="sm" onClick={handleSaveShift}>Save Shift</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- PROFILE MODAL --- */}
      <Dialog open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
                <UserCog className="w-5 h-5" /> Edit Employee
            </DialogTitle>
          </DialogHeader>
          
          {profileEmp && (
            <div className="grid gap-4 py-2">
                <div className="text-lg font-bold border-b pb-2">{profileEmp.full_name}</div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-muted-foreground mb-1 block">Home Location</label>
                        <Select value={profileEmp.location} onValueChange={(val) => setProfileEmp({...profileEmp, location: val})}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {Object.keys(LOCATIONS).map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-muted-foreground mb-1 block">Department</label>
                        <Select value={profileEmp.department} onValueChange={(val) => setProfileEmp({...profileEmp, department: val})}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {(LOCATIONS[profileEmp.location as keyof typeof LOCATIONS] || []).map(d => (
                                    <SelectItem key={d} value={d}>{d}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div>
                    <label className="text-xs font-bold text-muted-foreground mb-1 flex items-center gap-1">
                        <CalendarDays className="w-3 h-3" /> Hire Date (for Seniority)
                    </label>
                    <Input 
                        type="date" 
                        value={profileEmp.hire_date || ''} 
                        onChange={(e) => setProfileEmp({...profileEmp, hire_date: e.target.value})} 
                    />
                </div>
                <div className="flex items-center justify-between border p-3 rounded bg-slate-50 dark:bg-slate-900/50">
                    <div>
                        <h4 className="text-sm font-bold flex items-center gap-2">
                            <Ban className="w-4 h-4 text-red-500" /> Block Timeclock Access
                        </h4>
                        <p className="text-[10px] text-muted-foreground">
                            Prevents this employee from clocking in.
                        </p>
                    </div>
                    <Switch 
                        checked={profileEmp.timeclock_blocked}
                        onCheckedChange={(checked) => setProfileEmp({...profileEmp, timeclock_blocked: checked})}
                    />
                </div>

                <div className="bg-red-50 p-3 rounded-md border border-red-100 mt-2">
                    <h4 className="text-red-800 text-xs font-bold mb-1 flex items-center gap-1">
                        <Ban className="w-3 h-3" /> Danger Zone
                    </h4>
                    <p className="text-[10px] text-red-600 mb-2">
                        Archiving removes this user from the schedule by downgrading them to &apos;Customer&apos;.
                    </p>
                    <Button variant="destructive" size="sm" className="w-full" onClick={handleArchiveEmployee}>
                        Archive / Remove from Schedule
                    </Button>
                </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsProfileModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveProfile}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}