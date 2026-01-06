/**
 * PAYROLL HEADER
 * Path: app/(biz)/biz/payroll/components/payroll-header.tsx
 * Description: High-contrast dashboard header.
 * Now includes a reactive "Total Hours" metric that updates based on parent filter state.
 */

'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  format, parseISO, addWeeks, subWeeks, getISOWeek, getYear, isValid 
} from 'date-fns';
import { 
  Lock, Unlock, ChevronLeft, ChevronRight, 
  Calendar, Download, Clock, Calculator 
} from 'lucide-react';

// UI Components
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

// Actions
import { togglePayrollLock } from '@/app/actions/admin-payroll';
import { generatePayrollReport } from '@/app/actions/generate-payroll-report';

interface PayrollHeaderProps {
  weekStart: string; 
  weekEnd: string;  
  isLocked: boolean;
  totalHours: number; // <--- NEW: Dynamic total passed from parent
  employeeCount?: number; // Optional context (e.g., "4 Employees" vs "1 Employee")
}

export default function PayrollHeader({ 
  weekStart, 
  weekEnd, 
  isLocked, 
  totalHours = 0,
  employeeCount
}: PayrollHeaderProps) {
    const { toast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isDownloading, setIsDownloading] = useState(false);

    // --- DATE LOGIC ---
    const startDateObj = parseISO(weekStart);
    const endDateObj = parseISO(weekEnd);
    
    // Fail-safe for invalid dates
    if (!isValid(startDateObj) || !isValid(endDateObj)) {
        return <div className="p-4 text-red-500 font-mono">Error: Invalid Date Parameters</div>;
    }

    const weekNumber = getISOWeek(startDateObj);
    const year = getYear(startDateObj);

    // --- NAVIGATION ---
    const handleWeekChange = (direction: 'prev' | 'next' | 'current') => {
        let newDate = new Date(); 

        if (direction === 'prev') newDate = subWeeks(startDateObj, 1);
        else if (direction === 'next') newDate = addWeeks(startDateObj, 1);

        const params = new URLSearchParams(searchParams.toString());
        params.set('date', format(newDate, 'yyyy-MM-dd')); 
        router.push(`/biz/payroll?${params.toString()}`);
    };

    // --- LOCK TOGGLE ---
    const handleToggleLock = async () => {
        if (isLocked && !confirm("Warning: Unlocking a finalized week allows data to change. Proceed?")) return;
        
        try {
            const res = await togglePayrollLock(weekStart, isLocked ? 'unlock' : 'lock');
            if (res.success) {
                toast({ 
                    title: isLocked ? "Week Unlocked" : "Week Finalized",
                    description: isLocked ? "Staff can now be edited." : "Payroll is now locked for export." 
                });
            } else {
                toast({ title: "Action Failed", description: res.message, variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Network Error", description: "Could not toggle lock status.", variant: "destructive" });
        }
    };

    // --- CSV DOWNLOAD ---
    const handleDownload = async () => {
        try {
            setIsDownloading(true);
            const csvData = await generatePayrollReport(weekStart, weekEnd);
            
            const blob = new Blob([csvData], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${year}-W${weekNumber.toString().padStart(2, '0')}-Payroll_Export.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            toast({ title: "Download Complete", description: "Payroll report saved." });
        } catch (e) {
            console.error(e);
            toast({ title: "Download Failed", description: "Could not generate CSV.", variant: "destructive" });
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div className="flex flex-col gap-4 mb-6">
            
            {/* --- TOP ROW: Context & Metrics --- */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6 border-b pb-4">
                
                {/* 1. Title & Date Context */}
                <div className="space-y-1">
                    <div className="flex items-baseline gap-3">
                        <h1 className="text-3xl font-black italic uppercase tracking-tighter text-foreground">
                            Payroll
                        </h1>
                        <span className="text-2xl text-muted-foreground font-thin">/</span>
                        <span className="text-2xl font-bold text-orange-600 font-mono">
                            Week {weekNumber}
                        </span>
                    </div>
                    <p className="text-muted-foreground font-medium flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-zinc-500" />
                        {format(startDateObj, 'MMM d')} <span className="text-zinc-300">|</span> {format(endDateObj, 'MMM d, yyyy')}
                    </p>
                </div>

                {/* 2. LIVE METRICS & STATUS (The "Stats Zone") */}
                <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                    
                    {/* TOTAL HOURS CARD - Updates dynamically */}
                    <div className="flex-1 xl:flex-none flex items-center gap-3 px-5 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
                        <div className="p-2 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                            <Clock className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                Total Hours {employeeCount ? `(${employeeCount})` : ''}
                            </p>
                            <p className="text-xl font-bold font-mono tracking-tight text-foreground">
                                {totalHours.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                <span className="text-sm font-medium text-muted-foreground ml-1">hrs</span>
                            </p>
                        </div>
                    </div>

                    {/* STATUS INDICATOR */}
                    <div className={`
                        flex-1 xl:flex-none flex items-center gap-3 px-5 py-2 rounded-lg border shadow-sm
                        ${isLocked 
                            ? 'bg-red-50/50 border-red-200 dark:bg-red-900/10 dark:border-red-800' 
                            : 'bg-green-50/50 border-green-200 dark:bg-green-900/10 dark:border-green-800'}
                    `}>
                        <div className={`p-2 rounded-full ${isLocked ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                            {isLocked ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
                        </div>
                        <div>
                            <p className={`text-[10px] font-bold uppercase tracking-wider ${isLocked ? 'text-red-600' : 'text-green-600'}`}>
                                Status
                            </p>
                            <p className="font-semibold text-sm whitespace-nowrap">
                                {isLocked ? "Finalized" : "Open for Edits"}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- BOTTOM ROW: Controls --- */}
            <div className="flex flex-col md:flex-row justify-between gap-4 bg-muted/20 p-2 rounded-xl border">
                
                {/* Navigation Group */}
                <div className="flex items-center gap-2">
                    <div className="flex items-center bg-background border rounded-lg shadow-sm">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleWeekChange('prev')} 
                            title="Previous Week"
                            className="rounded-r-none hover:bg-muted"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <div className="h-4 w-px bg-border" />
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleWeekChange('current')}
                            className="rounded-none px-4 font-mono font-medium text-xs hover:bg-muted"
                        >
                            THIS WEEK
                        </Button>
                        <div className="h-4 w-px bg-border" />
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleWeekChange('next')} 
                            title="Next Week"
                            className="rounded-l-none hover:bg-muted"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                    <Button 
                        variant={isLocked ? "ghost" : "default"} 
                        size="sm" 
                        onClick={handleToggleLock}
                        className={!isLocked ? "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900" : ""}
                    >
                        {isLocked ? "Unlock Week" : "Finalize Week"}
                    </Button>

                    <div className="h-6 w-px bg-border mx-1" />

                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleDownload} 
                        disabled={isDownloading}
                        className="bg-background shadow-sm"
                    >
                        <Download className="w-4 h-4 mr-2 text-orange-600" />
                        {isDownloading ? "Generating..." : "Download CSV"}
                    </Button>
                </div>
            </div>
        </div>
    );
}