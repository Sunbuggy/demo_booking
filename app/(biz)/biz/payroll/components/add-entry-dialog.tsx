/**
 * ADD ENTRY DIALOG
 * Path: app/(biz)/biz/payroll/components/add-entry-dialog.tsx
 * Description: Form to create a new time entry from scratch.
 * * FEATURES:
 * - Server Action Integration: Calls 'addTimeEntry' with audit logging.
 * - Lock Awareness: Hides button if payroll is finalized.
 * - Employee Selection: Dropdown to assign the punch.
 */

'use client';

import React, { useActionState, useState, useEffect } from 'react';
import { addTimeEntry } from '@/app/actions/admin-payroll';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/components/ui/use-toast';

interface AddEntryProps {
  users: { id: string; full_name: string }[];
  isLocked: boolean;
}

export default function AddEntryDialog({ users, isLocked }: AddEntryProps) {
  const [open, setOpen] = useState(false);
  
  // Server Action Hook
  const [state, action, isPending] = useActionState(addTimeEntry, { message: '', success: false });
  const { toast } = useToast();

  // Handle Response
  useEffect(() => {
    if (state.success) {
      toast({ title: "Success", description: state.message });
      setOpen(false);
    } else if (state.message) {
      toast({ title: "Error", description: state.message, variant: "destructive" });
    }
  }, [state, toast]);

  // If week is locked, do not allow adding entries
  if (isLocked) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-orange-600 hover:bg-orange-700 text-white font-bold gap-2 shadow-sm transition-all">
          <Plus className="w-4 h-4" /> Add Manual Entry
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Add Manual Time Entry</DialogTitle>
        </DialogHeader>

        <form action={action} className="space-y-5 py-2">
          
          {/* EMPLOYEE SELECT */}
          <div className="space-y-2">
             <Label className="text-xs font-bold uppercase text-gray-500">Employee</Label>
             <Select name="userId" required>
               <SelectTrigger>
                 <SelectValue placeholder="Select Staff Member..." />
               </SelectTrigger>
               <SelectContent className="max-h-[200px]">
                 {users.map((u) => (
                   <SelectItem key={u.id} value={u.id}>
                     {u.full_name}
                   </SelectItem>
                 ))}
               </SelectContent>
             </Select>
          </div>

          {/* TIME INPUTS */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
               <Label className="text-xs font-bold uppercase text-gray-500">Start Time</Label>
               <Input 
                 type="datetime-local" 
                 name="start" 
                 required 
                 className="font-mono text-sm" 
               />
            </div>
            <div className="space-y-2">
               <Label className="text-xs font-bold uppercase text-gray-500">End Time</Label>
               <Input 
                 type="datetime-local" 
                 name="end" 
                 className="font-mono text-sm" 
               />
               <p className="text-[10px] text-gray-400 mt-1">
                 Leave blank to keep them clocked in (Active).
               </p>
            </div>
          </div>

          {/* REASON */}
          <div className="space-y-2">
             <Label className="text-xs font-bold uppercase text-red-500">Audit Reason (Required)</Label>
             <Textarea 
               name="reason" 
               placeholder="Why was this entry created manually?" 
               required 
               className="resize-none min-h-[80px] focus-visible:ring-red-500/20 border-gray-200"
             />
          </div>

          {/* SUBMIT */}
          <Button type="submit" disabled={isPending} className="w-full mt-2 font-bold">
             {isPending ? (
               <>
                 <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Adding...
               </>
             ) : (
               'Create Time Entry'
             )}
          </Button>

        </form>
      </DialogContent>
    </Dialog>
  );
}