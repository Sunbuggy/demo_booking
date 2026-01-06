/**
 * @file user-form.tsx
 * @description Hierarchical form for Location > Department > Position.
 *
 * UPDATED: Uses centralized USER_LEVELS for permission logic.
 * SECURITY NOTE: This form includes a "User Level" selector. 
 * The Server Action must validate that a user cannot escalate their own privileges.
 */
'use client';

import React, { useActionState, useState, useEffect, useMemo } from 'react';
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
import { Loader2, Save, Info, Briefcase, MapPin, Layout, Mail, DollarSign } from 'lucide-react';

// --- IMPORT: Single Source of Truth for Roles ---
// Ensures this form stays in sync with database policies and admin tables
import { USER_LEVELS, ROLE_LABELS } from '@/lib/constants/user-levels';

// Configuration for Departments available at each Location
const LOCATIONS_CONFIG: Record<string, string[]> = {
  'Las Vegas': ['ADMIN', 'OFFICE', 'DUNES', 'SHUTTLES', 'SHOP'],
  'Pismo': ['ADMIN', 'CSR', 'BEACH', 'SHOP'],
  'Michigan': ['ADMIN', 'SHOP', 'GUIDES', 'OFFICE']
};

// Configuration for Specific Positions within each Department
const POSITIONS_CONFIG: Record<string, string[]> = {
  'ADMIN': ['MANAGER', 'HR', 'OWNER', 'IT'],
  'OFFICE': ['OPPS', 'CSR', 'PROD DEV', 'PHONES'],
  'CSR': ['RECEPTION', 'DISPATCH'],
  'SHOP': ['ATV TECH', 'BUGGY TECH', 'FLEET', 'FABRICATOR', 'HELPER'],
  'DUNES': ['GUIDE', 'LEAD GUIDE', 'SWEEP'],
  'SHUTTLES': ['DRIVER', 'DISPATCH'],
  'BEACH': ['RENTAL AGENT', 'GUIDE'],
  'GUIDES': ['GUIDE', 'LEAD']
};

interface UserFormProps {
  user: any;        // Identity data from 'users' table
  empDetails: any;  // Operational data from 'employee_details' table
}

export default function UserForm({ user, empDetails }: UserFormProps) {
  const { toast } = useToast();
  
  // Connect to the Server Action
  const [state, formAction, isPending] = useActionState(updateEmployeeProfile, { message: '', success: false });
  
  // Extract details (handles array or single object)
  const details = Array.isArray(empDetails) ? empDetails[0] : empDetails;

  // --- LOCAL STATE FOR UI BRANCHING ---
  // Default to CUSTOMER level if undefined, utilizing the constant
  const [userLevel, setUserLevel] = useState<number>(user?.user_level || USER_LEVELS.CUSTOMER);
  
  const [selectedLoc, setSelectedLoc] = useState<string>(details?.primary_work_location || 'Las Vegas');
  const [selectedDept, setSelectedDept] = useState<string>(details?.department || 'ADMIN');

  // Handle Server Action Response
  useEffect(() => {
    if (state.success) {
      toast({ title: "Success", description: "Profile updated successfully." });
    } else if (state.message) {
      toast({ title: "Update Failed", description: state.message, variant: "destructive" });
    }
  }, [state, toast]);

  // Derived lists based on selection
  const availableDepartments = useMemo(() => LOCATIONS_CONFIG[selectedLoc] || [], [selectedLoc]);
  const availablePositions = useMemo(() => POSITIONS_CONFIG[selectedDept] || ['STAFF'], [selectedDept]);

  // Helper boolean to determine if the Operational Section should be shown
  // Users must be at least STAFF (300) level to have fleet metadata
  const hasStaffPrivileges = userLevel >= USER_LEVELS.STAFF;

  return (
    <form action={formAction} className="space-y-6">
      {/* 1. HIDDEN IDENTITY TRACKER */}
      <input type="hidden" name="userId" value={user?.id} />

      {/* 2. CORE IDENTITY SECTION (Required for all account types) */}
      <div className="space-y-4">
        
        {/* Names */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-zinc-500">First Name</Label>
            <Input name="first_name" defaultValue={user?.first_name} className="bg-zinc-900 border-zinc-800" required />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-zinc-500">Last Name</Label>
            <Input name="last_name" defaultValue={user?.last_name} className="bg-zinc-900 border-zinc-800" required />
          </div>
        </div>

        {/* Alias Name */}
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase text-zinc-500 text-orange-500">Stage Name / Alias</Label>
          <Input 
            name="stage_name" 
            defaultValue={user?.stage_name || ''} 
            placeholder="e.g. Maverick"
            className="bg-zinc-900 border-zinc-800 font-bold" 
          />
          <p className="text-[10px] text-zinc-500 italic">Displayed on public schedules and dashboards.</p>
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase text-zinc-500 flex items-center gap-1">
            <Mail size={12} /> Email Address
          </Label>
          <Input 
            name="email" 
            type="email" 
            defaultValue={user?.email} 
            className="bg-zinc-900 border-zinc-800"
            required
          />
        </div>

        {/* Contact & Access */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-zinc-500">Primary Phone</Label>
            <Input name="phone" defaultValue={user?.phone} className="bg-zinc-900 border-zinc-800" />
          </div>

          {/* ACCESS LEVEL SELECTOR */}
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-zinc-500">Access Level</Label>
            <Select 
                name="user_level" 
                defaultValue={userLevel.toString()} 
                onValueChange={(v) => setUserLevel(parseInt(v))}
            >
              <SelectTrigger className="bg-zinc-900 border-zinc-800">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                {/* Dynamically render options from the Single Source of Truth */}
                {Object.entries(ROLE_LABELS).map(([level, label]) => (
                   <SelectItem key={level} value={level}>
                      {label}
                   </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* 3. OPERATIONAL SECTION (Only visible for active staff 300+) */}
      {hasStaffPrivileges ? (
        <div className="p-4 rounded-xl border border-orange-500/20 bg-orange-500/5 space-y-4 animate-in fade-in slide-in-from-top-4">
          <h3 className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em] flex items-center gap-2">
            <Info size={14} /> Fleet Operational Metadata
          </h3>
          
          {/* Base Location */}
          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase text-zinc-500 flex items-center gap-1">
              <MapPin size={10} /> Base Location
            </Label>
            <Select name="location" value={selectedLoc} onValueChange={setSelectedLoc}>
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

          <div className="grid grid-cols-2 gap-4">
            {/* Department (The Roster Sorting Bucket) */}
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase text-zinc-500 flex items-center gap-1">
                <Layout size={10} /> Department (Sort Group)
              </Label>
              <Select name="department" value={selectedDept} onValueChange={setSelectedDept}>
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

            {/* Position (The Specific Job Title) */}
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase text-zinc-500 flex items-center gap-1">
                <Briefcase size={10} /> Primary Position
              </Label>
              <Select name="position" defaultValue={details?.primary_position}>
                <SelectTrigger className="bg-zinc-950 border-zinc-800 text-white">
                  <SelectValue placeholder="Select Position" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                  {availablePositions.map(pos => (
                    <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* HR & Payroll Data */}
          <div className="space-y-2 border-t border-orange-500/20 pt-4 mt-2">
             <Label className="text-[10px] font-bold uppercase text-orange-400 flex items-center gap-1 mb-2">
                <DollarSign size={10} /> HR & Payroll Configuration
             </Label>
             
             <div className="grid grid-cols-2 gap-4">
                {/* Hire Date */}
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-zinc-500">Hire Date</Label>
                  <Input 
                    name="hire_date" 
                    type="date" 
                    defaultValue={details?.hire_date} 
                    className="bg-zinc-950 border-zinc-800 text-white" 
                  />
                </div>

                {/* Dialpad */}
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-zinc-500">Dialpad Ext.</Label>
                  <Input 
                      name="dialpad_number" 
                      defaultValue={details?.dialpad_number} 
                      className="bg-zinc-950 border-zinc-800 font-mono" 
                  />
                </div>

                {/* Payroll Company (New Feature) */}
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-zinc-500">Payroll Company</Label>
                  <Select name="payroll_company" defaultValue={details?.payroll_company || ''}>
                    <SelectTrigger className="bg-zinc-950 border-zinc-800 text-white">
                      <SelectValue placeholder="Select Provider..." />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                      <SelectItem value="NV-ModernHR">NV - ModernHR</SelectItem>
                      <SelectItem value="NV-BBSI">NV - BBSI</SelectItem>
                      <SelectItem value="CA-ModernHR">CA - ModernHR (Daily OT)</SelectItem>
                      <SelectItem value="MI-BBSI">MI - BBSI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Employee ID */}
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase text-zinc-500">Payroll ID</Label>
                  <Input 
                    name="payroll_id" 
                    defaultValue={details?.emp_id} 
                    placeholder="e.g. NV011325"
                    className="bg-zinc-950 border-zinc-800 font-mono" 
                  />
                </div>
             </div>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5">
           <p className="text-xs text-blue-400 italic font-medium">Customer profile: Operational metadata hidden.</p>
        </div>
      )}

      {/* 4. SUBMIT SECTION */}
      <Button 
        type="submit" 
        disabled={isPending}
        className={`w-full font-black italic uppercase tracking-widest transition-all ${
          hasStaffPrivileges ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'
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