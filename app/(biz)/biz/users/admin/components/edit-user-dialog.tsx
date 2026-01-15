/**
 * @file /app/(biz)/biz/users/admin/components/edit-user-dialog.tsx
 * @description Dynamic Edit Dialog for Customers and Staff.
 * Conditionally shows operational fields for levels 300+.
 */
'use client';

import React, { useActionState, useState, useEffect } from 'react';
import { updateEmployeeProfile } from '@/app/actions/update-user-profile';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Save, User, ShieldCheck, HardHat } from 'lucide-react';

// --- CONFIGURATION (Synced with Roster & Onboarding) ---
const LOCATIONS_CONFIG: Record<string, string[]> = {
  'Las Vegas': ['ADMIN', 'OFFICE', 'DUNES', 'SHUTTLES', 'SHOP'],
  'Pismo': ['ADMIN', 'CSR', 'BEACH', 'SHOP'],
  'Michigan': ['ADMIN', 'SHOP', 'GUIDES', 'OFFICE']
};

interface EditUserDialogProps {
  user: any; // The user object joined with employee_details
  open: boolean;
  setOpen: (open: boolean) => void;
}

export default function EditUserDialog({ user, open, setOpen }: EditUserDialogProps) {
  const { toast } = useToast();
  const [state, formAction, isPending] = useActionState(updateEmployeeProfile, { message: '', success: false });
  
  // Track local state for conditional UI and dynamic dropdowns
  const [userLevel, setUserLevel] = useState<number>(user?.user_level || 100);
  
  // SAFE INITIALIZATION: Handles cases where employee_details might be null
  const [selectedLoc, setSelectedLoc] = useState<string>(
    user?.employee_details?.primary_work_location || 'Las Vegas'
  );
  useEffect(() => {
    if (state.success) {
      toast({ title: "Success", description: "Profile updated." });
      setOpen(false);
    } else if (state.message) {
      toast({ title: "Error", description: state.message, variant: "destructive" });
    }
  }, [state, toast, setOpen]);

  const availableDepartments = LOCATIONS_CONFIG[selectedLoc] || [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[550px] bg-zinc-950 border-zinc-800 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold italic uppercase tracking-tighter">
            {userLevel >= 300 ? <HardHat className="text-orange-500" /> : <User className="text-blue-500" />}
            Edit <span className={userLevel >= 300 ? "text-orange-500" : "text-blue-500"}>
              {userLevel >= 300 ? "Staff_Member" : "Customer_Profile"}
            </span>
          </DialogTitle>
        </DialogHeader>

        <form action={formAction} className="space-y-5 py-4">
          {/* Hidden ID field for the Server Action */}
          <input type="hidden" name="userId" value={user?.id} />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase text-zinc-500 font-bold">First Name</Label>
              <Input name="first_name" defaultValue={user?.first_name} className="bg-zinc-900 border-zinc-800" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase text-zinc-500 font-bold">Last Name</Label>
              <Input name="last_name" defaultValue={user?.last_name} className="bg-zinc-900 border-zinc-800" />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase text-zinc-500 font-bold">Email Address</Label>
            <Input name="email" type="email" defaultValue={user?.email} className="bg-zinc-900 border-zinc-800" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase text-zinc-500 font-bold">Phone</Label>
              <Input name="phone" defaultValue={user?.phone} className="bg-zinc-900 border-zinc-800 font-mono" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase text-zinc-500 font-bold">Access Level</Label>
              <Select 
                name="user_level" 
                defaultValue={userLevel.toString()} 
                onValueChange={(v) => setUserLevel(parseInt(v))}
              >
                <SelectTrigger className="bg-zinc-900 border-zinc-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                  <SelectItem value="100">Customer (100)</SelectItem>
                  <SelectItem value="300">Employee (300)</SelectItem>
                  <SelectItem value="500">Manager (500)</SelectItem>
                  <SelectItem value="900">Admin (900)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* --- CONDITIONAL EMPLOYEE FIELDS --- */}
          {userLevel >= 300 && (
            <div className="p-4 rounded-lg border border-orange-500/20 bg-orange-500/5 space-y-4 animate-in fade-in slide-in-from-top-2">
              <h3 className="text-[10px] font-black text-orange-500 uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck size={12} /> Operational Fleet Metadata
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase text-zinc-500 font-bold">Work Location</Label>
                  <Select 
                    name="location" 
                    defaultValue={selectedLoc} 
                    onValueChange={setSelectedLoc}
                  >
                    <SelectTrigger className="bg-zinc-950 border-zinc-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                      {Object.keys(LOCATIONS_CONFIG).map(loc => (
                        <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] uppercase text-zinc-500 font-bold">Department</Label>
                  <Select 
                    name="position" 
                    defaultValue={user?.employee_details?.primary_position}
                  >
                    <SelectTrigger className="bg-zinc-950 border-zinc-800">
                      <SelectValue placeholder="Select Dept" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                      {availableDepartments.map(dept => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase text-zinc-500 font-bold">Employee ID / Badge #</Label>
                  <Input 
                    name="payroll_id" 
                    defaultValue={user?.employee_details?.emp_id} 
                    className="bg-zinc-950 border-zinc-800 font-mono" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase text-zinc-500 font-bold">Dialpad Extension</Label>
                  <Input 
                    name="dialpad_number" 
                    defaultValue={user?.employee_details?.dialpad_number} 
                    className="bg-zinc-950 border-zinc-800 font-mono" 
                  />
                </div>
              </div>
            </div>
          )}

          <Button 
            type="submit" 
            disabled={isPending}
            className={`w-full font-black italic uppercase tracking-widest transition-all ${
              userLevel >= 300 ? "bg-orange-600 hover:bg-orange-700" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isPending ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" size={16} />}
            Commit Changes
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}