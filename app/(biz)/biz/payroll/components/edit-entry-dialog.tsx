/**
 * EDIT ENTRY DIALOG
 * Path: app/(biz)/biz/payroll/components/edit-entry-dialog.tsx
 * Update: Now triggers 'onSuccess' to refresh the dashboard immediately.
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
  entry: any;       
  isLocked: boolean; 
  onSuccess?: () => void; // <--- NEW PROP
}

export default function EditEntryDialog({ entry, isLocked, onSuccess }: EditEntryProps) {
  const [open, setOpen] = useState(false);
  const [resumeShift, setResumeShift] = useState(false);
  
  const startDefault = entry.start_time 
    ? format(parseISO(entry.start_time), "yyyy-MM-dd'T'HH:mm") 
    : '';
    
  const endDefault = entry.end_time 
    ? format(parseISO(entry.end_time), "yyyy-MM-dd'T'HH:mm") 
    : '';

  const [localStart, setLocalStart] = useState(startDefault);
  const [localEnd, setLocalEnd] = useState(endDefault);

  useEffect(() => {
    setLocalStart(entry.start_time ? format(parseISO(entry.start_time), "yyyy-MM-dd'T'HH:mm") : '');
    setLocalEnd(entry.end_time ? format(parseISO(entry.end_time), "yyyy-MM-dd'T'HH:mm") : '');
  }, [entry]);

  const [editState, editAction, isEditPending] = useActionState(manualEditTimeEntry, { message: '', success: false });
  const [deleteState, deleteAction, isDeletePending] = useActionState(deleteTimeEntry, { message: '', success: false });
  
  const { toast } = useToast();

  useEffect(() => {
    if (editState.success) {
      toast({ title: "Success", description: editState.message });
      setOpen(false);
      setResumeShift(false); 
      
      // TRIGGER REFRESH
      if (onSuccess) onSuccess();

    } else if (editState.message) {
      toast({ title: "Edit Failed", description: editState.message, variant: "destructive" });
    }
    
    if (deleteState.success) {
      toast({ title: "Deleted", description: deleteState.message, variant: "destructive" });
      setOpen(false);

      // TRIGGER REFRESH
      if (onSuccess) onSuccess();

    } else if (deleteState.message) {
      toast({ title: "Delete Failed", description: deleteState.message, variant: "destructive" });
    }
  }, [editState, deleteState, toast, onSuccess]);

  const showResumeOption = !!entry.end_time && 
    differenceInHours(parseISO(entry.end_time), parseISO(entry.start_time)) < 12;

  const getIsoTime = (localTime: string) => {
    if (!localTime) return '';
    return new Date(localTime).toISOString();
  };

  if (isLocked) {
      return (
        <Button variant="ghost" size="sm" disabled title="Payroll Period Locked">
          <Edit2 className="w-4 h-4 opacity-50" />
        </Button>
      );
  }

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
          <input type="hidden" name="entryId" value={entry.id} />
          <input type="hidden" name="resumeShift" value={resumeShift ? 'true' : 'false'} /> 
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
               <Label className="text-xs font-bold uppercase text-gray-500">Clock In</Label>
               <input type="hidden" name="newStart" value={getIsoTime(localStart)} />
               <Input 
                 type="datetime-local" 
                 value={localStart}
                 onChange={(e) => setLocalStart(e.target.value)}
                 required 
                 className="font-mono"
               />
            </div>

            <div className="space-y-2">
               <Label className="text-xs font-bold uppercase text-gray-500">Clock Out</Label>
               {resumeShift ? (
                   <div className="h-10 border rounded-md bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-xs font-bold text-green-700 dark:text-green-400 border-green-200 dark:border-green-800 animate-in fade-in zoom-in-95 duration-200">
                       <History className="w-3 h-3 mr-2" /> RESUMING SHIFT...
                   </div>
               ) : (
                   <>
                     <input type="hidden" name="newEnd" value={getIsoTime(localEnd)} />
                     <Input 
                       type="datetime-local" 
                       value={localEnd}
                       onChange={(e) => setLocalEnd(e.target.value)}
                       className="font-mono"
                     />
                   </>
               )}
            </div>
          </div>

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

          <div className="space-y-2">
             <Label className="text-xs font-bold uppercase text-red-500">Audit Reason (Required)</Label>
             <Textarea 
               name="reason" 
               placeholder="Why is this record being changed?" 
               required 
               className="resize-none min-h-[80px] focus-visible:ring-red-500/20 border-gray-200" 
             />
          </div>

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