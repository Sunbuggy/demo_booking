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
    <Button 
      type="submit" 
      disabled={pending} 
      className="w-full bg-primary text-primary-foreground hover:bg-primary/90 mt-2"
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4 mr-2" />}
      Add Exception
    </Button>
  );
}

export default function AvailabilityManager({ 
  existingRules, 
  userId 
}: { 
  existingRules: AvailabilityRule[], 
  userId?: string 
}) {
  const [state, formAction] = useActionState(addAvailabilityRule, { message: '', success: false });
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

  const handleDelete = async (id: string) => {
    if(!confirm("Remove this rule?")) return;
    await deleteAvailabilityRule(id, userId); 
    toast({ title: "Rule removed" });
  };

  return (
    <Card className="w-full shadow-sm border-t-4 border-t-primary bg-card text-card-foreground">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-bold text-foreground">
            <Clock className="w-4 h-4 text-primary" /> Availability Exceptions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* --- ADD RULE FORM (Vertical Stack for Sidebar Compatibility) --- */}
        <form action={formAction} className="p-3 border border-border rounded-lg bg-muted/30 space-y-3">
          {userId && <input type="hidden" name="targetUserId" value={userId} />}
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground uppercase font-bold">Day</Label>
              <Select name="dayOfWeek" defaultValue="1">
                <SelectTrigger className="h-9 bg-background border-input text-foreground text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DAYS.map((day, i) => <SelectItem key={i} value={i.toString()}>{day}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground uppercase font-bold">Type</Label>
              <Select name="preferenceLevel" defaultValue="preferred_off">
                <SelectTrigger className="h-9 bg-background border-input text-foreground text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="preferred_off">Preferred OFF</SelectItem>
                  <SelectItem value="unavailable">Unavailable</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
             <Label className="text-xs text-muted-foreground uppercase font-bold">Time Range</Label>
             <div className="flex items-center gap-2">
               <Input type="time" name="startTime" defaultValue="00:00" className="flex-1 h-9 bg-background border-input text-foreground text-sm" />
               <span className="text-muted-foreground">-</span>
               <Input type="time" name="endTime" defaultValue="23:59" className="flex-1 h-9 bg-background border-input text-foreground text-sm" />
             </div>
          </div>

          <SubmitButton />
        </form>

        {/* --- RULES LIST (Stacked Single Column) --- */}
        <div className="space-y-2">
          {existingRules.length === 0 && (
            <div className="text-center p-4 border border-dashed border-green-500/30 rounded-lg bg-green-500/5">
                <CheckCircle2 className="w-6 h-6 mx-auto mb-1 text-green-500/60" />
                <p className="text-xs text-muted-foreground">Available 7 Days/Week</p>
            </div>
          )}
          
          <div className="flex flex-col gap-2">
            {existingRules.sort((a,b) => a.day_of_week - b.day_of_week).map((rule) => (
              <div key={rule.id} className={`flex items-center justify-between p-2 pl-3 border-l-4 rounded-r-md shadow-sm bg-card border border-border ${
                rule.preference_level === 'unavailable' ? 'border-l-destructive' : 'border-l-primary'
              }`}>
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="flex flex-col min-w-[3rem] text-center">
                     <span className="text-xs font-bold uppercase text-foreground">{DAYS[rule.day_of_week].substring(0,3)}</span>
                  </div>
                  <div className="flex flex-col truncate">
                    <span className={`text-xs font-bold uppercase flex items-center gap-1 ${
                      rule.preference_level === 'unavailable' ? 'text-destructive' : 'text-primary'
                    }`}>
                      {rule.preference_level === 'unavailable' ? <Ban className="w-3 h-3"/> : <ThumbsDown className="w-3 h-3"/>}
                      {rule.preference_level === 'unavailable' ? 'Unavailable' : 'Pref Off'}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {rule.start_time.slice(0,5)} - {rule.end_time.slice(0,5)}
                    </span>
                  </div>
                </div>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleDelete(rule.id)} 
                    className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>

      </CardContent>
    </Card>
  );
}