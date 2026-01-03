'use client';

import React from 'react';
import { approveCorrectionRequest, denyCorrectionRequest } from '@/app/actions/admin-payroll';
import { updateTimeOffStatus } from '@/app/actions/time-off'; // NEW: For Time Off approvals
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Check, X, AlertCircle, CalendarCheck, ArrowRight, PlaneTakeoff } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import moment from 'moment';
import EditEntryDialog from './edit-entry-dialog';

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

// NEW: Time Off Request Type
type TimeOffRequest = {
  id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  status: string;
  user: { full_name: string; avatar_url: string };
};

type Entry = {
  id: string;
  user_id: string;
  start_time: string;
  end_time: string | null;
  user: { full_name: string; avatar_url: string };
};

interface PayrollManagerProps {
  requests: Request[]; // Punch corrections
  timeOffRequests: TimeOffRequest[]; // Vacation/Appointments
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

  /**
   * NEW: Handle Time Off Approvals
   * This calls the server action that bypasses RLS using the Admin client.
   */
  const handleTimeOffStatus = async (id: string, userId: string, status: 'approved' | 'denied') => {
    const res = await updateTimeOffStatus(id, userId, status);
    if (res.success) {
      toast({ title: `Time Off ${status}` });
    } else {
      toast({ title: "Error", description: res.message, variant: "destructive" });
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
                  <div key={req.id} className="bg-white dark:bg-slate-900 p-3 rounded-md border text-sm">
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
                       <ArrowRight className="w-3 h-3" />
                       <span>{moment(req.end_time).format('h:mm A')}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => handleDenyPunch(req.id)}>Deny</Button>
                      <Button size="sm" className="flex-1 bg-orange-600" onClick={() => handleApprovePunch(req.id)}>Approve</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 2. NEW: TIME OFF QUEUE (SHANA FIX) */}
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
                  <div key={req.id} className="bg-white dark:bg-slate-900 p-3 rounded-md border text-sm">
                    <div className="flex items-center gap-3 mb-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={req.user?.avatar_url} />
                        <AvatarFallback>{req.user?.full_name?.[0]}</AvatarFallback>
                      </Avatar>
                      <span className="font-bold">{req.user?.full_name}</span>
                    </div>
                    <div className="text-xs mb-2">
                      <span className="font-mono bg-zinc-100 dark:bg-zinc-800 p-1 rounded">
                        {moment(req.start_date).format('M/D/YY')} - {moment(req.end_date).format('M/D/YY')}
                      </span>
                      {req.reason && <p className="mt-2 italic text-zinc-500">"{req.reason}"</p>}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" className="flex-1 text-red-600" onClick={() => handleTimeOffStatus(req.id, req.user_id, 'denied')}>Deny</Button>
                      <Button size="sm" className="flex-1 bg-blue-600 text-white" onClick={() => handleTimeOffStatus(req.id, req.user_id, 'approved')}>Approve</Button>
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
           <CardDescription>View and manually edit punches.</CardDescription>
        </CardHeader>
        <CardContent>
           <div className="rounded-md border">
              <div className="grid grid-cols-4 bg-muted p-3 font-medium text-xs uppercase tracking-tighter">
                 <div>Employee</div>
                 <div>Date</div>
                 <div>Shift</div>
                 <div className="text-right">Actions</div>
              </div>
              <div className="divide-y">
                 {entries.map((entry) => (
                    <div key={entry.id} className="grid grid-cols-4 p-3 items-center text-sm hover:bg-slate-50 transition-colors">
                       <div className="font-medium truncate">{entry.user?.full_name}</div>
                       <div className="text-muted-foreground">
                          {/* FIXED: Robust date formatting for Scott's active punches */}
                          {entry.start_time ? moment(entry.start_time).format('MMM D, YYYY') : '---'}
                       </div>
                       <div>
                          <span className="block">{entry.start_time ? moment(entry.start_time).format('h:mm A') : '---'}</span>
                          <span className="block text-muted-foreground text-xs">
                             {/* THE "SCOTT BRADFORD" FIX: Check for null end_time */}
                             {entry.end_time ? (
                                moment(entry.end_time).format('h:mm A')
                             ) : (
                                <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 animate-pulse">LIVE</Badge>
                             )}
                          </span>
                       </div>
                       <div className="flex justify-end">
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