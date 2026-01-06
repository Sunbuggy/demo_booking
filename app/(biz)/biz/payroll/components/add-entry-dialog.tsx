/**
 * ADD ENTRY DIALOG
 * Path: app/(biz)/biz/payroll/components/add-entry-dialog.tsx
 * Description: Form to create a new time entry from scratch.
 */

'use client';

import React, { useActionState } from 'react';
import { addTimeEntry } from '@/app/actions/admin-payroll';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function AddEntryDialog({ users, isLocked }: { users: any[], isLocked: boolean }) {
  const [open, setOpen] = React.useState(false);
  const [state, action, isPending] = useActionState(addTimeEntry, { message: '', success: false });
  const { toast } = useToast();

  React.useEffect(() => {
    if (state.success) {
      toast({ title: "Success", description: state.message });
      setOpen(false);
    } else if (state.message) {
      toast({ title: "Error", description: state.message, variant: "destructive" });
    }
  }, [state, toast]);

  if (isLocked) return null; // Don't show if week is locked

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-orange-600 hover:bg-orange-500">
            <PlusCircle className="w-4 h-4 mr-2" /> Add Manual Entry
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Manual Time Entry</DialogTitle>
        </DialogHeader>
        <form action={action} className="space-y-4">
           <div className="space-y-2">
              <Label>Employee</Label>
              <Select name="userId" required>
                 <SelectTrigger>
                    <SelectValue placeholder="Select Employee" />
                 </SelectTrigger>
                 <SelectContent>
                    {users.map(u => (
                        <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>
                    ))}
                 </SelectContent>
              </Select>
           </div>
           
           <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                 <Label>Start Time</Label>
                 <Input type="datetime-local" name="start" required />
              </div>
              <div className="space-y-2">
                 <Label>End Time (Optional)</Label>
                 <Input type="datetime-local" name="end" />
                 <p className="text-[10px] text-muted-foreground">Leave empty to clock them in now.</p>
              </div>
           </div>

           <div className="space-y-2">
              <Label>Reason</Label>
              <Textarea name="reason" required placeholder="Why is this being added manually?" />
           </div>

           <Button type="submit" className="w-full" disabled={isPending}>
               {isPending ? "Adding..." : "Create Entry"}
           </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}