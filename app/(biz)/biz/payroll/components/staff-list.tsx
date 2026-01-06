/**
 * @file app/(biz)/biz/payroll/components/staff-list.tsx
 * @description Logic: Updates URL ?userIds=1,2,3 based on checkboxes.
 */
'use client';

import React, { useState, useMemo } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

type StaffProp = {
  id: string;
  full_name: string;
  ui_role: string;
  job_title: string | null;
  employee_details: {
    primary_work_location: string | null;
  } | null;
};

export function StaffList({ staff }: { staff: StaffProp[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 1. SYNC: Read Checkboxes from URL
  const selectedIds = useMemo(() => {
    const param = searchParams.get('userIds');
    if (!param) return new Set<string>();
    return new Set(param.split(','));
  }, [searchParams]);

  // 2. FILTERING
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLoc, setFilterLoc] = useState<string>('ALL');

  const filteredStaff = useMemo(() => {
    return staff.filter(person => {
      const matchesSearch = person.full_name.toLowerCase().includes(searchTerm.toLowerCase());
      const loc = person.employee_details?.primary_work_location?.toLowerCase() || '';
      
      let matchesLoc = true;
      if (filterLoc === 'VEGAS') matchesLoc = loc.includes('vegas');
      if (filterLoc === 'PISMO') matchesLoc = loc.includes('pismo');
      if (filterLoc === 'SILVER') matchesLoc = loc.includes('silver');

      return matchesSearch && matchesLoc;
    });
  }, [staff, searchTerm, filterLoc]);

  // 3. ACTION: Update URL
  const updateSelection = (newSet: Set<string>) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newSet.size > 0) {
      params.set('userIds', Array.from(newSet).join(','));
    } else {
      params.delete('userIds');
    }
    // scroll: false keeps the user's place in the list
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const toggleOne = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    updateSelection(newSet);
  };

  const toggleAllVisible = () => {
    const newSet = new Set(selectedIds);
    const allVisibleAreSelected = filteredStaff.every(s => newSet.has(s.id));

    if (allVisibleAreSelected) {
      // Uncheck them
      filteredStaff.forEach(s => newSet.delete(s.id));
    } else {
      // Check them
      filteredStaff.forEach(s => newSet.add(s.id));
    }
    updateSelection(newSet);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
      
      {/* HEADER CONTROLS */}
      <div className="p-3 bg-gray-50 dark:bg-slate-950 border-b border-gray-100 dark:border-slate-800 space-y-3">
        {/* Search */}
        <div className="relative">
          <input 
            type="text"
            placeholder="Search Name or Title..."
            className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <svg className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        </div>
        
        {/* Location Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {['ALL', 'VEGAS', 'PISMO', 'SILVER'].map((loc) => (
            <button
              key={loc}
              onClick={() => setFilterLoc(loc)}
              className={`
                px-3 py-1 text-[10px] font-bold rounded-full border transition-all whitespace-nowrap
                ${filterLoc === loc 
                  ? 'bg-gray-800 text-white border-gray-800 dark:bg-white dark:text-slate-900' 
                  : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-600 hover:bg-gray-100'}
              `}
            >
              {loc === 'ALL' ? 'ALL STAFF' : loc}
            </button>
          ))}
        </div>

        {/* Select All Bar */}
        <div 
          onClick={toggleAllVisible}
          className="flex items-center justify-between px-2 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded cursor-pointer hover:bg-blue-100 transition-colors select-none group"
        >
           <div className="flex items-center gap-2 text-xs font-bold text-blue-700 dark:text-blue-300">
             <div className={`w-4 h-4 rounded border flex items-center justify-center ${filteredStaff.length > 0 && filteredStaff.every(s => selectedIds.has(s.id)) ? 'bg-blue-600 border-blue-600' : 'border-blue-300 bg-white'}`}>
                {filteredStaff.length > 0 && filteredStaff.every(s => selectedIds.has(s.id)) && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>}
             </div>
             <span>Select All Visible ({filteredStaff.length})</span>
           </div>
           <span className="text-[10px] font-mono text-blue-600/70">{selectedIds.size} Checked</span>
        </div>
      </div>

      {/* STAFF LIST */}
      <div className="overflow-y-auto flex-1 p-2 space-y-1">
        {filteredStaff.map((person) => {
          const isChecked = selectedIds.has(person.id);
          
          return (
            <div 
              key={person.id}
              onClick={() => toggleOne(person.id)}
              className={`
                group flex items-center gap-3 p-2 rounded-lg cursor-pointer border transition-all
                ${isChecked 
                  ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' 
                  : 'bg-white border-transparent hover:bg-gray-50 dark:hover:bg-slate-800'
                }
              `}
            >
              <div className={`
                 w-5 h-5 rounded border flex items-center justify-center transition-colors
                 ${isChecked ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300 group-hover:border-blue-400'}
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
                  <span>{person.job_title || 'N/A'}</span>
                  <span className="uppercase tracking-wide">{person.employee_details?.primary_work_location}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}