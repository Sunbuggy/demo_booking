/**
 * EDIT ENTRY DIALOG
 * Path: app/(biz)/biz/payroll/components/edit-entry-dialog.tsx
 * Description: A modal to audit, edit, delete, or resume time entries.
 * * CRITICAL FEATURES:
 * - Resume Shift: Clears the 'end_time' to fix split-shift errors.
 * - Audit Log: Enforces a reason for every change.
 * - Lock Awareness: Disables editing if the payroll week is finalized.
 */

'use client';

import React, { useActionState, useState, useEffect } from 'react';
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
  entry: any;       // The raw time entry object from Supabase
  isLocked: boolean; // Passed down from page.tsx check
}

export default function EditEntryDialog({ entry, isLocked }: EditEntryProps) {
  const [open, setOpen] = useState(false);
  const [resumeShift, setResumeShift] = useState(false);
  
  // Server Action Hooks
  const [editState, editAction, isEditPending] = useActionState(manualEditTimeEntry, { message: '', success: false });
  const [deleteState, deleteAction, isDeletePending] = useActionState(deleteTimeEntry, { message: '', success: false });
  
  const { toast } = useToast();

  // Handle Server Responses
  useEffect(() => {
    if (editState.success) {
      toast({ title: "Success", description: editState.message });
      setOpen(false);
      setResumeShift(false); // Reset internal state
    } else if (editState.message) {
      toast({ title: "Edit Failed", description: editState.message, variant: "destructive" });
    }
    
    if (deleteState.success) {
      toast({ title: "Deleted", description: deleteState.message, variant: "destructive" });
      setOpen(false);
    } else if (deleteState.message) {
      toast({ title: "Delete Failed", description: deleteState.message, variant: "destructive" });
    }
  }, [editState, deleteState, toast]);

  // DATE-FNS FORMATTING (Input requires: yyyy-MM-ddThh:mm)
  // Handles potential nulls safely
  const startDefault = entry.start_time 
    ? format(parseISO(entry.start_time), "yyyy-MM-dd'T'HH:mm") 
    : '';
    
  const endDefault = entry.end_time 
    ? format(parseISO(entry.end_time), "yyyy-MM-dd'T'HH:mm") 
    : '';

  // LOGIC: Only show "Resume Shift" if the entry is closed AND was closed recently (<12h).
  // This prevents UI clutter on old historical records.
  const showResumeOption = !!entry.end_time && 
    differenceInHours(parseISO(entry.end_time), parseISO(entry.start_time)) < 12;

  // RENDER: Locked State
  if (isLocked) {
      return (
        <Button variant="ghost" size="sm" disabled title="Payroll Period Locked">
          <Edit2 className="w-4 h-4 opacity-50" />
        </Button>
      );
  }

  // RENDER: Active State
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="hover:bg-blue-50 text-gray-400 hover:text-blue-600">
          <Edit2 className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Time Entry</DialogTitle>
        </DialogHeader>
        
        <form className="space-y-5 py-2">
          {/* Hidden Identifiers */}
          <input type="hidden" name="entryId" value={entry.id} />
          <input type="hidden" name="resumeShift" value={resumeShift ? 'true' : 'false'} /> 
          
          <div className="grid grid-cols-2 gap-4">
            {/* CLOCK IN */}
            <div className="space-y-2">
               <Label className="text-xs font-bold uppercase text-gray-500">Clock In</Label>
               <Input 
                 type="datetime-local" 
                 name="newStart" 
                 defaultValue={startDefault} 
                 required 
                 className="font-mono"
               />
            </div>

            {/* CLOCK OUT (Conditional UI) */}
            <div className="space-y-2">
               <Label className="text-xs font-bold uppercase text-gray-500">Clock Out</Label>
               {resumeShift ? (
                   <div className="h-10 border rounded-md bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-xs font-bold text-green-700 dark:text-green-400 border-green-200 dark:border-green-800 animate-in fade-in zoom-in-95 duration-200">
                       <History className="w-3 h-3 mr-2" /> RESUMING SHIFT...
                   </div>
               ) : (
                   <Input 
                     type="datetime-local" 
                     name="newEnd" 
                     defaultValue={endDefault} 
                     className="font-mono"
                   />
               )}
            </div>
          </div>

          {/* TOGGLE: Resume Shift Action */}
          {showResumeOption && !resumeShift && (
             <Button 
               type="button" 
               variant="outline" 
               size="sm" 
               className="w-full text-green-600 border-green-200 bg-green-50/50 hover:bg-green-100 hover:text-green-700 hover:border-green-300 transition-all" 
               onClick={() => setResumeShift(true)}
             >
                <AlertCircle className="w-3 h-3 mr-2"/> 
                Fix Split Shift (Resume this Shift)
             </Button>
          )}
          
          {resumeShift && (
             <Button 
               type="button" 
               variant="ghost" 
               size="sm" 
               className="w-full text-muted-foreground text-xs hover:text-gray-900" 
               onClick={() => setResumeShift(false)}
             >
                Cancel Resume (Restore Clock Out Time)
             </Button>
          )}

          {/* REASON FIELD */}
          <div className="space-y-2">
             <Label className="text-xs font-bold uppercase text-red-500">Audit Reason (Required)</Label>
             <Textarea 
               name="reason" 
               placeholder="Why is this record being changed?" 
               required 
               className="resize-none min-h-[80px] focus-visible:ring-red-500/20 border-gray-200" 
             />
          </div>

          {/* ACTIONS FOOTER */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-gray-800 mt-4">
             <Button 
                type="submit" 
                variant="destructive" 
                size="sm"
                formAction={deleteAction} 
                disabled={isDeletePending}
                onClick={(e) => { 
                  if(!confirm("Are you sure you want to PERMANENTLY DELETE this entry?\n\nThis action cannot be undone.")) {
                    e.preventDefault(); 
                  }
                }}
             >
                {isDeletePending ? <span className="animate-pulse">Deleting...</span> : <><Trash2 className="w-4 h-4 mr-2" /> Delete</>}
             </Button>

             <Button 
               type="submit" 
               formAction={editAction} 
               disabled={isEditPending}
               className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]"
             >
               {isEditPending ? <span className="animate-pulse">Saving...</span> : 'Save Changes'}
             </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}