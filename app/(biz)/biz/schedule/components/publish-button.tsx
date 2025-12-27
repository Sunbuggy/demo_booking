'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { publishWeeklySchedule } from '@/app/actions/publish-schedule';
import { Send, Loader2, MapPin } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import moment from 'moment';

const LOCATIONS = ['ALL', 'Las Vegas', 'Pismo', 'Michigan'];

export default function PublishButton({ weekStart }: { weekStart: string }) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [targetLocation, setTargetLocation] = useState('Las Vegas'); // Default to LV
  const { toast } = useToast();

  const weekEnd = moment(weekStart).add(6, 'days').endOf('day').toISOString();
  // Ensure we compare ISO strings properly in the server action

  const handleSend = async () => {
    setLoading(true);
    // Pass the selected location to the server action
    const result = await publishWeeklySchedule(weekStart, weekEnd, targetLocation);
    setLoading(false);

    if (result.success) {
      toast({ 
        title: "Schedules Sent!", 
        description: result.message, 
        variant: "success" 
      });
      setOpen(false);
    } else {
      toast({ 
        title: "Error Sending", 
        description: result.message, 
        variant: "destructive" 
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
           <Send className="w-4 h-4" />
           Publish
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Publish Schedule</DialogTitle>
          <DialogDescription>
            Email shifts for the week of <strong>{moment(weekStart).format('MMM D')}</strong>.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Select Location to Publish</Label>
            <Select value={targetLocation} onValueChange={setTargetLocation}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Locations (Master Send)</SelectItem>
                <SelectItem value="Las Vegas">Las Vegas</SelectItem>
                <SelectItem value="Pismo">Pismo</SelectItem>
                <SelectItem value="Michigan">Michigan</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Only employees with shifts in <strong>{targetLocation === 'ALL' ? 'any location' : targetLocation}</strong> will receive an email.
            </p>
          </div>

          <div className="text-sm bg-slate-50 dark:bg-slate-900 p-3 rounded-md border text-muted-foreground">
             <ul className="list-disc pl-4 space-y-1">
               <li>Staff receive only their own shifts.</li>
               <li>Includes link to live roster.</li>
               <li>Does not email staff who are off this week.</li>
             </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSend} disabled={loading} className="gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {loading ? "Sending..." : `Send to ${targetLocation}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}