'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Clock, Coffee, Ban, MapPinOff, RefreshCw, CheckCircle2, LogOut, Camera, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import moment from 'moment';
import { useRouter } from 'next/navigation';

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
  clock_in_photo_url?: string;
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
  const router = useRouter();
  
  // State
  const [loading, setLoading] = useState(true);
  const [activeShift, setActiveShift] = useState<TimeEntry | null>(null);
  const [todaySchedule, setTodaySchedule] = useState<Schedule | null>(null);
  const [manualBlock, setManualBlock] = useState(false);
  
  // Camera & GPS State
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(false); 
  const [locationCoords, setLocationCoords] = useState<{lat: number, lon: number} | null>(null);
  const [gpsError, setGpsError] = useState(false); 

  // Post-Clock-In Flow State
  const [successAction, setSuccessAction] = useState<'in' | 'out' | null>(null);
  const [countdown, setCountdown] = useState(5);
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(null);
  const [successLocation, setSuccessLocation] = useState<string>(''); 

  // --- 1. INITIAL DATA FETCH & CAMERA INIT ---
  useEffect(() => {
    let isMounted = true;

    fetchStatus();
    getCurrentLocation();
    
    const startCamera = async () => {
        // Clean up old stream if it exists
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
        }
        
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
             if(isMounted) setCameraError(true);
             return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } 
            });
            
            if (!isMounted) {
                stream.getTracks().forEach(t => t.stop());
                return;
            }

            streamRef.current = stream;
            
            // Attach to video element immediately
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                // Attempt to play
                videoRef.current.play().catch(e => console.warn("Autoplay blocked:", e));
            }
            
            setCameraActive(true);
            setCameraError(false);

        } catch (err) {
            console.error("Camera Init Error:", err);
            if(isMounted) setCameraError(true);
        }
    };

    startCamera();

    return () => {
        isMounted = false;
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
    };
  }, [employeeId]);

  // --- 2. RE-ATTACH STREAM ON RENDER ---
  useEffect(() => {
      if (videoRef.current && streamRef.current && !videoRef.current.srcObject) {
          videoRef.current.srcObject = streamRef.current;
          videoRef.current.play().catch(e => console.warn("Re-attach play error:", e));
      }
  });

  // --- 3. REDIRECT LOGIC ---
  useEffect(() => {
      if (!successAction) return;

      if (countdown === 0) {
          const locationSlug = getLocationSlug(successLocation);
          let target = '/biz/users/admin/dashboard'; // Fallback
          
          if (successAction === 'in' && locationSlug) {
            target = `/biz/${locationSlug}`;
          } else if (successAction === 'out') {
            target = '/biz/my-schedule'; // Redirect to schedule after clock out
          }

          router.push(target);
          return;
      }

      const timer = setTimeout(() => {
          setCountdown((prev) => prev - 1);
      }, 1000);

      return () => clearTimeout(timer);
  }, [successAction, countdown, router, successLocation]);


  // --- HELPER FUNCTIONS ---

  const handleRetryCamera = () => {
      window.location.reload(); 
  };

  const getLocationSlug = (locationName?: string) => {
      if (!locationName) return '';
      const map: Record<string, string> = {
          'Las Vegas': 'vegas',
          'Pismo': 'pismo',
          'Michigan': 'michigan'
      };
      return map[locationName] || '';
  };

  const fetchStatus = async () => {
    setLoading(true);
    const startOfDay = moment().startOf('day').toISOString();
    const endOfDay = moment().endOf('day').toISOString();

    const { data: userData } = await supabase.from('users').select('timeclock_blocked').eq('id', employeeId).single();
    if (userData?.timeclock_blocked) setManualBlock(true);

    const { data: currentEntry } = await supabase.from('time_entries').select('*').eq('user_id', employeeId).is('end_time', null).single();
    if (currentEntry) {
        setActiveShift(currentEntry);
        setSuccessLocation(currentEntry.location || 'Las Vegas');
    }

    const { data: schedule } = await supabase.from('employee_schedules').select('*').eq('user_id', employeeId).gte('start_time', startOfDay).lte('start_time', endOfDay).single();
    if (schedule) setTodaySchedule(schedule);

    setLoading(false);
  };

  const getScheduleStatus = () => {
      if (manualBlock) return { allowed: false, reason: "Account blocked by manager." };
      if (!todaySchedule) return { allowed: false, reason: "You are not scheduled for today." };
      
      const now = moment();
      const start = moment(todaySchedule.start_time);
      const earlyLimit = start.clone().subtract(15, 'minutes');
      
      if (now.isBefore(earlyLimit)) {
          const diff = earlyLimit.diff(now, 'minutes');
          return { allowed: false, reason: `Too early. You can clock in starting at ${earlyLimit.format('h:mm A')} (in ${diff} mins).` };
      }
      return { allowed: true, reason: "" };
  };

  const getCurrentLocation = () => {
      setGpsError(false);
      if (!navigator.geolocation) { setGpsError(true); return; }
      navigator.geolocation.getCurrentPosition(
          (pos) => { setLocationCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude }); setGpsError(false); },
          (err) => { console.warn(err); setGpsError(true); },
          { enableHighAccuracy: true, timeout: 10000 }
      );
  };

  const capturePhoto = async (): Promise<Blob | null> => {
      if (!videoRef.current || !canvasRef.current) return null;
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return null;
      ctx.drawImage(videoRef.current, 0, 0, 320, 240);
      return new Promise((resolve) => canvasRef.current?.toBlob(b => resolve(b), 'image/jpeg', 0.7));
  };

  const uploadPhoto = async (blob: Blob, type: 'in' | 'out'): Promise<string | null> => {
      const filename = `${employeeId}/${moment().format('YYYY-MM-DD_HH-mm-ss')}_${type}.jpg`;
      const { error } = await supabase.storage.from('timeclock-photos').upload(filename, blob);
      if (error) { console.error("Upload error", error); return null; }
      const { data } = supabase.storage.from('timeclock-photos').getPublicUrl(filename);
      return data.publicUrl;
  };

  // --- ACTIONS ---

  const handleClockIn = async () => {
    const { allowed, reason } = getScheduleStatus();
    if (!allowed) { toast.error(reason); return; }

    setLoading(true);
    let photoUrl = null;
    try {
        const photoBlob = await capturePhoto();
        if (photoBlob) photoUrl = await uploadPhoto(photoBlob, 'in');
    } catch (e) { console.error("Photo failed", e); }

    const now = new Date().toISOString();
    const role = todaySchedule!.role; 
    const loc = todaySchedule!.location || 'Las Vegas'; 

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
        toast.error(`Error: ${error.message}`);
        setLoading(false);
    } else {
      setActiveShift(data);
      setSuccessLocation(loc);
      setCapturedPhotoUrl(photoUrl);
      setSuccessAction('in');
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    if (!activeShift) return;
    setLoading(true);

    let photoUrl = null;
    try {
        const photoBlob = await capturePhoto();
        if (photoBlob) photoUrl = await uploadPhoto(photoBlob, 'out');
    } catch (e) { console.warn("Photo error", e); }

    const { error } = await supabase.from('time_entries').update({ 
          end_time: new Date().toISOString(), status: 'closed',
          clock_out_lat: locationCoords?.lat || null, clock_out_lon: locationCoords?.lon || null,
          clock_out_photo_url: photoUrl
      }).eq('id', activeShift.id);

    if (error) {
        toast.error(error.message);
        setLoading(false);
    } else { 
        setActiveShift(null); 
        setCapturedPhotoUrl(photoUrl);
        setSuccessAction('out');
        setLoading(false);
    }
  };

  const handleStartBreak = async () => {
      if(!activeShift) return; setLoading(true);
      await supabase.from('time_entries').update({ status: 'break', break_start: new Date().toISOString() }).eq('id', activeShift.id);
      setActiveShift({ ...activeShift, status: 'break', break_start: new Date().toISOString() }); setLoading(false);
  };

  const handleEndBreak = async () => {
      if(!activeShift || !activeShift.break_start) return; setLoading(true);
      const start = new Date(activeShift.break_start);
      const mins = Math.round((new Date().getTime() - start.getTime())/60000);
      const total = (activeShift.total_break_minutes || 0) + mins;
      await supabase.from('time_entries').update({ status: 'active', break_start: null, total_break_minutes: total }).eq('id', activeShift.id);
      setActiveShift({ ...activeShift, status: 'active', break_start: null, total_break_minutes: total }); setLoading(false);
  };

  const wrapperClass = "w-full flex justify-center items-center min-h-[50vh]";
  
  // --- CAMERA PREVIEW JSX ---
  const cameraPreviewContent = (
    <div className="relative w-full h-56 bg-slate-900 rounded-lg overflow-hidden group border border-slate-700 shadow-inner">
        <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className={`w-full h-full object-cover transform scale-x-[-1] transition-opacity duration-700 ${cameraActive ? 'opacity-100' : 'opacity-0'}`} 
        />
        
        {(!cameraActive) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-slate-900 z-10">
                {cameraError ? (
                    <div className="flex flex-col items-center animate-in fade-in">
                        <Ban className="w-8 h-8 text-red-500 mb-2" />
                        <p className="text-xs text-red-400 mb-3">Camera Failed</p>
                        <Button size="sm" variant="secondary" onClick={handleRetryCamera}>
                            <RefreshCw className="w-3 h-3 mr-1" /> Retry
                        </Button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center">
                        <Camera className="w-8 h-8 animate-pulse mb-2 text-blue-400" />
                        <p className="text-xs">Initializing Camera...</p>
                    </div>
                )}
            </div>
        )}
        <canvas ref={canvasRef} width="320" height="240" className="hidden" />
        
        <div className={`absolute top-2 left-2 text-[10px] px-2 py-1 rounded-full flex items-center shadow-md z-20 ${
            gpsError ? 'bg-red-500 text-white' : 
            locationCoords ? 'bg-green-600 text-white' : 'bg-yellow-500 text-white animate-pulse'
        }`}>
            {gpsError ? <><MapPinOff className="w-3 h-3 mr-1" /> No GPS</> : 
             locationCoords ? <><MapPin className="w-3 h-3 mr-1" /> GPS Ready</> : 
             <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Locating...</>}
        </div>
    </div>
  );

  // --- RENDER STATES ---

  if (loading && !successAction) return <div className={wrapperClass}><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;

  if (successAction) {
      return (
        <div className={wrapperClass}>
        <Card className={`w-full max-w-md shadow-xl border-2 animate-in zoom-in-95 duration-300 ${successAction === 'in' ? 'bg-green-50 dark:bg-green-900/20 border-green-500' : 'bg-blue-50 dark:bg-blue-900/20 border-blue-500'}`}>
            <CardHeader className="text-center pb-2">
                <CheckCircle2 className={`w-16 h-16 mx-auto mb-2 ${successAction === 'in' ? 'text-green-600' : 'text-blue-600'}`} />
                <CardTitle className="text-2xl">{successAction === 'in' ? 'Clock In Successful!' : 'Clock Out Successful!'}</CardTitle>
                <p className="text-muted-foreground">
                    {successAction === 'in' 
                        ? `Have a great shift at ${successLocation}.` 
                        : 'Shift Complete. See you next time!'}
                </p>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
                {capturedPhotoUrl && (
                    <div className="relative w-48 h-48 rounded-lg overflow-hidden border-4 border-white shadow-md rotate-2">
                        <img src={capturedPhotoUrl} alt="Verification" className="w-full h-full object-cover" />
                    </div>
                )}
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground bg-background/50 px-3 py-1 rounded-full">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {successAction === 'out' ? 'Opening Schedule...' : 'Redirecting...'} in {countdown}s
                </div>
            </CardContent>
        </Card>
        </div>
      );
  }

  const scheduleStatus = getScheduleStatus();
  if (!activeShift && !scheduleStatus.allowed) {
      return (
        <div className={wrapperClass}>
        <Card className="w-full max-w-md border-red-200 bg-red-50 dark:bg-red-950/20 shadow-lg">
            <CardHeader className="text-center"><Ban className="w-12 h-12 mx-auto text-red-500 mb-2" /><CardTitle className="text-red-700 dark:text-red-400">Cannot Clock In</CardTitle></CardHeader>
            <CardContent className="text-center pb-6">
                <p className="font-semibold text-lg text-red-900 dark:text-red-200 mb-2">{scheduleStatus.reason}</p>
                {todaySchedule ? <div className="text-sm text-red-700 mt-4 bg-red-100 p-2 rounded">Scheduled Start: <span className="font-bold">{moment(todaySchedule.start_time).format('h:mm A')}</span></div> : <div className="text-xs text-muted-foreground mt-4">Please see a manager if you are working today.</div>}
            </CardContent>
        </Card>
        </div>
      );
  }

  if (activeShift && activeShift.status === 'active') {
      return (
        <div className={wrapperClass}>
        <Card className="w-full max-w-md border-green-500 shadow-xl bg-green-50/50 dark:bg-green-900/10">
            <CardHeader className="text-center pb-2">
                <div className="flex justify-center items-center gap-2 mb-2">
                    <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200 px-3 py-1 font-bold uppercase tracking-wider">Current Shift</Badge>
                </div>
                <h1 className="text-4xl font-black tracking-tight text-green-900 dark:text-green-100">{moment(activeShift.start_time).format('h:mm A')}</h1>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{activeShift.role} • {activeShift.location}</p>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 pt-2">
                {cameraPreviewContent}
                <div className="grid grid-cols-2 gap-3">
                    <Button variant="secondary" className="h-14 font-medium" onClick={handleStartBreak} disabled={loading}>
                        <Coffee className="w-4 h-4 mr-2" /> Start Break
                    </Button>
                    <Button variant="destructive" className="h-14 font-bold shadow-md" onClick={handleClockOut} disabled={loading || (!cameraActive && !cameraError)}>
                        {loading ? <Loader2 className="animate-spin mr-2" /> : <><LogOut className="w-4 h-4 mr-2" /> CLOCK OUT</>}
                    </Button>
                </div>
            </CardContent>
        </Card>
        </div>
      );
  }
  
  if (activeShift && activeShift.status === 'break') {
      return (
        <div className={wrapperClass}>
        <Card className="w-full max-w-md border-orange-400 bg-orange-50 dark:bg-orange-950/20 shadow-lg">
            <CardHeader className="text-center"><Coffee className="w-12 h-12 mx-auto text-orange-500 mb-2" /><CardTitle>On Break</CardTitle><p className="text-sm">Since {moment(activeShift.break_start).format('h:mm A')}</p></CardHeader>
            <CardContent><Button className="w-full h-16 text-xl font-bold bg-orange-600 hover:bg-orange-700" onClick={handleEndBreak} disabled={loading}>END BREAK</Button></CardContent>
        </Card>
        </div>
      );
  }

  return (
    <div className={wrapperClass}>
    <Card className="w-full max-w-md shadow-xl border-t-4 border-t-blue-500">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          Time Clock <Badge className="bg-blue-100 text-blue-800">{todaySchedule ? moment(todaySchedule.start_time).format('h:mm A') : 'Off Schedule'}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {todaySchedule && (
           <div className="p-3 rounded-md bg-slate-100 dark:bg-slate-800 flex gap-3 items-center border border-slate-200 dark:border-slate-700">
             <div className="bg-white p-2 rounded-full shadow-sm"><Clock className="w-5 h-5 text-blue-500" /></div>
             <div>
               <p className="font-bold text-sm text-slate-900 dark:text-white">
                  {todaySchedule.role} • {todaySchedule.location || 'Las Vegas'}
               </p>
               <p className="text-xs text-muted-foreground">
                  Shift: {moment(todaySchedule.start_time).format('h:mm A')} - {moment(todaySchedule.end_time).format('h:mm A')}
               </p>
             </div>
           </div>
        )}

        {cameraPreviewContent}

        <Button 
          className="w-full h-20 text-xl font-bold bg-blue-600 hover:bg-blue-700 shadow-lg transition-all active:scale-[0.98]"
          onClick={handleClockIn}
          disabled={loading || (!cameraActive && !cameraError)}
        >
          {loading ? <Loader2 className="animate-spin mr-2" /> : "TAKE PHOTO & CLOCK IN"}
        </Button>
      </CardContent>
    </Card>
    </div>
  );
}