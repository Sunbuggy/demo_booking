'use client';

import React, { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { submitTimeOffRequest, cancelTimeOffRequest } from '@/app/actions/time-off';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Trash2, Loader2, Plane, CalendarClock, ShieldCheck } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Textarea } from '@/components/ui/textarea';

export type TimeOffRequest = {
  id: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  status: 'pending' | 'approved' | 'denied';
};

/**
 * THE FIX: Timezone-Safe Date Formatter
 * Prevents the "Day Before" bug by splitting the string 
 * and manually reassembling it without Date object conversion.
 */
function formatLocalDate(dateStr: string) {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split('-');
  return `${parseInt(month)}/${parseInt(day)}/${year}`;
}

function SubmitButton({ isAdmin }: { isAdmin: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} size="sm" className="w-full md:w-auto gap-2">
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : isAdmin ? <ShieldCheck className="w-4 h-4" /> : <Plane className="h-4 w-4" />}
      {isAdmin ? "Approve & Save" : "Submit Request"}
    </Button>
  );
}

export default function TimeOffManager({ 
  requests, 
  userId 
}: { 
  requests: TimeOffRequest[], 
  userId?: string 
}) {
  const [state, formAction] = useActionState(submitTimeOffRequest, { message: '', success: false });
  const { toast } = useToast();

  React.useEffect(() => {
    if (state.message) {
      toast({
        title: state.success ? "Success" : "Error",
        description: state.message,
        variant: state.success ? "success" : "destructive"
      });
    }
  }, [state, toast]);

  const handleCancel = async (id: string) => {
    if(!confirm("Cancel this request?")) return;
    await cancelTimeOffRequest(id, userId);
    toast({ title: "Request cancelled" });
  };

  return (
    <Card className={`w-full shadow-md border-t-4 ${userId ? 'border-t-blue-500' : 'border-t-purple-500'}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <CalendarClock className="w-5 h-5" /> 
            {userId ? "Manage Time Off" : "Time Off Requests"}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {userId 
            ? "Submit a request on behalf of this user. It will be auto-approved." 
            : "Request days off for vacation, appointments, or personal leave."}
        </p>
      </CardHeader>
      <CardContent className="space-y-8">
        
        <form action={formAction} className="p-4 border rounded-lg bg-slate-50 dark:bg-slate-900/40">
          {userId && <input type="hidden" name="targetUserId" value={userId} />}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <Label>Start Date</Label>
                   <Input type="date" name="startDate" required className="bg-white dark:bg-slate-950" />
                 </div>
                 <div className="space-y-2">
                   <Label>End Date</Label>
                   <Input type="date" name="endDate" required className="bg-white dark:bg-slate-950" />
                 </div>
               </div>
               <div className="space-y-2">
                 <Label>Reason / Note</Label>
                 <Textarea name="reason" placeholder="e.g. Doctor's appointment..." className="resize-none bg-white dark:bg-slate-950" rows={2} required />
               </div>
            </div>
            <div className="flex items-end justify-end">
               <SubmitButton isAdmin={!!userId} />
            </div>
          </div>
        </form>

        <div className="space-y-3">
          <h3 className="font-semibold text-sm">Request History</h3>
          <div className="grid gap-2">
            {requests.map((req) => (
              <div key={req.id} className="flex flex-col md:flex-row md:items-center justify-between p-3 border rounded-md bg-white dark:bg-slate-950 shadow-sm gap-3">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {/* FIXED: Uses local string formatting to avoid UTC jump */}
                      {formatLocalDate(req.start_date)} 
                      {req.start_date !== req.end_date && ` - ${formatLocalDate(req.end_date)}`}
                    </span>
                    <Badge className={`${
                      req.status === 'approved' ? 'bg-green-600' : 
                      req.status === 'denied' ? 'bg-red-600' : 'bg-yellow-500 text-black'
                    }`}>
                      {req.status}
                    </Badge>
                  </div>
                  <span className="text-sm text-muted-foreground">{req.reason}</span>
                </div>
                {(req.status === 'pending' || userId) && (
                  <Button variant="ghost" size="sm" onClick={() => handleCancel(req.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 self-end md:self-center">
                    <Trash2 className="h-4 w-4 mr-1" /> Cancel
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}