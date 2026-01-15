/**
 * @file /app/(biz)/biz/users/admin/components/add-staff-dialog.tsx
 * @description Refactored to include Department logic and use Centralized User Levels with Semantic Theming.
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
import { UserPlus, Loader2, Mail, UserCheck } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

// --- NEW IMPORT: Single Source of Truth ---
import { USER_LEVELS, ROLE_LABELS } from '@/lib/constants/user-levels';

// --- CONFIGURATION (Synced with Roster Page for consistency) ---
const LOCATIONS_CONFIG: Record<string, string[]> = {
  'Las Vegas': ['ADMIN', 'OFFICE', 'DUNES', 'SHUTTLES', 'SHOP'],
  'Pismo': ['ADMIN', 'CSR', 'BEACH', 'SHOP'],
  'Michigan': ['ADMIN', 'SHOP', 'GUIDES', 'OFFICE']
};

function SubmitButton({ isInvite }: { isInvite: boolean }) {
  const { pending } = useFormStatus();
  return (
    // SEMANTIC: Primary Button Styling
    // Replaced bg-orange-600 with bg-primary
    <Button 
      type="submit" 
      disabled={pending} 
      className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold italic uppercase tracking-wider transition-colors"
    >
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

  // Filter Roles: Only show Staff (300) and above for onboarding
  const onboardingRoles = Object.entries(ROLE_LABELS).filter(
    ([level]) => Number(level) >= USER_LEVELS.STAFF
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {/* SEMANTIC: Primary Trigger Button 
           Replaced hardcoded zinc/black with bg-primary. 
           This ensures high contrast in both Light and Dark modes. 
        */}
        <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 border border-transparent shadow-sm">
          <UserPlus className="w-4 h-4" />
          Add Staff
        </Button>
      </DialogTrigger>
      
      {/* SEMANTIC: Card Background & Foreground 
         Replaced bg-zinc-950/text-white with semantic bg-card/text-card-foreground
      */}
      <DialogContent className="sm:max-w-[500px] bg-card text-card-foreground border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-black italic tracking-tighter uppercase text-foreground">
            Onboard <span className="text-primary">New Staff</span>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Link identity credentials to operational fleet data.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="grid gap-4 py-4">
          <input type="hidden" name="mode" value={sendInvite ? 'invite' : 'silent'} />
          
          {/* Invite Mode Toggle */}
          {/* SEMANTIC: Muted Background for secondary containers */}
          <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-muted/30">
            <div className="space-y-0.5">
              <Label className="text-sm font-bold uppercase italic text-foreground">Invitation Protocol</Label>
              <div className="text-[10px] text-muted-foreground uppercase tracking-widest">
                {sendInvite ? "External Email Link" : "Internal Silent Creation"}
              </div>
            </div>
            <Switch checked={sendInvite} onCheckedChange={setSendInvite} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground font-bold uppercase">Full Name</Label>
              {/* SEMANTIC: Inputs use bg-background and border-input */}
              <Input 
                name="fullName" 
                className="bg-background border-input text-foreground placeholder:text-muted-foreground focus-visible:ring-primary" 
                placeholder="John Doe" 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground font-bold uppercase">Email</Label>
              <Input 
                name="email" 
                type="email" 
                className="bg-background border-input text-foreground placeholder:text-muted-foreground focus-visible:ring-primary" 
                placeholder="john@sunbuggy.com" 
                required 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground font-bold uppercase">Phone</Label>
              <Input 
                name="phone" 
                type="tel" 
                className="bg-background border-input font-mono text-foreground placeholder:text-muted-foreground focus-visible:ring-primary" 
                placeholder="702-555-0199" 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground font-bold uppercase">Employee ID</Label>
              <Input 
                name="employeeId" 
                className="bg-background border-input font-mono text-foreground placeholder:text-muted-foreground focus-visible:ring-primary" 
                placeholder="NV-100" 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
               {/* SEMANTIC: Primary color highlights */}
               <Label className="text-xs text-primary font-bold uppercase">Location</Label>
               <Select name="location" defaultValue="Las Vegas" onValueChange={setSelectedLoc}>
                 <SelectTrigger className="bg-background border-input text-foreground focus:ring-primary">
                    <SelectValue />
                 </SelectTrigger>
                 <SelectContent className="bg-popover text-popover-foreground border-border">
                   {Object.keys(LOCATIONS_CONFIG).map(loc => (
                     <SelectItem key={loc} value={loc} className="focus:bg-accent focus:text-accent-foreground">{loc}</SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>

             <div className="space-y-2">
               <Label className="text-xs text-primary font-bold uppercase">Department</Label>
               <Select name="department" required>
                 <SelectTrigger className="bg-background border-input text-foreground focus:ring-primary">
                    <SelectValue placeholder="Select Dept" />
                 </SelectTrigger>
                 <SelectContent className="bg-popover text-popover-foreground border-border">
                   {availableDepartments.map(dept => (
                     <SelectItem key={dept} value={dept} className="focus:bg-accent focus:text-accent-foreground">{dept}</SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>
          </div>

          <div className="space-y-2">
             <Label className="text-xs text-muted-foreground font-bold uppercase">Access Level</Label>
             <Select name="userLevel" defaultValue={USER_LEVELS.STAFF.toString()}>
              <SelectTrigger className="bg-background border-input text-foreground focus:ring-primary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover text-popover-foreground border-border">
                {/* Dynamically render only STAFF and higher */}
                {onboardingRoles.map(([level, label]) => (
                  <SelectItem key={level} value={level} className="focus:bg-accent focus:text-accent-foreground">
                    {label} ({level})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <SubmitButton isInvite={sendInvite} />
        </form>
      </DialogContent>
    </Dialog>
  );
}