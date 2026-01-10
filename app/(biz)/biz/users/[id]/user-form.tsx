/**
 * @file user-form.tsx
 * @description Hierarchical form for Location > Department > Position.
 *
 * UPDATED: Uses dynamic HR Config from DB instead of hardcoded constants.
 * SECURITY: Hides/Disables sensitive fields (User Level) for non-admins.
 * FIX: Deduplicates positions to prevent key errors.
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
import { Loader2, Save, Info, Briefcase, MapPin, Layout, Mail, DollarSign, ShieldAlert } from 'lucide-react';

// --- IMPORT: Single Source of Truth for Roles ---
import { USER_LEVELS, ROLE_LABELS } from '@/lib/constants/user-levels';

interface HRConfig {
  id: string;
  name: string;
  departments: {
    id: string;
    name: string;
    positions: { id: string; title: string }[];
  }[];
}

interface UserFormProps {
  user: any;        // Identity data from 'users' table
  empDetails: any;  // Operational data from 'employee_details' table
  hrConfig: HRConfig[]; // <--- Dynamic Data from DB
  currentUserLevel: number; // <--- Viewer's permission level
}

export default function UserForm({ user, empDetails, hrConfig, currentUserLevel }: UserFormProps) {
  const { toast } = useToast();
  
  // Connect to the Server Action
  const [state, formAction, isPending] = useActionState(updateEmployeeProfile, { message: '', success: false });
  
  // Extract details (handles array or single object)
  const details = Array.isArray(empDetails) ? empDetails[0] : empDetails;

  // --- LOCAL STATE ---
  const [userLevel, setUserLevel] = useState<number>(user?.user_level || USER_LEVELS.CUSTOMER);
  
  // Initialize with existing data, fallback to first available or safe defaults
  const [selectedLoc, setSelectedLoc] = useState<string>(details?.primary_work_location || (hrConfig[0]?.name || 'Las Vegas'));
  const [selectedDept, setSelectedDept] = useState<string>(details?.department || 'OFFICE');

  // --- DYNAMIC LOGIC ---
  // 1. Get Departments for Selected Location
  const availableDepartments = useMemo(() => {
    const activeLoc = hrConfig.find(l => l.name === selectedLoc);
    return activeLoc ? activeLoc.departments : [];
  }, [selectedLoc, hrConfig]);

  // 2. Get Positions for Selected Department - WITH DEDUPLICATION FIX
  const availablePositions = useMemo(() => {
    const activeDept = availableDepartments.find(d => d.name === selectedDept);
    if (!activeDept) return [];

    // Deduplicate based on position title
    const uniquePositions = new Map();
    activeDept.positions.forEach(p => {
        if (!uniquePositions.has(p.title)) {
            uniquePositions.set(p.title, p);
        }
    });
    
    return Array.from(uniquePositions.values());
  }, [selectedDept, availableDepartments]);

  // Reset downstream selections when upstream changes
  useEffect(() => {
    // If current dept isn't valid for new location, pick first valid
    const isValidDept = availableDepartments.some(d => d.name === selectedDept);
    if (!isValidDept && availableDepartments.length > 0) {
        setSelectedDept(availableDepartments[0].name);
    }
  }, [selectedLoc, availableDepartments, selectedDept]);

  // Handle Server Action Response
  useEffect(() => {
    if (state.success) {
      toast({ title: "Success", description: "Profile updated successfully." });
    } else if (state.message) {
      toast({ title: "Update Failed", description: state.message, variant: "destructive" });
    }
  }, [state, toast]);

  // Helper boolean: Does this user (the one being edited) have staff privileges?
  const isStaffProfile = userLevel >= USER_LEVELS.STAFF;
  
  // Security Check: Is the VIEWER allowed to change permissions?
  const canEditPermissions = currentUserLevel >= 900; 

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

          {/* ACCESS LEVEL SELECTOR - SECURED */}
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-zinc-500 flex items-center justify-between">
                <span>Access Level</span>
                {!canEditPermissions && <ShieldAlert className="w-3 h-3 text-red-500" />}
            </Label>
            
            {canEditPermissions ? (
                // ADMIN VIEW: Full Select
                <Select 
                    name="user_level" 
                    defaultValue={userLevel.toString()} 
                    onValueChange={(v) => setUserLevel(parseInt(v))}
                >
                <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                    {Object.entries(ROLE_LABELS).map(([level, label]) => (
                    <SelectItem key={level} value={level}>
                        {label} ({level})
                    </SelectItem>
                    ))}
                </SelectContent>
                </Select>
            ) : (
                // NON-ADMIN VIEW: Read Only Display + Hidden Input
                <>
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-400 cursor-not-allowed">
                        {ROLE_LABELS[userLevel] || 'Unknown'} (Lvl {userLevel})
                    </div>
                    {/* Hidden input to ensure value persists on submit */}
                    <input type="hidden" name="user_level" value={userLevel} />
                </>
            )}
          </div>
        </div>
      </div>

      {/* 3. OPERATIONAL SECTION (Only visible for active staff 300+) */}
      {isStaffProfile ? (
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
                {hrConfig.map(loc => (
                  <SelectItem key={loc.id} value={loc.name}>{loc.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Department */}
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
                    <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Position */}
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
                    // Using pos.title as the key because we deduplicated based on title
                    <SelectItem key={pos.title} value={pos.title}>{pos.title}</SelectItem>
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

                {/* Payroll Company */}
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
          isStaffProfile ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'
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