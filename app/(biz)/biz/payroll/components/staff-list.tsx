/**
 * STAFF LIST
 * Path: app/(biz)/biz/payroll/components/staff-list.tsx
 * Update: LIFTED STATE. Now accepts 'filterLoc' as a prop so the parent knows the location.
 */

'use client';

import React, { useState, useMemo } from 'react';

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
  // NEW PROPS FOR STATE LIFTING
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
      // 1. Search Text
      const matchesSearch = person.full_name.toLowerCase().includes(searchTerm.toLowerCase());
      
      // 2. Location Filter
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
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
      
      {/* HEADER */}
      <div className="p-3 bg-gray-50 dark:bg-slate-950 border-b border-gray-100 dark:border-slate-800 space-y-3">
         
         {/* Search */}
         <div className="relative">
            <input 
                type="text" 
                placeholder="Search staff..." 
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
         </div>

         {/* Location Tabs (Controlled by Parent) */}
         <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {['ALL', 'VEGAS', 'PISMO', 'SILVER'].map(loc => (
                <button 
                    key={loc} 
                    onClick={() => onFilterLocChange(loc)}
                    className={`
                        px-3 py-1 text-[10px] font-bold rounded-full border transition-all whitespace-nowrap
                        ${filterLoc === loc 
                            ? 'bg-gray-800 text-white border-gray-800 dark:bg-white dark:text-slate-900' 
                            : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-600 hover:bg-gray-100'}
                    `}
                >
                    {loc === 'ALL' ? 'ALL LOCATIONS' : loc}
                </button>
            ))}
         </div>

         {/* Select All Bar */}
         <div 
            onClick={toggleAllVisible} 
            className="flex items-center justify-between px-2 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded cursor-pointer hover:bg-blue-100 transition-colors select-none group border border-blue-100 dark:border-blue-900"
         >
             <div className="flex items-center gap-2 text-xs font-bold text-blue-700 dark:text-blue-300">
                <div className={`
                    w-4 h-4 rounded border flex items-center justify-center transition-colors
                    ${filteredStaff.length > 0 && filteredStaff.every(s => selectedIds.has(s.id)) 
                        ? 'bg-blue-600 border-blue-600' 
                        : 'border-blue-300 bg-white dark:bg-slate-800'}
                `}>
                    {filteredStaff.length > 0 && filteredStaff.every(s => selectedIds.has(s.id)) && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>
                    )}
                </div>
                <span>
                   {filteredStaff.length > 0 && filteredStaff.every(s => selectedIds.has(s.id)) ? 'Deselect All Visible' : 'Select All Visible'} ({filteredStaff.length})
                </span>
             </div>
             <span className="text-[10px] font-mono text-blue-600/70 dark:text-blue-400">{selectedIds.size} Checked</span>
         </div>
      </div>

      {/* LIST CONTENT */}
      <div className="overflow-y-auto flex-1 p-2 space-y-1">
         {filteredStaff.map(person => {
             const isChecked = selectedIds.has(person.id);
             return (
                 <div 
                    key={person.id} 
                    onClick={() => toggleSelection(person.id)}
                    className={`
                        group flex items-center gap-3 p-2 rounded-lg cursor-pointer border transition-all
                        ${isChecked 
                            ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' 
                            : 'bg-white border-transparent hover:bg-gray-50 dark:hover:bg-slate-800'}
                    `}
                 >
                    <div className={`
                         w-5 h-5 rounded border flex items-center justify-center transition-colors
                         ${isChecked 
                            ? 'bg-blue-600 border-blue-600' 
                            : 'bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 group-hover:border-blue-400'}
                    `}>
                        {isChecked && <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <div className="flex justify-between items-center">
                            <span className={`font-bold text-sm truncate ${isChecked ? 'text-blue-900 dark:text-blue-100' : 'text-gray-700 dark:text-gray-200'}`}>
                                {person.full_name}
                            </span>
                            <span className="text-[10px] px-1.5 rounded bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400 font-mono">
                                {person.ui_role}
                            </span>
                        </div>
                        <div className="text-[10px] flex justify-between text-gray-400 mt-0.5">
                            <span>{person.job_title || 'Staff'}</span>
                            <span className="uppercase tracking-wide">{person.employee_details?.primary_work_location || 'N/A'}</span>
                        </div>
                    </div>
                 </div>
             );
         })}
      </div>
    </div>
  );
}