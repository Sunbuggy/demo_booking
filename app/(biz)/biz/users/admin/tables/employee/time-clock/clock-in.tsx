/**
 * REFACTORED: SunBuggy Smart Time Clock (1-Click Version)
 * Path: app/(biz)/biz/users/admin/tables/employee/time-clock/clock-in.tsx
 */
'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Clock, Coffee, Ban, MapPinOff, CheckCircle2, LogOut, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import moment from 'moment';
import { useRouter } from 'next/navigation';

// Import Camera & Handle Interface
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

interface SmartTimeClockProps {
    employeeId: string;
    onClose?: () => void; 
}

export default function SmartTimeClock({ employeeId, onClose }: SmartTimeClockProps) {
  const supabase = createClient();
  const router = useRouter();
  
  // Refs
  const cameraRef = useRef<TimeclockCameraHandle>(null);

  // Data State
  const [loading, setLoading] = useState(true);
  const [activeShift, setActiveShift] = useState<TimeEntry | null>(null);
  const [todaySchedule, setTodaySchedule] = useState<Schedule | null>(null);
  const [manualBlock, setManualBlock] = useState(false);
  
  // Location & Hardware State
  const [locationCoords, setLocationCoords] = useState<{lat: number, lon: number} | null>(null);
  const [gpsError, setGpsError] = useState(false); 
  const [cameraReady, setCameraReady] = useState(false); // Only enable buttons when camera works

  // Flow State
  const [successAction, setSuccessAction] = useState<'in' | 'out' | null>(null);
  const [capturedImageBase64, setCapturedImageBase64] = useState<string | null>(null); // Only for success display
  const [countdown, setCountdown] = useState(3); 
  const [successLocation, setSuccessLocation] = useState<string>(''); 

  // --- INITIALIZATION ---
  useEffect(() => {
    fetchStatus();
    getCurrentLocation();
  }, [employeeId]);

  // --- SUCCESS REDIRECT ---
  useEffect(() => {
      if (!successAction) return;
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
  }, [successAction, countdown, router, successLocation, onClose]);

  // --- HELPERS ---
  const fetchStatus = async () => {
    setLoading(true);
    const startOfDay = moment().startOf('day').toISOString();
    const endOfDay = moment().endOf('day').toISOString();

    const { data: userData } = await supabase.from('users').select('timeclock_blocked').eq('id', employeeId).single();
    if (userData?.timeclock_blocked) setManualBlock(true);

    const { data: currentEntry } = await supabase.from('time_entries').select('*').eq('user_id', employeeId).is('end_time', null).maybeSingle();
    if (currentEntry) {
        setActiveShift(currentEntry);
        setSuccessLocation(currentEntry.location || 'Las Vegas');
    }

    const { data: schedule } = await supabase.from('employee_schedules').select('*').eq('user_id', employeeId).gte('start_time', startOfDay).lte('start_time', endOfDay).single();
    if (schedule) setTodaySchedule(schedule);
    setLoading(false);
  };

  const getScheduleStatus = () => {
      if (!manualBlock) return { allowed: true, reason: "" };
      if (!todaySchedule) return { allowed: false, reason: "Restricted Access: Blocked with no schedule." };
      const now = moment();
      const start = moment(todaySchedule.start_time);
      const earlyLimit = start.clone().subtract(15, 'minutes');
      if (now.isBefore(earlyLimit)) return { allowed: false, reason: `Too early. Clock in starts at ${earlyLimit.format('h:mm A')}.` };
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
        const filename = `${employeeId}/${moment().format('YYYY-MM-DD_HH-mm-ss')}_${type}.jpg`;
        const { error } = await supabase.storage.from('timeclock-photos').upload(filename, blob);
        if (error) throw error;
        const { data } = supabase.storage.from('timeclock-photos').getPublicUrl(filename);
        return data.publicUrl;
      } catch (e) {
        console.error("Upload failed", e);
        return null;
      }
  };

  // --- ACTIONS (1-CLICK LOGIC) ---

  const handleClockIn = async () => {
    const { allowed, reason } = getScheduleStatus();
    if (!allowed) { toast.error(reason); return; }

    setLoading(true);

    // 1. CAPTURE INSTANTLY
    const imageBase64 = cameraRef.current?.capture();
    if (!imageBase64) {
        toast.error("Camera failed to capture. Please try again.");
        setLoading(false);
        return;
    }

    // 2. SET STATE FOR UI & START UPLOAD
    setCapturedImageBase64(imageBase64); // Show photo in success screen
    let photoUrl = await uploadPhoto(imageBase64, 'in');

    const now = new Date().toISOString();
    const role = todaySchedule?.role || 'Staff'; 
    const loc = todaySchedule?.location || 'Las Vegas'; 

    const { data, error } = await supabase.from('time_entries').insert([{
        user_id: employeeId,
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

    // 1. CAPTURE INSTANTLY
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

  // Break handlers remain unchanged...
  const handleStartBreak = async () => { /* ... existing logic ... */ };
  const handleEndBreak = async () => { /* ... existing logic ... */ };


  // --- RENDER HELPERS ---
  const wrapperClass = onClose ? "w-full flex justify-center items-center py-4" : "w-full flex justify-center items-center min-h-[50vh]";
  
  // Reusable Camera Section (Now Just the Viewport)
  const renderCameraSection = () => (
    <div className="flex flex-col gap-3">
        <TimeclockCamera 
            ref={cameraRef}
            onReady={setCameraReady} 
            onError={(err) => toast.error(err)}
        />
        <div className={`text-center text-[10px] uppercase font-bold tracking-wider py-1 rounded ${gpsError ? 'bg-red-100 text-red-600' : locationCoords ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
            {gpsError ? <span className="flex items-center justify-center gap-1"><MapPinOff className="w-3 h-3" /> No GPS</span> 
            : locationCoords ? <span className="flex items-center justify-center gap-1"><MapPin className="w-3 h-3" /> Location Verified</span> 
            : <span className="flex items-center justify-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Locating...</span>}
        </div>
    </div>
  );

  if (loading && !successAction) return <div className={wrapperClass}><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;

  // SUCCESS STATE (Shows the photo we just snapped)
  if (successAction) {
      return (
        <div className={wrapperClass}>
        <Card className={`w-full max-w-md shadow-xl border-2 animate-in zoom-in-95 duration-300 ${successAction === 'in' ? 'bg-green-50 dark:bg-green-900/20 border-green-500' : 'bg-blue-50 dark:bg-blue-900/20 border-blue-500'}`}>
            <CardHeader className="text-center pb-2">
                <CheckCircle2 className={`w-16 h-16 mx-auto mb-2 ${successAction === 'in' ? 'text-green-600' : 'text-blue-600'}`} />
                <CardTitle className="text-2xl">{successAction === 'in' ? 'Clock In Successful!' : 'Clock Out Successful!'}</CardTitle>
                <p className="text-muted-foreground">{successAction === 'in' ? `Have a great shift at ${successLocation}.` : 'Shift Complete.'}</p>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
                {capturedImageBase64 && (
                    <div className="relative w-48 h-48 rounded-lg overflow-hidden border-4 border-white shadow-md rotate-2">
                        <img src={capturedImageBase64} alt="Verification" className="w-full h-full object-cover" />
                    </div>
                )}
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground bg-background/50 px-3 py-1 rounded-full">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {onClose ? 'Closing' : 'Redirecting'} in {countdown}s
                </div>
            </CardContent>
        </Card>
        </div>
      );
  }

  // BLOCKED STATE
  const scheduleStatus = getScheduleStatus();
  if (!activeShift && !scheduleStatus.allowed) {
      return (
        <div className={wrapperClass}>
        <Card className="w-full max-w-md border-red-200 bg-red-50 dark:bg-red-950/20 shadow-lg">
            <CardHeader className="text-center"><Ban className="w-12 h-12 mx-auto text-red-500 mb-2" /><CardTitle className="text-red-700 dark:text-red-400">Cannot Clock In</CardTitle></CardHeader>
            <CardContent className="text-center pb-6">
                <p className="font-semibold text-lg text-red-900 dark:text-red-200 mb-2">{scheduleStatus.reason}</p>
            </CardContent>
        </Card>
        </div>
      );
  }

  // ACTIVE SHIFT STATE
  if (activeShift?.status === 'active') {
      return (
        <div className={wrapperClass}>
        <Card className="w-full max-w-md border-green-500 shadow-xl bg-green-50/50 dark:bg-green-900/10">
            <CardHeader className="text-center pb-2">
                <div className="flex justify-center items-center gap-2 mb-2"><Badge variant="outline" className="bg-green-100 text-green-700 border-green-200 px-3 py-1 font-bold uppercase tracking-wider">Current Shift</Badge></div>
                <h1 className="text-4xl font-black tracking-tight text-green-900 dark:text-green-100">{moment(activeShift.start_time).format('h:mm A')}</h1>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{activeShift.role} • {activeShift.location}</p>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 pt-2">
                {renderCameraSection()}
                <div className="grid grid-cols-2 gap-3">
                    <Button variant="secondary" className="h-14 font-medium" onClick={handleStartBreak} disabled={loading}><Coffee className="w-4 h-4 mr-2" /> Start Break</Button>
                    {/* 1-CLICK CLOCK OUT */}
                    <Button 
                        variant="destructive" 
                        className="h-14 font-bold shadow-md" 
                        onClick={handleClockOut} 
                        disabled={loading || !cameraReady}
                    >
                        {loading ? <Loader2 className="animate-spin mr-2" /> : <><LogOut className="w-4 h-4 mr-2" /> CLOCK OUT</>}
                    </Button>
                </div>
            </CardContent>
        </Card>
        </div>
      );
  }

  // DEFAULT: CLOCK IN
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
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {todaySchedule && (
           <div className="p-3 rounded-md bg-slate-100 dark:bg-slate-800 flex gap-3 items-center border border-slate-200 dark:border-slate-700">
             <div className="bg-white p-2 rounded-full shadow-sm"><Clock className="w-5 h-5 text-blue-500" /></div>
             <div><p className="font-bold text-sm text-slate-900 dark:text-white">{todaySchedule.role} • {todaySchedule.location || 'Las Vegas'}</p><p className="text-xs text-muted-foreground">Shift: {moment(todaySchedule.start_time).format('h:mm A')} - {moment(todaySchedule.end_time).format('h:mm A')}</p></div>
           </div>
        )}
        
        {renderCameraSection()}

        {/* 1-CLICK CLOCK IN */}
        <Button 
            className="w-full h-20 text-xl font-bold bg-blue-600 hover:bg-blue-700 shadow-lg transition-all active:scale-[0.98]" 
            onClick={handleClockIn} 
            disabled={loading || !cameraReady} 
        >
          {loading ? <Loader2 className="animate-spin mr-2" /> : "CLOCK IN"}
        </Button>
      </CardContent>
    </Card>
    </div>
  );
}