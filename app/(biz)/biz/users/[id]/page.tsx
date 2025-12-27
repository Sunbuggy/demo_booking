import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import moment from 'moment';

// --- DATA QUERIES ---
import {
  getUserById,
  getEmployeeDetails,
  fetchEmployeeTimeClockEntryData,
  fetchTimeEntryByUserId
} from '@/utils/supabase/queries';

// --- COMPONENTS ---
import UserImage from './components/user-image';
import UserForm from './user-form';
import ScanHistory from './components/scan-history'; 
import HistoryTimeClockEvents from '@/app/(biz)/biz/users/admin/tables/employee/time-clock/time-history';

// --- NEW COMPONENTS (We will create these below) ---
import AdminAvailability from './components/admin-availability';
import AdminTimeOff from './components/admin-time-off';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  MapPin, UserCog, History, 
  Trophy, CalendarOff, CalendarClock, Phone, Cloud
} from 'lucide-react';

export default async function AdminUserProfilePage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const supabase = await createClient();
  const resolvedParams = await params;
  const targetUserId = resolvedParams.id;

  // 1. Auth Check
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  if (!currentUser) return redirect('/signin');
  
  // 2. Fetch TARGET User Data
  const startOfWeek = moment().startOf('isoWeek').format('YYYY-MM-DD');
  const endOfWeek = moment().endOf('isoWeek').format('YYYY-MM-DD');

  const [
    userRes,
    detailsRes,
    timeEntries,
    activeEntry,
    qrRes,
    availabilityRes,
    timeOffRes
  ] = await Promise.all([
    getUserById(supabase, targetUserId),
    getEmployeeDetails(supabase, targetUserId),
    fetchEmployeeTimeClockEntryData(supabase, targetUserId, startOfWeek, endOfWeek),
    fetchTimeEntryByUserId(supabase, targetUserId),
    supabase.from('qr_history').select('*, vehicle:vehicles(*)').eq('user', targetUserId).order('scanned_at', { ascending: false }),
    // Fetch Availability
    supabase.from('employee_availability_patterns').select('*').eq('user_id', targetUserId),
    // Fetch Time Off
    supabase.from('time_off_requests').select('*').eq('user_id', targetUserId).order('start_date', { ascending: false })
  ]);

  const targetUser = userRes?.[0];
  if (!targetUser) return <div className="p-8">User not found.</div>;

  const empDetails = detailsRes?.[0];
  const isClockedIn = activeEntry && activeEntry.length > 0;
  
  // Calculate Hours
  let totalMinutes = 0;
  timeEntries?.forEach((e: any) => {
    if (e.clock_in_time && e.clock_out_time) {
      totalMinutes += moment(e.clock_out_time).diff(moment(e.clock_in_time), 'minutes');
    }
  });
  const weeklyHours = (totalMinutes / 60).toFixed(2);

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-8 space-y-8 pb-32">
      
      {/* --- HEADER --- */}
      <div className="relative overflow-hidden rounded-3xl border bg-card text-card-foreground shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 pointer-events-none" />
        <div className="relative p-8 flex flex-col md:flex-row items-center md:items-start gap-8">
           <div className="flex-shrink-0">
             <UserImage profilePic={targetUser.avatar_url || ''} user_id={targetUserId} />
           </div>
           
           <div className="flex-grow text-center md:text-left space-y-2">
             <h1 className="text-3xl font-extrabold flex flex-col md:flex-row gap-2 items-center md:items-end">
               <span>{targetUser.stage_name || targetUser.full_name}</span>
               {targetUser.stage_name && (
                 <span className="text-lg font-normal text-muted-foreground">({targetUser.full_name})</span>
               )}
             </h1>
             
             <div className="flex flex-wrap justify-center md:justify-start gap-3 items-center">
                <Badge variant={isClockedIn ? "default" : "secondary"} className={isClockedIn ? "bg-green-600" : ""}>
                   {isClockedIn ? "Clocked In" : "Clocked Out"}
                </Badge>
                <Badge variant="outline">Level {targetUser.user_level}</Badge>
                <div className="flex items-center text-sm text-muted-foreground gap-1">
                  <MapPin className="w-4 h-4" /> {empDetails?.primary_work_location || 'No Location'}
                </div>
             </div>

             <div className="pt-4 flex gap-3 justify-center md:justify-start">
               <Dialog>
                 <DialogTrigger asChild>
                   <Button variant="outline" size="sm" className="gap-2">
                     <UserCog className="w-4 h-4" /> Edit Profile
                   </Button>
                 </DialogTrigger>
                 <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Edit Employee Profile</DialogTitle>
                    </DialogHeader>
                    <UserForm user={targetUser} empDetails={detailsRes} />
                 </DialogContent>
               </Dialog>
               
               <Button variant="secondary" size="sm" asChild>
                 <Link href={`/biz/schedule?user=${targetUserId}`}>View Schedule</Link>
               </Button>
             </div>
           </div>
        </div>
      </div>

      {/* --- MAIN CONTENT GRID --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Vitals */}
        <div className="space-y-6">
           <Card>
             <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">CONTACT</CardTitle></CardHeader>
             <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between"><span>Email</span> <span className="font-mono">{targetUser.email}</span></div>
                <div className="flex justify-between"><span>Cell</span> <span>{targetUser.phone || 'N/A'}</span></div>
                {empDetails?.dialpad_number && (
                   <div className="flex justify-between text-blue-600"><span>Dialpad</span> <span className="font-mono">{empDetails.dialpad_number}</span></div>
                )}
             </CardContent>
           </Card>

           <Card>
             <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">PAYROLL</CardTitle></CardHeader>
             <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between"><span>This Week</span> <span className="font-bold text-lg">{weeklyHours} Hrs</span></div>
                <div className="flex justify-between"><span>Position</span> <span>{empDetails?.primary_position || 'N/A'}</span></div>
                <div className="flex justify-between"><span>Payroll ID</span> <span className="font-mono">{empDetails?.emp_id || 'N/A'}</span></div>
             </CardContent>
           </Card>
        </div>

        {/* RIGHT COLUMN: The 5 Tabs */}
        <div className="lg:col-span-2">
           <Tabs defaultValue="timesheet" className="w-full">
              <TabsList className="mb-4 flex flex-wrap h-auto gap-2">
                 <TabsTrigger value="timesheet" className="gap-2"><History className="w-4 h-4"/> Time Sheet</TabsTrigger>
                 <TabsTrigger value="availability" className="gap-2"><CalendarClock className="w-4 h-4"/> Availability</TabsTrigger>
                 <TabsTrigger value="timeoff" className="gap-2"><CalendarOff className="w-4 h-4"/> Time Off</TabsTrigger>
                 <TabsTrigger value="achievements" className="gap-2"><Trophy className="w-4 h-4"/> Achievements</TabsTrigger>
                 <TabsTrigger value="scans" className="gap-2">Scan History</TabsTrigger>
              </TabsList>

              {/* 1. Time Sheet */}
              <TabsContent value="timesheet">
                 <Card>
                    <CardHeader>
                       <CardTitle>Time Sheet & History</CardTitle>
                       <CardDescription>Review punch history for this user.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                       <HistoryTimeClockEvents user={targetUser} />
                    </CardContent>
                 </Card>
              </TabsContent>

              {/* 2. Availability (New) */}
              <TabsContent value="availability">
                 <AdminAvailability 
                    userId={targetUserId} 
                    existingPattern={availabilityRes.data} 
                 />
              </TabsContent>

              {/* 3. Time Off (New) */}
              <TabsContent value="timeoff">
                 <AdminTimeOff 
                    userId={targetUserId}
                    requests={timeOffRes.data || []}
                 />
              </TabsContent>

              {/* 4. Achievements (Placeholder for now) */}
              <TabsContent value="achievements">
                 <Card>
                    <CardHeader><CardTitle>Employee Achievements</CardTitle></CardHeader>
                    <CardContent className="text-center py-8 text-muted-foreground">
                       <Trophy className="w-12 h-12 mx-auto mb-4 opacity-20" />
                       <p>Achievements module coming soon.</p>
                    </CardContent>
                 </Card>
              </TabsContent>

              {/* 5. Scan History */}
              <TabsContent value="scans">
                 <Card>
                    <CardHeader><CardTitle>Vehicle Scans</CardTitle></CardHeader>
                    <CardContent>
                       <ScanHistory scans={qrRes.data?.map((x: any) => x.vehicle) || []} />
                    </CardContent>
                 </Card>
              </TabsContent>
           </Tabs>
        </div>
      </div>
    </div>
  );
}