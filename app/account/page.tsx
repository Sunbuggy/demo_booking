/**
 * @file /app/account/page.tsx
 * @description The unified user dashboard.
 * - CUSTOMERS: Land on "My Adventures" (Bookings).
 * - STAFF: Land on "Operations" (Time Clock).
 * - THEME: Fully Semantic (Light/Dark Mode Safe).
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
import { fetchHRConfiguration } from '@/app/actions/fetch-hr-config';

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
  CalendarOff, CalendarDays, Ticket, ShieldAlert, Briefcase, UserCircle, Car
} from 'lucide-react';

// --- TYPES ---
import { UserType } from '@/app/(biz)/biz/users/types';

// --- PAGE PROPS INTERFACE ---
interface AccountPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AccountPage(props: AccountPageProps) {
  const supabase = await createClient();

  // 1. Authenticate Viewer
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  if (!currentUser) return redirect('/login');

  // 2. Resolve Async SearchParams
  const searchParams = await props.searchParams;
  const requestedUserId = typeof searchParams.userId === 'string' ? searchParams.userId : undefined;

  let targetUserId = currentUser.id;
  let isViewingOther = false;
  let viewerLevel = 0;

  // Fetch Viewer Profile for Permissions
  const viewerProfileRes = await getUserById(supabase, currentUser.id);
  viewerLevel = viewerProfileRes?.[0]?.user_level ?? 0;
  
  if (requestedUserId && requestedUserId !== currentUser.id) {
    if (viewerLevel >= 650) {
      targetUserId = requestedUserId;
      isViewingOther = true;
    } else {
      return redirect('/account');
    }
  }

  // 3. Data Fetching
  const startOfWeek = moment().startOf('isoWeek').format('YYYY-MM-DD');
  const endOfWeek = moment().endOf('isoWeek').format('YYYY-MM-DD');

  const [
    userProfileRes,
    employeeDetailsRes,
    weeklyTimeEntries,
    qrDataRes,
    availabilityRes,
    timeOffRes,
    hrConfig 
  ] = await Promise.all([
    getUserById(supabase, targetUserId),
    getEmployeeDetails(supabase, targetUserId),
    fetchEmployeeTimeClockEntryData(supabase, targetUserId, startOfWeek, endOfWeek),
    supabase.from('qr_history').select(`*, vehicle:vehicles (*)`).eq('user', targetUserId).order('scanned_at', { ascending: false }),
    supabase.from('employee_availability_patterns').select('*').eq('user_id', targetUserId),
    supabase.from('time_off_requests').select('*').eq('user_id', targetUserId).order('start_date', { ascending: false }),
    fetchHRConfiguration() 
  ]);

  // 4. Normalize Data
  const userProfile = userProfileRes?.[0] as UserType | undefined;
  
  if (!userProfile) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-background text-foreground">
            <h1 className="text-2xl font-bold text-destructive">User Not Found</h1>
            <Button asChild className="mt-4" variant="secondary"><Link href="/">Return Home</Link></Button>
        </div>
      );
  }

  const userLevel = userProfile.user_level ?? 0;
  // --- GATEKEEPER: GUESTS (0-99) ---
  if (!isViewingOther && userLevel < 100) return redirect('/login');

  const employeeDetails = employeeDetailsRes || [];
  const availabilityRules = availabilityRes.data || [];
  const timeOffRequests = timeOffRes.data || [];
  const scans = (qrDataRes.data || []).map((item: any) => item.vehicle).filter((v: any) => v !== null);

  const isStaff = userLevel >= 300; 
  const defaultTab = isStaff ? "operations" : "adventures";

  return (
    // SEMANTIC: Main Page Background
    <div className="min-h-screen bg-background text-foreground w-full overflow-x-hidden">
      
      {/* --- TOP BAR: IDENTITY & ACTIONS --- */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          
          {/* LEFT: Identity (Fun License) */}
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
               <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-primary shadow-sm">
                 <UserImage profilePic={userProfile.avatar_url || ''} user_id={targetUserId} />
               </div>
               <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5">
                 {isStaff 
                   ? <Badge className="h-5 w-5 p-0 flex items-center justify-center rounded-full bg-primary"><Briefcase className="w-3 h-3 text-primary-foreground" /></Badge> 
                   : <Badge className="h-5 w-5 p-0 flex items-center justify-center rounded-full bg-secondary"><UserCircle className="w-3 h-3 text-secondary-foreground" /></Badge>
                 }
               </div>
            </div>
            <div className="leading-tight">
              <h1 className="font-bold text-lg truncate max-w-[200px] md:max-w-md">
                {userProfile.stage_name || userProfile.full_name}
              </h1>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-mono">LVL_{userLevel}</span>
                <span>•</span>
                <span className="uppercase">{employeeDetails[0]?.primary_work_location || 'Las Vegas'}</span>
              </div>
            </div>
          </div>

          {/* RIGHT: Actions */}
          <div className="flex items-center gap-2">
             {!isViewingOther && <BackgroundPicker user={userProfile} />}
             
             <Dialog>
                 <DialogTrigger asChild>
                   <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                     <Settings className="w-5 h-5" />
                   </Button>
                 </DialogTrigger>
                 <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-card border-border text-card-foreground">
                    <DialogHeader>
                      <DialogTitle>Profile Settings</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6">
                        <UserForm 
                          user={userProfile as any} 
                          empDetails={employeeDetails} 
                          hrConfig={hrConfig || []} 
                          currentUserLevel={viewerLevel}
                        />
                        {/* Homepage Selector moved to Settings to declutter main view */}
                        <div className="pt-4 border-t border-border">
                           <h3 className="text-sm font-semibold mb-2">Start Page Preference</h3>
                           <HomepageSelect 
                              userId={targetUserId}
                              currentHomepage={userProfile.homepage}
                              userLevel={userLevel}
                            />
                        </div>
                    </div>
                 </DialogContent>
             </Dialog>
          </div>
        </div>

        {/* Admin Banner (If Viewing Other) */}
        {isViewingOther && (
          <div className="bg-destructive/10 text-destructive text-xs text-center py-1 font-bold border-t border-destructive/20">
             ADMIN VIEWING: {userProfile.full_name}
          </div>
        )}
      </header>

      {/* --- MAIN CONTENT --- */}
      <main className="max-w-7xl mx-auto p-4 md:p-6 pb-32">
        <Tabs defaultValue={defaultTab} className="w-full space-y-6">
          
          {/* TAB NAVIGATION */}
          <TabsList className="w-full md:w-auto h-auto p-1 bg-muted/50 border border-border flex flex-wrap justify-start gap-1">
             {/* Customer Primary Tab */}
             <TabsTrigger value="adventures" className="gap-2 py-2 px-4 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                <Ticket className="w-4 h-4 text-primary" /> My Adventures
             </TabsTrigger>

             {/* Staff Primary Tab */}
             {isStaff && (
               <TabsTrigger value="operations" className="gap-2 py-2 px-4 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                  <Briefcase className="w-4 h-4 text-orange-500" /> Operations
               </TabsTrigger>
             )}

             {/* Shared Tabs */}
             <TabsTrigger value="history" className="gap-2 py-2 px-4 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                <History className="w-4 h-4 text-blue-500" /> Activity Log
             </TabsTrigger>
             
             <TabsTrigger value="achievements" className="gap-2 py-2 px-4 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                <Trophy className="w-4 h-4 text-yellow-500" /> Badges
             </TabsTrigger>
          </TabsList>

          {/* ----------------------------------------------------------------------
              TAB CONTENT: MY ADVENTURES (Bookings)
             ---------------------------------------------------------------------- */}
          <TabsContent value="adventures" className="animate-in fade-in slide-in-from-left-2 duration-300">
             <div className="grid gap-6">
                {/* Placeholder for Booking Interface */}
                <Card className="bg-card border-border border-dashed">
                   <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                         <Car className="w-8 h-8 text-primary" />
                      </div>
                      <h3 className="text-xl font-bold mb-2">No Upcoming Adventures</h3>
                      <p className="text-muted-foreground max-w-md mb-6">
                        You don't have any active reservations. Ready to kick up some dust?
                      </p>
                      <Button className="bg-primary text-primary-foreground hover:bg-primary/90" asChild>
                        <Link href="/book">Book an Adventure</Link>
                      </Button>
                   </CardContent>
                </Card>
             </div>
          </TabsContent>

          {/* ----------------------------------------------------------------------
              TAB CONTENT: OPERATIONS (Staff Only)
             ---------------------------------------------------------------------- */}
          {isStaff && (
            <TabsContent value="operations" className="animate-in fade-in slide-in-from-left-2 duration-300">
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Col: Time Clock */}
                  <div className="lg:col-span-2 space-y-6">
                     <UserTimeSheet userId={targetUserId} />
                  </div>

                  {/* Right Col: Admin Utils */}
                  <div className="space-y-6">
                     <Card className="bg-card border-border">
                        <CardHeader>
                           <CardTitle className="flex items-center gap-2 text-base">
                              <CalendarDays className="w-4 h-4 text-primary" /> Availability
                           </CardTitle>
                        </CardHeader>
                        <CardContent>
                           <AdminAvailability userId={targetUserId} existingPattern={availabilityRules} />
                        </CardContent>
                     </Card>

                     <Card className="bg-card border-border">
                        <CardHeader>
                           <CardTitle className="flex items-center gap-2 text-base">
                              <CalendarOff className="w-4 h-4 text-destructive" /> Time Off
                           </CardTitle>
                        </CardHeader>
                        <CardContent>
                           <AdminTimeOff userId={targetUserId} requests={timeOffRequests} />
                        </CardContent>
                     </Card>
                  </div>
               </div>
            </TabsContent>
          )}

          {/* ----------------------------------------------------------------------
              TAB CONTENT: ACTIVITY LOG
             ---------------------------------------------------------------------- */}
          <TabsContent value="history" className="animate-in fade-in slide-in-from-left-2 duration-300">
             <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>System Interactions</CardTitle>
                  <CardDescription>History of vehicle check-outs and QR scans.</CardDescription>
                </CardHeader>
                <CardContent>
                   <ScanHistory scans={scans} />
                </CardContent>
             </Card>
          </TabsContent>

          {/* ----------------------------------------------------------------------
              TAB CONTENT: ACHIEVEMENTS
             ---------------------------------------------------------------------- */}
          <TabsContent value="achievements" className="animate-in fade-in slide-in-from-left-2 duration-300">
             <Card className="bg-card border-border">
                <CardHeader>
                   <CardTitle>Badges & Recognition</CardTitle>
                   <CardDescription>Earn badges by completing adventures and mastering vehicles.</CardDescription>
                </CardHeader>
                <CardContent className="py-12 text-center">
                   <Trophy className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                   <p className="text-muted-foreground italic">Achievement system coming soon.</p>
                </CardContent>
             </Card>
          </TabsContent>

        </Tabs>
      </main>
    </div>
  );
}