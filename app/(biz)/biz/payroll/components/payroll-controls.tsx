/**
 * @file app/(biz)/biz/payroll/components/payroll-controls.tsx
 * @description Date navigation focused on "Week Numbers" with Calendar Override.
 */
'use client';

import { useTransition, useRef } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { addWeeks, subWeeks, format, parseISO, isValid } from 'date-fns';

type PayrollControlsProps = {
  weekStart: string; // "2026-01-05"
  weekEnd: string;
  weekLabel: string;
  weekNumber: number; // e.g. 2
};

export function PayrollControls({ weekStart, weekEnd, weekNumber }: PayrollControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const dateInputRef = useRef<HTMLInputElement>(null);

  // HELPER: Push new date to URL
  const updateDate = (newDate: Date) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('date', format(newDate, 'yyyy-MM-dd'));
    
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handleWeekChange = (direction: 'prev' | 'next' | 'current') => {
    let dateObj = parseISO(weekStart);
    if (!isValid(dateObj)) dateObj = new Date();

    if (direction === 'prev') updateDate(subWeeks(dateObj, 1));
    if (direction === 'next') updateDate(addWeeks(dateObj, 1));
    if (direction === 'current') updateDate(new Date());
  };

  // CALENDAR OVERRIDE
  const handleCalendarPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.valueAsDate) {
      updateDate(e.target.valueAsDate);
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 items-center justify-between w-full p-3 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
      
      {/* 1. WEEK NAVIGATION AREA */}
      <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-800 p-1.5 rounded-lg border border-gray-200 dark:border-slate-700">
        
        {/* PREV BUTTON */}
        <button 
          onClick={() => handleWeekChange('prev')} 
          disabled={isPending}
          className="p-3 hover:bg-white dark:hover:bg-slate-700 rounded-md shadow-sm transition-all text-gray-600 dark:text-gray-300 active:scale-95"
          title="Previous Week"
        >
           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
        </button>

        {/* WEEK DISPLAY (Click to Open Calendar) */}
        <div 
          className="relative group cursor-pointer text-center px-4 min-w-[160px]"
          onClick={() => dateInputRef.current?.showPicker()}
        >
          <div className="text-xs text-gray-500 font-bold tracking-widest uppercase mb-0.5">
            Payroll Week
          </div>
          <div className="text-3xl font-black text-gray-900 dark:text-white leading-none flex items-center justify-center gap-2">
            #{weekNumber}
            {/* Tiny calendar icon to hint clickability */}
            <svg className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </div>
          <div className="text-[10px] text-gray-400 font-mono mt-1">
            {weekStart} thru {weekEnd}
          </div>

          {/* HIDDEN NATIVE PICKER */}
          <input 
            ref={dateInputRef}
            type="date" 
            className="absolute inset-0 opacity-0 cursor-pointer"
            onChange={handleCalendarPick}
            defaultValue={weekStart} 
          />
        </div>

        {/* NEXT BUTTON */}
        <button 
          onClick={() => handleWeekChange('next')} 
          disabled={isPending}
          className="p-3 hover:bg-white dark:hover:bg-slate-700 rounded-md shadow-sm transition-all text-gray-600 dark:text-gray-300 active:scale-95"
          title="Next Week"
        >
           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>

      {/* 2. ACTIONS / CURRENT */}
      <div className="flex gap-3">
         <button 
           onClick={() => handleWeekChange('current')}
           className="px-4 py-2 text-sm font-bold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-800 rounded-lg transition-colors"
         >
           Jump to Current
         </button>
         
         <div className="h-full w-px bg-gray-300 dark:bg-slate-700 mx-1"></div>

         <button className="px-4 py-2 bg-gray-900 dark:bg-slate-600 text-white rounded-lg text-sm font-medium hover:bg-gray-800 shadow-sm transition-colors flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
            Export CSV
         </button>
      </div>
    </div>
  );
}