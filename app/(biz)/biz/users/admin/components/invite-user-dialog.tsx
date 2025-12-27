'use client';

import React, { useState, useActionState } from 'react'; // UPDATED: Imported from 'react'
import { useFormStatus } from 'react-dom'; 
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { inviteUser, InviteFormState } from '@/app/actions/admin-invite'; // Make sure this path matches where you saved the action
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Plus } from 'lucide-react';

const initialState: InviteFormState = {
  message: '',
  success: false,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Send Invite'}
    </Button>
  );
}

export default function InviteUserDialog() {
  const [open, setOpen] = useState(false);
  
  // UPDATED: usage of useActionState
  const [state, formAction, isPending] = useActionState(inviteUser, initialState);
  
  const { toast } = useToast();

  // Watch for state changes to close dialog on success
  React.useEffect(() => {
    if (state.success) {
      toast({
        title: "Success",
        description: state.message,
        variant: "success"
      });
      setOpen(false);
    } else if (state.message) {
       toast({
        title: "Error",
        description: state.message,
        variant: "destructive"
      });
    }
  }, [state, toast]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="gap-2">
          <Plus className="h-4 w-4" />
          Invite Staff
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Invite New Employee</DialogTitle>
          <DialogDescription>
            Send an email invitation. They will set their password upon clicking the link.
          </DialogDescription>
        </DialogHeader>
        
        <form action={formAction} className="grid gap-4 py-4">
          
          <div className="grid gap-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input id="fullName" name="fullName" placeholder="John Doe" required />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" name="email" type="email" placeholder="john@sunbuggy.com" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">Phone Number (Optional)</Label>
            <Input 
              id="phone" 
              name="phone" 
              type="tel" 
              placeholder="702-555-0199" 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="employeeId">Employee ID</Label>
              <Input id="employeeId" name="employeeId" placeholder="e.g. NV105" />
            </div>
            
            <div className="grid gap-2">
               <Label htmlFor="userLevel">Access Level</Label>
               <Select name="userLevel" defaultValue="300">
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="300">Employee (300)</SelectItem>
                  <SelectItem value="500">Manager (500)</SelectItem>
                  <SelectItem value="900">Admin (900)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
               <Label htmlFor="position">Position</Label>
               <Input id="position" name="position" placeholder="Driver / Tech" />
            </div>

            <div className="grid gap-2">
               <Label htmlFor="location">Primary Location</Label>
               <Select name="location" defaultValue="Las Vegas">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Las Vegas">Las Vegas</SelectItem>
                  <SelectItem value="Pismo">Pismo</SelectItem>
                  <SelectItem value="Michigan">Michigan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <SubmitButton />
        </form>
      </DialogContent>
    </Dialog>
  );
}