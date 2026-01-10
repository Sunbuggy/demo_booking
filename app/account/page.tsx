/**
 * @file /app/account/page.tsx
 * @description THE UNIVERSAL USER HUB.
 * Updated: Fetches dynamic HR Configuration (Locations/Depts/Positions) from DB
 * and passes it to UserForm for editing consistency.
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
import { fetchHRConfiguration } from '@/app/actions/fetch-hr-config'; // <--- NEW IMPORT

// --- FEATURE COMPONENTS ---
import UserTimeSheet from '@/components/UserTimeSheet'; 
import AdminAvailability from '@/app/(biz)/biz/users/[id]/components/admin-availability'; 
import AdminTimeOff from '@/app/(biz)/biz/users/[id]/components/admin-time-off'; 
import ScanHistory from '@/app/(biz)/biz/users/[id]/components/scan-history';
import HomepageSelect from '@/components/account/HomepageSelect';

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
  MapPin, Settings, History, Trophy, 
  CalendarOff, CalendarDays, Mail, Activity, ShieldAlert, Home
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

// --- PAGE PROPS INTERFACE ---
interface AccountPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AccountPage(props: AccountPageProps) {
  const supabase = await createClient();

  // 1. Authenticate Viewer
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  if (!currentUser) return redirect('/login'); // Basic auth check

  // 2. Resolve Async SearchParams
  const searchParams = await props.searchParams;
  const requestedUserId = typeof searchParams.userId === 'string' ? searchParams.userId : undefined;

  let targetUserId = currentUser.id;
  let isViewingOther = false;
  let viewerLevel = 0;

  // Fetch Viewer Profile first to establish permissions
  const viewerProfileRes = await getUserById(supabase, currentUser.id);
  viewerLevel = viewerProfileRes?.[0]?.user_level ?? 0;
  
  if (requestedUserId && requestedUserId !== currentUser.id) {
    // Only Managers (650+) or Admins (900+) can view others
    if (viewerLevel >= 650) {
      targetUserId = requestedUserId;
      isViewingOther = true;
    } else {
      return redirect('/account');
    }
  }

  // 3. Data Fetching for TARGET User
  const startOfWeek = moment().startOf('isoWeek').format('YYYY-MM-DD');
  const endOfWeek = moment().endOf('isoWeek').format('YYYY-MM-DD');

  const [
    userProfileRes,
    employeeDetailsRes,
    weeklyTimeEntries,
    qrDataRes,
    availabilityRes,
    timeOffRes,
    hrConfig // <--- NEW: Fetch HR Data
  ] = await Promise.all([
    getUserById(supabase, targetUserId),
    getEmployeeDetails(supabase, targetUserId),
    fetchEmployeeTimeClockEntryData(supabase, targetUserId, startOfWeek, endOfWeek),
    supabase.from('qr_history').select(`*, vehicle:vehicles (*)`).eq('user', targetUserId).order('scanned_at', { ascending: false }),
    supabase.from('employee_availability_patterns').select('*').eq('user_id', targetUserId),
    supabase.from('time_off_requests').select('*').eq('user_id', targetUserId).order('start_date', { ascending: false }),
    fetchHRConfiguration() // <--- NEW Call
  ]);

  // 4. Normalize Data
  const userProfile = userProfileRes?.[0] as UserType | undefined;
  
  if (!userProfile) {
      return (
        <div className="p-8 text-center text-red-500">
            <h1 className="text-2xl font-bold">User Not Found</h1>
            <p>The requested profile does not exist.</p>
            <Button asChild className="mt-4"><Link href="/">Return Home</Link></Button>
        </div>
      );
  }

  const userLevel = userProfile.user_level ?? 0;

  // --- GATEKEEPER: GUESTS (0-99) ---
  // If the user is viewing themselves and is < 100, kick them out.
  if (!isViewingOther && userLevel < 100) {
    return redirect('/login');
  }

  const employeeDetails = employeeDetailsRes || [];
  const weeklyHours = calculateWeeklyHours(weeklyTimeEntries || []);
  const availabilityRules = availabilityRes.data || [];
  const timeOffRequests = timeOffRes.data || [];

  const scans = (qrDataRes.data || [])
    .map((item: any) => item.vehicle)
    .filter((v: any) => v !== null);

  // Standardized "Staff" check (Level 300+)
  const isStaff = userLevel >= 300; 

  // Use either the unified employee_details column or fallback to user table
  const currentDept = employeeDetails[0]?.department || userProfile.department || 'UNASSIGNED';
  const currentPos = employeeDetails[0]?.primary_position || userProfile.job_title || 'STAFF';

  return (
    <div className="max-w-7xl mx-auto p-2 sm:p-8 space-y-8 pb-32 w-full overflow-hidden animate-in fade-in">
      
      {/* --- ADMIN MODE BANNER --- */}
      {isViewingOther && (
        <div className="bg-amber-500/10 border border-amber-500/50 text-amber-500 p-3 rounded-lg flex items-center justify-between">
           <div className="flex items-center gap-2">
             <ShieldAlert className="w-5 h-5" />
             <span className="font-bold text-sm uppercase">Admin Override: {userProfile.full_name}</span>
           </div>
           <Button asChild size="sm" variant="ghost" className="hover:bg-amber-500/20 text-amber-500">
             <Link href="/account">Back to My Profile</Link>
           </Button>
        </div>
      )}

      {/* --- HERO HEADER --- */}
      <div className={`relative overflow-hidden rounded-3xl border shadow-sm transition-all ${isStaff ? 'bg-card border-zinc-800' : 'bg-zinc-950 border-blue-500/20'}`}>
        <div className={`absolute inset-0 pointer-events-none opacity-20 ${
          isStaff ? 'bg-gradient-to-br from-orange-500 via-transparent to-red-600' : 'bg-gradient-to-br from-blue-600 via-transparent to-indigo-600'
        }`} />
        
        <div className="relative p-4 md:p-8 flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
           <div className="flex-shrink-0 max-w-[150px] md:max-w-none">
             <UserImage profilePic={userProfile.avatar_url || ''} user_id={targetUserId} />
           </div>
           
           <div className="flex-grow text-center md:text-left space-y-2 min-w-0 w-full">
             <div className="flex flex-col md:flex-row md:items-end gap-2 justify-center md:justify-start flex-wrap">
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
                
                {/* DEPT/POS: Hidden for customers to ensure privacy/simplicity */}
                {isStaff && (
                  <Badge variant="secondary" className="ml-2 bg-zinc-800 text-zinc-300 border-zinc-700">
                    {currentDept} / {currentPos}
                  </Badge>
                )}
             </div>

             <div className="pt-4 flex flex-wrap gap-2 justify-center md:justify-start items-center">
               <Dialog>
                 <DialogTrigger asChild>
                   {/* CHANGED: Replaced "Sync Profile" text with Gear Icon */}
                   <Button size="icon" variant="ghost" className="rounded-full bg-white/5 hover:bg-primary hover:text-black border border-white/10" title="Settings">
                     <Settings className="w-5 h-5" />
                   </Button>
                 </DialogTrigger>
                 <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-zinc-950 border-zinc-800">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-bold italic uppercase tracking-tighter">
                        Profile Settings: <span className="text-orange-500">{userProfile.full_name}</span>
                      </DialogTitle>
                    </DialogHeader>
                    {/* UPDATED: Passing hrConfig and viewerLevel to UserForm */}
                    <UserForm 
                      user={userProfile as any} 
                      empDetails={employeeDetails} 
                      hrConfig={hrConfig || []} 
                      currentUserLevel={viewerLevel}
                    />
                 </DialogContent>
               </Dialog>
               
               {isStaff && (
                 <Button variant="secondary" size="sm" asChild className="font-bold">
                   <Link href="/biz/schedule">VIEW ROSTER</Link>
                 </Button>
               )}
               {!isViewingOther && <BackgroundPicker user={userProfile} />}
             </div>
           </div>
        </div>
      </div>

      {/* --- MAIN GRID --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6 min-w-0">
           <Card className="bg-zinc-950 border-zinc-800 shadow-xl">
             <CardHeader className="pb-2 border-b border-zinc-900 mb-4">
               <CardTitle className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                 <Mail size={12}/> Identity Contact
               </CardTitle>
             </CardHeader>
             <CardContent className="space-y-4 text-sm">
                <div className="flex justify-between items-center gap-4">
                    <span className="text-zinc-500 shrink-0">Email</span> 
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

           {/* OPERATIONS CARD - STAFF ONLY */}
           {isStaff && (
             <Card className="bg-zinc-900/30 border-orange-500/20">
               <CardHeader className="pb-2">
                 <CardTitle className="text-[10px] font-black uppercase tracking-widest text-orange-500">Operations Summary</CardTitle>
               </CardHeader>
               <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Week Hours</span> 
                    <span className="font-bold text-lg text-white">{weeklyHours}h</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Dept</span> 
                    <span className="text-white font-semibold uppercase">{currentDept}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Position</span> 
                    <span className="text-white">{currentPos}</span>
                  </div>

                  {/* --- NEW: HOMEPAGE SELECTOR --- */}
                  <div className="py-2 border-t border-zinc-800/50">
                    <div className="flex justify-between items-center mb-1">
                       <span className="text-[10px] font-black uppercase text-orange-500 flex items-center gap-1">
                         <Home className="w-3 h-3"/> Start Page
                       </span>
                    </div>
                    <HomepageSelect 
                      userId={targetUserId}
                      currentHomepage={userProfile.homepage}
                      userLevel={userLevel}
                    />
                  </div>
                  {/* ----------------------------- */}

                  <div className="flex justify-between items-center pt-2 border-t border-zinc-800">
                    <span className="text-zinc-400">Hire Date</span> 
                    <span className="text-white font-mono">{employeeDetails[0]?.hire_date || 'N/A'}</span>
                  </div>
               </CardContent>
             </Card>
           )}
        </div>

        <div className="lg:col-span-2 min-w-0">
           <Tabs defaultValue={isStaff ? "timesheet" : "scans"} className="w-full">
              <TabsList className="mb-4 bg-zinc-950 border border-zinc-800 p-1 flex h-auto flex-wrap gap-1">
                 {isStaff && (
                    <>
                        <TabsTrigger value="timesheet" className="gap-2 data-[state=active]:bg-orange-600"><History size={14}/> Time Sheet</TabsTrigger>
                        <TabsTrigger value="availability" className="gap-2 data-[state=active]:bg-orange-600"><CalendarDays size={14}/> Availability</TabsTrigger>
                        <TabsTrigger value="timeoff" className="gap-2 data-[state=active]:bg-orange-600"><CalendarOff size={14}/> Time Off</TabsTrigger>
                    </>
                 )}
                 <TabsTrigger value="scans" className="gap-2 data-[state=active]:bg-blue-600">
                   <Activity size={14} /> Log
                 </TabsTrigger>
                 <TabsTrigger value="achievements" className="gap-2 data-[state=active]:bg-yellow-600">
                   <Trophy size={14} /> Badges
                 </TabsTrigger>
              </TabsList>

              {isStaff && (
                <TabsContent value="timesheet" className="animate-in fade-in zoom-in-95 duration-200">
                    <div className="w-full min-w-0">
                      <UserTimeSheet userId={targetUserId} />
                    </div>
                </TabsContent>
              )}

              {isStaff && (
                <TabsContent value="availability" className="animate-in fade-in zoom-in-95 duration-200">
                   <div className="w-full min-w-0">
                     <AdminAvailability userId={targetUserId} existingPattern={availabilityRules} />
                   </div>
                </TabsContent>
              )}

              {isStaff && (
                <TabsContent value="timeoff" className="animate-in fade-in zoom-in-95 duration-200">
                   <div className="w-full min-w-0">
                     <AdminTimeOff userId={targetUserId} requests={timeOffRequests} />
                   </div>
                </TabsContent>
              )}

              <TabsContent value="scans" className="animate-in fade-in zoom-in-95 duration-200">
                 <Card className="bg-zinc-950 border-zinc-800">
                    <CardHeader>
                      <CardTitle className="italic uppercase tracking-tighter">System Interaction</CardTitle>
                      <CardDescription>Recent QR scans and vehicle engagement.</CardDescription>
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