/**
 * ADD ENTRY DIALOG
 * Path: app/(biz)/biz/payroll/components/add-entry-dialog.tsx
 * Update: Now triggers 'onSuccess' to refresh the dashboard immediately.
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
  onSuccess?: () => void; // <--- NEW PROP
}

export default function AddEntryDialog({ users, isLocked, onSuccess }: AddEntryProps) {
  const [open, setOpen] = useState(false);
  const [localStart, setLocalStart] = useState('');
  const [localEnd, setLocalEnd] = useState('');

  const [state, action, isPending] = useActionState(addTimeEntry, { message: '', success: false });
  const { toast } = useToast();

  useEffect(() => {
    if (state.success) {
      toast({ title: "Success", description: state.message });
      setOpen(false);
      setLocalStart('');
      setLocalEnd('');
      
      // TRIGGER REFRESH
      if (onSuccess) onSuccess(); 

    } else if (state.message) {
      toast({ title: "Error", description: state.message, variant: "destructive" });
    }
  }, [state, toast, onSuccess]);

  const getIsoTime = (localTime: string) => {
    if (!localTime) return '';
    return new Date(localTime).toISOString();
  };

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
               <input type="hidden" name="start" value={getIsoTime(localStart)} />
               <Input 
                 type="datetime-local" 
                 required 
                 className="font-mono text-sm"
                 value={localStart}
                 onChange={(e) => setLocalStart(e.target.value)}
               />
            </div>
            <div className="space-y-2">
               <Label className="text-xs font-bold uppercase text-gray-500">End Time</Label>
               <input type="hidden" name="end" value={getIsoTime(localEnd)} />
               <Input 
                 type="datetime-local" 
                 className="font-mono text-sm" 
                 value={localEnd}
                 onChange={(e) => setLocalEnd(e.target.value)}
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

          <Button type="submit" disabled={isPending} className="w-full mt-2 font-bold">
             {isPending ? (
               <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Adding...</>
             ) : 'Create Time Entry'}
          </Button>

        </form>
      </DialogContent>
    </Dialog>
  );
}