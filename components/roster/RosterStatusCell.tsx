'use client';

import React from 'react';
import { format, isSameDay, parseISO, isWithinInterval } from 'date-fns'; // Replacing moment.js
import { Check, X, Ban, AlertCircle } from 'lucide-react';
import { processTimeOffRequest } from '@/app/actions/roster-actions';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// --- TYPES (Import these from your central types file ideally) ---
type TimeOffRequest = {
  id: string;
  start_date: string; // ISO string YYYY-MM-DD
  end_date: string;
  reason: string | null;
  status: 'pending' | 'approved' | 'denied';
};

type AvailabilityRule = {
  day_of_week: number; // 0-6
  preference_level: 'unavailable' | 'available' | 'preferred_off';
  start_time?: string;
  end_time?: string;
};

interface RosterStatusCellProps {
  date: Date;
  requests: TimeOffRequest[];
  availability: AvailabilityRule[];
  isManager: boolean; // Level 500+
}

export default function RosterStatusCell({ 
  date, 
  requests, 
  availability, 
  isManager 
}: RosterStatusCellProps) {

  // 1. CHECK TIME OFF REQUESTS
  // Filter for requests that cover this specific date AND are not denied
  const activeRequest = requests.find(req => {
    if (req.status === 'denied') return false;
    
    // Parse strings to Dates for interval check
    // We treat dates as local YYYY-MM-DD to avoid timezone shifts
    const start = parseISO(req.start_date);
    const end = parseISO(req.end_date);
    
    return isWithinInterval(date, { start, end });
  });

  // 2. CHECK AVAILABILITY PATTERNS
  // Map date to 0 (Sunday) - 6 (Saturday)
  const dayOfWeek = date.getDay(); 
  const availabilityRule = availability.find(r => r.day_of_week === dayOfWeek);

  // --- RENDER LOGIC ---

  // SCENARIO A: PENDING REQUEST (High Priority for Manager)
  if (activeRequest?.status === 'pending') {
    return (
      <div className="h-full w-full bg-orange-100 dark:bg-orange-900/30 border border-orange-300 dark:border-orange-700 p-1 flex flex-col justify-between animate-in fade-in">
        <div className="flex items-start gap-1">
          <AlertCircle className="w-3 h-3 text-orange-600 mt-0.5" />
          <span className="text-[10px] leading-tight font-bold text-orange-800 dark:text-orange-200 line-clamp-2">
            REQ: {activeRequest.reason || 'Time Off'}
          </span>
        </div>

        {isManager ? (
          <div className="flex gap-1 mt-1">
            {/* APPROVE BUTTON */}
            <form action={processTimeOffRequest} className="flex-1">
              <input type="hidden" name="requestId" value={activeRequest.id} />
              <input type="hidden" name="status" value="approved" />
              <button className="w-full flex justify-center items-center bg-green-600 hover:bg-green-500 text-white rounded py-1 transition-colors">
                <Check className="w-3 h-3" />
              </button>
            </form>

            {/* DENY BUTTON */}
            <form action={processTimeOffRequest} className="flex-1">
              <input type="hidden" name="requestId" value={activeRequest.id} />
              <input type="hidden" name="status" value="denied" />
              <button className="w-full flex justify-center items-center bg-red-600 hover:bg-red-500 text-white rounded py-1 transition-colors">
                <X className="w-3 h-3" />
              </button>
            </form>
          </div>
        ) : (
          <span className="text-[10px] text-orange-600 font-mono text-center">PENDING</span>
        )}
      </div>
    );
  }

  // SCENARIO B: APPROVED TIME OFF (Blocks Scheduling)
  if (activeRequest?.status === 'approved') {
    return (
      <div className="h-full w-full bg-yellow-400/90 dark:bg-yellow-600/90 flex flex-col items-center justify-center p-2 text-center border-l-4 border-yellow-600 dark:border-yellow-400">
        <span className="text-xs font-black uppercase text-black dark:text-white tracking-widest">OFF</span>
        <span className="text-[10px] leading-none text-black/70 dark:text-white/80 font-semibold line-clamp-1">
          {activeRequest.reason || 'Approved'}
        </span>
      </div>
    );
  }

  // SCENARIO C: PREFERRED OFF (Soft Warning)
  if (availabilityRule?.preference_level === 'preferred_off') {
    return (
      <div className="h-full w-full relative group">
         {/* Background pattern to indicate preference without blocking visibility of potential shifts */}
         <div className="absolute inset-0 bg-slate-100 dark:bg-slate-800/50 pattern-diagonal-lines opacity-50" />
         
         <TooltipProvider>
           <Tooltip>
             <TooltipTrigger asChild>
                <div className="absolute top-1 right-1 cursor-help">
                   <div className="bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-100 text-[9px] font-bold px-1 rounded uppercase tracking-tighter">
                     Prefers Off
                   </div>
                </div>
             </TooltipTrigger>
             <TooltipContent>
               <p>Employee prefers not to work on {format(date, 'EEEE')}s.</p>
             </TooltipContent>
           </Tooltip>
         </TooltipProvider>
      </div>
    );
  }

  // SCENARIO D: HARD UNAVAILABLE (Availability Rule)
  if (availabilityRule?.preference_level === 'unavailable') {
    return (
      <div className="h-full w-full bg-slate-200 dark:bg-slate-900 flex items-center justify-center opacity-70">
         <div className="flex flex-col items-center text-slate-400">
            <Ban className="w-4 h-4 mb-1" />
            <span className="text-[10px] font-bold uppercase">N/A</span>
         </div>
      </div>
    );
  }

  // DEFAULT: Empty Cell (Ready for Shift Assignment)
  return null; 
}