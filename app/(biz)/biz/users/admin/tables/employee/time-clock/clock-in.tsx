'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Clock, Coffee, LogOut, MapPin, Camera, Ban, MapPinOff } from 'lucide-react';
import { toast } from 'sonner';
import moment from 'moment';

// --- TYPES ---
interface TimeEntry {
  id: string;
  start_time: string;
  end_time: string | null;
  role: string;
  status: 'active' | 'break' | 'closed'; 
  break_start: string | null;
  total_break_minutes: number;
  location?: string;
}

interface Schedule {
  id: string;
  start_time: string;
  end_time: string;
  role: string;
  location: string;
}

export default function SmartTimeClock({ employeeId }: { employeeId: string }) {
  const supabase = createClient();
  
  // State
  const [loading, setLoading] = useState(true);
  const [activeShift, setActiveShift] = useState<TimeEntry | null>(null);
  const [todaySchedule, setTodaySchedule] = useState<Schedule | null>(null);
  const [manualBlock, setManualBlock] = useState(false); // Admin override block
  
  // Camera & GPS State
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [locationCoords, setLocationCoords] = useState<{lat: number, lon: number} | null>(null);
  const [gpsError, setGpsError] = useState(false); 

  // --- 1. INITIAL DATA FETCH ---
  useEffect(() => {
    fetchStatus();
    initCamera();
    getCurrentLocation();

    return () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
            tracks.forEach(track => track.stop());
        }
    };
  }, [employeeId]);

  const fetchStatus = async () => {
    setLoading(true);
    const startOfDay = moment().startOf('day').toISOString();
    const endOfDay = moment().endOf('day').toISOString();

    // 1. Check Manual Admin Block
    const { data: userData } = await supabase.from('users').select('timeclock_blocked').eq('id', employeeId).single();
    if (userData?.timeclock_blocked) {
        setManualBlock(true);
    }

    // 2. Check Active Shift
    const { data: currentEntry } = await supabase
      .from('time_entries')
      .select('*')
      .eq('user_id', employeeId)
      .is('end_time', null)
      .single();

    if (currentEntry) setActiveShift(currentEntry);

    // 3. Check Schedule
    const { data: schedule } = await supabase
      .from('employee_schedules')
      .select('*')
      .eq('user_id', employeeId)
      .gte('start_time', startOfDay)
      .lte('start_time', endOfDay)
      .single();

    if (schedule) setTodaySchedule(schedule);

    setLoading(false);
  };

  // --- HELPER: CHECK SCHEDULE RULES ---
  const getScheduleStatus = () => {
      // 1. If manually blocked by admin (the switch in profile)
      if (manualBlock) return { allowed: false, reason: "Account blocked by manager." };
      
      // 2. If no schedule found for today
      if (!todaySchedule) return { allowed: false, reason: "You are not scheduled for today." };

      // 3. Time Window Check (15 mins early rule)
      const now = moment();
      const start = moment(todaySchedule.start_time);
      const earlyLimit = start.clone().subtract(15, 'minutes');
      
      // Too early?
      if (now.isBefore(earlyLimit)) {
          const diff = earlyLimit.diff(now, 'minutes');
          return { allowed: false, reason: `Too early. You can clock in starting at ${earlyLimit.format('h:mm A')} (in ${diff} mins).` };
      }

      // Late? -> Allowed. (We simply don't return false here)

      return { allowed: true, reason: "" };
  };

  // --- CAMERA & GPS HELPERS ---
  const initCamera = async () => {
      try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
          if (videoRef.current) {
              videoRef.current.srcObject = stream;
              setCameraActive(true);
          }
      } catch (err) {
          console.warn("Camera Error:", err);
      }
  };

  const getCurrentLocation = () => {
      setGpsError(false);
      if (!navigator.geolocation) { setGpsError(true); return; }
      navigator.geolocation.getCurrentPosition(
          (pos) => { setLocationCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }); setGpsError(false); },
          (err) => { console.warn(err); setGpsError(true); },
          { enableHighAccuracy: true, timeout: 5000 }
      );
  };

  const capturePhoto = async (): Promise<Blob | null> => {
      if (!videoRef.current || !canvasRef.current) return null;
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return null;
      ctx.drawImage(videoRef.current, 0, 0, 320, 240);
      return new Promise((resolve) => canvasRef.current?.toBlob(b => resolve(b), 'image/jpeg', 0.6));
  };

  const uploadPhoto = async (blob: Blob, type: 'in' | 'out'): Promise<string | null> => {
      const filename = `${employeeId}/${moment().format('YYYY-MM-DD_HH-mm-ss')}_${type}.jpg`;
      const { error } = await supabase.storage.from('timeclock-photos').upload(filename, blob);
      if (error) return null;
      const { data } = supabase.storage.from('timeclock-photos').getPublicUrl(filename);
      return data.publicUrl;
  };

  // --- CLOCK ACTIONS ---

  const handleClockIn = async () => {
    // FINAL CHECK before submitting
    const { allowed, reason } = getScheduleStatus();
    if (!allowed) {
        toast.error(reason);
        return;
    }

    setLoading(true);

    let photoUrl = null;
    try {
        const photoBlob = await capturePhoto();
        if (photoBlob) photoUrl = await uploadPhoto(photoBlob, 'in');
    } catch (e) { console.warn("Photo error", e); }

    const now = new Date().toISOString();
    
    // Use scheduled role/location
    const role = todaySchedule!.role; 
    const loc = todaySchedule!.location;

    const { data, error } = await supabase.from('time_entries').insert([
      {
        user_id: employeeId,
        start_time: now,
        role: role,
        location: loc,
        status: 'active',
        clock_in_lat: locationCoords?.lat || null,
        clock_in_lon: locationCoords?.lon || null,
        clock_in_photo_url: photoUrl
      }
    ]).select().single();

    if (error) {
        console.error(error);
        toast.error(`Error: ${error.message}`);
    } else {
      setActiveShift(data);
      toast.success(`Clocked in! Have a great shift.`);
    }
    setLoading(false);
  };

  const handleClockOut = async () => {
    if (!activeShift) return;
    if (!confirm("Clock Out now?")) return;
    setLoading(true);

    let photoUrl = null;
    try {
        const photoBlob = await capturePhoto();
        if (photoBlob) photoUrl = await uploadPhoto(photoBlob, 'out');
    } catch (e) { console.warn("Photo error", e); }

    const { error } = await supabase
      .from('time_entries')
      .update({ 
          end_time: new Date().toISOString(),
          status: 'closed',
          clock_out_lat: locationCoords?.lat || null,
          clock_out_lon: locationCoords?.lon || null,
          clock_out_photo_url: photoUrl
      })
      .eq('id', activeShift.id);

    if (error) toast.error(error.message);
    else {
      setActiveShift(null);
      toast.success("Clocked Out.");
    }
    setLoading(false);
  };

  const handleStartBreak = async () => {
      if(!activeShift) return;
      setLoading(true);
      await supabase.from('time_entries').update({ status: 'break', break_start: new Date().toISOString() }).eq('id', activeShift.id);
      setActiveShift({ ...activeShift, status: 'break', break_start: new Date().toISOString() });
      setLoading(false);
  };

  const handleEndBreak = async () => {
      if(!activeShift || !activeShift.break_start) return;
      setLoading(true);
      const start = new Date(activeShift.break_start);
      const mins = Math.round((new Date().getTime() - start.getTime())/60000);
      const total = (activeShift.total_break_minutes || 0) + mins;
      
      await supabase.from('time_entries').update({ status: 'active', break_start: null, total_break_minutes: total }).eq('id', activeShift.id);
      setActiveShift({ ...activeShift, status: 'active', break_start: null, total_break_minutes: total });
      setLoading(false);
  };

  // --- RENDER ---

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  // BLOCK SCREEN (Only if not already working)
  const scheduleStatus = getScheduleStatus();
  const showBlockScreen = !activeShift && !scheduleStatus.allowed;

  if (showBlockScreen) {
      return (
        <Card className="w-full max-w-md mx-auto border-red-200 bg-red-50 dark:bg-red-950/20 shadow-lg">
            <CardHeader className="text-center">
                <Ban className="w-12 h-12 mx-auto text-red-500 mb-2" />
                <CardTitle className="text-red-700 dark:text-red-400">Cannot Clock In</CardTitle>
            </CardHeader>
            <CardContent className="text-center pb-6">
                <p className="font-semibold text-lg text-red-900 dark:text-red-200 mb-2">
                    {scheduleStatus.reason}
                </p>
                {todaySchedule && (
                     <div className="text-sm text-red-700 mt-4 bg-red-100 p-2 rounded">
                        Scheduled Start: <span className="font-bold">{moment(todaySchedule.start_time).format('h:mm A')}</span>
                     </div>
                )}
                {!todaySchedule && (
                    <div className="text-xs text-muted-foreground mt-4">
                        Please see a manager if you are working today.
                    </div>
                )}
            </CardContent>
        </Card>
      );
  }

  // BREAK MODE
  if (activeShift && activeShift.status === 'break') {
      return (
        <Card className="w-full max-w-md mx-auto border-orange-400 bg-orange-50 dark:bg-orange-950/20 shadow-lg">
            <CardHeader className="text-center">
                <Coffee className="w-12 h-12 mx-auto text-orange-500 mb-2" />
                <CardTitle>On Break</CardTitle>
                <p className="text-sm">Since {moment(activeShift.break_start).format('h:mm A')}</p>
            </CardHeader>
            <CardContent>
                <Button className="w-full h-16 text-xl font-bold bg-orange-600 hover:bg-orange-700" onClick={handleEndBreak} disabled={loading}>
                    END BREAK
                </Button>
            </CardContent>
        </Card>
      );
  }

  // WORKING MODE
  if (activeShift && activeShift.status === 'active') {
      return (
        <Card className="w-full max-w-md mx-auto border-green-500 shadow-lg bg-green-50/50 dark:bg-green-900/10">
            <CardHeader className="text-center pb-2">
                <div className="bg-green-100 text-green-700 w-fit mx-auto px-4 py-1 rounded-full text-xs font-bold uppercase mb-3">Working</div>
                <h1 className="text-4xl font-bold">{moment(activeShift.start_time).format('h:mm A')}</h1>
                <p className="text-xs text-muted-foreground">{activeShift.role}</p>
            </CardHeader>
            <CardContent className="grid gap-4 pt-4">
                <div className="relative w-full h-40 bg-black rounded-lg overflow-hidden">
                    <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${cameraActive ? 'opacity-100' : 'opacity-0'}`} />
                    {!cameraActive && <div className="absolute inset-0 flex items-center justify-center text-white"><Camera className="w-8 h-8 animate-pulse" /></div>}
                    <canvas ref={canvasRef} width="320" height="240" className="hidden" />
                </div>
                <Button variant="secondary" className="w-full h-12" onClick={handleStartBreak} disabled={loading}>Start Break</Button>
                <Button variant="destructive" className="w-full h-16 text-xl font-bold" onClick={handleClockOut} disabled={loading}>CLOCK OUT</Button>
            </CardContent>
        </Card>
      );
  }

  // READY MODE (Only visible if Allowed)
  return (
    <Card className="w-full max-w-md mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          Time Clock
          <Badge className="bg-blue-100 text-blue-800">{moment(todaySchedule?.start_time).format('h:mm A')}</Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex flex-col gap-4">
        {todaySchedule && (
           <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 flex gap-3">
             <Clock className="text-blue-500" />
             <div>
               <p className="font-semibold text-sm">{todaySchedule.role} • {todaySchedule.location}</p>
               <p className="text-xs text-muted-foreground">{moment(todaySchedule.start_time).format('h:mm A')} - {moment(todaySchedule.end_time).format('h:mm A')}</p>
             </div>
           </div>
        )}

        <div className="relative w-full h-56 bg-slate-900 rounded-lg overflow-hidden group">
            <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${cameraActive ? 'opacity-100' : 'opacity-0'}`} />
            {!cameraActive && <div className="absolute inset-0 flex items-center justify-center text-slate-400"><Camera className="w-8 h-8 animate-pulse" /></div>}
            <canvas ref={canvasRef} width="320" height="240" className="hidden" />
            
            {gpsError ? (
                <div className="absolute top-2 left-2 text-[10px] px-2 py-1 rounded-full flex items-center bg-red-500/80 text-white"><MapPinOff className="w-3 h-3 mr-1" /> GPS Failed</div>
            ) : (
                <div className={`absolute top-2 left-2 text-[10px] px-2 py-1 rounded-full flex items-center transition-colors ${locationCoords ? 'bg-green-500/80 text-white' : 'bg-yellow-500/80 text-white animate-pulse'}`}><MapPin className="w-3 h-3 mr-1" /> {locationCoords ? 'GPS Ready' : 'Locating...'}</div>
            )}
        </div>

        <Button 
          className="w-full h-24 text-2xl font-bold bg-green-600 hover:bg-green-700 shadow-lg"
          onClick={handleClockIn}
          disabled={loading || !cameraActive}
        >
          {loading ? <Loader2 className="animate-spin mr-2" /> : "TAKE PHOTO & CLOCK IN"}
        </Button>
      </CardContent>
    </Card>
  );
}