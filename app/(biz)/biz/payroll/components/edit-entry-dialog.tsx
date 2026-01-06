/**
 * EDIT ENTRY DIALOG
 * Path: app/(biz)/biz/payroll/components/edit-entry-dialog.tsx
 * Description: Dialog to Edit, Delete, or Resume Shift.
 * * FEATURES:
 * - Resume Shift Mode: Toggles end time to NULL.
 * - Lock Awareness: Disabled if week is locked.
 * - Date-FNS: Handles input defaults using ISO format.
 */

'use client';

import React, { useActionState } from 'react';
import { manualEditTimeEntry, deleteTimeEntry } from '@/app/actions/admin-payroll';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Edit2, Trash2, History, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { format, parseISO, differenceInHours } from 'date-fns';

interface EditEntryProps {
  entry: any;
  isLocked: boolean;
}

export default function EditEntryDialog({ entry, isLocked }: EditEntryProps) {
  const [open, setOpen] = React.useState(false);
  const [resumeShift, setResumeShift] = React.useState(false);
  
  const [editState, editAction, isEditPending] = useActionState(manualEditTimeEntry, { message: '', success: false });
  const [deleteState, deleteAction, isDeletePending] = useActionState(deleteTimeEntry, { message: '', success: false });
  const { toast } = useToast();

  // Handle Action Responses
  React.useEffect(() => {
    if (editState.success) {
      toast({ title: "Updated", description: editState.message });
      setOpen(false);
      setResumeShift(false); // Reset state
    } else if (editState.message) toast({ title: "Edit Failed", description: editState.message, variant: "destructive" });
    
    if (deleteState.success) {
      toast({ title: "Deleted", description: deleteState.message, variant: "destructive" });
      setOpen(false);
    } else if (deleteState.message) toast({ title: "Delete Failed", description: deleteState.message, variant: "destructive" });
  }, [editState, deleteState, toast]);

  // DATE-FNS FORMATTING FOR INPUTS (Required format: yyyy-MM-ddThh:mm)
  const startDefault = entry.start_time ? format(parseISO(entry.start_time), "yyyy-MM-dd'T'HH:mm") : '';
  const endDefault = entry.end_time ? format(parseISO(entry.end_time), "yyyy-MM-dd'T'HH:mm") : '';

  // LOGIC: Show resume option only if entry is closed AND closed < 12 hours after start.
  // This prevents accidentally resuming a shift from a month ago.
  const showResumeOption = !!entry.end_time && differenceInHours(parseISO(entry.end_time), parseISO(entry.start_time)) < 12;

  // If locked, return disabled button
  if (isLocked) {
      return <Button variant="ghost" size="sm" disabled title="Week Locked"><Edit2 className="w-4 h-4 opacity-50" /></Button>;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm"><Edit2 className="w-4 h-4 text-muted-foreground" /></Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Edit or Delete Entry</DialogTitle></DialogHeader>
        
        <form className="space-y-4 py-2">
          <input type="hidden" name="entryId" value={entry.id} />
          {/* PASS RESUME FLAG TO SERVER */}
          <input type="hidden" name="resumeShift" value={resumeShift ? 'true' : 'false'} /> 
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
               <Label>Clock In</Label>
               <Input type="datetime-local" name="newStart" defaultValue={startDefault} required />
            </div>
            <div className="space-y-2">
               <Label>Clock Out</Label>
               {resumeShift ? (
                   <div className="h-10 border rounded-md bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-xs font-bold text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">
                       <History className="w-3 h-3 mr-2" /> WILL RESUME SHIFT
                   </div>
               ) : (
                   <Input type="datetime-local" name="newEnd" defaultValue={endDefault} />
               )}
            </div>
          </div>

          {/* TOGGLE RESUME MODE */}
          {showResumeOption && !resumeShift && (
             <Button type="button" variant="outline" size="sm" className="w-full text-green-600 border-green-200" onClick={() => setResumeShift(true)}>
                <AlertCircle className="w-3 h-3 mr-2"/> User accidentally clocked out? (Resume Shift)
             </Button>
          )}
          {resumeShift && (
             <Button type="button" variant="ghost" size="sm" className="w-full text-muted-foreground text-xs" onClick={() => setResumeShift(false)}>
                Cancel (Restore Clock Out Time)
             </Button>
          )}

          <div className="space-y-2">
             <Label className="text-red-500 font-semibold">Audit Reason (Required)</Label>
             <Textarea name="reason" placeholder="Reason..." required className="resize-none border-red-200 focus-visible:ring-red-500" />
          </div>

          <div className="flex justify-between items-center pt-4 border-t mt-2">
             <Button type="submit" variant="destructive" formAction={deleteAction} disabled={isDeletePending}
                onClick={(e) => { if(!confirm("Permanently DELETE?")) e.preventDefault(); }}>
                <Trash2 className="w-4 h-4 mr-2" /> Delete Entry
             </Button>
             <Button type="submit" formAction={editAction} disabled={isEditPending}>Save Changes</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}