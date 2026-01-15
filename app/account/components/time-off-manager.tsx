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

function formatLocalDate(dateStr: string) {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split('-');
  return `${parseInt(month)}/${parseInt(day)}/${year}`;
}

function SubmitButton({ isAdmin }: { isAdmin: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button 
      type="submit" 
      disabled={pending} 
      className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2 mt-2"
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : isAdmin ? <ShieldCheck className="w-4 h-4" /> : <Plane className="h-4 w-4" />}
      {isAdmin ? "Approve & Save" : "Request Time Off"}
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
        variant: state.success ? "default" : "destructive"
      });
    }
  }, [state, toast]);

  const handleCancel = async (id: string) => {
    if(!confirm("Cancel this request?")) return;
    await cancelTimeOffRequest(id, userId);
    toast({ title: "Request cancelled" });
  };

  return (
    <Card className={`w-full shadow-sm border-t-4 bg-card text-card-foreground ${
      userId ? 'border-t-primary' : 'border-t-secondary'
    }`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-bold text-foreground">
            <CalendarClock className={`w-4 h-4 ${userId ? 'text-primary' : 'text-secondary'}`} /> 
            {userId ? "Manage Time Off" : "Time Off Requests"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* --- FORM (Vertical Stack) --- */}
        <form action={formAction} className="p-3 border border-border rounded-lg bg-muted/20 space-y-3">
          {userId && <input type="hidden" name="targetUserId" value={userId} />}
          
          <div className="grid grid-cols-2 gap-3">
             <div className="space-y-1">
               <Label className="text-xs text-foreground font-bold">Start</Label>
               <Input type="date" name="startDate" required className="h-9 bg-background border-input text-xs text-foreground" />
             </div>
             <div className="space-y-1">
               <Label className="text-xs text-foreground font-bold">End</Label>
               <Input type="date" name="endDate" required className="h-9 bg-background border-input text-xs text-foreground" />
             </div>
          </div>
          
          <div className="space-y-1">
             <Label className="text-xs text-foreground font-bold">Reason</Label>
             <Textarea name="reason" placeholder="e.g. Vacation..." className="resize-none bg-background border-input text-sm text-foreground min-h-[60px]" required />
          </div>

          <SubmitButton isAdmin={!!userId} />
        </form>

        {/* --- LIST --- */}
        <div className="space-y-2">
          {requests.map((req) => (
            <div key={req.id} className="flex items-start justify-between p-3 border border-border rounded-md bg-card shadow-sm gap-2 transition-all hover:bg-muted/30">
              <div className="flex flex-col gap-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-foreground">
                    {formatLocalDate(req.start_date)} 
                    {req.start_date !== req.end_date && ` - ${formatLocalDate(req.end_date)}`}
                  </span>
                  
                  {req.status === 'approved' && (
                      <Badge className="h-5 px-1.5 text-[10px] bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/20 border">Approved</Badge>
                  )}
                  {req.status === 'denied' && (
                      <Badge className="h-5 px-1.5 text-[10px] bg-destructive/15 text-destructive border-destructive/20 border">Denied</Badge>
                  )}
                  {req.status === 'pending' && (
                      <Badge className="h-5 px-1.5 text-[10px] bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/20 border">Pending</Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground truncate">{req.reason}</span>
              </div>
              
              {(req.status === 'pending' || userId) && (
                <Button variant="ghost" size="icon" onClick={() => handleCancel(req.id)} className="h-6 w-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}