'use client';

import React from 'react';
import { approveCorrectionRequest, denyCorrectionRequest } from '@/app/actions/admin-payroll';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Check, X, AlertCircle, Clock, CalendarCheck } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import moment from 'moment';
import EditEntryDialog from './edit-entry-dialog'; // We will create this next

// Types
type Request = {
  id: string;
  user_id: string;
  start_time: string;
  end_time: string;
  reason: string;
  created_at: string;
  user: { full_name: string; avatar_url: string }; // joined data
};

type Entry = {
  id: string;
  user_id: string;
  clock_in: { clock_in_time: string };
  clock_out: { clock_out_time: string } | null;
  user: { full_name: string; avatar_url: string };
};

export default function PayrollManager({ requests, entries }: { requests: Request[], entries: Entry[] }) {
  const { toast } = useToast();

  const handleApprove = async (id: string) => {
    const res = await approveCorrectionRequest(id);
    toast({ 
      title: res.success ? "Approved" : "Error", 
      description: res.message,
      variant: res.success ? "default" : "destructive" 
    });
  };

  const handleDeny = async (id: string) => {
    if(!confirm("Deny this request?")) return;
    const res = await denyCorrectionRequest(id);
    toast({ title: res.message });
  };

  return (
    <div className="space-y-6">
      
      {/* --- TOP SECTION: ACTION QUEUE --- */}
      <div className="grid gap-4 md:grid-cols-1">
        <Card className="border-l-4 border-l-orange-500 bg-orange-50/20">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertCircle className="w-5 h-5 text-orange-600" /> 
              Correction Queue ({requests.length})
            </CardTitle>
            <CardDescription>Employees requesting retroactive punches.</CardDescription>
          </CardHeader>
          <CardContent>
            {requests.length === 0 ? (
               <div className="text-sm text-muted-foreground italic py-4">All caught up! No pending requests.</div>
            ) : (
              <div className="space-y-3">
                {requests.map((req) => (
                  <div key={req.id} className="flex flex-col md:flex-row items-start md:items-center justify-between bg-white dark:bg-slate-900 p-3 rounded-md shadow-sm border gap-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={req.user?.avatar_url} />
                        <AvatarFallback>{req.user?.full_name?.[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold text-sm">{req.user?.full_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {moment(req.start_time).format('MMM D')} • {moment(req.start_time).format('h:mm A')} - {moment(req.end_time).format('h:mm A')}
                        </div>
                        <div className="text-xs font-medium text-orange-700 mt-1">"{req.reason}"</div>
                      </div>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                      <Button size="sm" variant="ghost" className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDeny(req.id)}>
                        <X className="w-4 h-4 mr-1" /> Deny
                      </Button>
                      <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700 text-white" onClick={() => handleApprove(req.id)}>
                        <Check className="w-4 h-4 mr-1" /> Approve
                      </Button>
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
           <CardDescription>View and manually edit punches. All edits are audited.</CardDescription>
        </CardHeader>
        <CardContent>
           <div className="rounded-md border">
              <div className="grid grid-cols-4 bg-muted p-3 font-medium text-sm">
                 <div className="col-span-1">Employee</div>
                 <div className="col-span-1">Date</div>
                 <div className="col-span-1">Shift</div>
                 <div className="col-span-1 text-right">Actions</div>
              </div>
              <div className="divide-y">
                 {entries.map((entry) => (
                    <div key={entry.id} className="grid grid-cols-4 p-3 items-center text-sm hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                       <div className="col-span-1 font-medium truncate">{entry.user?.full_name}</div>
                       <div className="col-span-1 text-muted-foreground">
                          {moment(entry.clock_in?.clock_in_time).format('MMM D, YYYY')}
                       </div>
                       <div className="col-span-1">
                          <span className="block">{moment(entry.clock_in?.clock_in_time).format('h:mm A')}</span>
                          <span className="block text-muted-foreground text-xs">
                             {entry.clock_out?.clock_out_time ? moment(entry.clock_out.clock_out_time).format('h:mm A') : <Badge variant="outline" className="text-green-600 border-green-200">Active</Badge>}
                          </span>
                       </div>
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