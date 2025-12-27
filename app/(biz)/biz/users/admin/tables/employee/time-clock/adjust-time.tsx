'use client';

import React, { useActionState } from 'react'; // React 19 Hook
import { useFormStatus } from 'react-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { submitTimeCorrection } from '@/app/actions/time-correction';
import { useToast } from '@/components/ui/use-toast';
import { Clock, AlertCircle, Loader2, History } from 'lucide-react';
import moment from 'moment';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <History className="h-4 w-4 mr-2" />}
      {pending ? 'Submitting...' : 'Submit Request'}
    </Button>
  );
}

const AdjustTime = () => {
  const [open, setOpen] = React.useState(false);
  const [state, formAction] = useActionState(submitTimeCorrection, { message: '', success: false });
  const { toast } = useToast();

  // Close dialog on success
  React.useEffect(() => {
    if (state.success) {
      toast({
        title: "Request Sent",
        description: state.message,
        variant: "success"
      });
      setOpen(false);
    } else if (state.message) {
      toast({
        title: "Error",
        description: state.message,
        variant: "destructive"
      });
    }
  }, [state, toast]);

  // Default to today
  const today = moment().format('YYYY-MM-DD');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 border-orange-200 hover:bg-orange-50 hover:text-orange-600 dark:border-orange-900 dark:hover:bg-orange-900/20">
          <AlertCircle className="w-4 h-4 text-orange-500" />
          Request Correction
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Time Sheet Correction</DialogTitle>
          <DialogDescription>
            Forgot to clock in/out? Submit the <strong>exact time</strong> you worked. 
            This will be reviewed by payroll.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="grid gap-4 py-4">
          
          {/* Date Selection */}
          <div className="grid gap-2">
            <Label htmlFor="date">Shift Date</Label>
            <Input 
              id="date" 
              name="date" 
              type="date" 
              defaultValue={today} 
              max={today} // Can't correct future time
              required 
            />
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="startTime">Clock In</Label>
              <div className="relative">
                <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input id="startTime" name="startTime" type="time" className="pl-9" required />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="endTime">Clock Out</Label>
              <div className="relative">
                <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input id="endTime" name="endTime" type="time" className="pl-9" required />
              </div>
            </div>
          </div>

          {/* Reason */}
          <div className="grid gap-2">
            <Label htmlFor="reason">Reason for Correction</Label>
            <Textarea 
              id="reason" 
              name="reason" 
              placeholder="e.g. Forgot to punch out, Scanner wasn't working, etc." 
              className="resize-none"
              rows={3}
              required
            />
          </div>

          <SubmitButton />
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AdjustTime;