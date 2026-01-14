'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { 
  PlaneTakeoff, 
  PlaneLanding, 
  RotateCcw, 
  Trash2, 
  Clock, 
  CheckCircle2,
  Lock,
  Pencil
} from 'lucide-react';
import { 
  launchGroup, 
  unLaunchGroup, 
  updateGroupLaunchTime, 
  landGroup 
} from '@/app/actions/group-launch-actions'; 

interface LaunchGroupProps {
  groupId: string;
  launchedAt: string | null;
  landedAt: string | null;
  groupName: string;
  durationMinutes?: number;
  role?: number; // Permission Level
}

export default function LaunchGroup({
  groupId,
  launchedAt,
  landedAt,
  groupName,
  durationMinutes = 60,
  role = 0
}: LaunchGroupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [elapsedString, setElapsedString] = useState<string>('');
  const [isOverdue, setIsOverdue] = useState(false);
  
  // Manual Edit States
  const [manualLaunchTime, setManualLaunchTime] = useState('');
  const [manualLandTime, setManualLandTime] = useState(''); // NEW: For fixing land time
  
  const { toast } = useToast();
  const isManager = role >= 500;

  // --- TIMER LOGIC ---
  useEffect(() => {
    if (!launchedAt) return;
    
    // Pre-fill inputs for editing
    const launchDate = new Date(launchedAt);
    setManualLaunchTime(launchDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));

    if (landedAt) {
      const landDate = new Date(landedAt);
      setManualLandTime(landDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }));
    }

    // Only run live timer if NOT landed
    if (landedAt) return;

    const calculateTime = () => {
      const start = launchDate.getTime();
      const now = new Date().getTime();
      const end = start + (durationMinutes * 60 * 1000);
      const diff = now - start; 
      const remaining = end - now;

      // Calculate elapsed minutes
      const totalMins = Math.floor(diff / 60000);
      setElapsedString(`${totalMins}m`);

      setIsOverdue(remaining < 0);
    };

    calculateTime();
    const timer = setInterval(calculateTime, 60000);
    return () => clearInterval(timer);
  }, [launchedAt, landedAt, durationMinutes]);

  // --- ACTIONS ---

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
    if (!manualLaunchTime) return;
    const [hours, minutes] = manualLaunchTime.split(':');
    
    const newDate = new Date();
    // Preserve the original date if possible, otherwise use today
    if (launchedAt) {
      const current = new Date(launchedAt);
      newDate.setFullYear(current.getFullYear(), current.getMonth(), current.getDate());
    }
    newDate.setHours(parseInt(hours), parseInt(minutes), 0);
    
    const res = await updateGroupLaunchTime(groupId, newDate.toISOString());
    if (res?.error) toast({ title: 'Error', description: res.error, variant: 'destructive' });
    else { 
      toast({ title: 'Updated', description: 'Launch time adjusted.', variant: 'default' }); 
      setIsOpen(false); 
    }
  };

  // NEW: Allow fixing the land time
  const handleUpdateLandTime = async () => {
    // We re-land the group with the specific timestamp
    if (!manualLandTime) return;
    const [hours, minutes] = manualLandTime.split(':');
    
    const newDate = new Date();
    if (landedAt) {
       const current = new Date(landedAt);
       newDate.setFullYear(current.getFullYear(), current.getMonth(), current.getDate());
    }
    newDate.setHours(parseInt(hours), parseInt(minutes), 0);

    const res = await landGroup(groupId, newDate.toISOString()); // Ensure your action accepts this optional arg
    if (res?.error) toast({ title: 'Error', description: res.error, variant: 'destructive' });
    else { 
      toast({ title: 'Updated', description: 'Land time corrected.', variant: 'default' }); 
      setIsOpen(false); 
    }
  };

  const handleReset = async () => {
    if (!confirm('MANAGER OVERRIDE:\n\nAre you sure you want to completely RESET this group? This will clear launch and land times.')) return;
    
    const res = await unLaunchGroup(groupId);
    if (res?.error) toast({ title: 'Error', description: res.error, variant: 'destructive' });
    else { 
      toast({ title: 'Reset', description: 'Group status cleared.', variant: 'default' }); 
      setIsOpen(false); 
    }
  };

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  // --- RENDER: STATE 3 - COMPLETED (GREEN) ---
  if (landedAt && launchedAt) {
    const duration = Math.round((new Date(landedAt).getTime() - new Date(launchedAt).getTime()) / 60000);

    // Common Inner Content
    const BadgeContent = (
      <>
        <CheckCircle2 className="w-4 h-4" />
        <div className="flex flex-col items-start leading-none">
          <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">Completed</span>
          <span className="text-xs font-mono font-bold">
             {duration}m total
          </span>
        </div>
      </>
    );

    // MANAGER VIEW (Interactive Button)
    if (isManager) {
      return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <button 
              type="button"
              className="flex items-center gap-2 px-3 py-1 rounded border transition-all 
              bg-green-100 border-green-300 text-green-900 
              dark:bg-green-900/40 dark:border-green-800 dark:text-green-300
              hover:bg-green-200 dark:hover:bg-green-900/60 cursor-pointer
              focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {BadgeContent}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-3 bg-popover border-border shadow-xl" align="center">
            <h4 className="text-xs font-bold text-destructive uppercase mb-3 flex items-center gap-2">
              <Lock className="w-3 h-3" /> Manager Override
            </h4>
            
            <div className="space-y-4">
               {/* Time Editors */}
               <div className="grid grid-cols-2 gap-2">
                 <div className="space-y-1">
                    <Label className="text-[9px] uppercase text-muted-foreground">Launch</Label>
                    <Input 
                      type="time" 
                      className="h-7 text-xs" 
                      value={manualLaunchTime}
                      onChange={(e) => setManualLaunchTime(e.target.value)}
                    />
                 </div>
                 <div className="space-y-1">
                    <Label className="text-[9px] uppercase text-muted-foreground">Land</Label>
                    <Input 
                      type="time" 
                      className="h-7 text-xs" 
                      value={manualLandTime}
                      onChange={(e) => setManualLandTime(e.target.value)}
                    />
                 </div>
               </div>
               
               <div className="flex gap-2">
                 <Button size="sm" variant="secondary" className="flex-1 h-7 text-xs" onClick={() => { handleUpdateLaunchTime(); handleUpdateLandTime(); }}>
                    Update Times
                 </Button>
               </div>

               <div className="pt-2 border-t border-border">
                  <Button variant="destructive" size="sm" className="w-full text-xs h-8" onClick={handleReset}>
                    <RotateCcw className="w-3 h-3 mr-2" /> Reset Entire Group
                  </Button>
               </div>
            </div>
          </PopoverContent>
        </Popover>
      );
    }

    // STAFF VIEW (Static Div)
    return (
      <div className="flex items-center gap-2 px-3 py-1 rounded border transition-all cursor-default
        bg-green-100 border-green-300 text-green-900 
        dark:bg-green-900/40 dark:border-green-800 dark:text-green-300 opacity-80">
        {BadgeContent}
      </div>
    );
  }

  // --- RENDER: STATE 2 - IN PROGRESS (YELLOW) ---
  if (launchedAt) {
    return (
      <div className="flex items-center gap-1">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <button className={`
              flex items-center gap-2 px-3 py-1 rounded border transition-all
              ${isOverdue 
                ? 'bg-red-100 border-red-300 text-red-900 animate-pulse dark:bg-red-900/30 dark:border-red-800 dark:text-red-200' 
                : 'bg-yellow-100 border-yellow-300 text-yellow-900 dark:bg-yellow-900/30 dark:border-yellow-700 dark:text-yellow-200'}
            `}>
              <div className="flex flex-col items-start leading-none">
                <span className="text-[9px] font-bold uppercase tracking-wider opacity-70">
                  {isOverdue ? 'Overdue' : 'In Progress'}
                </span>
                <span className="text-xs font-mono font-bold">
                   {elapsedString}
                </span>
              </div>
              
              <Pencil className="w-3 h-3 opacity-50 ml-1" />
            </button>
          </PopoverTrigger>

          <PopoverContent className="w-72 p-3 bg-popover border-border shadow-xl" align="center">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
               <h4 className="text-xs font-bold uppercase flex items-center gap-2">
                 <Clock className="w-3 h-3" /> Flight Controls
               </h4>
               <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-mono">
                 Launched: {formatTime(launchedAt)}
               </span>
            </div>

            <div className="space-y-4">
              {/* Manual Time Correction */}
              <div className="space-y-1.5">
                <Label className="text-[10px] text-muted-foreground uppercase font-bold">Correct Launch Time</Label>
                <div className="flex gap-2">
                  <Input 
                    type="time" 
                    className="h-8 text-xs bg-background" 
                    value={manualLaunchTime}
                    onChange={(e) => setManualLaunchTime(e.target.value)}
                  />
                  <Button size="sm" variant="secondary" className="h-8" onClick={handleUpdateLaunchTime} disabled={!manualLaunchTime}>
                    Save
                  </Button>
                </div>
              </div>

              {/* Manager Reset */}
              {isManager && (
                <div className="pt-2 border-t border-border mt-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full text-xs text-destructive hover:text-destructive hover:bg-destructive/10 h-8 justify-start px-0" 
                    onClick={handleReset}
                  >
                    <Trash2 className="w-3 h-3 mr-2" />
                    Reset / Cancel Launch
                  </Button>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Land Button */}
        <Button 
          size="sm" 
          onClick={handleLandNow}
          className="h-[38px] px-4 bg-yellow-500 hover:bg-yellow-600 text-black border border-yellow-600 shadow-sm font-bold gap-2 transition-all"
        >
          <PlaneLanding className="w-4 h-4" /> 
          Land
        </Button>
      </div>
    );
  }

  // --- RENDER: STATE 1 - TO DO (RED) ---
  return (
    <Button 
      size="sm" 
      onClick={handleLaunchNow}
      variant="outline"
      className="h-[28px] bg-red-50 text-red-700 border-red-200 hover:bg-red-100 hover:text-red-900 hover:border-red-300 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900 dark:hover:bg-red-900/40"
    >
       <PlaneTakeoff className="w-3 h-3 mr-2" /> 
       Launch
    </Button>
  );
}