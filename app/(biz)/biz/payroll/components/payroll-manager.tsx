// app/(biz)/biz/payroll/components/payroll-manager.tsx
'use client';

import React from 'react';
// FIX: Import the SHARED action used by the Roster
import { approveTimeOffRequest } from '@/app/actions/approve-time-off'; 
import { approveCorrectionRequest, denyCorrectionRequest } from '@/app/actions/admin-payroll';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowRight, PlaneTakeoff, Info, AlertCircle, CalendarCheck, Check, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import moment from 'moment';
import EditEntryDialog from './edit-entry-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// --- TYPES ---
type Request = {
  id: string;
  user_id: string;
  start_time: string;
  end_time: string;
  reason: string | null;
  created_at: string;
  status: string;
  user: { full_name: string; avatar_url: string };
};

type TimeOffRequest = {
  id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  status: string;
  user: { full_name: string; avatar_url: string };
};

type AuditLog = {
    edited_by: string;
    edited_at: string;
    note: string;
    changes: string;
};

type Entry = {
  id: string;
  user_id: string;
  start_time: string;
  end_time: string | null;
  user: { full_name: string; avatar_url: string };
  // FIX: Ensure optional chaining in render if this is null
  audit_trail?: AuditLog[] | null; 
};

interface PayrollManagerProps {
  requests: Request[]; 
  timeOffRequests: TimeOffRequest[]; 
  entries: Entry[];
}

export default function PayrollManager({ requests, timeOffRequests, entries }: PayrollManagerProps) {
  const { toast } = useToast();

  // --- ACTIONS ---

  const handleApprovePunch = async (id: string) => {
    const res = await approveCorrectionRequest(id);
    toast({ 
      title: res.success ? "Approved" : "Error", 
      description: res.message,
      variant: res.success ? "default" : "destructive" 
    });
  };

  const handleDenyPunch = async (id: string) => {
    if(!confirm("Deny this request?")) return;
    const res = await denyCorrectionRequest(id);
    toast({ title: res.message });
  };

  // FIX: Updated handler to use the robust shared action
  const handleTimeOffStatus = async (id: string, status: 'approved' | 'denied') => {
    const res = await approveTimeOffRequest(id, status);
    
    if (res.success) {
      toast({ title: `Time Off ${status.toUpperCase()}` });
    } else {
      toast({ title: "Update Failed", description: res.error, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      
      {/* --- TOP SECTION: ACTION QUEUES --- */}
      <div className="grid gap-6 md:grid-cols-2">
        
        {/* 1. CORRECTION QUEUE (PUNCHES) */}
        <Card className="border-l-4 border-l-orange-500 bg-orange-50/20">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertCircle className="w-5 h-5 text-orange-600" /> 
              Correction Queue ({requests.length})
            </CardTitle>
            <CardDescription>Punch edit requests.</CardDescription>
          </CardHeader>
          <CardContent>
            {requests.length === 0 ? (
               <div className="text-sm text-muted-foreground italic py-4">All caught up!</div>
            ) : (
              <div className="space-y-3">
                {requests.map((req) => (
                  <div key={req.id} className="bg-white dark:bg-slate-900 p-3 rounded-md border text-sm shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={req.user?.avatar_url} />
                        <AvatarFallback>{req.user?.full_name?.[0]}</AvatarFallback>
                      </Avatar>
                      <span className="font-bold">{req.user?.full_name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs mb-2">
                       <Badge variant="outline">{moment(req.start_time).format('MMM D')}</Badge>
                       <span>{moment(req.start_time).format('h:mm A')}</span>
                       <ArrowRight className="w-3 h-3 text-muted-foreground" />
                       <span>{moment(req.end_time).format('h:mm A')}</span>
                    </div>
                    {req.reason && <p className="text-xs italic text-muted-foreground mb-2">"{req.reason}"</p>}
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1 h-8 text-xs" onClick={() => handleDenyPunch(req.id)}>Deny</Button>
                      <Button size="sm" className="flex-1 bg-orange-600 h-8 text-xs hover:bg-orange-500" onClick={() => handleApprovePunch(req.id)}>Approve</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 2. TIME OFF QUEUE */}
        <Card className="border-l-4 border-l-blue-500 bg-blue-50/20">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <PlaneTakeoff className="w-5 h-5 text-blue-600" /> 
              Time Off Approvals ({timeOffRequests.length})
            </CardTitle>
            <CardDescription>Vacation and appointment requests.</CardDescription>
          </CardHeader>
          <CardContent>
            {timeOffRequests.length === 0 ? (
               <div className="text-sm text-muted-foreground italic py-4">No pending time off.</div>
            ) : (
              <div className="space-y-3">
                {timeOffRequests.map((req) => (
                  <div key={req.id} className="bg-white dark:bg-slate-900 p-3 rounded-md border text-sm shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={req.user?.avatar_url} />
                        <AvatarFallback>{req.user?.full_name?.[0]}</AvatarFallback>
                      </Avatar>
                      <span className="font-bold">{req.user?.full_name}</span>
                    </div>
                    <div className="text-xs mb-2 flex justify-between items-center">
                      <span className="font-mono bg-zinc-100 dark:bg-zinc-800 p-1 rounded">
                        {moment(req.start_date).format('M/D/YY')} - {moment(req.end_date).format('M/D/YY')}
                      </span>
                    </div>
                    {req.reason && <p className="mb-3 text-xs italic text-zinc-500">"{req.reason}"</p>}
                    <div className="flex gap-2">
                      {/* FIX: Removed userId arg, rely on shared action */}
                      <Button size="sm" variant="ghost" className="flex-1 text-red-600 h-8 text-xs hover:bg-red-50" onClick={() => handleTimeOffStatus(req.id, 'denied')}><X className="w-3 h-3 mr-1"/> Deny</Button>
                      <Button size="sm" className="flex-1 bg-blue-600 text-white h-8 text-xs hover:bg-blue-500" onClick={() => handleTimeOffStatus(req.id, 'approved')}><Check className="w-3 h-3 mr-1"/> Approve</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* --- BOTTOM SECTION: TIMESHEET REVIEW --- */}
      <Card>
        <CardHeader>
           <CardTitle className="flex items-center gap-2">
             <CalendarCheck className="w-5 h-5" /> Recent Time Entries
           </CardTitle>
           <CardDescription>View and manually edit punches. Edits are audited.</CardDescription>
        </CardHeader>
        <CardContent>
           <div className="rounded-md border bg-card">
              <div className="grid grid-cols-4 bg-muted/50 p-3 font-medium text-xs uppercase tracking-tighter border-b">
                 <div>Employee</div>
                 <div>Date</div>
                 <div>Shift</div>
                 <div className="text-right">Actions</div>
              </div>
              <div className="divide-y">
                 {entries.map((entry) => (
                    <div key={entry.id} className="grid grid-cols-4 p-3 items-center text-sm hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                       
                       {/* Column 1: Employee Name */}
                       <div className="col-span-1 font-medium truncate flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={entry.user?.avatar_url} />
                            <AvatarFallback>{entry.user?.full_name?.[0]}</AvatarFallback>
                          </Avatar>
                          {entry.user?.full_name}
                       </div>
                       
                       {/* Column 2: Date & Audit Indicator */}
                       <div className="col-span-1 text-muted-foreground flex items-center gap-2">
                          {moment(entry.start_time).format('MMM D, YYYY')}
                          
                          {/* AUDIT TOOLTIP: Only shows if 'audit_trail' has data */}
                          {entry.audit_trail && entry.audit_trail.length > 0 && (
                            <TooltipProvider>
                              <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                  <Info className="w-4 h-4 text-orange-500 cursor-help opacity-80 hover:opacity-100" />
                                </TooltipTrigger>
                                <TooltipContent className="bg-slate-950 border-slate-800 text-slate-300 p-0 overflow-hidden shadow-xl max-w-xs z-50">
                                  <div className="bg-orange-500/10 p-2 border-b border-orange-500/20">
                                     <p className="font-bold text-[10px] uppercase tracking-wider text-orange-500">Edit History</p>
                                  </div>
                                  <div className="max-h-[200px] overflow-y-auto p-2 space-y-3">
                                    {entry.audit_trail.slice().reverse().map((log, idx) => (
                                      <div key={idx} className="text-xs space-y-1 border-b border-slate-800 pb-2 last:border-0 last:pb-0">
                                        <div className="flex justify-between items-center">
                                           <span className="font-bold text-white">{log.edited_by}</span>
                                           <span className="text-[10px] text-slate-500">{moment(log.edited_at).format('MMM D h:mm A')}</span>
                                        </div>
                                        <div className="text-[10px] font-mono bg-slate-900 p-1 rounded text-slate-400 truncate">
                                           {log.changes}
                                        </div>
                                        {log.note && <p className="italic text-slate-500">"{log.note}"</p>}
                                      </div>
                                    ))}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                       </div>
                       
                       {/* Column 3: Shift Times */}
                       <div className="col-span-1">
                          <span className="block">{entry.start_time ? moment(entry.start_time).format('h:mm A') : '---'}</span>
                          <span className="block text-muted-foreground text-xs">
                             {entry.end_time ? (
                                moment(entry.end_time).format('h:mm A')
                             ) : (
                                <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 animate-pulse border-none">LIVE</Badge>
                             )}
                          </span>
                       </div>
                       
                       {/* Column 4: Edit Action */}
                       <div className="col-span-1 flex justify-end">
                          <EditEntryDialog entry={entry} />
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}