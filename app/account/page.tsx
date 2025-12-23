// app/account/page.tsx

import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';

// --- DATA ACCESS ---
import {
  fetchEmployeeTimeClockEntryData,
  fetchTimeEntryByUserId,
  getEmployeeDetails,
  getUserById
} from '@/utils/supabase/queries';

// --- COMPONENTS ---
import BackgroundPickerButton from './components/background-picker-button';
import ScanHistory from '@/app/(biz)/biz/users/[id]/components/scan-history';
import UserImage from '@/app/(biz)/biz/users/[id]/components/user-image';
import UserForm from '@/app/(biz)/biz/users/[id]/user-form';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, MapPin, Trophy, User as UserIcon } from 'lucide-react';
import moment from 'moment';

// --- TYPES ---
import { UserType } from '@/app/(biz)/biz/users/types';
// We import VehicleType to cast our joined data correctly for the ScanHistory component
import { VehicleType } from '@/app/(biz)/biz/vehicles/admin/page';

/**
 * Helper to calculate total hours from time entries
 */
const calculateWeeklyHours = (entries: any[]) => {
  if (!entries || entries.length === 0) return "0.00";
  
  let totalMinutes = 0;
  entries.forEach((entry) => {
    if (entry.clock_in?.clock_in_time && entry.clock_out?.clock_out_time) {
      const start = moment(entry.clock_in.clock_in_time);
      const end = moment(entry.clock_out.clock_out_time);
      totalMinutes += end.diff(start, 'minutes');
    }
  });
  return (totalMinutes / 60).toFixed(2);
};

export default async function AccountPage() {
  // 1. Initialize Supabase
  const supabase = await createClient();

  // 2. Auth Check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect('/signin');

  const userId = user.id;

  // 3. Define Time Window (YYYY-MM-DD for database compatibility)
  const startOfWeek = moment().startOf('isoWeek').format('YYYY-MM-DD');
  const endOfWeek = moment().endOf('isoWeek').format('YYYY-MM-DD');

  // 4. Fetch Data
  // We perform the QR Join manually here to ensure we get the 'vehicle' details needed for Trophies
  const [
    userProfileRes,
    employeeDetailsRes,
    weeklyTimeEntries,
    activeTimeEntry,
    qrDataRes
  ] = await Promise.all([
    getUserById(supabase, userId),
    getEmployeeDetails(supabase, userId),
    fetchEmployeeTimeClockEntryData(supabase, userId, startOfWeek, endOfWeek),
    fetchTimeEntryByUserId(supabase, userId),
    // Custom query to join vehicles for the ScanHistory component
    supabase
      .from('qr_history')
      .select(`
        *,
        vehicle:vehicles (*)
      `)
      .eq('user', userId)
      .order('scanned_at', { ascending: false })
  ]);

  // 5. Data Normalization
  const userProfile = userProfileRes?.[0] as UserType | undefined;
  if (!userProfile) return redirect('/signin');

  const employeeDetails = employeeDetailsRes || [];
  const weeklyHours = calculateWeeklyHours(weeklyTimeEntries || []);
  
  // Transform the QR result into the VehicleType[] expected by ScanHistory
  const scans: VehicleType[] = (qrDataRes.data || [])
    .map((item: any) => item.vehicle) // Extract the vehicle object from the join
    .filter((v: any) => v !== null)   // Filter out nulls (deleted vehicles)
    .map((v: any) => ({
      ...v,
      // Ensure required fields exist just in case DB schema varies
      id: v.id,
      name: v.name || 'Unknown',
      type: v.type || 'unknown',
      vehicle_status: v.vehicle_status || 'unknown'
    }));

  // Determine Clock Status
  const isClockedIn = activeTimeEntry && activeTimeEntry.length > 0;
  const clockInTime = isClockedIn ? activeTimeEntry[0].clock_in?.clock_in_time : null;
  
  // Role & Permission Checks
  const userLevel = userProfile.user_level ?? 0;
  const isStaff = userLevel > 284;

  return (
    <section className="min-h-screen w-full pb-32 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* --- HEADER: Identity & Actions --- */}
        <div className="relative overflow-hidden rounded-3xl border bg-card text-card-foreground shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-yellow-500/10 pointer-events-none" />
          <div className="relative p-8 flex flex-col md:flex-row items-center md:items-start gap-8">
            
            {/* Avatar Component */}
            <div className="flex-shrink-0">
               <UserImage 
                 profilePic={userProfile.avatar_url || ''} 
                 user_id={userId} 
               />
            </div>

            <div className="flex-grow text-center md:text-left space-y-3">
              <div className="space-y-1">
                <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                  {userProfile.full_name || 'SunBuggy Adventurer'}
                </h1>
                <p className="text-muted-foreground font-mono">
                  {userProfile.email}
                </p>
              </div>

              <div className="flex flex-wrap justify-center md:justify-start gap-3 items-center">
                <Badge variant="outline" className="text-sm px-3 py-1">
                  Level {userLevel}
                </Badge>
                {employeeDetails[0]?.primary_position && (
                  <Badge variant="secondary" className="text-sm px-3 py-1">
                    {employeeDetails[0].primary_position}
                  </Badge>
                )}
              </div>

              <div className="pt-2 flex flex-wrap justify-center md:justify-start gap-3">
                {/* EDIT PROFILE DIALOG */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <UserIcon className="w-4 h-4" /> Edit Profile
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Edit Profile Details</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                      <UserForm 
                        user={userProfile as any}
                        empDetails={employeeDetails}
                        userDispatchLocation={[]} 
                      />
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </div>

        {/* --- MAIN DASHBOARD CONTENT --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN: Stats & Timeclock (Staff) */}
          <div className="space-y-6 lg:col-span-1">
            
            {/* TIMECLOCK STATUS CARD (Staff Only) */}
            {isStaff && (
              <Card className={`border-l-4 ${isClockedIn ? 'border-l-green-500' : 'border-l-slate-300'} shadow-md`}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-lg">
                    <span>Time Status</span>
                    {isClockedIn ? (
                      <Badge className="bg-green-500 hover:bg-green-600">Clocked In</Badge>
                    ) : (
                      <Badge variant="secondary">Clocked Out</Badge>
                    )}
                  </CardTitle>
                  <CardDescription>Current Week Activity</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  
                  {isClockedIn && clockInTime && (
                    <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-100 dark:border-green-900/50">
                      <div className="text-xs text-green-700 dark:text-green-400 font-semibold mb-1">CURRENT SESSION</div>
                      <div className="text-2xl font-mono font-bold text-green-800 dark:text-green-300">
                        {moment(clockInTime).format('h:mm A')}
                      </div>
                      <div className="text-xs text-muted-foreground">Started today</div>
                    </div>
                  )}

                  <div className="flex justify-between items-end border-t pt-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Weekly Hours</div>
                      <div className="text-3xl font-bold">{weeklyHours}</div>
                    </div>
                    <Clock className="w-8 h-8 text-muted-foreground/20" />
                  </div>
                  
                  <Button className="w-full mt-2" variant="default" asChild>
                    <Link href="/biz/schedule">Open Roster & Schedule</Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* EMPLOYEE DETAILS */}
            {isStaff && employeeDetails.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Employment Details</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-3">
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">Location</span>
                    <span className="font-medium flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {employeeDetails[0].primary_work_location || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">Payroll ID</span>
                    <span className="font-mono">{employeeDetails[0].emp_id || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Company</span>
                    <span>{employeeDetails[0].payroll_company || 'N/A'}</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* RIGHT COLUMN: Gamification & History */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="achievements" className="w-full">
              <div className="flex items-center justify-between mb-4">
                <TabsList>
                  <TabsTrigger value="achievements" className="flex gap-2">
                    <Trophy className="w-4 h-4" /> Achievements
                  </TabsTrigger>
                  <TabsTrigger value="scans">Scan History</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="achievements" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Trophies & Badges</CardTitle>
                    <CardDescription>
                      Track your fleet scans and earn badges for different vehicle types.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {scans && scans.length > 0 ? (
                      <ScanHistory scans={scans} />
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        <Trophy className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>No scans found yet. Start scanning vehicles to earn trophies!</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="scans" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Scans</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      {(scans || []).slice(0, 10).map((scan, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 hover:bg-muted/50 rounded-lg transition-colors border-b last:border-0">
                          <div className="flex flex-col">
                            <span className="font-medium">{scan.name || 'Unknown Vehicle'}</span>
                            <span className="text-xs text-muted-foreground capitalize">{scan.type} • {scan.vehicle_status}</span>
                          </div>
                          <Badge variant="outline">{scan.id}</Badge>
                        </div>
                      ))}
                      {(!scans || scans.length === 0) && (
                        <p className="text-sm text-muted-foreground text-center py-4">No recent history.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Floating Background Picker */}
        <BackgroundPickerButton user={userProfile} />
      </div>
    </section>
  );
}