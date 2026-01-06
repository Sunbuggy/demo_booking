/**
 * @file app/(biz)/biz/payroll/components/timesheet-grid.tsx
 * @description Renders stacked timesheets for ALL selected users.
 */
'use client';

import React from 'react';

type TimeEntry = {
  id: string;
  day: string;     
  in_time: string; 
  out_time: string;
  location: string;
  photo_in?: string; 
  photo_out?: string; 
  status: 'PENDING' | 'APPROVED' | 'FLAGGED';
};

// MOCK DATA GENERATOR
const getMockEntries = (userId: string): TimeEntry[] => [
  { id: `${userId}-1`, day: 'Mon Jan 5', in_time: '07:55 AM', out_time: '04:05 PM', location: 'Las Vegas Dunes', status: 'APPROVED', photo_in: 'https://placehold.co/100x100/orange/white?text=IN', photo_out: 'https://placehold.co/100x100/black/white?text=OUT' },
  { id: `${userId}-2`, day: 'Tue Jan 6', in_time: '08:00 AM', out_time: '04:00 PM', location: 'Las Vegas Dunes', status: 'APPROVED', photo_in: 'https://placehold.co/100x100/orange/white?text=IN' },
  { id: `${userId}-3`, day: 'Wed Jan 7', in_time: '08:15 AM', out_time: '04:30 PM', location: 'Las Vegas Shop', status: 'FLAGGED', photo_in: 'https://placehold.co/100x100/red/white?text=LATE' },
];

export function TimesheetGrid({ selectedStaff }: { selectedStaff: any[] }) {
  
  if (!selectedStaff || selectedStaff.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-300">
        <svg className="w-20 h-20 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
        <p className="text-lg font-medium">Select staff to view timesheets</p>
        <p className="text-sm mt-1">Check the boxes on the left to compare multiple schedules.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {selectedStaff.map((staff) => (
        <div key={staff.id} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
          
          {/* USER HEADER */}
          <div className="bg-gray-50 dark:bg-slate-950 px-6 py-4 border-b border-gray-200 dark:border-slate-800 flex justify-between items-center">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                 {staff.full_name.substring(0,2).toUpperCase()}
               </div>
               <div>
                 <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{staff.full_name}</h3>
                 <p className="text-xs text-gray-500 font-mono">ID: {staff.employee_details?.emp_id || 'N/A'}</p>
               </div>
             </div>
             
             <button className="text-xs font-bold text-blue-600 bg-white border border-blue-200 px-3 py-1.5 rounded hover:bg-blue-50 transition">
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
                {getMockEntries(staff.id).map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-800 dark:text-gray-200">{entry.day}</div>
                      <div className="text-xs text-gray-500">{entry.location}</div>
                      {entry.status === 'FLAGGED' && <span className="text-[10px] text-red-600 font-bold bg-red-50 px-1 rounded">⚠️ CHECK</span>}
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3 group">
                         <span className="font-mono text-gray-700 dark:text-gray-300">{entry.in_time}</span>
                         {entry.photo_in && (
                           <div className="relative">
                             <img src={entry.photo_in} className="w-8 h-8 rounded border object-cover shadow-sm group-hover:scale-[3] transition-transform origin-bottom-left z-20 absolute -top-4 left-0" />
                             <div className="w-8 h-8 rounded bg-gray-200"></div> {/* Placeholder for layout stability */}
                           </div>
                         )}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3 group">
                         <span className="font-mono text-gray-700 dark:text-gray-300">{entry.out_time}</span>
                         {entry.photo_out && (
                           <div className="relative">
                             <img src={entry.photo_out} className="w-8 h-8 rounded border object-cover shadow-sm group-hover:scale-[3] transition-transform origin-bottom-left z-20 absolute -top-4 left-0" />
                             <div className="w-8 h-8 rounded bg-gray-200"></div>
                           </div>
                         )}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span className="font-bold text-gray-900 dark:text-white">8.0</span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}