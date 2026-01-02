/**
 * @file /app/(biz)/biz/users/[id]/user-form.tsx
 * @description Unified Edit Form for both Customers and Staff.
 * Handles dual-table updates via the updateEmployeeProfile action.
 */
'use client';

import React, { useActionState, useState, useEffect } from 'react';
import { updateEmployeeProfile } from '@/app/actions/update-user-profile';
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
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Save, Info } from 'lucide-react';

// Sync with your Roster/Onboarding config
const LOCATIONS_CONFIG: Record<string, string[]> = {
  'Las Vegas': ['ADMIN', 'OFFICE', 'DUNES', 'SHUTTLES', 'SHOP'],
  'Pismo': ['ADMIN', 'CSR', 'BEACH', 'SHOP'],
  'Michigan': ['ADMIN', 'SHOP', 'GUIDES', 'OFFICE']
};

interface UserFormProps {
  user: any;        // Identity data from 'users' table
  empDetails: any;  // Operational data (passed as an array or object from page.tsx)
}

export default function UserForm({ user, empDetails }: UserFormProps) {
  const { toast } = useToast();
  const [state, formAction, isPending] = useActionState(updateEmployeeProfile, { message: '', success: false });
  
  // Extract details (handles array or single object)
  const details = Array.isArray(empDetails) ? empDetails[0] : empDetails;

  // Local state for UI branching and dynamic dropdowns
  const [userLevel, setUserLevel] = useState<number>(user?.user_level || 100);
  const [selectedLoc, setSelectedLoc] = useState<string>(
    details?.primary_work_location || 'Las Vegas'
  );

  useEffect(() => {
    if (state.success) {
      toast({ title: "Success", description: "Profile updated successfully." });
    } else if (state.message) {
      toast({ title: "Update Failed", description: state.message, variant: "destructive" });
    }
  }, [state, toast]);

  const availableDepartments = LOCATIONS_CONFIG[selectedLoc] || [];

  return (
    <form action={formAction} className="space-y-6">
      {/* 1. HIDDEN IDENTITY TRACKER */}
      <input type="hidden" name="userId" value={user?.id} />

      {/* 2. CORE IDENTITY SECTION (Everyone) */}
      <div className="space-y-4">
        
        {/* Names */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-zinc-500">First Name</Label>
            <Input name="first_name" defaultValue={user?.first_name} className="bg-zinc-900 border-zinc-800" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-zinc-500">Last Name</Label>
            <Input name="last_name" defaultValue={user?.last_name} className="bg-zinc-900 border-zinc-800" />
          </div>
        </div>

        {/* Stage Name / Alias (ADDED) */}
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase text-zinc-500">Stage Name / Alias</Label>
          <Input 
            name="stage_name" 
            defaultValue={user?.stage_name || ''} 
            placeholder="e.g. Maverick"
            className="bg-zinc-900 border-zinc-800 text-orange-500 font-medium" 
          />
          <p className="text-[10px] text-zinc-500">This name will be displayed on public schedules and dashboards.</p>
        </div>

        {/* Contact Info */}
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase text-zinc-500">Email Address</Label>
          <Input name="email" type="email" defaultValue={user?.email} className="bg-zinc-900 border-zinc-800" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-zinc-500">Primary Phone</Label>
            <Input name="phone" defaultValue={user?.phone} className="bg-zinc-900 border-zinc-800" />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-zinc-500">Account Access Level</Label>
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
                <SelectItem value="300">Staff (300)</SelectItem>
                <SelectItem value="500">Manager (500)</SelectItem>
                <SelectItem value="900">Admin (900)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* 3. OPERATIONAL SECTION (Staff Only) */}
      {userLevel >= 300 ? (
        <div className="p-4 rounded-xl border border-orange-500/20 bg-orange-500/5 space-y-4 animate-in fade-in slide-in-from-top-4">
          <h3 className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em] flex items-center gap-2">
            <Info size={14} /> Fleet Operational Metadata
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-zinc-500">Base Location</Label>
              <Select name="location" defaultValue={selectedLoc} onValueChange={setSelectedLoc}>
                <SelectTrigger className="bg-zinc-950 border-zinc-800 text-white">
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
              <Label className="text-xs font-bold uppercase text-zinc-500">Department / Position</Label>
              <Select name="position" defaultValue={details?.primary_position}>
                <SelectTrigger className="bg-zinc-950 border-zinc-800 text-white">
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
              <Label className="text-xs font-bold uppercase text-zinc-500">Employee ID</Label>
              <Input name="payroll_id" defaultValue={details?.emp_id} className="bg-zinc-950 border-zinc-800 font-mono" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-zinc-500">Dialpad Extension</Label>
              <Input name="dialpad_number" defaultValue={details?.dialpad_number} className="bg-zinc-950 border-zinc-800 font-mono" />
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5">
           <p className="text-xs text-blue-400 italic font-medium">This is a customer account. No operational work metadata is required.</p>
        </div>
      )}

      <Button 
        type="submit" 
        disabled={isPending}
        className={`w-full font-black italic uppercase tracking-widest transition-all ${
          userLevel >= 300 ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {isPending ? (
          <><Loader2 className="animate-spin mr-2 h-4 w-4" /> Syncing Data...</>
        ) : (
          <><Save className="mr-2 h-4 w-4" /> Commit Changes</>
        )}
      </Button>
    </form>
  );
}