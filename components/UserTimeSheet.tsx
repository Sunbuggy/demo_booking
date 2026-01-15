'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import moment from 'moment';
import { 
  Accordion, AccordionItem, AccordionTrigger, AccordionContent 
} from "@/components/ui/accordion";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription 
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, AlertCircle, History, MapPin, Pencil 
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// --- TYPES ---
interface TimeEntry {
  id: string;
  start_time: string;
  end_time: string | null;
  role: string;
  location: string;
  total_break_minutes: number;
  clock_in_photo_url?: string;
  clock_out_photo_url?: string;
  clock_in_lat?: number;
  clock_in_lon?: number;
}

interface TimeSheetRequest {
  id: string;
  start_time: string;
  end_time: string;
  reason: string | null;
  status: string;
  created_at: string;
}

// --- HELPER: FORMAT DURATION ---
const formatDuration = (start: string, end: string | null, breakMins: number) => {
    if (!end) return "Active";
    const s = moment(start);
    const e = moment(end);
    const diffMins = e.diff(s, 'minutes') - (breakMins || 0);
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}m`;
};

export default function UserTimeSheet({ userId }: { userId: string }) {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [requests, setRequests] = useState<TimeSheetRequest[]>([]);
  
  // -- DIALOG STATES --
  const [isCorrectionOpen, setIsCorrectionOpen] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isImageOpen, setIsImageOpen] = useState(false);
  
  // -- SELECTED DATA FOR DIALOGS --
  const [selectedLocation, setSelectedLocation] = useState<{name: string, lat?: number, lon?: number} | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // -- CORRECTION FORM --
  // We now capture the FULL shift range because the DB requires start_time AND end_time
  const [reqDate, setReqDate] = useState(moment().format('YYYY-MM-DD'));
  const [reqStartTime, setReqStartTime] = useState('09:00');
  const [reqEndTime, setReqEndTime] = useState('17:00');
  const [reqReason, setReqReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // --- 1. FETCH DATA ---
  const fetchData = async () => {
    setLoading(true);
    
    // Fetch Entries
    const { data: timeData } = await supabase
        .from('time_entries')
        .select('*')
        .eq('user_id', userId)
        .order('start_time', { ascending: false });
    
    if (timeData) setEntries(timeData);

    // Fetch Requests (UPDATED TABLE NAME)
    const { data: reqData } = await supabase
        .from('time_sheet_requests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (reqData) setRequests(reqData);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [userId]);

  // --- 2. SUBMIT CORRECTION ---
  const handleSubmitCorrection = async () => {
      setSubmitting(true);
      
      // Construct full ISO strings
      const startIso = moment(`${reqDate} ${reqStartTime}`).toISOString();
      const endIso = moment(`${reqDate} ${reqEndTime}`).toISOString();

      // Insert into the CORRECT table
      const { error } = await supabase.from('time_sheet_requests').insert([{
          user_id: userId,
          start_time: startIso,
          end_time: endIso,
          reason: reqReason,
          status: 'pending'
      }]);

      if (error) {
          console.error(error);
          toast.error("Failed to submit request");
      } else {
          toast.success("Correction requested successfully");
          setIsCorrectionOpen(false);
          setReqReason('');
          fetchData(); 
      }
      setSubmitting(false);
  };

  // --- 3. OPEN CORRECTION DIALOG (PRE-FILL) ---
  const handleRequestCorrection = (entry?: TimeEntry) => {
      if (entry) {
          // Pre-fill with the existing bad data so they can fix it
          setReqDate(moment(entry.start_time).format('YYYY-MM-DD'));
          setReqStartTime(moment(entry.start_time).format('HH:mm'));
          setReqEndTime(entry.end_time ? moment(entry.end_time).format('HH:mm') : '17:00');
          setReqReason(`Correction for existing entry`);
      } else {
          // Default to today 9-5
          setReqDate(moment().format('YYYY-MM-DD'));
          setReqStartTime('09:00');
          setReqEndTime('17:00');
          setReqReason('');
      }
      setIsCorrectionOpen(true);
  };

  // --- 4. GROUP BY WEEK LOGIC ---
  const weeks = useMemo(() => {
      const grouped: Record<string, { 
          weekNum: number, 
          year: number,
          start: string, 
          end: string, 
          entries: TimeEntry[], 
          totalMins: number,
          isLocked: boolean,
          isCurrent: boolean
      }> = {};
      
      const currentWeekNum = moment().isoWeek();
      const currentYear = moment().year();

      entries.forEach(entry => {
          if (!entry.start_time) return;
          const m = moment(entry.start_time);
          if (!m.isValid()) return;

          const weekNum = m.isoWeek();
          const year = m.year();
          const key = `${year}-${weekNum}`;
          
          if (!grouped[key]) {
              const weekStart = m.clone().startOf('isoWeek');
              const weekEnd = m.clone().endOf('isoWeek');
              
              const lockDeadline = weekEnd.clone().add(1, 'day').endOf('day');
              const isLocked = moment().isAfter(lockDeadline);
              const isCurrent = (weekNum === currentWeekNum && year === currentYear);

              grouped[key] = {
                  weekNum,
                  year,
                  start: weekStart.format('MMM D'),
                  end: weekEnd.format('MMM D'),
                  entries: [],
                  totalMins: 0,
                  isLocked,
                  isCurrent
              };
          }
          grouped[key].entries.push(entry);
          
          if (entry.end_time) {
              const diff = moment(entry.end_time).diff(moment(entry.start_time), 'minutes') - (entry.total_break_minutes || 0);
              grouped[key].totalMins += diff;
          }
      });

      return Object.entries(grouped).sort((a, b) => {
          if (b[1].year !== a[1].year) return b[1].year - a[1].year;
          return b[1].weekNum - a[1].weekNum;
      });
  }, [entries]);

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;

  const activeWeekKey = weeks.find(([_, w]) => w.isCurrent)?.[0] || weeks[0]?.[0];

  return (
    <div className="space-y-6">
        {/* HEADER ACTIONS */}
        <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-200 dark:border-slate-800">
            <div>
                <h3 className="text-lg font-bold flex items-center gap-2">
                    <History className="w-5 h-5 text-blue-500" /> 
                    Punch History
                </h3>
                <p className="text-sm text-muted-foreground">Review your shifts and hours.</p>
            </div>
            
            <Button 
                onClick={() => handleRequestCorrection()}
                variant="outline" 
                className="border-orange-200 hover:bg-orange-50 hover:text-orange-700 dark:border-orange-900 dark:hover:bg-orange-900/20"
            >
                <AlertCircle className="w-4 h-4 mr-2 text-orange-500" />
                Correction Request
            </Button>
        </div>

        {/* TIME SHEET ACCORDION */}
        <Accordion type="single" collapsible defaultValue={activeWeekKey} className="w-full space-y-4">
            {weeks.length === 0 && <div className="text-center py-8 text-muted-foreground italic">No time entries found.</div>}
            
            {weeks.map(([key, data]) => (
                <AccordionItem key={key} value={key} className={cn("border rounded-lg overflow-hidden bg-card", data.isCurrent && "border-blue-500/50 shadow-sm")}>
                    <AccordionTrigger className="px-4 hover:no-underline hover:bg-slate-50 dark:hover:bg-slate-900/50">
                        <div className="flex justify-between items-center w-full pr-4">
                            <div className="flex flex-col items-start">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-lg">Week {data.weekNum}</span>
                                    {data.isCurrent && <Badge className="bg-blue-600 text-[10px] h-5">CURRENT WEEK</Badge>}
                                    {data.isLocked && <Badge variant="outline" className="text-[10px] h-5 opacity-50">LOCKED</Badge>}
                                </div>
                                <span className="text-xs text-muted-foreground font-normal">{data.start} - {data.end}</span>
                            </div>
                            <div className="text-right">
                                <Badge variant="secondary" className="font-mono text-sm">
                                    {(data.totalMins / 60).toFixed(2)} Hrs
                                </Badge>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-0 border-t">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50 dark:bg-slate-900">
                                    <TableHead className="w-[100px]">Date</TableHead>
                                    <TableHead>Clock In</TableHead>
                                    <TableHead>Clock Out</TableHead>
                                    <TableHead>Location</TableHead>
                                    <TableHead className="text-right">Duration</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.entries.map((entry) => (
                                    <TableRow key={entry.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex flex-col">
                                                <span>{moment(entry.start_time).format('ddd, MMM D')}</span>
                                            </div>
                                        </TableCell>
                                        
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {entry.clock_in_photo_url && (
                                                    <div 
                                                        className="w-8 h-8 rounded overflow-hidden border cursor-pointer hover:scale-110 transition-transform"
                                                        onClick={() => { setSelectedImage(entry.clock_in_photo_url!); setIsImageOpen(true); }}
                                                    >
                                                        <img src={entry.clock_in_photo_url} alt="In" className="object-cover w-full h-full" />
                                                    </div>
                                                )}
                                                <span className="text-green-700 dark:text-green-400 font-mono text-xs">
                                                    {moment(entry.start_time).format('h:mm A')}
                                                </span>
                                            </div>
                                        </TableCell>

                                        <TableCell>
                                            {entry.end_time ? (
                                                <div className="flex items-center gap-2">
                                                    {entry.clock_out_photo_url && (
                                                        <div 
                                                            className="w-8 h-8 rounded overflow-hidden border cursor-pointer hover:scale-110 transition-transform"
                                                            onClick={() => { setSelectedImage(entry.clock_out_photo_url!); setIsImageOpen(true); }}
                                                        >
                                                            <img src={entry.clock_out_photo_url} alt="Out" className="object-cover w-full h-full" />
                                                        </div>
                                                    )}
                                                    <span className="text-red-700 dark:text-red-400 font-mono text-xs">
                                                        {moment(entry.end_time).format('h:mm A')}
                                                    </span>
                                                </div>
                                            ) : (
                                                <Badge className="bg-green-500 animate-pulse text-[10px]">Active</Badge>
                                            )}
                                        </TableCell>

                                        <TableCell>
                                            <Button 
                                                variant="ghost" 
                                                className="h-6 px-2 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                                onClick={() => {
                                                    setSelectedLocation({ 
                                                        name: entry.location, 
                                                        lat: entry.clock_in_lat, 
                                                        lon: entry.clock_in_lon 
                                                    });
                                                    setIsMapOpen(true);
                                                }}
                                            >
                                                <MapPin className="w-3 h-3 mr-1" /> {entry.location || 'Unknown'}
                                            </Button>
                                        </TableCell>

                                        <TableCell className="text-right font-mono font-bold text-xs">
                                            {formatDuration(entry.start_time, entry.end_time, entry.total_break_minutes)}
                                        </TableCell>

                                        <TableCell>
                                            {!data.isLocked && (
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-6 w-6 text-muted-foreground hover:text-orange-500"
                                                    title="Request Correction"
                                                    onClick={() => handleRequestCorrection(entry)}
                                                >
                                                    <Pencil className="w-3 h-3" />
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>

        {/* --- DIALOGS --- */}

        {/* 1. CORRECTION DIALOG (Updated fields) */}
        <Dialog open={isCorrectionOpen} onOpenChange={setIsCorrectionOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Request Time Correction</DialogTitle>
                    <DialogDescription>
                        Please enter the <strong>Actual</strong> time this shift should have been.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-2">
                    {/* DATE INPUT */}
                    <div>
                        <label className="text-xs font-bold">Shift Date</label>
                        <Input type="date" value={reqDate} onChange={e => setReqDate(e.target.value)} />
                    </div>

                    {/* START & END TIME INPUTS */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold">Actual Start Time</label>
                            <Input type="time" value={reqStartTime} onChange={e => setReqStartTime(e.target.value)} />
                        </div>
                        <div>
                            <label className="text-xs font-bold">Actual End Time</label>
                            <Input type="time" value={reqEndTime} onChange={e => setReqEndTime(e.target.value)} />
                        </div>
                    </div>
                    
                    {/* REASON INPUT */}
                    <div>
                        <label className="text-xs font-bold">Reason for Adjustment</label>
                        <Textarea 
                            placeholder="e.g. Forgot to clock in, System error, etc." 
                            value={reqReason} 
                            onChange={e => setReqReason(e.target.value)} 
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setIsCorrectionOpen(false)}>Cancel</Button>
                    <Button onClick={handleSubmitCorrection} disabled={submitting}>
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Request"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {/* 2. MAP DIALOG */}
        <Dialog open={isMapOpen} onOpenChange={setIsMapOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader><DialogTitle>Punch Location</DialogTitle></DialogHeader>
                <div className="aspect-video w-full bg-slate-100 rounded-md overflow-hidden relative">
                    {selectedLocation && (
                        <iframe
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            loading="lazy"
                            src={`https://maps.google.com/maps?q=${selectedLocation.lat && selectedLocation.lon ? `${selectedLocation.lat},${selectedLocation.lon}` : encodeURIComponent(selectedLocation.name)}&z=15&output=embed`}
                        ></iframe>
                    )}
                </div>
            </DialogContent>
        </Dialog>

        {/* 3. IMAGE DIALOG */}
        <Dialog open={isImageOpen} onOpenChange={setIsImageOpen}>
            <DialogContent className="sm:max-w-lg p-0 bg-black border-zinc-800">
                <div className="relative aspect-[4/3] w-full flex items-center justify-center">
                    {selectedImage && (
                        <img src={selectedImage} alt="Proof" className="w-full h-full object-contain" />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    </div>
  );
}