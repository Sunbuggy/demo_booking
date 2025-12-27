'use client';

import React, { useActionState } from 'react';
import { manualEditTimeEntry, deleteTimeEntry } from '@/app/actions/admin-payroll'; // Import delete action
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Edit2, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import moment from 'moment';

export default function EditEntryDialog({ entry }: { entry: any }) {
  const [open, setOpen] = React.useState(false);
  
  // State for Edit Action
  const [editState, editAction, isEditPending] = useActionState(manualEditTimeEntry, { message: '', success: false });
  // State for Delete Action
  const [deleteState, deleteAction, isDeletePending] = useActionState(deleteTimeEntry, { message: '', success: false });
  
  const { toast } = useToast();

  // Watch for Edit Success
  React.useEffect(() => {
    if (editState.success) {
      toast({ title: "Updated", description: editState.message });
      setOpen(false);
    } else if (editState.message) {
      toast({ title: "Edit Failed", description: editState.message, variant: "destructive" });
    }
  }, [editState, toast]);

  // Watch for Delete Success
  React.useEffect(() => {
    if (deleteState.success) {
      toast({ title: "Deleted", description: deleteState.message, variant: "destructive" });
      setOpen(false);
    } else if (deleteState.message) {
      toast({ title: "Delete Failed", description: deleteState.message, variant: "destructive" });
    }
  }, [deleteState, toast]);

  const startDefault = moment(entry.start_time || entry.clock_in?.clock_in_time).format('YYYY-MM-DDTHH:mm');
  const endDefault = (entry.end_time || entry.clock_out?.clock_out_time)
    ? moment(entry.end_time || entry.clock_out.clock_out_time).format('YYYY-MM-DDTHH:mm') 
    : '';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm"><Edit2 className="w-4 h-4 text-muted-foreground" /></Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit or Delete Entry</DialogTitle>
        </DialogHeader>
        
        {/* Single Form handles both actions */}
        <form className="space-y-4 py-2">
          <input type="hidden" name="entryId" value={entry.id} />
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
               <Label>Clock In</Label>
               <Input type="datetime-local" name="newStart" defaultValue={startDefault} required />
            </div>
            <div className="space-y-2">
               <Label>Clock Out</Label>
               <Input type="datetime-local" name="newEnd" defaultValue={endDefault} />
            </div>
          </div>

          <div className="space-y-2">
             <Label className="text-red-500 font-semibold">Audit Reason (Required)</Label>
             <Textarea 
                name="reason" 
                placeholder="Reason for change OR deletion..." 
                required 
                className="resize-none border-red-200 focus-visible:ring-red-500"
             />
          </div>

          <div className="flex justify-between items-center pt-4 border-t mt-2">
             {/* DELETE BUTTON */}
             {/* We use formAction to route this click to the delete handler */}
             <Button 
                type="submit" 
                variant="destructive" 
                formAction={deleteAction}
                disabled={isDeletePending || isEditPending}
                onClick={(e) => {
                  if(!confirm("Are you sure you want to permanently DELETE this record?")) {
                    e.preventDefault();
                  }
                }}
             >
                {isDeletePending ? "Deleting..." : <><Trash2 className="w-4 h-4 mr-2" /> Delete Entry</>}
             </Button>

             {/* SAVE BUTTON */}
             {/* Default submit behavior goes to editAction */}
             <Button 
                type="submit" 
                formAction={editAction}
                disabled={isDeletePending || isEditPending}
             >
                {isEditPending ? "Saving..." : "Save Changes"}
             </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}