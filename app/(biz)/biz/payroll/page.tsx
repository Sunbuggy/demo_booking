/**
 * SUNBUGGY PAYROLL DASHBOARD
 * Location: app/(biz)/biz/payroll/page.tsx
 */
import React, { Suspense } from 'react';
import { getPayrollWeek } from '@/app/actions/get-payroll-week';
import { getStaffUsers } from '@/app/actions/get-users';

import { PayrollControls } from './components/payroll-controls';
import { StaffList } from './components/staff-list';     
import { TimesheetGrid } from './components/timesheet-grid'; 

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function PayrollPage(props: PageProps) {
  const params = await props.searchParams;
  const rawDate = Array.isArray(params.date) ? params.date[0] : params.date;
  
  // PARSE MULTIPLE IDs (?userIds=1,2,3)
  const rawUserIds = Array.isArray(params.userIds) ? params.userIds[0] : params.userIds;
  const selectedIdSet = new Set(rawUserIds ? rawUserIds.split(',') : []);

  const weekInfo = getPayrollWeek(rawDate);
  const staffMembers = await getStaffUsers();
  
  // Filter staff to only pass the selected ones to the grid
  const selectedStaff = staffMembers.filter(s => selectedIdSet.has(s.id));

  return (
    <div className="p-6 max-w-[1800px] mx-auto space-y-4 h-screen flex flex-col overflow-hidden">
      
      {/* HEADER */}
      <div className="flex-none pb-4 border-b border-gray-200 dark:border-slate-800">
        <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Payroll Management</h1>
        <PayrollControls 
          weekStart={weekInfo.startDate}
          weekEnd={weekInfo.endDate}
          weekLabel={weekInfo.label}
          weekNumber={weekInfo.weekNumber} 
        />
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
        
        {/* LEFT COL: FILTER & SELECT */}
        <div className="lg:col-span-3 h-full flex flex-col">
           <StaffList staff={staffMembers} />
        </div>

        {/* RIGHT COL: MULTI-USER GRID */}
        <div className="lg:col-span-9 rounded-xl overflow-hidden flex flex-col">
          <Suspense fallback={<div className="p-10 text-center">Loading Timesheets...</div>}>
             <div className="flex-1 overflow-y-auto pr-2 pb-20">
                <TimesheetGrid selectedStaff={selectedStaff} />
             </div>
          </Suspense>
        </div>

      </div>
    </div>
  );
}