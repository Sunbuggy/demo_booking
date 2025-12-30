/**
 * @file /app/(biz)/biz/users/admin/components/add-staff-dialog.tsx
 * @description Refactored to include Department logic and fix data persistence issues.
 */
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
import { Switch } from "@/components/ui/switch";
import { UserPlus, Loader2, Mail, UserCheck, MapPin, Briefcase } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

// --- CONFIGURATION (Synced with Roster Page for consistency) ---
const LOCATIONS_CONFIG: Record<string, string[]> = {
  'Las Vegas': ['ADMIN', 'OFFICE', 'DUNES', 'SHUTTLES', 'SHOP'],
  'Pismo': ['ADMIN', 'CSR', 'BEACH', 'SHOP'],
  'Michigan': ['ADMIN', 'SHOP', 'GUIDES', 'OFFICE']
};

function SubmitButton({ isInvite }: { isInvite: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold italic uppercase tracking-wider">
      {pending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : 
       isInvite ? <Mail className="h-4 w-4 mr-2" /> : <UserCheck className="h-4 w-4 mr-2" />}
      {isInvite ? 'Send Invitation' : 'Add to Roster (Silent)'}
    </Button>
  );
}

export default function AddStaffDialog() {
  const [open, setOpen] = useState(false);
  const [sendInvite, setSendInvite] = useState(true);
  const [selectedLoc, setSelectedLoc] = useState('Las Vegas');
  const [state, formAction] = useActionState(addStaffMember, { message: '', success: false });
  const { toast } = useToast();

  React.useEffect(() => {
    if (state.success) {
      toast({ title: "Success", description: state.message });
      setOpen(false);
    } else if (state.message) {
      toast({ title: "Error", description: state.message, variant: "destructive" });
    }
  }, [state, toast]);

  // Derived departments based on chosen location
  const availableDepartments = LOCATIONS_CONFIG[selectedLoc] || [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800">
          <UserPlus className="w-4 h-4 text-orange-500" />
          Add Staff
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-zinc-950 border-zinc-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-black italic tracking-tighter uppercase">
            Onboard <span className="text-orange-500">New Staff</span>
          </DialogTitle>
          <DialogDescription className="text-zinc-500">
            Link identity credentials to operational fleet data.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="grid gap-4 py-4">
          <input type="hidden" name="mode" value={sendInvite ? 'invite' : 'silent'} />
          
          {/* Invite Mode Toggle */}
          <div className="flex items-center justify-between p-3 border border-zinc-800 rounded-lg bg-zinc-900/50">
            <div className="space-y-0.5">
              <Label className="text-sm font-bold uppercase italic">Invitation Protocol</Label>
              <div className="text-[10px] text-zinc-500 uppercase tracking-widest">
                {sendInvite ? "External Email Link" : "Internal Silent Creation"}
              </div>
            </div>
            <Switch checked={sendInvite} onCheckedChange={setSendInvite} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-zinc-500 font-bold uppercase">Full Name</Label>
              <Input name="fullName" className="bg-zinc-900 border-zinc-800" placeholder="John Doe" required />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-zinc-500 font-bold uppercase">Email</Label>
              <Input name="email" type="email" className="bg-zinc-900 border-zinc-800" placeholder="john@sunbuggy.com" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-zinc-500 font-bold uppercase">Phone</Label>
              <Input name="phone" type="tel" className="bg-zinc-900 border-zinc-800 font-mono" placeholder="702-555-0199" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-zinc-500 font-bold uppercase">Employee ID</Label>
              <Input name="employeeId" className="bg-zinc-900 border-zinc-800 font-mono" placeholder="NV-100" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
               <Label className="text-xs text-orange-500 font-bold uppercase">Location</Label>
               <Select name="location" defaultValue="Las Vegas" onValueChange={setSelectedLoc}>
                 <SelectTrigger className="bg-zinc-900 border-zinc-800">
                    <SelectValue />
                 </SelectTrigger>
                 <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                   {Object.keys(LOCATIONS_CONFIG).map(loc => (
                     <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>

             <div className="space-y-2">
               <Label className="text-xs text-orange-500 font-bold uppercase">Department</Label>
               <Select name="department" required>
                 <SelectTrigger className="bg-zinc-900 border-zinc-800">
                    <SelectValue placeholder="Select Dept" />
                 </SelectTrigger>
                 <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                   {availableDepartments.map(dept => (
                     <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>
          </div>

          <div className="space-y-2">
             <Label className="text-xs text-zinc-500 font-bold uppercase">Access Level</Label>
             <Select name="userLevel" defaultValue="300">
              <SelectTrigger className="bg-zinc-900 border-zinc-800">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
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