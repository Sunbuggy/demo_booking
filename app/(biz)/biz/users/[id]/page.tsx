/**
 * @file /app/(biz)/biz/users/[id]/page.tsx
 * @description COMPLETE UNIVERSAL PROFILE. Handles Staff (300+) and Customers (<300) 
 * with full operational logic (Payroll, Scans, Achievements).
 */

import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import moment from 'moment';

// --- DATA QUERIES ---
import {
  getFullUserProfile,
  fetchEmployeeTimeClockEntryData,
  fetchTimeEntryByUserId
} from '@/utils/supabase/queries';

// --- COMPONENTS ---
import UserImage from './components/user-image';
import UserForm from './user-form';
import ScanHistory from './components/scan-history'; 
import AdminAvailability from './components/admin-availability';
import AdminTimeOff from './components/admin-time-off';

// NEW: Import the robust Time Sheet component
import UserTimeSheet from '@/components/UserTimeSheet';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  MapPin, UserCog, History, 
  Trophy, CalendarOff, CalendarClock, Phone, Mail, Activity
} from 'lucide-react';

export default async function AdminUserProfilePage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const supabase = await createClient();
  const { id: targetUserId } = await params;

  // 1. Auth Check
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  if (!currentUser) return redirect('/signin');
  
  // 2. Fetch Data
  const startOfWeek = moment().startOf('isoWeek').format('YYYY-MM-DD');
  const endOfWeek = moment().endOf('isoWeek').format('YYYY-MM-DD');

  // Unified fetch (Identity + Details)
  const targetUser = await getFullUserProfile(supabase, targetUserId);
  
  if (!targetUser) {
    return (
      <div className="p-20 text-center">
        <h2 className="text-2xl font-bold text-zinc-500 italic">USER_NOT_FOUND</h2>
        <Button asChild variant="link" className="mt-4"><Link href="/biz/users/admin">Return to Directory</Link></Button>
      </div>
    );
  }

  const isStaff = (targetUser.user_level || 0) >= 300;
  const empDetails = targetUser.employee_details; 

  // 3. Supplemental Data Parallel Fetch
  const [timeEntries, activeEntry, qrRes, availabilityRes, timeOffRes] = await Promise.all([
    // Keep fetching THIS WEEK'S entries for the sidebar "Weekly Hours" widget calculation
    isStaff ? fetchEmployeeTimeClockEntryData(supabase, targetUserId, startOfWeek, endOfWeek) : Promise.resolve([]),
    isStaff ? fetchTimeEntryByUserId(supabase, targetUserId) : Promise.resolve([]),
    supabase.from('qr_history').select('*, vehicle:vehicles(*)').eq('user', targetUserId).order('scanned_at', { ascending: false }),
    supabase.from('employee_availability_patterns').select('*').eq('user_id', targetUserId),
    supabase.from('time_off_requests').select('*').eq('user_id', targetUserId).order('start_date', { ascending: false })
  ]);

  const isClockedIn = activeEntry && activeEntry.length > 0;
  
  // 4. Payroll Math (Sidebar Summary Only)
  let totalMinutes = 0;
  timeEntries?.forEach((e: any) => {
    if (e.clock_in?.clock_in_time && e.clock_out?.clock_out_time) {
      totalMinutes += moment(e.clock_out.clock_out_time).diff(moment(e.clock_in.clock_in_time), 'minutes');
    }
  });
  const weeklyHours = (totalMinutes / 60).toFixed(2);

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-8 space-y-8 pb-32">
      
      {/* --- HEADER --- */}
      <div className={`relative overflow-hidden rounded-3xl border shadow-sm transition-all ${isStaff ? 'bg-card border-zinc-800' : 'bg-zinc-950 border-blue-500/20'}`}>
        <div className={`absolute inset-0 pointer-events-none opacity-20 ${
          isStaff ? 'bg-gradient-to-br from-orange-500 via-transparent to-red-600' : 'bg-gradient-to-br from-blue-600 via-transparent to-indigo-600'
        }`} />
        
        <div className="relative p-8 flex flex-col md:flex-row items-center md:items-start gap-8">
           <div className="flex-shrink-0">
             <UserImage profilePic={targetUser.avatar_url || ''} user_id={targetUserId} />
           </div>
           
           <div className="flex-grow text-center md:text-left space-y-2">
             <div className="flex flex-col md:flex-row md:items-end gap-2">
               <h1 className="text-4xl font-black italic tracking-tighter uppercase">
                 {targetUser.stage_name || targetUser.full_name}
               </h1>
               {!isStaff && <Badge className="bg-blue-600 mb-1">CUSTOMER_ACCOUNT</Badge>}
               {isStaff && <Badge className="bg-orange-600 mb-1">STAFF_FLEET_ACCESS</Badge>}
             </div>
             
             <div className="flex flex-wrap justify-center md:justify-start gap-3 items-center">
                {isStaff && (
                  <Badge variant={isClockedIn ? "default" : "secondary"} className={isClockedIn ? "bg-green-600 font-bold" : "bg-zinc-800"}>
                     {isClockedIn ? "ACTIVE_DUTY" : "OFF_CLOCK"}
                  </Badge>
                )}
                <Badge variant="outline" className="font-mono">LVL_{targetUser.user_level}</Badge>
                <div className="flex items-center text-sm text-zinc-400 gap-1 font-bold italic uppercase">
                  <MapPin className={`w-4 h-4 ${isStaff ? 'text-orange-500' : 'text-blue-500'}`} /> 
                  {empDetails?.primary_work_location || 'REMOTE / GENERAL'}
                </div>
             </div>

             <div className="pt-4 flex gap-3 justify-center md:justify-start">
               <Dialog>
                 <DialogTrigger asChild>
                   <Button variant="outline" size="sm" className="gap-2 border-zinc-700 bg-zinc-900/50 hover:bg-zinc-800">
                     <UserCog className="w-4 h-4 text-orange-500" /> Edit System Identity
                   </Button>
                 </DialogTrigger>
                 <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-zinc-950 border-zinc-800">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-bold italic uppercase tracking-tighter">Sync Profile: <span className="text-orange-500">{targetUser.full_name}</span></DialogTitle>
                    </DialogHeader>
                    <UserForm user={targetUser} empDetails={empDetails ? [empDetails] : []} />
                 </DialogContent>
               </Dialog>
               
               {isStaff && (
                 <Button variant="secondary" size="sm" asChild className="font-bold">
                   <Link href={`/biz/schedule?user=${targetUserId}`}>Fleet Schedule</Link>
                 </Button>
               )}
             </div>
           </div>
        </div>
      </div>

      {/* --- CONTENT GRID --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* SIDEBAR */}
        <div className="space-y-6">
           <Card className="bg-zinc-950 border-zinc-800">
             <CardHeader className="pb-2 border-b border-zinc-900 mb-4">
               <CardTitle className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                 <Mail size={12}/> Identity Contact
               </CardTitle>
             </CardHeader>
             <CardContent className="space-y-4 text-sm">
                <div className="flex justify-between items-center"><span className="text-zinc-500">Email</span> <span className="font-mono text-white">{targetUser.email}</span></div>
                <div className="flex justify-between items-center"><span className="text-zinc-500">Mobile</span> <span className="text-white">{targetUser.phone || 'NOT_FOUND'}</span></div>
                {isStaff && empDetails?.dialpad_number && (
                  <div className="flex justify-between items-center"><span className="text-zinc-500">Dialpad</span> <span className="text-blue-400">{empDetails.dialpad_number}</span></div>
                )}
             </CardContent>
           </Card>

           {isStaff && (
             <Card className="bg-zinc-900/30 border-orange-500/20">
               <CardHeader className="pb-2">
                 <CardTitle className="text-[10px] font-black uppercase tracking-widest text-orange-500">Fleet Operations</CardTitle>
               </CardHeader>
               <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between"><span>Weekly Hours</span> <span className="font-bold text-lg text-white">{weeklyHours}h</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">Position</span> <span className="text-white">{empDetails?.primary_position || 'UNASSIGNED'}</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">Badge ID</span> <span className="font-mono text-orange-500">{empDetails?.emp_id || 'NONE'}</span></div>
               </CardContent>
             </Card>
           )}
        </div>

        {/* MAIN PANEL */}
        <div className="lg:col-span-2">
           <Tabs defaultValue={isStaff ? "timesheet" : "scans"} className="w-full">
              <TabsList className="mb-4 bg-zinc-950 border border-zinc-800 p-1 flex h-auto flex-wrap">
                 {isStaff && <TabsTrigger value="timesheet">Time Sheet</TabsTrigger>}
                 {isStaff && <TabsTrigger value="availability">Availability</TabsTrigger>}
                 {isStaff && <TabsTrigger value="timeoff">Time Off</TabsTrigger>}
                 <TabsTrigger value="scans" className="gap-2">
                   <Activity size={14} /> Activity Log
                 </TabsTrigger>
                 <TabsTrigger value="achievements" className="gap-2">
                   <Trophy size={14} /> Achievements
                 </TabsTrigger>
              </TabsList>

              {isStaff && (
                <TabsContent value="timesheet">
                   {/* NEW COMPONENT INTEGRATION */}
                   <UserTimeSheet userId={targetUserId} />
                </TabsContent>
              )}

              <TabsContent value="availability">
                 <AdminAvailability userId={targetUserId} existingPattern={availabilityRes.data} />
              </TabsContent>

              <TabsContent value="timeoff">
                 <AdminTimeOff userId={targetUserId} requests={timeOffRes.data || []} />
              </TabsContent>

              <TabsContent value="scans">
                 <Card className="bg-zinc-950 border-zinc-800">
                    <CardHeader>
                      <CardTitle className="italic uppercase tracking-tighter">System Interaction</CardTitle>
                      <CardDescription>QR scans and vehicle engagement history.</CardDescription>
                    </CardHeader>
                    <CardContent>
                       <ScanHistory scans={qrRes.data?.map((x: any) => x.vehicle) || []} />
                    </CardContent>
                 </Card>
              </TabsContent>

              <TabsContent value="achievements">
                 <Card className="bg-zinc-950 border-zinc-800">
                    <CardHeader><CardTitle className="italic uppercase tracking-tighter">Badges & Recognition</CardTitle></CardHeader>
                    <CardContent className="text-center py-12">
                       <Trophy className="w-12 h-12 mx-auto mb-4 opacity-20 text-zinc-500" />
                       <p className="text-zinc-500 italic">No achievements recorded for this account profile.</p>
                    </CardContent>
                 </Card>
              </TabsContent>
           </Tabs>
        </div>
      </div>
    </div>
  );
}