/**
 * SUNBUGGY PAYROLL DASHBOARD (ENTRY POINT)
 * Path: app/(biz)/biz/payroll/page.tsx
 * Description: Server Component that loads the staff roster and initializes the client dashboard.
 * * * ARCHITECTURE CHANGE:
 * - State (Date/Selection) is now managed by <PayrollDashboard /> (Client).
 * - URL remains clean.
 * - Lock checks and Timesheet fetching happen dynamically in the Dashboard.
 */

import React from 'react';
import { getStaffUsers } from '@/app/actions/get-users';
import PayrollDashboard from './components/payroll-dashboard';

export const dynamic = 'force-dynamic'; // Ensure we always get fresh staff data

export default async function PayrollPage() {
  // 1. FETCH STAFF ROSTER (Server-Side)
  // This is the only data strictly required for the initial paint.
  // The dashboard will fetch timesheets and lock status on mount.
  const staffMembers = await getStaffUsers();

  return (
    <div className="p-6 max-w-[1800px] mx-auto h-screen overflow-hidden bg-white dark:bg-black">
       {/* 2. HANDOFF TO CLIENT DASHBOARD */}
       <PayrollDashboard initialStaff={staffMembers} />
    </div>
  );
}