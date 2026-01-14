/**
 * CORRECTION QUEUE
 * Path: app/(biz)/biz/payroll/components/correction-queue.tsx
 * Update: Added Conflict Resolution logic.
 */

'use client';

import React, { useState } from 'react';
import { parseISO, differenceInMinutes } from 'date-fns';
import { Check, X, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { approveCorrectionRequest, denyCorrectionRequest } from '@/app/actions/admin-payroll';
import { useToast } from '@/components/ui/use-toast';
import ConflictResolver from './conflict-resolver'; // <--- IMPORT THIS

interface Request {
  id: string;
  user: { full_name: string; avatar_url?: string };
  date: string; 
  start_time: string;
  end_time: string;
  reason: string;
  status: string;
}

// (Keep your formatVegasTime helpers here...)
const formatVegasTime = (isoString: string) => {
  if (!isoString) return '--:--';
  try {
    const cleanString = isoString.endsWith('Z') || isoString.includes('+') ? isoString : `${isoString}Z`;
    return new Date(cleanString).toLocaleTimeString('en-US', {
      timeZone: 'America/Los_Angeles',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch (e) { return 'Err'; }
};

const formatVegasDate = (isoString: string) => {
  if (!isoString) return '';
  try {
    const cleanString = isoString.endsWith('Z') || isoString.includes('+') ? isoString : `${isoString}Z`;
    return new Date(cleanString).toLocaleDateString('en-US', {
      timeZone: 'America/Los_Angeles',
      month: 'short',
      day: 'numeric'
    });
  } catch (e) { return ''; }
};

export function CorrectionQueue({ requests, onSuccess }: { requests: Request[], onSuccess: () => void }) {
  const { toast } = useToast();
  const [processingId, setProcessingId] = useState<string | null>(null);

  // --- CONFLICT STATE ---
  const [conflictData, setConflictData] = useState<{
    isOpen: boolean;
    request: Request | null;
    entry: any | null;
  }>({ isOpen: false, request: null, entry: null });

  const handleAction = async (reqId: string, action: 'approve' | 'deny') => {
    setProcessingId(reqId);
    
    let res;
    if (action === 'approve') {
       // Try normal approval
       res = await approveCorrectionRequest(reqId, false); // force = false
    } else {
       res = await denyCorrectionRequest(reqId);
    }

    // CHECK FOR CONFLICT RETURN
    if (action === 'approve' && !res.success && res.isConflict) {
        // Find the full request object for the modal
        const fullReq = requests.find(r => r.id === reqId) || null;
        
        // Open the Resolver Modal
        setConflictData({
            isOpen: true,
            request: fullReq,
            entry: res.conflictingEntry
        });
        
        setProcessingId(null); // Stop spinner on button, waiting for modal
        return; 
    }

    setProcessingId(null);

    if (res.success) {
      toast({ title: action === 'approve' ? "Request Approved" : "Request Denied" });
      onSuccess(); 
    } else {
      toast({ title: "Error", description: res.message, variant: "destructive" });
    }
  };

  // HANDLER: User clicked "Overwrite" in the modal
  const handleForceApprove = async () => {
      if (!conflictData.request) return;
      
      setProcessingId(conflictData.request.id); // Show loading state
      
      // Call action with Force = true
      const res = await approveCorrectionRequest(conflictData.request.id, true);
      
      setProcessingId(null);
      setConflictData({ isOpen: false, request: null, entry: null }); // Close modal

      if (res.success) {
          toast({ title: "Resolved", description: "Old entry deleted, new entry created." });
          onSuccess();
      } else {
          toast({ title: "Error", description: res.message, variant: "destructive" });
      }
  };

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 border rounded-xl bg-gray-50/50 dark:bg-slate-900/50 border-dashed border-gray-200 dark:border-slate-800 text-gray-400">
        <Check className="w-12 h-12 mb-2 opacity-20" />
        <p className="font-medium">All caught up!</p>
        <p className="text-xs">No pending correction requests.</p>
      </div>
    );
  }

  return (
    <>
        <div className="grid gap-4 grid-cols-1 xl:grid-cols-2">
        {requests.map((req) => {
            const cleanStart = req.start_time.endsWith('Z') || req.start_time.includes('+') ? req.start_time : `${req.start_time}Z`;
            const cleanEnd = req.end_time.endsWith('Z') || req.end_time.includes('+') ? req.end_time : `${req.end_time}Z`;

            const diffMins = differenceInMinutes(parseISO(cleanEnd), parseISO(cleanStart));
            const duration = (diffMins / 60).toFixed(1);
            
            return (
            <div key={req.id} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 p-4 rounded-xl shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center animate-in fade-in slide-in-from-bottom-2">
                
                {/* LEFT: INFO */}
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/20 text-orange-600 flex items-center justify-center font-bold">
                    {req.user?.full_name ? req.user.full_name.substring(0,2).toUpperCase() : '??'}
                    </div>
                    <div>
                    <h4 className="font-bold text-gray-900 dark:text-white">{req.user?.full_name || 'Unknown User'}</h4>
                    
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                        <Clock className="w-3 h-3" />
                        <span className="font-mono font-medium text-gray-700 dark:text-gray-300">
                            {formatVegasDate(req.start_time)}, {formatVegasTime(req.start_time)} - {formatVegasTime(req.end_time)}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-slate-800 font-bold border border-gray-200 dark:border-slate-700">
                            {duration}h
                        </span>
                    </div>

                    {req.reason && (
                        <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-slate-800 p-2 rounded border border-gray-100 dark:border-slate-700 max-w-md">
                            <span className="font-bold text-gray-400 text-[10px] uppercase mr-1">Reason:</span>
                            {req.reason}
                        </div>
                    )}
                    </div>
                </div>

                {/* RIGHT: ACTIONS */}
                <div className="flex gap-2 w-full sm:w-auto">
                    <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1 sm:flex-none border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={() => handleAction(req.id, 'deny')}
                    disabled={processingId === req.id}
                    >
                    {processingId === req.id ? "..." : <X className="w-4 h-4" />}
                    </Button>
                    <Button 
                    size="sm" 
                    className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 text-white font-bold"
                    onClick={() => handleAction(req.id, 'approve')}
                    disabled={processingId === req.id}
                    >
                    {processingId === req.id ? "Processing..." : <>Approve <Check className="w-4 h-4 ml-2" /></>}
                    </Button>
                </div>
            </div>
            );
        })}
        </div>

        {/* --- MODAL INJECTION --- */}
        <ConflictResolver 
            isOpen={conflictData.isOpen}
            onClose={() => setConflictData({ ...conflictData, isOpen: false })}
            onConfirmOverwrite={handleForceApprove}
            request={conflictData.request}
            conflictEntry={conflictData.entry}
            isProcessing={!!processingId}
        />
    </>
  );
}