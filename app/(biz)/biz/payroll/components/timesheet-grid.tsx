/**
 * TIMESHEET GRID
 * Path: app/(biz)/biz/payroll/components/timesheet-grid.tsx
 * Update: Added GPS Map Modal and clickable location pills.
 */

'use client';

import React, { useState } from 'react';
import { format, parseISO, differenceInHours } from 'date-fns';
import { MapPin } from 'lucide-react'; // Icon for the pill
import type { TimeEntry } from '@/app/actions/get-timesheets';
import EditEntryDialog from './edit-entry-dialog'; 
import PunchMapModal from './punch-map-modal'; // <--- NEW IMPORT

// ... (Keep your formatTime / formatDate helpers here)
const formatTime = (isoString: string | null) => {
  if (!isoString) return '--:--';
  try {
    return format(parseISO(isoString), 'hh:mm a');
  } catch (e) {
    return 'Err';
  }
};

const formatDate = (isoString: string) => {
  try {
    return format(parseISO(isoString), 'EEE MMM d');
  } catch (e) {
    return isoString;
  }
};

interface TimesheetGridProps {
  selectedStaff: any[];
  timesheetData: TimeEntry[];
  isLocked: boolean;
  onUpdate?: () => void;
}

export function TimesheetGrid({ selectedStaff, timesheetData, isLocked, onUpdate }: TimesheetGridProps) {
  
  // --- NEW STATE FOR MAP ---
  const [mapEntry, setMapEntry] = useState<any | null>(null);
  const [isMapOpen, setIsMapOpen] = useState(false);

  // Handler to open map
  const handleViewMap = (entry: any) => {
    setMapEntry(entry);
    setIsMapOpen(true);
  };

  if (!selectedStaff || selectedStaff.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-300">
         {/* ... (Keep existing empty state) ... */}
         <p className="text-lg font-medium">Select staff to view timesheets</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 pb-12">
        {selectedStaff.map((staff) => {
          const safeData = timesheetData || [];
          const userEntries = safeData.filter(t => t.user_id === staff.id);

          return (
            <div key={staff.id} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
              
              {/* USER HEADER */}
              <div className="bg-gray-50 dark:bg-slate-950 px-6 py-4 border-b border-gray-200 dark:border-slate-800 flex justify-between items-center">
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-700 dark:text-blue-200 font-bold text-sm">
                     {staff.full_name ? staff.full_name.substring(0,2).toUpperCase() : '??'}
                   </div>
                   <div>
                     <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{staff.full_name}</h3>
                     <p className="text-xs text-gray-500 font-mono">
                        ID: {staff.employee_details?.emp_id || 'N/A'} • {userEntries.length} Punches
                     </p>
                   </div>
                 </div>
                 
                 <button 
                   disabled={isLocked}
                   className="text-xs font-bold text-blue-600 bg-white border border-blue-200 px-3 py-1.5 rounded hover:bg-blue-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   + Add Adjustment
                 </button>
              </div>

              {/* GRID */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-400 uppercase bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800">
                    <tr>
                      <th className="px-6 py-3 w-48">Date / Loc</th>
                      <th className="px-6 py-3">Clock In</th>
                      <th className="px-6 py-3">Clock Out</th>
                      <th className="px-6 py-3 text-center">Hours</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                    {userEntries.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-gray-400 text-xs italic">
                          No time entries found for this period.
                        </td>
                      </tr>
                    ) : (
                      userEntries.map((entry) => {
                        let hoursDisplay = '--';
                        if (entry.start_time && entry.end_time) {
                           const h = differenceInHours(parseISO(entry.end_time), parseISO(entry.start_time));
                           hoursDisplay = `${h.toFixed(1)}`;
                        }

                        // Check if GPS data exists
                        // Note: Ensure your 'getTimesheets' action fetches clock_in_lat/lon!
                        const hasGps = entry.clock_in_lat || entry.clock_out_lat;

                        return (
                          <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                            
                            {/* DATE / LOC COLUMN - Modified for Pill */}
                            <td className="px-6 py-4">
                              <div className="font-bold text-gray-800 dark:text-gray-200">
                                {formatDate(entry.start_time)}
                              </div>
                              
                              <div className="mt-1">
                                {hasGps ? (
                                    <button 
                                        onClick={() => handleViewMap(entry)}
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-100 transition-all hover:scale-105"
                                        title="View GPS Map"
                                    >
                                        <MapPin size={10} /> 
                                        {entry.location || 'GPS Locked'}
                                    </button>
                                ) : (
                                    <span className="text-xs text-gray-500">
                                        {entry.location || 'Unknown Loc'}
                                    </span>
                                )}
                              </div>

                              {entry.status === 'FLAGGED' && (
                                <span className="text-[10px] text-red-600 font-bold bg-red-50 px-1 rounded mt-1 inline-block">⚠️ CHECK</span>
                              )}
                            </td>
                            
                            {/* CLOCK IN */}
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3 group relative">
                                 <span className="font-mono text-gray-700 dark:text-gray-300">
                                   {formatTime(entry.start_time)}
                                 </span>
                                 {entry.clock_in_photo_url && (
                                   <div className="relative group/img">
                                     <img 
                                       src={entry.clock_in_photo_url} 
                                       alt="In"
                                       className="w-8 h-8 rounded border object-cover shadow-sm cursor-zoom-in" 
                                     />
                                     <div className="absolute bottom-full left-0 hidden group-hover/img:block z-50 w-32 h-32 bg-white p-1 shadow-xl rounded border">
                                        <img src={entry.clock_in_photo_url} className="w-full h-full object-cover" alt="Punch In" />
                                     </div>
                                   </div>
                                 )}
                              </div>
                            </td>

                            {/* CLOCK OUT */}
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3 group">
                                 <span className="font-mono text-gray-700 dark:text-gray-300">
                                   {formatTime(entry.end_time)}
                                 </span>
                                 {entry.clock_out_photo_url && (
                                   <div className="relative group/img">
                                     <img 
                                       src={entry.clock_out_photo_url} 
                                       alt="Out"
                                       className="w-8 h-8 rounded border object-cover shadow-sm cursor-zoom-in" 
                                     />
                                     <div className="absolute bottom-full left-0 hidden group-hover/img:block z-50 w-32 h-32 bg-white p-1 shadow-xl rounded border">
                                        <img src={entry.clock_out_photo_url} className="w-full h-full object-cover" alt="Punch Out" />
                                     </div>
                                   </div>
                                 )}
                              </div>
                            </td>

                            <td className="px-6 py-4 text-center">
                              <span className="font-bold text-gray-900 dark:text-white">
                                {hoursDisplay}
                              </span>
                            </td>

                            <td className="px-6 py-4 text-right">
                              <EditEntryDialog 
                                  entry={entry} 
                                  isLocked={isLocked} 
                                  onSuccess={onUpdate}
                              />
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      {/* Map Modal Instance */}
      <PunchMapModal 
        isOpen={isMapOpen} 
        onClose={() => setIsMapOpen(false)} 
        entry={mapEntry} 
      />
    </>
  );
}