/**
 * REFACTORED: SunBuggy Smart Time Clock (Bulletproof Edition)
 * Path: app/(biz)/biz/users/admin/tables/employee/time-clock/clock-in.tsx
 * Fixes: 406 Errors (using maybeSingle) & Missing Locations (using manual join).
 */
'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch"; 
import { Label } from "@/components/ui/label";
import { Loader2, Clock, Coffee, Ban, MapPinOff, CheckCircle2, LogOut, MapPin, Users, User, Filter, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import moment from 'moment';
import { useRouter } from 'next/navigation';

import TimeclockCamera, { TimeclockCameraHandle } from '@/components/TimeclockCamera';

// --- TYPES ---
interface TimeEntry {
  id: string;
  start_time: string;
  end_time: string | null;
  role: string;
  status: 'active' | 'break' | 'closed'; 
  is_on_break: boolean;
  break_start: string | null;
  total_break_minutes: number;
  location?: string;
  clock_in_photo_url?: string;
}

interface Schedule {
  id: string;
  start_time: string;
  end_time: string;
  role: string;
  location: string;
}

interface StaffMember {
    id: string;
    full_name: string;
    is_active: boolean; 
    location: string; 
}

interface SmartTimeClockProps {
    employeeId: string;
    onClose?: () => void; 
}

export default function SmartTimeClock({ employeeId, onClose }: SmartTimeClockProps) {
  const supabase = createClient();
  const router = useRouter();
  const cameraRef = useRef<TimeclockCameraHandle>(null);

  // Manager State
  const [isManager, setIsManager] = useState(false);
  const [proxyMode, setProxyMode] = useState(false);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<StaffMember[]>([]);
  const [targetUserId, setTargetUserId] = useState(employeeId); 
  const [locationFilter, setLocationFilter] = useState<string>('All');

  // Core State
  const [loading, setLoading] = useState(true);
  const [activeShift, setActiveShift] = useState<TimeEntry | null>(null);
  const [todaySchedule, setTodaySchedule] = useState<Schedule | null>(null);
  const [manualBlock, setManualBlock] = useState(false);
  
  // Hardware State
  const [locationCoords, setLocationCoords] = useState<{lat: number, lon: number} | null>(null);
  const [gpsError, setGpsError] = useState(false); 
  const [cameraReady, setCameraReady] = useState(false); 

  // Success State
  const [successAction, setSuccessAction] = useState<'in' | 'out' | null>(null);
  const [capturedImageBase64, setCapturedImageBase64] = useState<string | null>(null); 
  const [countdown, setCountdown] = useState(3); 
  const [successLocation, setSuccessLocation] = useState<string>(''); 

  // --- INIT ---
  useEffect(() => {
    checkManagerStatus();
    getCurrentLocation();
  }, [employeeId]);

  useEffect(() => {
    fetchStatus();
  }, [targetUserId]);

  // --- FILTERING LOGIC ---
  useEffect(() => {
      if (locationFilter === 'All') {
          setFilteredStaff(staffList);
      } else {
          setFilteredStaff(staffList.filter(s => 
              (s.location || '').toLowerCase().includes(locationFilter.toLowerCase())
          ));
      }
  }, [locationFilter, staffList]);

  const checkManagerStatus = async () => {
    const { data } = await supabase.from('users').select('user_level').eq('id', employeeId).single();
    if (data && data.user_level >= 500) {
        setIsManager(true);
        fetchStaffList();
    }
  };

  /**
   * FIX: BULLETPROOF STAFF FETCHING
   * Instead of relying on a join that might fail, we fetch data in parallel and map it manually.
   */
  const fetchStaffList = async () => {
      // 1. Fetch Users
      const { data: users } = await supabase
        .from('users')
        .select('id, full_name')
        .eq('user_type', 'employee')
        .order('full_name');

      // 2. Fetch Details (for location)
      const { data: details } = await supabase
        .from('employee_details')
        .select('user_id, primary_work_location');

      // 3. Fetch Active Punches
      const { data: activeEntries } = await supabase.from('time_entries').select('user_id').is('end_time', null);

      if (!users) return;

      // Create lookup maps for speed
      const locationMap = new Map(details?.map(d => [d.user_id, d.primary_work_location]) || []);
      const activeSet = new Set(activeEntries?.map(e => e.user_id));

      const mapped = users.map(u => ({
          id: u.id,
          full_name: u.full_name,
          is_active: activeSet.has(u.id),
          location: locationMap.get(u.id) || 'Las Vegas' // Default if not found
      }));

      setStaffList(mapped);
      setFilteredStaff(mapped);
  };

  const fetchStatus = async () => {
    setLoading(true);
    const startOfDay = moment().startOf('day').toISOString();
    const endOfDay = moment().endOf('day').toISOString();

    const { data: userData } = await supabase.from('users').select('timeclock_blocked').eq('id', targetUserId).single();
    if (userData?.timeclock_blocked) setManualBlock(true);
    else setManualBlock(false);

    // 1. Check Active Shift
    const { data: currentEntry } = await supabase
        .from('time_entries')
        .select('*')
        .eq('user_id', targetUserId)
        .is('end_time', null)
        .maybeSingle(); // FIX: Prevents 406 if no rows found
    
    if (currentEntry) {
        setActiveShift(currentEntry);
        setSuccessLocation(currentEntry.location || 'Las Vegas');
    } else {
        setActiveShift(null);
    }

    // 2. Check Schedule (FIX: 406 Error)
    const { data: schedule } = await supabase
        .from('employee_schedules')
        .select('*')
        .eq('user_id', targetUserId)
        .gte('start_time', startOfDay)
        .lte('start_time', endOfDay)
        .maybeSingle(); // FIX: Changed from .single() to .maybeSingle()
    
    if (schedule) setTodaySchedule(schedule);
    else setTodaySchedule(null);

    setLoading(false);
  };

  const getScheduleStatus = () => {
      if (!manualBlock) return { allowed: true, reason: "" };
      if (!todaySchedule) return { allowed: false, reason: "Restricted Access: Blocked with no schedule." };
      
      const now = moment();
      const start = moment(todaySchedule.start_time);
      const earlyLimit = start.clone().subtract(15, 'minutes');
      
      if (!isManager && now.isBefore(earlyLimit)) return { allowed: false, reason: `Too early. Clock in starts at ${earlyLimit.format('h:mm A')}.` };
      
      return { allowed: true, reason: "" };
  };

  const getCurrentLocation = () => {
      if (!navigator.geolocation) { setGpsError(true); return; }
      navigator.geolocation.getCurrentPosition(
          (pos) => setLocationCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
          () => setGpsError(true),
          { enableHighAccuracy: true, timeout: 10000 }
      );
  };

  const uploadPhoto = async (base64Data: string, type: 'in' | 'out'): Promise<string | null> => {
      try {
        const res = await fetch(base64Data);
        const blob = await res.blob();
        const filename = `${targetUserId}/${moment().format('YYYY-MM-DD_HH-mm-ss')}_${type}.jpg`;
        const { error } = await supabase.storage.from('timeclock-photos').upload(filename, blob);
        if (error) throw error;
        const { data } = supabase.storage.from('timeclock-photos').getPublicUrl(filename);
        return data.publicUrl;
      } catch (e) {
        console.error("Upload failed", e);
        return null;
      }
  };

  // --- ACTIONS ---

  const handleClockIn = async () => {
    const { allowed, reason } = getScheduleStatus();
    if (!allowed && !isManager) { toast.error(reason); return; }

    setLoading(true);

    const imageBase64 = cameraRef.current?.capture();
    if (!imageBase64) {
        toast.error("Camera failed to capture.");
        setLoading(false);
        return;
    }

    setCapturedImageBase64(imageBase64);
    let photoUrl = await uploadPhoto(imageBase64, 'in');

    const now = new Date().toISOString();
    
    // Logic: Use scheduled role/loc if available, otherwise use Filter selection, fallback to Vegas
    const role = todaySchedule?.role || 'Staff'; 
    let loc = todaySchedule?.location;
    if (!loc) {
        // If no schedule, use the selected filter location (unless it's 'All')
        loc = locationFilter !== 'All' ? locationFilter : 'Las Vegas';
    }

    const { data, error } = await supabase.from('time_entries').insert([{
        user_id: targetUserId, 
        start_time: now,
        role: role,
        location: loc,
        status: 'active',
        clock_in_lat: locationCoords?.lat || null,
        clock_in_lon: locationCoords?.lon || null,
        clock_in_photo_url: photoUrl
    }]).select().single();

    if (error) { 
        toast.error(`Error: ${error.message}`); 
        setLoading(false); 
    } else { 
        setActiveShift(data); 
        setSuccessLocation(loc); 
        setSuccessAction('in'); 
        setLoading(false); 
    }
  };

  const handleClockOut = async () => {
    if (!activeShift) return;
    setLoading(true);

    const imageBase64 = cameraRef.current?.capture();
    if (!imageBase64) {
        toast.error("Camera capture failed.");
        setLoading(false);
        return;
    }

    setCapturedImageBase64(imageBase64);
    let photoUrl = await uploadPhoto(imageBase64, 'out');

    const { error } = await supabase.from('time_entries').update({ 
          end_time: new Date().toISOString(), status: 'closed',
          clock_out_lat: locationCoords?.lat || null, clock_out_lon: locationCoords?.lon || null, clock_out_photo_url: photoUrl
      }).eq('id', activeShift.id);

    if (error) { toast.error(error.message); setLoading(false); } 
    else { setActiveShift(null); setSuccessAction('out'); setLoading(false); }
  };

  useEffect(() => {
      if (!successAction) return;
      if (proxyMode && countdown === 0) {
          setSuccessAction(null);
          setCapturedImageBase64(null);
          setCountdown(3);
          return;
      }
      if (countdown === 0) {
          if (onClose) onClose();
          else {
              const map: Record<string, string> = { 'Las Vegas': 'vegas', 'Pismo': 'pismo', 'Michigan': 'michigan' };
              const slug = map[successLocation] || '';
              const target = successAction === 'in' && slug ? `/biz/${slug}` : '/biz/my-schedule';
              router.push(target);
          }
          return;
      }
      const timer = setTimeout(() => setCountdown(p => p - 1), 1000);
      return () => clearTimeout(timer);
  }, [successAction, countdown, router, successLocation, onClose, proxyMode]);


  // --- RENDER ---
  const wrapperClass = onClose ? "w-full flex justify-center items-center py-4" : "w-full flex justify-center items-center min-h-[50vh]";
  
  const renderCameraSection = () => (
    <div className="flex flex-col gap-3">
        <TimeclockCamera 
            ref={cameraRef}
            onReady={setCameraReady} 
            onError={(err) => toast.error(err)}
            facingMode={proxyMode ? 'environment' : 'user'} 
        />
        <div className={`text-center text-[10px] uppercase font-bold tracking-wider py-1 rounded ${gpsError ? 'bg-red-100 text-red-600' : locationCoords ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
            {gpsError ? <span className="flex items-center justify-center gap-1"><MapPinOff className="w-3 h-3" /> No GPS</span> 
            : locationCoords ? <span className="flex items-center justify-center gap-1"><MapPin className="w-3 h-3" /> Location Verified</span> 
            : <span className="flex items-center justify-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Locating...</span>}
        </div>
    </div>
  );

  const renderManagerControls = () => {
    if (!isManager) return null;
    return (
        <div className="mb-4 space-y-3 bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800 shadow-inner">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-full ${proxyMode ? 'bg-orange-500/10' : 'bg-blue-500/10'}`}>
                         {proxyMode ? <Users className="w-4 h-4 text-orange-500" /> : <User className="w-4 h-4 text-blue-500" />}
                    </div>
                    <div className="flex flex-col">
                        <Label htmlFor="proxy-mode" className="font-bold text-sm cursor-pointer">
                            {proxyMode ? 'Manager Proxy' : 'Self Punch'}
                        </Label>
                        <span className="text-[10px] text-muted-foreground">{proxyMode ? 'Rear Camera • Punching Staff' : 'Front Camera • Punching Self'}</span>
                    </div>
                </div>
                <Switch 
                    id="proxy-mode"
                    checked={proxyMode}
                    onCheckedChange={(checked) => {
                        setProxyMode(checked);
                        if (!checked) setTargetUserId(employeeId); 
                    }}
                />
            </div>
            
            {proxyMode && (
                <div className="animate-in fade-in slide-in-from-top-1 space-y-3 pt-2">
                    <div className="space-y-2">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1"><Filter className="w-3 h-3" /> Filter Location</span>
                        <div className="flex flex-wrap gap-2">
                            {['All', 'Las Vegas', 'Pismo', 'Michigan'].map(loc => {
                                const isSelected = locationFilter === loc;
                                return (
                                    <button 
                                        key={loc}
                                        onClick={() => setLocationFilter(loc)}
                                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all border ${
                                            isSelected 
                                            ? 'bg-orange-500 text-white border-orange-600 shadow-md ring-2 ring-orange-200 dark:ring-orange-900' 
                                            : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700 hover:text-zinc-200'
                                        }`}
                                    >
                                        {loc}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <Select value={targetUserId} onValueChange={setTargetUserId}>
                        <SelectTrigger className="w-full bg-white dark:bg-zinc-900 h-12 border-zinc-700">
                            <SelectValue placeholder="Select Staff Member..." />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                            {filteredStaff.length === 0 ? (
                                <div className="p-4 text-sm text-center flex flex-col items-center gap-2 text-muted-foreground">
                                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                                    <span>No staff found in <strong>{locationFilter}</strong></span>
                                </div>
                            ) : (
                                filteredStaff.map((staff) => (
                                    <SelectItem key={staff.id} value={staff.id}>
                                        <div className="flex items-center justify-between w-full gap-2 min-w-[200px]">
                                            <span className="font-medium">{staff.full_name}</span>
                                            {staff.is_active && (
                                                <Badge variant="secondary" className="text-[10px] h-5 bg-green-500 text-white border-none shadow-sm">
                                                    CLOCKED IN
                                                </Badge>
                                            )}
                                        </div>
                                    </SelectItem>
                                ))
                            )}
                        </SelectContent>
                    </Select>
                </div>
            )}
        </div>
    );
  };

  if (loading && !successAction) return <div className={wrapperClass}><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;

  if (successAction) {
      return (
        <div className={wrapperClass}>
        <Card className={`w-full max-w-md shadow-xl border-2 animate-in zoom-in-95 duration-300 ${successAction === 'in' ? 'bg-green-50 dark:bg-green-900/20 border-green-500' : 'bg-blue-50 dark:bg-blue-900/20 border-blue-500'}`}>
            <CardHeader className="text-center pb-2">
                <CheckCircle2 className={`w-16 h-16 mx-auto mb-2 ${successAction === 'in' ? 'text-green-600' : 'text-blue-600'}`} />
                <CardTitle className="text-2xl">{successAction === 'in' ? 'Clock In Successful!' : 'Clock Out Successful!'}</CardTitle>
                <p className="text-muted-foreground">
                    {proxyMode ? `Recorded punch for staff member.` : (successAction === 'in' ? `Have a great shift at ${successLocation}.` : 'Shift Complete.')}
                </p>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
                {capturedImageBase64 && (
                    <div className="relative w-48 h-48 rounded-lg overflow-hidden border-4 border-white shadow-md rotate-2">
                        <img src={capturedImageBase64} alt="Verification" className="w-full h-full object-cover" />
                    </div>
                )}
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground bg-background/50 px-3 py-1 rounded-full">
                    {proxyMode ? (
                        <Button variant="ghost" size="sm" onClick={() => { setSuccessAction(null); setCapturedImageBase64(null); setCountdown(3); }}>Punch Another</Button>
                    ) : (
                        <><Loader2 className="w-4 h-4 animate-spin" /> {onClose ? 'Closing' : 'Redirecting'} in {countdown}s</>
                    )}
                </div>
            </CardContent>
        </Card>
        </div>
      );
  }

  const scheduleStatus = getScheduleStatus();
  if (!activeShift && !scheduleStatus.allowed && !isManager) {
      return (
        <div className={wrapperClass}>
        <Card className="w-full max-w-md border-red-200 bg-red-50 dark:bg-red-950/20 shadow-lg">
            <CardHeader className="text-center"><Ban className="w-12 h-12 mx-auto text-red-500 mb-2" /><CardTitle className="text-red-700 dark:text-red-400">Cannot Clock In</CardTitle></CardHeader>
            <CardContent className="text-center pb-6">
                <p className="font-semibold text-lg text-red-900 dark:text-red-200 mb-2">{scheduleStatus.reason}</p>
                {isManager && <Button variant="outline" onClick={() => setManualBlock(false)}>Override as Manager</Button>}
            </CardContent>
        </Card>
        </div>
      );
  }

  if (activeShift?.status === 'active') {
      return (
        <div className={wrapperClass}>
        <Card className="w-full max-w-md border-green-500 shadow-xl bg-green-50/50 dark:bg-green-900/10">
            <CardHeader className="text-center pb-2">
                <div className="flex justify-center items-center gap-2 mb-2"><Badge variant="outline" className="bg-green-100 text-green-700 border-green-200 px-3 py-1 font-bold uppercase tracking-wider">Current Shift</Badge></div>
                <h1 className="text-4xl font-black tracking-tight text-green-900 dark:text-green-100">{moment(activeShift.start_time).format('h:mm A')}</h1>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{activeShift.role} • {activeShift.location}</p>
                {proxyMode && <div className="mt-2 text-sm font-bold text-orange-600 bg-orange-100 px-2 py-1 rounded inline-block">Managing: {filteredStaff.find(s => s.id === targetUserId)?.full_name || 'Staff Member'}</div>}
            </CardHeader>
            <CardContent className="flex flex-col gap-4 pt-2">
                {renderManagerControls()}
                {renderCameraSection()}
                <div className="grid grid-cols-2 gap-3">
                    <Button variant="secondary" className="h-14 font-medium" disabled={loading}><Coffee className="w-4 h-4 mr-2" /> Start Break</Button>
                    <Button variant="destructive" className="h-14 font-bold shadow-md" onClick={handleClockOut} disabled={loading || !cameraReady}>
                        {loading ? <Loader2 className="animate-spin mr-2" /> : <><LogOut className="w-4 h-4 mr-2" /> CLOCK OUT</>}
                    </Button>
                </div>
            </CardContent>
        </Card>
        </div>
      );
  }

  return (
    <div className={wrapperClass}>
    <Card className="w-full max-w-md shadow-xl border-t-4 border-t-blue-500">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          Time Clock 
          <Badge className="bg-blue-100 text-blue-800">
            {todaySchedule ? moment(todaySchedule.start_time).format('h:mm A') : (manualBlock ? 'Off Schedule' : 'Open Clock-In')}
          </Badge>
        </CardTitle>
        {proxyMode && targetUserId !== employeeId && (
            <p className="text-xs text-center font-bold text-orange-600 pt-1">Targeting: {filteredStaff.find(s => s.id === targetUserId)?.full_name}</p>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {renderManagerControls()}
        {todaySchedule && (
           <div className="p-3 rounded-md bg-slate-100 dark:bg-slate-800 flex gap-3 items-center border border-slate-200 dark:border-slate-700">
             <div className="bg-white p-2 rounded-full shadow-sm"><Clock className="w-5 h-5 text-blue-500" /></div>
             <div><p className="font-bold text-sm text-slate-900 dark:text-white">{todaySchedule.role} • {todaySchedule.location || 'Las Vegas'}</p><p className="text-xs text-muted-foreground">Shift: {moment(todaySchedule.start_time).format('h:mm A')} - {moment(todaySchedule.end_time).format('h:mm A')}</p></div>
           </div>
        )}
        {renderCameraSection()}
        <Button className="w-full h-20 text-xl font-bold bg-blue-600 hover:bg-blue-700 shadow-lg transition-all active:scale-[0.98]" onClick={handleClockIn} disabled={loading || !cameraReady}>
          {loading ? <Loader2 className="animate-spin mr-2" /> : "CLOCK IN"}
        </Button>
      </CardContent>
    </Card>
    </div>
  );
}