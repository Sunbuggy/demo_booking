/**
 * @file /app/account/page.tsx
 * @description THE UNIVERSAL USER HUB.
 */

import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import moment from 'moment';

// --- DATA & QUERIES ---
import {
  getUserById,
  getEmployeeDetails,
  fetchEmployeeTimeClockEntryData 
} from '@/utils/supabase/queries';

// --- FEATURE COMPONENTS ---
import UserTimeSheet from '@/components/UserTimeSheet'; 
import AdminAvailability from '@/app/(biz)/biz/users/[id]/components/admin-availability'; 
import AdminTimeOff from '@/app/(biz)/biz/users/[id]/components/admin-time-off'; 
import ScanHistory from '@/app/(biz)/biz/users/[id]/components/scan-history';

// --- UI COMPONENTS ---
import BackgroundPicker from './components/background-picker';
import UserImage from '@/app/(biz)/biz/users/[id]/components/user-image';
import UserForm from '@/app/(biz)/biz/users/[id]/user-form';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger 
} from '@/components/ui/dialog';
import { 
  MapPin, UserCog, History, Trophy, 
  CalendarOff, CalendarDays, Mail, Activity
} from 'lucide-react';

// --- TYPES ---
import { UserType } from '@/app/(biz)/biz/users/types';

// --- HELPER: Calculate Hours ---
const calculateWeeklyHours = (entries: any[]) => {
  if (!entries || entries.length === 0) return "0.00";
  let totalMinutes = 0;
  entries.forEach((entry) => {
    const inTime = Array.isArray(entry.clock_in) ? entry.clock_in[0]?.clock_in_time : entry.clock_in?.clock_in_time;
    const outTime = Array.isArray(entry.clock_out) ? entry.clock_out[0]?.clock_out_time : entry.clock_out?.clock_out_time;

    if (inTime && outTime) {
      totalMinutes += moment(outTime).diff(moment(inTime), 'minutes');
    }
  });
  return (totalMinutes / 60).toFixed(2);
};

export default async function AccountPage() {
  const supabase = await createClient();

  // 1. Auth Check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect('/signin');
  const userId = user.id;

  // 2. Data Fetching
  const startOfWeek = moment().startOf('isoWeek').format('YYYY-MM-DD');
  const endOfWeek = moment().endOf('isoWeek').format('YYYY-MM-DD');

  const [
    userProfileRes,
    employeeDetailsRes,
    weeklyTimeEntries,
    qrDataRes,
    availabilityRes,
    timeOffRes
  ] = await Promise.all([
    getUserById(supabase, userId),
    getEmployeeDetails(supabase, userId),
    fetchEmployeeTimeClockEntryData(supabase, userId, startOfWeek, endOfWeek),
    supabase.from('qr_history').select(`*, vehicle:vehicles (*)`).eq('user', userId).order('scanned_at', { ascending: false }),
    supabase.from('employee_availability_patterns').select('*').eq('user_id', userId),
    supabase.from('time_off_requests').select('*').eq('user_id', userId).order('start_date', { ascending: false })
  ]);

  // 3. Normalize Data
  const userProfile = userProfileRes?.[0] as UserType | undefined;
  if (!userProfile) return redirect('/signin');

  const employeeDetails = employeeDetailsRes || [];
  const weeklyHours = calculateWeeklyHours(weeklyTimeEntries || []);
  const availabilityRules = availabilityRes.data || [];
  const timeOffRequests = timeOffRes.data || [];

  const scans = (qrDataRes.data || [])
    .map((item: any) => item.vehicle)
    .filter((v: any) => v !== null);

  const userLevel = userProfile.user_level ?? 0;
  const isStaff = userLevel > 284;

  return (
    // FIX: Added 'w-full max-w-[100vw] overflow-hidden' to the root container 
    // to strictly prevent any child from blowing out the width.
    <div className="max-w-7xl mx-auto p-2 sm:p-8 space-y-8 pb-32 w-full overflow-hidden">
      
      {/* --- HERO HEADER --- */}
      <div className={`relative overflow-hidden rounded-3xl border shadow-sm transition-all ${isStaff ? 'bg-card border-zinc-800' : 'bg-zinc-950 border-blue-500/20'}`}>
        <div className={`absolute inset-0 pointer-events-none opacity-20 ${
          isStaff ? 'bg-gradient-to-br from-orange-500 via-transparent to-red-600' : 'bg-gradient-to-br from-blue-600 via-transparent to-indigo-600'
        }`} />
        
        {/* FIX: Reduced padding from p-8 to p-4 on mobile to give content more room */}
        <div className="relative p-4 md:p-8 flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
           {/* FIX: Constrained image width on mobile */}
           <div className="flex-shrink-0 max-w-[150px] md:max-w-none">
             <UserImage profilePic={userProfile.avatar_url || ''} user_id={userId} />
           </div>
           
           {/* FIX: Added 'min-w-0' to text container to force wrapping */}
           <div className="flex-grow text-center md:text-left space-y-2 min-w-0 w-full">
             <div className="flex flex-col md:flex-row md:items-end gap-2 justify-center md:justify-start flex-wrap">
               {/* FIX: Added break-words to handle very long names */}
               <h1 className="text-3xl md:text-4xl font-black italic tracking-tighter uppercase break-words">
                 {userProfile.stage_name || userProfile.full_name}
               </h1>
               <div className="flex gap-2 justify-center">
                {!isStaff && <Badge className="bg-blue-600 mb-1">CUSTOMER</Badge>}
                {isStaff && <Badge className="bg-orange-600 mb-1">STAFF_ACCESS</Badge>}
                <Badge variant="outline" className="font-mono">LVL_{userLevel}</Badge>
               </div>
             </div>
             
             <div className="flex flex-wrap justify-center md:justify-start gap-3 items-center text-sm text-zinc-400 font-bold italic uppercase">
                <MapPin className={`w-4 h-4 ${isStaff ? 'text-orange-500' : 'text-blue-500'}`} /> 
                {employeeDetails[0]?.primary_work_location || 'REMOTE / GENERAL'}
             </div>

             <div className="pt-4 flex flex-wrap gap-2 justify-center md:justify-start items-center">
               <Dialog>
                 <DialogTrigger asChild>
                   <Button variant="outline" size="sm" className="gap-2 border-zinc-700 bg-zinc-900/50 hover:bg-zinc-800 hover:text-orange-500">
                     <UserCog className="w-4 h-4" /> Edit Profile
                   </Button>
                 </DialogTrigger>
                 <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-zinc-950 border-zinc-800">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-bold italic uppercase tracking-tighter">Edit Profile: <span className="text-orange-500">{userProfile.full_name}</span></DialogTitle>
                    </DialogHeader>
                    <UserForm user={userProfile as any} empDetails={employeeDetails} />
                 </DialogContent>
               </Dialog>
               
               {isStaff && (
                 <Button variant="secondary" size="sm" asChild className="font-bold">
                   <Link href="/biz/schedule">ROSTER</Link>
                 </Button>
               )}
               <BackgroundPicker user={userProfile} />
             </div>
           </div>
        </div>
      </div>

      {/* --- MAIN GRID --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Sidebar Info */}
        {/* FIX: Added 'min-w-0' to prevent grid blowout */}
        <div className="space-y-6 min-w-0">
           <Card className="bg-zinc-950 border-zinc-800">
             <CardHeader className="pb-2 border-b border-zinc-900 mb-4">
               <CardTitle className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                 <Mail size={12}/> Identity Contact
               </CardTitle>
             </CardHeader>
             <CardContent className="space-y-4 text-sm">
                {/* FIX: Constrained Email Container Width */}
                <div className="flex justify-between items-center gap-4">
                    <span className="text-zinc-500 shrink-0">Email</span> 
                    {/* FIX: 'truncate' works, but only if parent has width limits. 'min-w-0' helps here. */}
                    <span className="font-mono text-white truncate text-right min-w-0 block flex-1">
                        {userProfile.email}
                    </span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-zinc-500">Mobile</span> 
                    <span className="text-white text-right">{userProfile.phone || 'NOT_SET'}</span>
                </div>
             </CardContent>
           </Card>

           {isStaff && (
             <Card className="bg-zinc-900/30 border-orange-500/20">
               <CardHeader className="pb-2">
                 <CardTitle className="text-[10px] font-black uppercase tracking-widest text-orange-500">Fleet Operations</CardTitle>
               </CardHeader>
               <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between"><span>Weekly Hours</span> <span className="font-bold text-lg text-white">{weeklyHours}h</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">Position</span> <span className="text-white">{employeeDetails[0]?.primary_position || 'UNASSIGNED'}</span></div>
               </CardContent>
             </Card>
           )}
        </div>

        {/* RIGHT COLUMN: Interactive Tabs */}
        {/* FIX: Added 'min-w-0' here too */}
        <div className="lg:col-span-2 min-w-0">
           <Tabs defaultValue={isStaff ? "timesheet" : "scans"} className="w-full">
              {/* FIX: Added 'flex-wrap' to TabsList */}
              <TabsList className="mb-4 bg-zinc-950 border border-zinc-800 p-1 flex h-auto flex-wrap">
                 {isStaff && (
                    <>
                        <TabsTrigger value="timesheet" className="gap-2"><History size={14}/> Time Sheet</TabsTrigger>
                        <TabsTrigger value="availability" className="gap-2"><CalendarDays size={14}/> Availability</TabsTrigger>
                        <TabsTrigger value="timeoff" className="gap-2"><CalendarOff size={14}/> Time Off</TabsTrigger>
                    </>
                 )}
                 <TabsTrigger value="scans" className="gap-2">
                   <Activity size={14} /> Activity Log
                 </TabsTrigger>
                 <TabsTrigger value="achievements" className="gap-2">
                   <Trophy size={14} /> Achievements
                 </TabsTrigger>
              </TabsList>

              {isStaff && (
                <TabsContent value="timesheet">
                    <div className="w-full min-w-0">
                      <UserTimeSheet userId={userId} />
                    </div>
                </TabsContent>
              )}

              {isStaff && (
                <TabsContent value="availability">
                   <div className="w-full min-w-0">
                     <AdminAvailability userId={userId} existingPattern={availabilityRules} />
                   </div>
                </TabsContent>
              )}

              {isStaff && (
                <TabsContent value="timeoff">
                   <div className="w-full min-w-0">
                     <AdminTimeOff userId={userId} requests={timeOffRequests} />
                   </div>
                </TabsContent>
              )}

              <TabsContent value="scans">
                 <Card className="bg-zinc-950 border-zinc-800">
                    <CardHeader>
                      <CardTitle className="italic uppercase tracking-tighter">System Interaction</CardTitle>
                      <CardDescription>QR scans and vehicle engagement history.</CardDescription>
                    </CardHeader>
                    <CardContent>
                       <ScanHistory scans={scans} />
                    </CardContent>
                 </Card>
              </TabsContent>

              <TabsContent value="achievements">
                 <Card className="bg-zinc-950 border-zinc-800">
                    <CardHeader><CardTitle className="italic uppercase tracking-tighter">Badges & Recognition</CardTitle></CardHeader>
                    <CardContent className="text-center py-12">
                       <Trophy className="w-12 h-12 mx-auto mb-4 opacity-20 text-zinc-500" />
                       <p className="text-zinc-500 italic">Adventure badges coming soon.</p>
                    </CardContent>
                 </Card>
              </TabsContent>

           </Tabs>
        </div>
      </div>
    </div>
  );
}