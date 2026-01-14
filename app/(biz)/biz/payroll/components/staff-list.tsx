/**
 * STAFF LIST
 * Path: app/(biz)/biz/payroll/components/staff-list.tsx
 * Update: Improved Dark Mode readability and contrast per THEMING.md.
 */

'use client';

import React, { useState, useMemo } from 'react';
import { Search, Check } from 'lucide-react'; // Using Lucide icons for consistency

type StaffProp = {
  id: string;
  full_name: string;
  ui_role: string;
  job_title: string | null;
  employee_details: {
    primary_work_location: string | null;
  } | null;
};

interface StaffListProps {
  staff: StaffProp[];
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  filterLoc: string;
  onFilterLocChange: (loc: string) => void;
}

export function StaffList({ 
  staff, 
  selectedIds, 
  onSelectionChange,
  filterLoc,
  onFilterLocChange 
}: StaffListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // --- FILTERING LOGIC ---
  const filteredStaff = useMemo(() => {
    return staff.filter(person => {
      const matchesSearch = person.full_name.toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchesLoc = true;
      const loc = person.employee_details?.primary_work_location?.toLowerCase() || '';
      
      if (filterLoc === 'VEGAS') matchesLoc = loc.includes('vegas');
      if (filterLoc === 'PISMO') matchesLoc = loc.includes('pismo');
      if (filterLoc === 'SILVER') matchesLoc = loc.includes('silver');

      return matchesSearch && matchesLoc;
    });
  }, [staff, searchTerm, filterLoc]);

  // --- HANDLERS ---
  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    onSelectionChange(newSet);
  };

  const toggleAllVisible = () => {
    const newSet = new Set(selectedIds);
    const allVisibleAreSelected = filteredStaff.length > 0 && filteredStaff.every(s => newSet.has(s.id));
    
    if (allVisibleAreSelected) {
        filteredStaff.forEach(s => newSet.delete(s.id));
    } else {
        filteredStaff.forEach(s => newSet.add(s.id));
    }
    onSelectionChange(newSet);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-950 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      
      {/* HEADER */}
      <div className="p-3 bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800 space-y-3">
         
         {/* Search */}
         <div className="relative">
            <input 
                type="text" 
                placeholder="Search staff..." 
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-zinc-100 placeholder:text-zinc-400 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
         </div>

         {/* Location Tabs */}
         <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {['ALL', 'VEGAS', 'PISMO', 'SILVER'].map(loc => (
                <button 
                    key={loc} 
                    onClick={() => onFilterLocChange(loc)}
                    className={`
                        px-3 py-1 text-[10px] font-bold rounded-full border transition-all whitespace-nowrap
                        ${filterLoc === loc 
                            ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100' 
                            : 'bg-white dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'}
                    `}
                >
                    {loc === 'ALL' ? 'ALL LOCATIONS' : loc}
                </button>
            ))}
         </div>

         {/* Select All Bar */}
         <div 
            onClick={toggleAllVisible} 
            className="flex items-center justify-between px-2 py-1.5 bg-blue-50/50 dark:bg-blue-900/10 rounded cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-colors select-none group border border-blue-100 dark:border-blue-900/30"
         >
             <div className="flex items-center gap-2 text-xs font-bold text-blue-700 dark:text-blue-300">
                <div className={`
                    w-4 h-4 rounded border flex items-center justify-center transition-colors
                    ${filteredStaff.length > 0 && filteredStaff.every(s => selectedIds.has(s.id)) 
                        ? 'bg-blue-600 border-blue-600 dark:bg-blue-500 dark:border-blue-500' 
                        : 'border-blue-300 dark:border-blue-700 bg-white dark:bg-zinc-900'}
                `}>
                    {filteredStaff.length > 0 && filteredStaff.every(s => selectedIds.has(s.id)) && (
                        <Check className="w-3 h-3 text-white" strokeWidth={4} />
                    )}
                </div>
                <span>
                   {filteredStaff.length > 0 && filteredStaff.every(s => selectedIds.has(s.id)) ? 'Deselect All' : 'Select All'} ({filteredStaff.length})
                </span>
             </div>
             <span className="text-[10px] font-mono text-blue-600/70 dark:text-blue-400/70">{selectedIds.size} Checked</span>
         </div>
      </div>

      {/* LIST CONTENT */}
      <div className="overflow-y-auto flex-1 p-2 space-y-1 bg-zinc-50/30 dark:bg-black/20">
         {filteredStaff.map(person => {
             const isChecked = selectedIds.has(person.id);
             return (
                 <div 
                    key={person.id} 
                    onClick={() => toggleSelection(person.id)}
                    className={`
                        group flex items-center gap-3 p-2 rounded-lg cursor-pointer border transition-all duration-150
                        ${isChecked 
                            ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800/50 shadow-sm' 
                            : 'bg-white dark:bg-zinc-900/40 border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800/80 hover:border-zinc-200 dark:hover:border-zinc-700'}
                    `}
                 >
                    {/* CHECKBOX VISUAL */}
                    <div className={`
                         w-5 h-5 rounded border flex items-center justify-center transition-all
                         ${isChecked 
                            ? 'bg-blue-600 border-blue-600 dark:bg-blue-500 dark:border-blue-500' 
                            : 'bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-600 group-hover:border-blue-400 dark:group-hover:border-blue-500'}
                    `}>
                        {isChecked && <Check className="w-3.5 h-3.5 text-white" strokeWidth={4} />}
                    </div>

                    {/* TEXT CONTENT */}
                    <div className="flex-1 overflow-hidden">
                        <div className="flex justify-between items-center mb-0.5">
                            <span className={`font-medium text-sm truncate transition-colors ${isChecked ? 'text-blue-900 dark:text-blue-100 font-bold' : 'text-zinc-700 dark:text-zinc-200'}`}>
                                {person.full_name}
                            </span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono border ${isChecked ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800' : 'bg-zinc-100 text-zinc-500 border-zinc-100 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700'}`}>
                                {person.ui_role}
                            </span>
                        </div>
                        <div className="text-[10px] flex justify-between items-center">
                            <span className={`${isChecked ? 'text-blue-600/80 dark:text-blue-300/70' : 'text-zinc-500 dark:text-zinc-500'}`}>
                                {person.job_title || 'Staff'}
                            </span>
                            <span className={`uppercase tracking-wider font-bold ${isChecked ? 'text-blue-400 dark:text-blue-500' : 'text-zinc-300 dark:text-zinc-600'}`}>
                                {person.employee_details?.primary_work_location?.substring(0, 12) || 'N/A'}
                            </span>
                        </div>
                    </div>
                 </div>
             );
         })}
      </div>
    </div>
  );
}