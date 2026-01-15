/**
 * PAYROLL CONTROLS
 * Path: app/(biz)/biz/payroll/components/payroll-controls.tsx
 * Update: Added "Week #" display + Dynamic CSV Filename logic.
 */

'use client';

import React, { useRef, useState } from 'react';
import { addWeeks, subWeeks, format, parseISO, startOfWeek, getISOWeek, getYear } from 'date-fns';
import { Lock, Unlock, ChevronLeft, ChevronRight, Printer, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { togglePayrollLock } from '@/app/actions/admin-payroll';
import { generatePayrollReport } from '@/app/actions/generate-payroll-report'; // Ensure this action exists

interface PayrollControlsProps {
  weekStart: string;
  weekEnd: string;
  isLocked: boolean;
  filterLoc: string; // <--- NEW PROP for filename
  onDateChange: (newDate: string) => void;
  onLockChange: () => void;
}

export function PayrollControls({ 
  weekStart, 
  weekEnd, 
  isLocked, 
  filterLoc,
  onDateChange,
  onLockChange
}: PayrollControlsProps) {
    const { toast } = useToast();
    const dateInputRef = useRef<HTMLInputElement>(null);
    const [isDownloading, setIsDownloading] = useState(false);

    const startDateObj = parseISO(weekStart);
    const weekNum = getISOWeek(startDateObj);
    const year = getYear(startDateObj);

    // --- NAVIGATION ---
    const handleWeekChange = (direction: 'prev' | 'next' | 'current') => {
        let newDate = new Date(); 
        if (direction === 'prev') newDate = subWeeks(startDateObj, 1);
        else if (direction === 'next') newDate = addWeeks(startDateObj, 1);
        
        const newStart = startOfWeek(newDate, { weekStartsOn: 1 });
        onDateChange(format(newStart, 'yyyy-MM-dd'));
    };

    // --- LOCK TOGGLE ---
    const handleToggleLock = async () => {
        const action = isLocked ? 'unlock' : 'lock';
        if (!confirm(isLocked ? "Unlock this week?" : "Finalize and Lock this week?")) return;
        
        const res = await togglePayrollLock(weekStart, action);
        if (res.success) {
            toast({ title: "Success", description: `Week ${action}ed.` });
            onLockChange(); 
        } else {
            toast({ title: "Error", description: res.message, variant: "destructive" });
        }
    };

    // --- CSV EXPORT ---
    const handleDownload = async () => {
        setIsDownloading(true);
        try {
            // 1. Map Filter Code to Readable Name
            let locName = 'ALL LOCATIONS';
            if (filterLoc === 'VEGAS') locName = 'Las Vegas';
            if (filterLoc === 'PISMO') locName = 'Pismo Beach';
            if (filterLoc === 'SILVER') locName = 'Silver Lake';

            // 2. Generate Filename
            // Format: "2026 week 2 Las Vegas time sheet.csv"
            const filename = `${year} week ${weekNum} ${locName} time sheet.csv`;

            // 3. Fetch Data (Server Action)
            // Note: You must ensure 'generatePayrollReport' accepts these args
            const csvData = await generatePayrollReport(weekStart, weekEnd, filterLoc);
            
            // 4. Trigger Download
            const blob = new Blob([csvData], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            toast({ title: "Export Complete", description: filename });
        } catch (error) {
            console.error(error);
            toast({ title: "Export Failed", description: "Could not generate CSV.", variant: "destructive" });
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-4 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-2 rounded-xl shadow-sm">
             
             {/* LEFT: Week Navigation */}
             <div className="flex items-center gap-2">
                <div className="flex items-center bg-gray-50 dark:bg-slate-800 border dark:border-slate-700 rounded-lg">
                    <Button variant="ghost" size="icon" onClick={() => handleWeekChange('prev')} className="hover:bg-white dark:hover:bg-slate-700 rounded-r-none">
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    
                    {/* WEEK # DISPLAY */}
                    <div 
                        onClick={() => dateInputRef.current?.showPicker()}
                        className="px-4 py-1 cursor-pointer hover:bg-white dark:hover:bg-slate-700 transition-colors flex flex-col items-center justify-center min-w-[160px] border-x border-transparent hover:border-gray-200"
                    >
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Week {weekNum}</span>
                        <span className="font-mono font-bold text-sm leading-none text-gray-900 dark:text-white">
                            {format(startDateObj, 'MMM d')} - {format(parseISO(weekEnd), 'MMM d')}
                        </span>
                        
                        {/* Hidden Native Picker */}
                        <input 
                           type="date" ref={dateInputRef} 
                           className="sr-only" 
                           onChange={(e) => onDateChange(e.target.value)} 
                        />
                    </div>

                    <Button variant="ghost" size="icon" onClick={() => handleWeekChange('next')} className="hover:bg-white dark:hover:bg-slate-700 rounded-l-none">
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleWeekChange('current')} className="text-xs font-bold">Today</Button>
             </div>

             {/* RIGHT: Actions */}
             <div className="flex items-center gap-2">
                <Button 
                    size="sm"
                    variant={isLocked ? "outline" : "default"}
                    onClick={handleToggleLock}
                    className={`font-bold ${isLocked ? "border-red-200 text-red-600 bg-red-50 hover:bg-red-100" : "bg-green-600 hover:bg-green-700 text-white"}`}
                >
                    {isLocked ? <><Lock className="w-3 h-3 mr-2"/> Unlock Week</> : <><Unlock className="w-3 h-3 mr-2"/> Finalize Week</>}
                </Button>

                <div className="h-6 w-px bg-gray-200 dark:bg-slate-700 mx-1"></div>

                <Button variant="outline" size="sm" onClick={() => window.print()} title="Print">
                    <Printer className="w-4 h-4" />
                </Button>

                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleDownload} 
                    disabled={isDownloading}
                    className="bg-gray-50 dark:bg-slate-800"
                >
                    {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 mr-2 text-orange-600" />}
                    CSV
                </Button>
             </div>
        </div>
    );
}