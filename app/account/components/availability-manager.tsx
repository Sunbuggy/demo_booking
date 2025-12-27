'use client';

import React, { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { addAvailabilityRule, deleteAvailabilityRule } from '@/app/actions/availability';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Trash2, Loader2, PlusCircle, Clock, Ban, ThumbsDown, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export type AvailabilityRule = {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  preference_level: 'unavailable' | 'available' | 'preferred_off';
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} size="sm" className="w-full md:w-auto">
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4 mr-2" />}
      Add Exception
    </Button>
  );
}

// UPDATED: Accept userId prop
export default function AvailabilityManager({ 
  existingRules, 
  userId 
}: { 
  existingRules: AvailabilityRule[], 
  userId?: string // Optional: If missing, assumes current user
}) {
  const [state, formAction] = useActionState(addAvailabilityRule, { message: '', success: false });
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

  const handleDelete = async (id: string) => {
    if(!confirm("Remove this rule?")) return;
    // We pass userId here too so the server knows an Admin is performing the action
    await deleteAvailabilityRule(id, userId); 
    toast({ title: "Rule removed" });
  };

  return (
    <Card className="w-full shadow-md border-t-4 border-t-amber-500">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" /> Availability Exceptions
        </CardTitle>
        <p className="text-sm text-muted-foreground">
           {userId ? "Define days this employee cannot work." : "Add days you cannot work or prefer off."}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* --- ADD RULE FORM --- */}
        <form action={formAction} className="p-4 border rounded-lg bg-slate-50 dark:bg-slate-900/40">
          {/* VITAL: Pass the userId to the server action */}
          {userId && <input type="hidden" name="targetUserId" value={userId} />}
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            
            <div className="space-y-2">
              <Label>Day of Week</Label>
              <Select name="dayOfWeek" defaultValue="1">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DAYS.map((day, i) => <SelectItem key={i} value={i.toString()}>{day}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Type</Label>
              <Select name="preferenceLevel" defaultValue="preferred_off">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="preferred_off">Preferred OFF</SelectItem>
                  <SelectItem value="unavailable">Absolutely Unavailable</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
               <Label>Time Range</Label>
               <div className="flex items-center gap-2">
                 <Input type="time" name="startTime" defaultValue="00:00" className="flex-1 min-w-[5rem]" />
                 <span className="text-muted-foreground">-</span>
                 <Input type="time" name="endTime" defaultValue="23:59" className="flex-1 min-w-[5rem]" />
               </div>
            </div>

            <SubmitButton />
          </div>
        </form>

        {/* --- RULES LIST --- */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm">Current Exceptions</h3>
          {existingRules.length === 0 && (
            <div className="text-center p-6 border border-dashed rounded-lg text-muted-foreground bg-green-50/50 dark:bg-green-900/10">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-500 opacity-50" />
                <p>No exceptions set.</p>
                <p className="text-xs">Considered <strong>Available 7 Days a Week</strong>.</p>
            </div>
          )}
          
          <div className="grid gap-2 md:grid-cols-2">
            {existingRules.sort((a,b) => a.day_of_week - b.day_of_week).map((rule) => (
              <div key={rule.id} className={`flex items-center justify-between p-3 border-l-4 rounded-r-md shadow-sm bg-white dark:bg-slate-950 ${
                rule.preference_level === 'unavailable' ? 'border-l-red-500' : 'border-l-amber-500'
              }`}>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="w-24 justify-center bg-slate-100 dark:bg-slate-800">
                    {DAYS[rule.day_of_week]}
                  </Badge>
                  <div className="flex flex-col">
                    <span className={`text-sm font-bold uppercase tracking-wider flex items-center gap-1 ${
                      rule.preference_level === 'unavailable' ? 'text-red-600' : 'text-amber-600'
                    }`}>
                      {rule.preference_level === 'unavailable' ? <Ban className="w-3 h-3"/> : <ThumbsDown className="w-3 h-3"/>}
                      {rule.preference_level === 'unavailable' ? 'Unavailable' : 'Preferred Off'}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">
                      {rule.start_time.slice(0,5)} - {rule.end_time.slice(0,5)}
                    </span>
                  </div>
                </div>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleDelete(rule.id)} 
                    className="h-8 w-8 text-muted-foreground hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

      </CardContent>
    </Card>
  );
}