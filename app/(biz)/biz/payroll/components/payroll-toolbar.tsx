/**
 * PAYROLL TOOLBAR
 * Path: app/(biz)/biz/payroll/components/payroll-toolbar.tsx
 * Replaces: payroll-filters.tsx
 * * Features:
 * - Location Filter (Las Vegas, Pismo, etc.)
 * - Multi-Employee Select (Combobox)
 * - Date Range Sync
 * - Dynamic "Total Hours" Metric Display
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { format, parseISO, isValid } from 'date-fns';
import { 
  MapPin, Users, CalendarDays, Calculator, X, Search, Check 
} from 'lucide-react';

// UI Components
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from '@/lib/utils';

// Enhanced User Type
export type ToolbarUser = {
  id: string;
  full_name: string;
  primary_work_location?: string | null; // Optional, from DB
};

interface PayrollToolbarProps {
  weekStart: string; // YYYY-MM-DD
  weekEnd: string;   // YYYY-MM-DD
  totalHours: number; // Calculated by parent
  employeeList: ToolbarUser[];
}

export default function PayrollToolbar({
  weekStart,
  weekEnd,
  totalHours,
  employeeList
}: PayrollToolbarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // --- STATE INIT FROM URL ---
  // We initialize state based on URL params so standard browser navigation works
  const initialLocation = searchParams.get('location') || 'all';
  const initialEmpIds = searchParams.get('employeeIds')?.split(',') || [];

  const [selectedLocation, setSelectedLocation] = useState<string>(initialLocation);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>(initialEmpIds);
  const [dateInputs, setDateInputs] = useState({ start: weekStart, end: weekEnd });
  const [comboboxOpen, setComboboxOpen] = useState(false);

  // --- SYNC DATES WHEN HEADER CHANGES ---
  useEffect(() => {
    setDateInputs({ start: weekStart, end: weekEnd });
  }, [weekStart, weekEnd]);

  // --- MAIN FILTER LOGIC ---
  // This function pushes changes to the URL. The Parent Page (Server Component) 
  // reads the URL -> Fetches Data -> Re-renders this component with new props.
  const applyFilters = (newLocation: string, newEmpIds: string[], newDate?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    // 1. Update Location
    if (newLocation && newLocation !== 'all') params.set('location', newLocation);
    else params.delete('location');

    // 2. Update Employees
    if (newEmpIds.length > 0) params.set('employeeIds', newEmpIds.join(','));
    else params.delete('employeeIds');

    // 3. Update Date (if provided)
    if (newDate) params.set('date', newDate);

    router.replace(`/biz/payroll?${params.toString()}`, { scroll: false });
  };

  // --- HANDLERS ---

  const handleDateChange = (field: 'start' | 'end', value: string) => {
    const newDates = { ...dateInputs, [field]: value };
    setDateInputs(newDates);

    if (field === 'start' && isValid(parseISO(value))) {
        applyFilters(selectedLocation, selectedEmployees, value);
    }
  };

  const handleLocationChange = (val: string) => {
    setSelectedLocation(val);
    applyFilters(val, selectedEmployees);
  };

  const toggleEmployee = (empId: string) => {
    const newSelection = selectedEmployees.includes(empId)
      ? selectedEmployees.filter(id => id !== empId)
      : [...selectedEmployees, empId];
    
    setSelectedEmployees(newSelection);
    applyFilters(selectedLocation, newSelection);
  };

  const clearFilters = () => {
    setSelectedLocation('all');
    setSelectedEmployees([]);
    router.push(`/biz/payroll?date=${weekStart}`); // Keep date, reset others
  };

  // Filter the employee list in the dropdown based on the selected location
  const visibleEmployees = employeeList.filter(emp => {
      if (selectedLocation === 'all') return true;
      // If employee has no location, show them anyway just in case
      return !emp.primary_work_location || emp.primary_work_location === selectedLocation;
  });

  const activeFilterCount = (selectedLocation !== 'all' ? 1 : 0) + selectedEmployees.length;

  return (
    <div className="w-full bg-background border rounded-xl shadow-sm mb-6 overflow-hidden">
      
      {/* Top Bar: Inputs & Actions */}
      <div className="p-4 flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">
        
        {/* --- LEFT: FILTERS --- */}
        <div className="flex flex-col md:flex-row gap-3 w-full xl:w-auto">
            
            {/* 1. DATE RANGE DISPLAY (Read-Onlyish - drives navigation) */}
            <div className="flex items-center gap-2 bg-muted/30 p-1 rounded-lg border">
                <div className="relative">
                    <CalendarDays className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input 
                        type="date" 
                        className="w-36 pl-9 h-9 border-0 bg-transparent focus-visible:ring-0 text-sm font-medium"
                        value={dateInputs.start}
                        onChange={(e) => handleDateChange('start', e.target.value)}
                    />
                </div>
                <span className="text-muted-foreground text-xs font-mono">TO</span>
                <div className="relative">
                    <Input 
                        type="date" 
                        disabled 
                        className="w-36 h-9 border-0 bg-transparent focus-visible:ring-0 text-sm font-medium text-muted-foreground"
                        value={dateInputs.end}
                    />
                </div>
            </div>

            <div className="h-8 w-px bg-border hidden md:block" />

            {/* 2. LOCATION FILTER */}
            <Select value={selectedLocation} onValueChange={handleLocationChange}>
                <SelectTrigger className="w-full md:w-[180px] h-11 md:h-auto bg-muted/30 border-dashed data-[state=open]:border-solid">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4 text-orange-500" />
                        <span className="truncate text-foreground">
                            {selectedLocation === 'all' ? "All Locations" : selectedLocation}
                        </span>
                    </div>
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    <SelectItem value="Las Vegas">Las Vegas</SelectItem>
                    <SelectItem value="Pismo Beach">Pismo Beach</SelectItem>
                    <SelectItem value="Silver Lake">Silver Lake</SelectItem>
                </SelectContent>
            </Select>

            {/* 3. MULTI-EMPLOYEE SEARCH */}
            <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                <PopoverTrigger asChild>
                    <Button 
                        variant="outline" 
                        role="combobox"
                        className={`justify-between w-full md:w-[220px] h-11 md:h-auto border-dashed ${selectedEmployees.length > 0 ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300' : 'bg-muted/30'}`}
                    >
                        <div className="flex items-center gap-2 truncate">
                            <Users className="h-4 w-4" />
                            {selectedEmployees.length === 0 
                                ? "Filter Staff..." 
                                : `${selectedEmployees.length} Selected`
                            }
                        </div>
                        {selectedEmployees.length > 0 && (
                             <Badge variant="secondary" className="ml-2 h-5 px-1 bg-blue-200 text-blue-800 hover:bg-blue-300 dark:bg-blue-800 dark:text-blue-100">
                                {selectedEmployees.length}
                             </Badge>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[280px] p-0" align="start">
                    <Command>
                        <CommandInput placeholder="Search staff..." />
                        <CommandList>
                            <CommandEmpty>No staff found.</CommandEmpty>
                            <CommandGroup heading="Employees">
                                <CommandItem onSelect={() => { setSelectedEmployees([]); applyFilters(selectedLocation, []); setComboboxOpen(false); }}>
                                    <Check className={cn("mr-2 h-4 w-4", selectedEmployees.length === 0 ? "opacity-100" : "opacity-0")} />
                                    ALL EMPLOYEES
                                </CommandItem>
                                {visibleEmployees.map((emp) => (
                                    <CommandItem
                                        key={emp.id}
                                        value={emp.full_name}
                                        onSelect={() => toggleEmployee(emp.id)}
                                    >
                                        <div className="flex items-center flex-1">
                                            <Check className={cn("mr-2 h-4 w-4", selectedEmployees.includes(emp.id) ? "opacity-100" : "opacity-0")} />
                                            <div className="flex flex-col">
                                                <span>{emp.full_name}</span>
                                                {emp.primary_work_location && (
                                                    <span className="text-[10px] text-muted-foreground">{emp.primary_work_location}</span>
                                                )}
                                            </div>
                                        </div>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>

            {/* CLEAR BUTTON */}
            {activeFilterCount > 0 && (
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={clearFilters}
                    className="text-muted-foreground hover:text-red-500"
                    title="Clear Filters"
                >
                    <X className="h-4 w-4" />
                </Button>
            )}
        </div>

        {/* --- RIGHT: DYNAMIC TOTAL HOURS --- */}
        <div className="w-full xl:w-auto flex items-center justify-end">
            <div className="flex items-center gap-4 pl-6 xl:border-l">
                <div className="text-right hidden sm:block">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                        Total Hours
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                        {activeFilterCount > 0 ? 'Filtered Results' : 'Full Fleet'}
                    </p>
                </div>
                
                <div className="flex items-center gap-3 bg-zinc-900 text-white dark:bg-white dark:text-black px-5 py-2.5 rounded-lg shadow-lg transform transition-all">
                    <Calculator className="h-5 w-5 opacity-70" />
                    <span className="text-2xl font-black font-mono tracking-tighter">
                        {totalHours.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-xs font-bold opacity-70 pt-2">hrs</span>
                </div>
            </div>
        </div>

      </div>
      
      {/* Active Filter Tags Row */}
      {activeFilterCount > 0 && (
          <div className="px-4 pb-3 flex flex-wrap gap-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase self-center mr-2">
                  Active Filters:
              </span>
              {selectedLocation !== 'all' && (
                  <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                      <MapPin className="w-3 h-3 mr-1" /> {selectedLocation}
                  </Badge>
              )}
              {selectedEmployees.map(id => {
                  const emp = employeeList.find(e => e.id === id);
                  return emp ? (
                      <Badge key={id} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {emp.full_name}
                          <button onClick={() => toggleEmployee(id)} className="ml-1 hover:text-red-500">
                              <X className="w-3 h-3" />
                          </button>
                      </Badge>
                  ) : null;
              })}
          </div>
      )}
    </div>
  );
}