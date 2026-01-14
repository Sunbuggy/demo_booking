/**
 * CONFLICT RESOLVER DIALOG
 * Path: app/(biz)/biz/payroll/components/conflict-resolver.tsx
 * Description: Modal that appears when an approval hits a time overlap.
 * Allows admin to "Overwrite" the existing entry in one click.
 * * FIX:
 * - Added 'formatVegasTime' to prevent UTC shift (e.g. 7am becoming 3pm).
 */

'use client';

import React from 'react';
import { differenceInMinutes, parseISO } from 'date-fns';
import { AlertTriangle, Trash2, CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirmOverwrite: () => void;
  request: any;         // The pending request
  conflictEntry: any;   // The existing database entry causing the issue
  isProcessing: boolean;
}

// --- TIMEZONE HELPER (Las Vegas Specific) ---
const formatVegasTime = (isoString: string) => {
  if (!isoString) return '--:--';
  try {
    // Ensure we are parsing as UTC ("Z") to prevent double conversion
    const cleanString = isoString.endsWith('Z') || isoString.includes('+') 
      ? isoString 
      : `${isoString}Z`;

    return new Date(cleanString).toLocaleTimeString('en-US', {
      timeZone: 'America/Los_Angeles',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch (e) {
    return 'Err';
  }
};

const calcHours = (start: string, end: string) => {
    if(!start || !end) return '0.0';
    // We can use standard diff here because the relative difference is the same in any timezone
    // provided we treat both as UTC strings
    const s = start.endsWith('Z') ? start : `${start}Z`;
    const e = end.endsWith('Z') ? end : `${end}Z`;
    
    const min = differenceInMinutes(parseISO(e), parseISO(s));
    return (min / 60).toFixed(2);
};

export default function ConflictResolver({ 
  isOpen, onClose, onConfirmOverwrite, request, conflictEntry, isProcessing 
}: Props) {
    
  if (!request || !conflictEntry) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isProcessing && !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] border-orange-500/50">
        <DialogHeader>
          <div className="flex items-center gap-2 text-orange-600 mb-2">
             <AlertTriangle className="w-6 h-6" />
             <DialogTitle>Scheduling Conflict Detected</DialogTitle>
          </div>
          <DialogDescription>
            This employee already has a shift recorded during this time. 
            Approving this request will create an overlap.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            
            {/* CARD 1: EXISTING (BAD) */}
            <div className="p-4 rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-900/30 opacity-70">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold uppercase text-red-600 tracking-wider">Current Record</span>
                    <Trash2 className="w-4 h-4 text-red-400" />
                </div>
                <div className="text-sm font-mono text-gray-700 dark:text-gray-300">
                    <div className="flex justify-between">
                        <span>IN:</span> <span>{formatVegasTime(conflictEntry.start_time)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>OUT:</span> <span>{formatVegasTime(conflictEntry.end_time)}</span>
                    </div>
                </div>
                <div className="mt-3 pt-2 border-t border-red-200/50 text-right">
                    <span className="text-xl font-bold text-gray-900 dark:text-white line-through decoration-red-500">
                        {calcHours(conflictEntry.start_time, conflictEntry.end_time)}h
                    </span>
                </div>
            </div>

            {/* CARD 2: NEW REQUEST (GOOD) */}
            <div className="p-4 rounded-xl border-2 border-green-500 bg-green-50 dark:bg-green-900/10 dark:border-green-800 shadow-md transform scale-105">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold uppercase text-green-700 tracking-wider">New Correction</span>
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                </div>
                <div className="text-sm font-mono text-gray-900 dark:text-white font-bold">
                    <div className="flex justify-between">
                        <span>IN:</span> <span>{formatVegasTime(request.start_time)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>OUT:</span> <span>{formatVegasTime(request.end_time)}</span>
                    </div>
                </div>
                <div className="mt-3 pt-2 border-t border-green-200/50 text-right">
                    <span className="text-2xl font-black text-green-700 dark:text-green-400">
                        {calcHours(request.start_time, request.end_time)}h
                    </span>
                </div>
            </div>

        </div>

        <div className="bg-gray-50 dark:bg-slate-900 p-3 rounded-lg text-xs text-center text-gray-500 italic">
            "{request.reason}"
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={onConfirmOverwrite} 
            disabled={isProcessing}
            className="bg-orange-600 hover:bg-orange-700 text-white font-bold"
          >
            {isProcessing ? 'Processing...' : 'Overwrite Existing & Approve'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}