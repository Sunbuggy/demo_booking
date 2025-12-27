'use client';

import React, { useState, useEffect } from 'react';
import { updateEmployeeProfile } from '@/app/actions/update-user-profile'; 
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Phone, Cloud, Mail, MapPin, Briefcase } from 'lucide-react';

// --- CONFIGURATION ---
// Valid Locations and their specific Departments
const LOCATIONS: Record<string, string[]> = {
  'Las Vegas': ['ADMIN', 'OFFICE', 'DUNES', 'SHUTTLES', 'SHOP'],
  'Pismo': ['ADMIN', 'CSR', 'BEACH', 'SHOP'],
  'Michigan': ['ADMIN', 'SHOP', 'GUIDES', 'OFFICE']
};

export default function UserForm({ user, empDetails }: { user: any, empDetails: any }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Initialize state
  const [formData, setFormData] = useState({
    first_name: user.first_name || user.full_name?.split(' ')[0] || '',
    last_name: user.last_name || user.full_name?.split(' ').slice(1).join(' ') || '',
    stage_name: user.stage_name || user.full_name?.split(' ')[0] || '',
    email: user.email || '',
    phone: user.phone || '', 
    dialpad_number: empDetails?.[0]?.dialpad_number || '',
    
    // We map 'position' to Department now
    position: empDetails?.[0]?.primary_position || '', 
    location: empDetails?.[0]?.primary_work_location || 'Las Vegas',
    
    payroll_id: empDetails?.[0]?.emp_id || '', 
    user_level: user.user_level?.toString() || '300'
  });

  // Helper to handle Location change (resets department if invalid)
  const handleLocationChange = (newLocation: string) => {
    setFormData(prev => ({
      ...prev,
      location: newLocation,
      // If current dept isn't valid for new location, reset it
      position: LOCATIONS[newLocation]?.includes(prev.position) ? prev.position : ''
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = new FormData();
    payload.append('userId', user.id);
    payload.append('first_name', formData.first_name);
    payload.append('last_name', formData.last_name);
    payload.append('stage_name', formData.stage_name);
    payload.append('email', formData.email);
    payload.append('phone', formData.phone);
    payload.append('dialpad_number', formData.dialpad_number);
    payload.append('position', formData.position); // Saves as "primary_position" in DB
    payload.append('location', formData.location);
    payload.append('user_level', formData.user_level);
    payload.append('payroll_id', formData.payroll_id);

    const result = await updateEmployeeProfile(null, payload);

    setLoading(false);

    if (result.success) {
      toast({ title: "Success", description: "Profile updated successfully.", variant: "success" });
    } else {
      toast({ title: "Update Failed", description: result.message, variant: "destructive" });
    }
  };

  // Derived list of departments based on selected location
  const availableDepartments = LOCATIONS[formData.location] || [];

  return (
    <form onSubmit={handleSubmit} className="space-y-6 py-4">
      
      {/* IDENTITY SECTION */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Identity</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>First Name (Legal)</Label>
            <Input name="first_name" value={formData.first_name} onChange={handleChange} required />
          </div>
          <div className="space-y-2">
            <Label>Last Name (Legal)</Label>
            <Input name="last_name" value={formData.last_name} onChange={handleChange} required />
          </div>
        </div>

        <div className="space-y-2">
            <Label className="flex items-center gap-2">
                <Mail className="w-3 h-3" /> Email Address
            </Label>
            <Input name="email" value={formData.email} onChange={handleChange} placeholder="user@example.com" className="font-mono" />
        </div>

        <div className="space-y-2 bg-yellow-50/10 p-3 rounded-md border border-yellow-500/20">
          <Label className="text-yellow-500 font-bold">Stage Name (Display Name)</Label>
          <Input name="stage_name" value={formData.stage_name} onChange={handleChange} placeholder="e.g. 'Maverick'" className="font-semibold" />
          <p className="text-xs text-muted-foreground">This is how the employee will appear on schedules and customer-facing views.</p>
        </div>
      </div>

      <Separator />

      {/* JOB DETAILS */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Job Details</h3>
        
        <div className="grid grid-cols-2 gap-4">
           
           {/* LOCATION SELECTOR */}
           <div className="space-y-2">
              <Label className="flex items-center gap-2"><MapPin className="w-3 h-3"/> Location</Label>
              <Select 
                value={formData.location} 
                onValueChange={handleLocationChange}
              >
                <SelectTrigger><SelectValue placeholder="Select Location" /></SelectTrigger>
                <SelectContent>
                  {Object.keys(LOCATIONS).map(loc => (
                    <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
           </div>

           {/* DEPARTMENT SELECTOR (Filtered) */}
           <div className="space-y-2">
              <Label className="flex items-center gap-2"><Briefcase className="w-3 h-3"/> Department</Label>
              <Select 
                value={formData.position} 
                onValueChange={(val) => setFormData({...formData, position: val})}
                disabled={!formData.location}
              >
                <SelectTrigger>
                  <SelectValue placeholder={formData.location ? "Select Department" : "Choose Location First"} />
                </SelectTrigger>
                <SelectContent>
                  {availableDepartments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
           </div>

        </div>

        <div className="grid grid-cols-2 gap-4">
           <div className="space-y-2">
              <Label>Access Level</Label>
              <Select 
                value={formData.user_level} 
                onValueChange={(val) => setFormData({...formData, user_level: val})}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="100">Customer (100)</SelectItem>
                  <SelectItem value="300">Staff (300)</SelectItem>
                  <SelectItem value="500">Manager (500)</SelectItem>
                  <SelectItem value="900">Admin (900)</SelectItem>
                </SelectContent>
              </Select>
           </div>
           
           <div className="space-y-2">
              <Label>Payroll ID</Label>
              <Input name="payroll_id" value={formData.payroll_id} onChange={handleChange} className="font-mono" />
           </div>
        </div>
        
        {/* CONTACT SECTION */}
        <div className="grid grid-cols-2 gap-4 pt-2">
           <div className="space-y-2">
             <Label className="flex items-center gap-2">
                <Phone className="w-3 h-3" /> Cell Phone
             </Label>
             <Input name="phone" value={formData.phone} onChange={handleChange} placeholder="Personal Mobile" />
           </div>
           
           <div className="space-y-2">
             <Label className="flex items-center gap-2 text-blue-600">
                <Cloud className="w-3 h-3" /> Dialpad (VoIP)
             </Label>
             <Input 
               name="dialpad_number" 
               value={formData.dialpad_number} 
               onChange={handleChange} 
               placeholder="Desk Number" 
               className="border-blue-200 focus-visible:ring-blue-500"
             />
           </div>
        </div>

      </div>

      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}