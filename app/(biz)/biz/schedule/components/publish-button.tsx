'use client';

/**
 * @file app/(biz)/biz/schedule/components/publish-button.tsx
 * @description Button to trigger the Weekly Roster Email.
 * Updated: Restored Location Selection (ALL vs Specific).
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { sendRosterEmail } from '@/app/actions/publish-schedule'; // Points to the new logic
import { Send, Loader2, Mail, Info, MapPin } from 'lucide-react';
import { toast } from 'sonner'; 
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { format, parseISO } from 'date-fns';

export default function PublishButton({ weekStart }: { weekStart: string }) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [targetLocation, setTargetLocation] = useState('Las Vegas'); // Default

  // Format date for display (e.g. "Oct 12")
  const formattedDate = format(parseISO(weekStart), 'MMM d');

  const handleSend = async () => {
    setLoading(true);
    
    // Call the server action with the selected location
    const result = await sendRosterEmail(weekStart, targetLocation);
    
    setLoading(false);

    if (result.success) {
      toast.success("Schedules Sent!", {
        description: result.message
      });
      setOpen(false);
    } else {
      toast.error("Error Sending", {
        description: result.error || "Unknown server error."
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full justify-start text-xs h-8">
           <Mail className="w-3.5 h-3.5 mr-2" />
           Email Schedule
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Publish Schedule</DialogTitle>
          <DialogDescription>
            Email roster for week of <strong className="text-foreground">{formattedDate}</strong>.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          
          <div className="space-y-2">
            <Label>Select Location</Label>
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
              {targetLocation === 'ALL' 
                ? "Emails ALL staff active in ANY location."
                : `Emails only staff with shifts or time off in ${targetLocation}.`}
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md border border-blue-100 dark:border-blue-900 flex gap-3">
             <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
             <div className="text-sm text-blue-800 dark:text-blue-300">
               <p className="font-bold mb-1">What's included?</p>
               <ul className="list-disc pl-4 space-y-1 text-xs opacity-90">
                 <li>Shift Assignments for <strong>{targetLocation}</strong>.</li>
                 <li>Approved Time Off (Yellow flags).</li>
                 <li>Link to the live Roster page.</li>
               </ul>
             </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSend} disabled={loading} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {loading ? "Sending..." : "Send Emails"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}