'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { CalendarClock, PlaneLanding, RotateCcw, Trash2, Clock, CheckCircle2 } from 'lucide-react';
import { launchGroup, unLaunchGroup, updateGroupLaunchTime, landGroup } from '@/app/actions/group-launch-actions'; 

interface LaunchGroupProps {
  groupId: string;
  launchedAt: string | null;
  landedAt: string | null;
  groupName: string;
  durationMinutes?: number;
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

  useEffect(() => {
    if (!launchedAt || landedAt) return;
    const calculateTime = () => {
      const start = new Date(launchedAt).getTime();
      const now = new Date().getTime();
      const end = start + (durationMinutes * 60 * 1000);
      const diff = end - now;
      if (diff < 0) {
        const overdueMins = Math.abs(Math.floor(diff / 60000));
        setTimeLeft(`+${overdueMins}m`);
        setIsOverdue(true);
      } else {
        const mins = Math.floor(diff / 60000);
        setTimeLeft(`${mins}m`);
        setIsOverdue(false);
      }
    };
    calculateTime();
    const timer = setInterval(calculateTime, 60000);
    return () => clearInterval(timer);
  }, [launchedAt, landedAt, durationMinutes]);

  const handleLaunchNow = async () => {
    const res = await launchGroup(groupId);
    if (res?.error) toast({ title: 'Error', description: res.error, variant: 'destructive' });
    else toast({ title: 'Launched!', description: `${groupName} is go.`, variant: 'default' });
  };

  const handleLandNow = async () => {
    const res = await landGroup(groupId); 
    if (res?.error) toast({ title: 'Error', description: res.error, variant: 'destructive' });
    else toast({ title: 'Landed', description: 'Welcome back.', variant: 'default' });
  };

  const handleUpdateLaunchTime = async () => {
    if (!manualTime) return;
    const [hours, minutes] = manualTime.split(':');
    const newDate = new Date();
    newDate.setHours(parseInt(hours), parseInt(minutes), 0);
    const res = await updateGroupLaunchTime(groupId, newDate.toISOString());
    if (res?.error) toast({ title: 'Error', description: res.error, variant: 'destructive' });
    else { toast({ title: 'Updated', description: 'Launch time adjusted.', variant: 'default' }); setIsOpen(false); }
  };

  const handleReset = async () => {
    if (!confirm('Are you sure you want to completely reset the launch status?')) return;
    const res = await unLaunchGroup(groupId);
    if (res?.error) toast({ title: 'Error', description: res.error, variant: 'destructive' });
    else { toast({ title: 'Reset', description: 'Group status cleared.', variant: 'default' }); setIsOpen(false); }
  };

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  // --- RENDER STATES ---
  if (landedAt && launchedAt) {
    const duration = Math.round((new Date(landedAt).getTime() - new Date(launchedAt).getTime()) / 60000);
    return (
      <div className="flex items-center gap-2 bg-muted/50 border border-border rounded px-2 py-0.5 opacity-70">
        <CheckCircle2 className="w-3 h-3 text-green-600 dark:text-green-500" />
        <div className="flex flex-col leading-none">
          <span className="text-[10px] text-muted-foreground font-mono uppercase">DONE ({duration}m)</span>
          <span className="text-[9px] text-muted-foreground">
            {formatTime(launchedAt)} - {formatTime(landedAt)}
          </span>
        </div>
      </div>
    );
  }

  if (launchedAt) {
    return (
      <div className="flex items-center gap-1">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <button className={`
              flex items-center gap-2 px-2 py-0.5 rounded border transition-all
              ${isOverdue 
                ? 'bg-red-100 border-red-200 text-red-700 dark:bg-red-950/30 dark:border-red-900 dark:text-red-400 animate-pulse' 
                : 'bg-green-100 border-green-200 text-green-700 dark:bg-green-950/30 dark:border-green-900 dark:text-green-400'}
            `}>
              <div className="flex flex-col items-start leading-none">
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  {isOverdue ? 'Overdue' : 'Active'}
                </span>
                <span className="text-xs font-mono font-bold">
                   {formatTime(launchedAt)}
                </span>
              </div>
              <div className={`text-sm font-bold font-mono ${isOverdue ? 'text-red-600 dark:text-red-500' : 'text-foreground'}`}>
                 {timeLeft}
              </div>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3 bg-popover border-border" align="end">
            <h4 className="text-xs font-bold text-muted-foreground uppercase mb-3 flex items-center gap-2">
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
              <div className="pt-2 border-t border-border">
                <label className="text-[10px] text-muted-foreground mb-1 block">Manual Start Time</label>
                <div className="flex gap-2">
                  <Input 
                    type="time" 
                    className="h-8 text-xs bg-background" 
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
        <Button 
          size="sm" 
          onClick={handleLandNow}
          className="h-[34px] px-3 bg-card hover:bg-blue-100 text-foreground border border-border hover:border-blue-500 dark:bg-slate-800 dark:hover:bg-blue-600 dark:hover:text-white transition-all font-bold gap-1"
        >
          <PlaneLanding className="w-3 h-3" /> Land
        </Button>
      </div>
    );
  }

  return (
    <Button 
      size="sm" 
      onClick={handleLaunchNow}
      variant="outline"
      className="h-[28px] gap-2 border-border hover:bg-green-100 hover:text-green-800 hover:border-green-300 dark:hover:bg-green-900/30 dark:hover:text-green-400"
    >
       <Clock className="w-3 h-3" /> Launch
    </Button>
  );
}