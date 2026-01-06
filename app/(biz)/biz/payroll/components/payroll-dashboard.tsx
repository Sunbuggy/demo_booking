/**
 * PAYROLL DASHBOARD (Client Container)
 * Path: app/(biz)/biz/payroll/components/payroll-dashboard.tsx
 * Update: Added Tabs for "Timesheets" vs "Correction Queue".
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { format, startOfWeek, endOfWeek, parseISO, differenceInMinutes } from 'date-fns';
import { createClient } from '@/utils/supabase/client';
import { ListChecks, Clock, AlertCircle } from 'lucide-react';

// ACTIONS
import { getTimesheets } from '@/app/actions/get-timesheets';

// COMPONENTS
import { PayrollControls } from './payroll-controls';
import { StaffList } from './staff-list';
import { TimesheetGrid } from './timesheet-grid';
import { CorrectionQueue } from './correction-queue';
import AddEntryDialog from './add-entry-dialog';

// UI
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function PayrollDashboard({ initialStaff }: { initialStaff: any[] }) {
    // STATE
    const [currentDate, setCurrentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [filterLoc, setFilterLoc] = useState('ALL'); 

    const [timesheets, setTimesheets] = useState<any[]>([]);
    const [requests, setRequests] = useState<any[]>([]); // <--- NEW: Queue Data
    const [isLocked, setIsLocked] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // DATE MATH
    const start = format(startOfWeek(parseISO(currentDate), { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const end = format(endOfWeek(parseISO(currentDate), { weekStartsOn: 1 }), 'yyyy-MM-dd');

    // DATA FETCHING
    const fetchData = async () => {
        setIsLoading(true);
        const supabase = createClient();

        // 1. Lock Check
        const { data: lockReport } = await supabase
            .from('payroll_reports')
            .select('id')
            .eq('period_start', start)
            .eq('period_end', end)
            .single();
        setIsLocked(!!lockReport);

        // 2. Fetch Pending Requests (Global, not just for selected week)
        // We want to see ALL pending requests regardless of the week viewed
        const { data: pendingReqs } = await supabase
            .from('time_sheet_requests')
            .select(`
                *,
                user:users (full_name, avatar_url)
            `)
            .eq('status', 'pending')
            .order('created_at', { ascending: false });
        
        setRequests(pendingReqs || []);

        // 3. Timesheets (Filtered by Selection)
        if (selectedIds.size > 0) {
            const data = await getTimesheets(Array.from(selectedIds), start, end);
            setTimesheets(data);
        } else {
            setTimesheets([]);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, [currentDate, selectedIds]);

    // CALC TOTALS
    const totalHours = useMemo(() => {
        return timesheets.reduce((acc, entry) => {
            if (entry.start_time && entry.end_time) {
                const diff = differenceInMinutes(parseISO(entry.end_time), parseISO(entry.start_time));
                return acc + (diff / 60);
            }
            return acc;
        }, 0);
    }, [timesheets]);

    const selectedStaff = initialStaff.filter(s => selectedIds.has(s.id));

    return (
        <div className="flex flex-col h-full space-y-4">
            
            {/* TOP CONTROLS */}
            <div className="flex-none pb-2 border-b border-gray-100 dark:border-slate-900">
                <div className="flex justify-between items-end mb-4">
                    <h1 className="text-3xl font-bold">Payroll Management</h1>
                    {isLocked && <span className="text-red-600 font-bold border border-red-200 bg-red-50 px-3 py-1 rounded animate-pulse">LOCKED</span>}
                </div>
                
                <PayrollControls 
                    weekStart={start} 
                    weekEnd={end} 
                    isLocked={isLocked}
                    filterLoc={filterLoc} 
                    onDateChange={setCurrentDate}
                    onLockChange={fetchData} 
                />
            </div>

            {/* MAIN CONTENT AREA */}
            <Tabs defaultValue="timesheets" className="flex-1 flex flex-col min-h-0">
                
                {/* TABS HEADER */}
                <div className="flex items-center justify-between mb-4 px-1">
                    <TabsList>
                        <TabsTrigger value="timesheets" className="gap-2">
                            <ListChecks className="w-4 h-4" /> Timesheets
                        </TabsTrigger>
                        <TabsTrigger value="queue" className="gap-2 relative">
                            <Clock className="w-4 h-4" /> Pending Requests
                            {requests.length > 0 && (
                                <span className="ml-1 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                    {requests.length}
                                </span>
                            )}
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* TAB 1: TIMESHEET GRID */}
                <TabsContent value="timesheets" className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0 m-0 data-[state=inactive]:hidden">
                    {/* LEFT: Staff List */}
                    <div className="lg:col-span-3 h-full flex flex-col">
                        <StaffList 
                            staff={initialStaff} 
                            selectedIds={selectedIds} 
                            onSelectionChange={setSelectedIds} 
                            filterLoc={filterLoc} 
                            onFilterLocChange={setFilterLoc} 
                        />
                    </div>

                    {/* RIGHT: Grid */}
                    <div className="lg:col-span-9 rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col overflow-hidden">
                        <div className="p-4 border-b bg-gray-50 dark:bg-slate-950 flex justify-between items-center">
                            <div className="flex items-baseline gap-3">
                                 <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                    Viewing {selectedIds.size} Employee{selectedIds.size !== 1 ? 's' : ''}
                                 </span>
                                 {selectedIds.size > 0 && (
                                    <span className="text-sm font-mono text-gray-500 dark:text-gray-400">
                                       • <span className="font-bold text-blue-600 dark:text-blue-400">{totalHours.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span> Hours Total
                                    </span>
                                 )}
                            </div>
                            <AddEntryDialog users={initialStaff} isLocked={isLocked} />
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 pb-20">
                            {isLoading ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mb-4"></div>
                                    <p>Loading...</p>
                                </div>
                            ) : (
                                <TimesheetGrid 
                                    selectedStaff={selectedStaff} 
                                    timesheetData={timesheets} 
                                    isLocked={isLocked} 
                                />
                            )}
                        </div>
                    </div>
                </TabsContent>

                {/* TAB 2: CORRECTION QUEUE */}
                <TabsContent value="queue" className="flex-1 min-h-0 m-0 data-[state=inactive]:hidden">
                    <div className="h-full overflow-y-auto p-1">
                        <div className="max-w-4xl mx-auto">
                            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900 rounded-lg flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                                <div>
                                    <h3 className="text-sm font-bold text-blue-900 dark:text-blue-100">Review Pending Requests</h3>
                                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                                        These are manual adjustments requested by employees via the mobile app. 
                                        Approving them will create an official time entry.
                                    </p>
                                </div>
                            </div>
                            
                            <CorrectionQueue requests={requests} onSuccess={fetchData} />
                        </div>
                    </div>
                </TabsContent>

            </Tabs>
        </div>
    );
}