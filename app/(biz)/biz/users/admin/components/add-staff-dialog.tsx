'use client';

import React, { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { addStaffMember } from '@/app/actions/add-staff';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from "@/components/ui/switch"; // Ensure you have this shadcn component
import { UserPlus, Loader2, Mail, UserCheck } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

function SubmitButton({ isInvite }: { isInvite: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : 
       isInvite ? <Mail className="h-4 w-4 mr-2" /> : <UserCheck className="h-4 w-4 mr-2" />}
      {isInvite ? 'Send Invitation' : 'Add to Roster (Silent)'}
    </Button>
  );
}

export default function AddStaffDialog() {
  const [open, setOpen] = useState(false);
  const [sendInvite, setSendInvite] = useState(true); // Default to sending email
  const [state, formAction] = useActionState(addStaffMember, { message: '', success: false });
  const { toast } = useToast();

  React.useEffect(() => {
    if (state.success) {
      toast({ title: "Success", description: state.message, variant: "success" });
      setOpen(false);
    } else if (state.message) {
      toast({ title: "Error", description: state.message, variant: "destructive" });
    }
  }, [state, toast]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <UserPlus className="w-4 h-4" />
          Add Staff
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Staff Member</DialogTitle>
          <DialogDescription>
            Enter employee details below.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="grid gap-4 py-4">
          {/* CONTROL MODE: Invite vs Silent */}
          <input type="hidden" name="mode" value={sendInvite ? 'invite' : 'silent'} />
          
          <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
            <div className="space-y-0.5">
              <Label className="text-base">Send Email Invitation?</Label>
              <div className="text-xs text-muted-foreground">
                {sendInvite 
                  ? "User will receive a link to set their password." 
                  : "User is created immediately without email."}
              </div>
            </div>
            <Switch checked={sendInvite} onCheckedChange={setSendInvite} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input name="fullName" placeholder="John Doe" required />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input name="email" type="email" placeholder="john@sunbuggy.com" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Phone (Optional)</Label>
              <Input name="phone" type="tel" placeholder="702-555-0199" />
            </div>
            <div className="space-y-2">
              <Label>Employee ID</Label>
              <Input name="employeeId" placeholder="e.g. NV105" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
               <Label>Position</Label>
               <Input name="position" placeholder="Driver / Tech" required />
             </div>
             
             <div className="space-y-2">
               <Label>Location</Label>
               <Select name="location" defaultValue="Las Vegas Dunes">
                 <SelectTrigger><SelectValue /></SelectTrigger>
                 <SelectContent>
                   <SelectItem value="Las Vegas Dunes">Las Vegas Dunes</SelectItem>
                   <SelectItem value="Las Vegas Speedway">Las Vegas Speedway</SelectItem>
                   <SelectItem value="Pismo Beach">Pismo Beach</SelectItem>
                   <SelectItem value="Amargosa">Amargosa</SelectItem>
                 </SelectContent>
               </Select>
             </div>
          </div>

          <div className="space-y-2">
             <Label>Access Level</Label>
             <Select name="userLevel" defaultValue="300">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="300">Employee (300)</SelectItem>
                <SelectItem value="500">Manager (500)</SelectItem>
                <SelectItem value="900">Admin (900)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <SubmitButton isInvite={sendInvite} />
        </form>
      </DialogContent>
    </Dialog>
  );
}