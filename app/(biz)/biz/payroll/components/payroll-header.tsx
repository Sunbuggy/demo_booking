/**
 * PAYROLL HEADER
 * Path: app/(biz)/biz/payroll/components/payroll-header.tsx
 * Description: The main control center for the Payroll Dashboard.
 * * Features:
 * - Week Navigation (Prev/Next/Current)
 * - Lock/Unlock Logic (Server Action)
 * - CSV Export
 * - Live Metrics (Total Hours)
 */

'use client';

import React, { useState, useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { 
  format, parseISO, addWeeks, subWeeks, getISOWeek, isValid, startOfWeek, endOfWeek 
} from 'date-fns';
import { 
  Lock, Unlock, ChevronLeft, ChevronRight, 
  Calendar, Download, Clock, Printer 
} from 'lucide-react';

// UI Components
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

// Actions
import { togglePayrollLock } from '@/app/actions/admin-payroll';
// Assuming this exists, or placeholder logic if not
// import { generatePayrollReport } from '@/app/actions/generate-payroll-report'; 

interface PayrollHeaderProps {
  weekStart: string; 
  weekEnd: string;  
  isLocked: boolean;
  totalHours: number; 
  employeeCount: number;
  generatedAt?: string | null;
}

export function PayrollHeader({ 
  weekStart, 
  weekEnd, 
  isLocked, 
  totalHours = 0,
  employeeCount,
  generatedAt
}: PayrollHeaderProps) {
    const { toast } = useToast();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    
    const [isPending, startTransition] = useTransition();
    const [isDownloading, setIsDownloading] = useState(false);

    // --- DATE LOGIC ---
    const startDateObj = parseISO(weekStart);
    
    // Fail-safe
    if (!isValid(startDateObj)) {
        return <div className="p-4 bg-red-50 text-red-600 border rounded">Error: Invalid Date State</div>;
    }

    const weekNumber = getISOWeek(startDateObj);
    const displayYear = format(startDateObj, 'yyyy');

    // --- NAVIGATION ---
    const handleWeekChange = (direction: 'prev' | 'next' | 'current') => {
        let newDate = new Date(); 

        if (direction === 'prev') newDate = subWeeks(startDateObj, 1);
        else if (direction === 'next') newDate = addWeeks(startDateObj, 1);
        // 'current' defaults to now

        // Ensure we snap to Monday for consistency
        const newStart = startOfWeek(newDate, { weekStartsOn: 1 });
        const dateStr = format(newStart, 'yyyy-MM-dd');

        const params = new URLSearchParams(searchParams.toString());
        params.set('date', dateStr); 
        
        startTransition(() => {
            router.push(`${pathname}?${params.toString()}`);
        });
    };

    // --- LOCK TOGGLE ---
    const handleToggleLock = async () => {
        const action = isLocked ? 'unlock' : 'lock';
        
        if (isLocked) {
            if (!confirm("⚠️ UNLOCK WARNING\n\nUnlocking a finalized week allows data modification.\nAre you sure you want to proceed?")) return;
        } else {
            if (!confirm("🔒 FINALIZE PAYROLL\n\nThis will lock the week and prevent further edits.\nReady to generate report?")) return;
        }
        
        try {
            const res = await togglePayrollLock(weekStart, action);
            if (res.success) {
                toast({ 
                    title: isLocked ? "Week Unlocked" : "Week Finalized",
                    description: isLocked ? "Edits are enabled." : "Payroll is locked." 
                });
            } else {
                toast({ title: "Error", description: res.message, variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Network Error", description: "Could not toggle lock.", variant: "destructive" });
        }
    };

    // --- CSV DOWNLOAD ---
    const handleDownload = async () => {
        toast({ title: "Feature Pending", description: "CSV Generation logic coming soon." });
        // Logic placeholder for Phase 3
    };

    return (
        <div className="flex flex-col gap-6 mb-2">
            
            {/* --- TOP ROW: Branding & Metrics --- */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6 pb-4 border-b border-gray-100 dark:border-slate-800">
                
                {/* LEFT: Title Area */}
                <div className="space-y-1">
                    <div className="flex items-baseline gap-3">
                        <h1 className="text-3xl font-black italic uppercase tracking-tighter text-gray-900 dark:text-white">
                            Payroll
                        </h1>
                        <span className="text-2xl text-gray-300 font-thin">/</span>
                        <span className="text-2xl font-bold text-orange-600 font-mono">
                            Week {weekNumber}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                        <Calendar className="w-4 h-4" />
                        <span>{format(startDateObj, 'MMM d')}</span>
                        <span className="text-gray-300">|</span>
                        <span>{format(parseISO(weekEnd), 'MMM d, yyyy')}</span>
                    </div>
                </div>

                {/* RIGHT: Stats Cards */}
                <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">
                    
                    {/* TOTAL HOURS */}
                    <div className="flex-1 xl:flex-none flex items-center gap-3 px-5 py-3 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-800 shadow-sm">
                        <div className="p-2 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                            <Clock className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                Total Hours ({employeeCount})
                            </p>
                            <p className="text-2xl font-bold font-mono tracking-tight text-gray-900 dark:text-white leading-none">
                                {totalHours.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                                <span className="text-sm font-medium text-gray-400 ml-1">hrs</span>
                            </p>
                        </div>
                    </div>

                    {/* STATUS INDICATOR */}
                    <div className={`
                        flex-1 xl:flex-none flex items-center gap-3 px-5 py-3 rounded-xl border shadow-sm transition-colors
                        ${isLocked 
                            ? 'bg-red-50/50 border-red-100 dark:bg-red-900/10 dark:border-red-900/30' 
                            : 'bg-green-50/50 border-green-100 dark:bg-green-900/10 dark:border-green-900/30'}
                    `}>
                        <div className={`p-2 rounded-full ${isLocked ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                            {isLocked ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
                        </div>
                        <div>
                            <p className={`text-[10px] font-bold uppercase tracking-wider ${isLocked ? 'text-red-600' : 'text-green-600'}`}>
                                Status
                            </p>
                            <p className="font-semibold text-sm whitespace-nowrap text-gray-900 dark:text-gray-100">
                                {isLocked ? "Locked" : "Open"}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- BOTTOM ROW: Controls Toolbar --- */}
            <div className="flex flex-col md:flex-row justify-between gap-4 bg-gray-50/50 dark:bg-slate-900/50 p-2 rounded-xl border border-gray-200 dark:border-slate-800">
                
                {/* Navigation Group */}
                <div className="flex items-center gap-2">
                    <div className="flex items-center bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg shadow-sm">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleWeekChange('prev')} 
                            title="Previous Week"
                            className="rounded-r-none border-r border-gray-100 dark:border-slate-800 hover:bg-gray-50"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleWeekChange('current')}
                            className="rounded-none px-4 font-mono font-medium text-xs hover:bg-gray-50 text-gray-600 dark:text-gray-300"
                        >
                            THIS WEEK
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleWeekChange('next')} 
                            title="Next Week"
                            className="rounded-l-none border-l border-gray-100 dark:border-slate-800 hover:bg-gray-50"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                    <Button 
                        variant={isLocked ? "outline" : "default"} 
                        size="sm" 
                        onClick={handleToggleLock}
                        className={`font-bold shadow-sm ${!isLocked ? 'bg-gray-900 text-white hover:bg-gray-800' : 'border-red-200 text-red-600 hover:bg-red-50'}`}
                    >
                        {isLocked ? "Unlock Week" : "Finalize & Lock"}
                    </Button>

                    <div className="h-6 w-px bg-gray-300 dark:bg-slate-700 mx-1" />

                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => window.print()} 
                        title="Print Report"
                        className="bg-white dark:bg-slate-900"
                    >
                        <Printer className="w-4 h-4 text-gray-500" />
                    </Button>

                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleDownload} 
                        disabled={isDownloading}
                        className="bg-white dark:bg-slate-900"
                    >
                        <Download className="w-4 h-4 mr-2 text-orange-600" />
                        CSV
                    </Button>
                </div>
            </div>
        </div>
    );
}