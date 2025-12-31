'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { CalendarClock, PlaneLanding, RotateCcw, Trash2, Clock, CheckCircle2 } from 'lucide-react';
import { launchGroup, unLaunchGroup, updateGroupLaunchTime, landGroup } from '@/app/actions/group-launch-actions';

interface LaunchGroupProps {
  groupId: string;
  launchedAt: string | null; // ISO String
  landedAt: string | null;   // ISO String
  groupName: string;
  durationMinutes?: number;  // Default to 60 if not passed
}

export default function LaunchGroup({
  groupId,
  launchedAt,
  landedAt,
  groupName,
  durationMinutes = 60
}: LaunchGroupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isOverdue, setIsOverdue] = useState(false);
  const [manualTime, setManualTime] = useState('');
  
  const { toast } = useToast();
  const router = useRouter();
  const supabase = createClient();

  // --- REALTIME SUBSCRIPTION ---
  useEffect(() => {
    const channel = supabase.channel('realtime_groups_launch')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'groups' }, () => router.refresh())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, router]);

  // --- COUNTDOWN TIMER LOGIC ---
  useEffect(() => {
    if (!launchedAt || landedAt) return;

    const calculateTime = () => {
      const start = new Date(launchedAt).getTime();
      const now = new Date().getTime();
      const end = start + (durationMinutes * 60 * 1000);
      const diff = end - now;

      if (diff < 0) {
        // Overdue
        const overdueMins = Math.abs(Math.floor(diff / 60000));
        setTimeLeft(`+${overdueMins}m`);
        setIsOverdue(true);
      } else {
        // Remaining
        const mins = Math.floor(diff / 60000);
        setTimeLeft(`${mins}m`);
        setIsOverdue(false);
      }
    };

    calculateTime();
    const timer = setInterval(calculateTime, 60000); // Update every min
    return () => clearInterval(timer);
  }, [launchedAt, landedAt, durationMinutes]);

  // --- ACTIONS ---

  const handleLaunchNow = async () => {
    // Default launch logic
    const res = await launchGroup(groupId);
    if (res?.error) toast({ title: 'Error', description: res.error, variant: 'destructive' });
    else toast({ title: 'Launched!', description: `${groupName} is go.`, variant: 'success' });
  };

  const handleLandNow = async () => {
    // Record current time as landed_at
    const res = await landGroup(groupId); 
    if (res?.error) toast({ title: 'Error', description: res.error, variant: 'destructive' });
    else toast({ title: 'Landed', description: 'Welcome back.', variant: 'success' });
  };

  const handleUpdateLaunchTime = async () => {
    if (!manualTime) return;
    // Combine today's date with the manual time input
    const [hours, minutes] = manualTime.split(':');
    const newDate = new Date();
    newDate.setHours(parseInt(hours), parseInt(minutes), 0);
    
    const res = await updateGroupLaunchTime(groupId, newDate.toISOString());
    if (res?.error) toast({ title: 'Error', description: res.error, variant: 'destructive' });
    else {
      toast({ title: 'Updated', description: 'Launch time adjusted.', variant: 'success' });
      setIsOpen(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Are you sure you want to completely reset the launch status?')) return;
    const res = await unLaunchGroup(groupId);
    if (res?.error) toast({ title: 'Error', description: res.error, variant: 'destructive' });
    else {
      toast({ title: 'Reset', description: 'Group status cleared.', variant: 'success' });
      setIsOpen(false);
    }
  };

  // --- HELPERS ---
  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  // --- RENDER STATES ---

  // 1. LANDED STATE (Complete)
  if (landedAt && launchedAt) {
    const duration = Math.round((new Date(landedAt).getTime() - new Date(launchedAt).getTime()) / 60000);
    return (
      <div className="flex items-center gap-2 bg-slate-900/50 border border-slate-700 rounded px-2 py-0.5 opacity-70">
        <CheckCircle2 className="w-3 h-3 text-green-500" />
        <div className="flex flex-col leading-none">
          <span className="text-[10px] text-slate-400 font-mono">DONE ({duration}m)</span>
          <span className="text-[9px] text-slate-600">
            {formatTime(launchedAt)} - {formatTime(landedAt)}
          </span>
        </div>
      </div>
    );
  }

  // 2. LAUNCHED STATE (Active)
  if (launchedAt) {
    return (
      <div className="flex items-center gap-1">
        {/* LAUNCH INFO WIDGET */}
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <button className={`
              flex items-center gap-2 px-2 py-0.5 rounded border transition-all
              ${isOverdue 
                ? 'bg-red-950/30 border-red-900 text-red-400 animate-pulse' 
                : 'bg-green-950/30 border-green-900 text-green-400'}
            `}>
              <div className="flex flex-col items-start leading-none">
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  {isOverdue ? 'Overdue' : 'Active'}
                </span>
                <span className="text-xs font-mono font-bold">
                   {formatTime(launchedAt)}
                </span>
              </div>
              
              <div className={`text-sm font-bold font-mono ${isOverdue ? 'text-red-500' : 'text-slate-200'}`}>
                 {timeLeft}
              </div>
            </button>
          </PopoverTrigger>

          {/* EDIT POPOVER */}
          <PopoverContent className="w-64 p-3 bg-slate-950 border-slate-800" align="end">
            <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
              <CalendarClock className="w-3 h-3" /> Adjust Launch
            </h4>
            
            <div className="space-y-3">
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" className="flex-1 text-xs" onClick={handleLaunchNow}>
                  <RotateCcw className="w-3 h-3 mr-1" /> Set to Now
                </Button>
                <Button variant="destructive" size="sm" className="flex-1 text-xs" onClick={handleReset}>
                  <Trash2 className="w-3 h-3 mr-1" /> Reset
                </Button>
              </div>

              <div className="pt-2 border-t border-slate-800">
                <label className="text-[10px] text-slate-500 mb-1 block">Manual Start Time</label>
                <div className="flex gap-2">
                  <Input 
                    type="time" 
                    className="h-8 text-xs" 
                    value={manualTime}
                    onChange={(e) => setManualTime(e.target.value)}
                  />
                  <Button size="sm" onClick={handleUpdateLaunchTime} disabled={!manualTime}>
                    Save
                  </Button>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* LAND BUTTON */}
        <Button 
          size="sm" 
          onClick={handleLandNow}
          className="h-[34px] px-3 bg-slate-800 border border-slate-600 hover:bg-blue-600 hover:text-white hover:border-blue-500 transition-all text-slate-300 font-bold gap-1"
        >
          <PlaneLanding className="w-3 h-3" /> Land
        </Button>
      </div>
    );
  }

  // 3. READY STATE (Default)
  return (
    <Button 
      size="sm" 
      onClick={handleLaunchNow}
      className="h-[28px] bg-slate-800 border border-slate-700 text-slate-400 hover:bg-green-600 hover:text-white hover:border-green-500 transition-all gap-2"
    >
       <Clock className="w-3 h-3" /> Launch
    </Button>
  );
}