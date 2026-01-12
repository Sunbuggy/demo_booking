'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FaSearch, FaArrowRight, FaTrash, FaUserCheck, FaExclamationTriangle, 
  FaCopy, FaBolt, FaHistory, FaGhost, FaArrowDown, FaSkull 
} from 'react-icons/fa';
import { toast } from 'sonner';
import { 
  searchEmployees, 
  getEmployeeStats, 
  mergeAndRemoveUser, 
  permanentlyDeleteUser // <--- IMPORT THE NEW FUNCTION
} from '@/app/actions/admin-cleanup';
import { format } from 'date-fns';

// ... UserStatCard Component remains exactly the same ...
function UserStatCard({ user, isTarget, onSelect, onDeselect }: any) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setLoading(true);
      getEmployeeStats(user.id).then((data) => {
        setStats(data);
        setLoading(false);
      });
    } else {
      setStats(null);
    }
  }, [user]);

  if (!user) {
    return (
      <div className={`h-full min-h-[200px] border-2 border-dashed rounded-xl flex items-center justify-center text-slate-500 ${
        isTarget ? 'border-green-900/30 bg-green-950/5' : 'border-red-900/30 bg-red-950/5'
      }`}>
        <span className="text-sm flex flex-col items-center gap-2 opacity-50">
           {isTarget ? <FaUserCheck size={24}/> : <FaTrash size={24}/>}
           {isTarget ? 'Select Target (Optional for Delete)' : 'Select Account to Delete'}
        </span>
      </div>
    );
  }

  return (
    <Card className={`relative border-2 shadow-lg transition-all animate-in fade-in zoom-in-95 ${
      isTarget 
        ? 'border-green-500/50 bg-green-950/10 shadow-green-900/10' 
        : 'border-red-500/50 bg-red-950/10 shadow-red-900/10'
    }`}>
      <div className="absolute top-2 right-2 z-10">
         <Button 
           variant="ghost" 
           size="sm" 
           onClick={onDeselect}
           className="h-6 w-6 p-0 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full"
         >
           <FaTrash size={10} />
         </Button>
      </div>

      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="flex flex-col">
          <div className="flex items-center justify-between gap-2">
            <span className="text-md font-bold text-white tracking-tight truncate">{user.full_name}</span>
            <Badge variant="outline" className="text-[10px] h-5 px-1 border-slate-700 text-slate-400 shrink-0">
               Lvl {user.user_level}
            </Badge>
          </div>
          
          {user.email ? (
            <span className="text-[10px] text-slate-400 font-mono truncate">{user.email}</span>
          ) : (
             <span className="text-[10px] text-red-400 font-mono font-bold flex items-center gap-1">
               <FaGhost size={8}/> NO EMAIL (Ghost)
             </span>
          )}
          
          <div className="flex gap-2 mt-2">
             {user.last_sign_in ? (
               <span className="text-[9px] bg-green-900/40 text-green-400 px-1.5 py-0.5 rounded flex items-center gap-1">
                 <FaBolt size={8}/> Login: {format(new Date(user.last_sign_in), 'MMM d, yy')}
               </span>
             ) : (
               <span className="text-[9px] bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded flex items-center gap-1">
                 <FaHistory size={8}/> Never Logged In
               </span>
             )}
          </div>

          {user.stage_name && (
            <span className="text-[10px] text-yellow-500 font-bold uppercase mt-1 tracking-wider">
              AKA: {user.stage_name}
            </span>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3 px-4 pb-4">
        <div className="grid grid-cols-3 gap-1 text-center">
          <div className="p-1.5 bg-slate-900/80 rounded border border-slate-800">
            <div className="text-[9px] text-slate-500 uppercase font-bold">Punches</div>
            <div className="text-lg font-bold text-white">{loading ? '-' : stats?.punches || 0}</div>
          </div>
          <div className="p-1.5 bg-slate-900/80 rounded border border-slate-800">
            <div className="text-[9px] text-slate-500 uppercase font-bold">Shifts</div>
            <div className="text-lg font-bold text-white">{loading ? '-' : stats?.shifts || 0}</div>
          </div>
          <div className="p-1.5 bg-slate-900/80 rounded border border-slate-800">
            <div className="text-[9px] text-slate-500 uppercase font-bold">Fleet</div>
            <div className="text-lg font-bold text-white">{loading ? '-' : stats?.fleet || 0}</div>
          </div>
        </div>
        <div className={`text-center py-1 rounded text-[10px] font-bold uppercase tracking-widest mt-1 ${
          isTarget ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {isTarget ? 'KEEP (MASTER)' : 'SOURCE (TO DELETE)'}
        </div>
      </CardContent>
    </Card>
  );
}

export default function UserCleanupPage() {
  // ... existing state ...
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [sourceUser, setSourceUser] = useState<any>(null);
  const [targetUser, setTargetUser] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [emailConflicts, setEmailConflicts] = useState<any[]>([]);
  const [nullProfiles, setNullProfiles] = useState<any[]>([]);
  const [scanning, setScanning] = useState(true);

  // ... existing useEffect/performScan ...
  const performScan = async () => {
    setScanning(true);
    const supabase = createClient();
    const [emailRes, nullRes] = await Promise.all([
      supabase.rpc('get_email_conflicts'),
      supabase.rpc('get_null_email_profiles')
    ]);
    if (emailRes.data) setEmailConflicts(emailRes.data);
    if (nullRes.data) setNullProfiles(nullRes.data);
    setScanning(false);
  };

  useEffect(() => { performScan(); }, []);

  // ... existing handleSearch/selectUser/handleReviewConflict/handleFixNullProfile ...
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (query.length < 2) return;
    const data = await searchEmployees(query);
    setResults(data || []);
  };

  const selectUser = (user: any) => {
    if (!sourceUser) {
      setSourceUser(user);
    } else if (!targetUser) {
      if (user.id === sourceUser.id) {
        toast.error("Cannot merge a user into themselves!");
        return;
      }
      setTargetUser(user);
    } else {
      toast.info('Slots full. Remove a user to add another.');
    }
  };

  const handleReviewConflict = (accountA: any, accountB: any) => {
    const aTime = accountA.last_sign_in ? new Date(accountA.last_sign_in).getTime() : 0;
    const bTime = accountB.last_sign_in ? new Date(accountB.last_sign_in).getTime() : 0;
    if (aTime > bTime) { setTargetUser(accountA); setSourceUser(accountB); } 
    else { setTargetUser(accountB); setSourceUser(accountA); }
    toast.info("Conflict loaded. Verify stats below.");
  };

  const handleFixNullProfile = (ghostUser: any) => {
     setSourceUser(ghostUser);
     setTargetUser(null);
     toast.warning(`"${ghostUser.full_name}" selected. To DELETE without merging, leave Target empty.`);
  };

  // --- MERGE LOGIC ---
  const handleMerge = async () => {
    if (!sourceUser || !targetUser) return;
    const confirmMsg = `MERGE CONFIRMATION:\n\n1. Move history from "${sourceUser.full_name}" -> "${targetUser.full_name}".\n2. DELETE "${sourceUser.full_name}".\n\nAre you sure?`;
    if (!confirm(confirmMsg)) return;

    setIsProcessing(true);
    try {
      await mergeAndRemoveUser(sourceUser.id, targetUser.id);
      toast.success('Merge Complete! Duplicate user deleted.');
      setSourceUser(null);
      setTargetUser(null);
      handleSearch(); 
      performScan();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Merge failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // --- DELETE ONLY LOGIC (NEW) ---
  const handleDeleteOnly = async () => {
    if (!sourceUser) return;
    const confirmMsg = `DELETE WARNING (NO MERGE):\n\nThis will PERMANENTLY DELETE "${sourceUser.full_name}" and DESTROY all their schedule/punch history.\n\nThere is NO UNDO.\n\nAre you sure?`;
    if (!confirm(confirmMsg)) return;

    setIsProcessing(true);
    try {
      await permanentlyDeleteUser(sourceUser.id);
      toast.success(`Deleted ${sourceUser.full_name} successfully.`);
      setSourceUser(null);
      
      // Refresh Lists
      handleSearch(); 
      performScan();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Delete failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full bg-slate-950 p-4 text-slate-200 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col gap-1 border-b border-slate-800 pb-4">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
             <FaUserCheck className="text-yellow-500" />
             Duplicate Account Fixer
          </h1>
          <p className="text-slate-400">
            Detect and merge duplicate profiles. 
            <span className="text-slate-500 ml-2 text-xs font-mono bg-slate-900 px-2 py-1 rounded">
              {scanning ? 'Scanning Database...' : 'System Scanned'}
            </span>
          </p>
        </div>

        {/* --- CONFLICT DETECTORS --- */}
        {(emailConflicts.length > 0 || nullProfiles.length > 0) && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 animate-in slide-in-from-top-4">
            
            {/* 1. DUPLICATE EMAIL DETECTOR */}
            {emailConflicts.length > 0 && (
              <div className="bg-amber-950/20 border border-amber-500/20 rounded-xl p-5 shadow-lg shadow-amber-900/10">
                 <div className="flex items-center gap-2 mb-4 text-amber-500 font-bold border-b border-amber-500/20 pb-2">
                    <FaExclamationTriangle />
                    <span>Email Conflicts Detected ({emailConflicts.length})</span>
                 </div>
                 <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {emailConflicts.map((c) => (
                       <div key={c.shared_email} className="bg-slate-900 border border-slate-800 p-3 rounded-lg flex flex-col gap-2">
                          <div className="flex justify-between items-center text-xs">
                             <span className="font-mono text-slate-400 truncate max-w-[200px]">{c.shared_email}</span>
                             <Badge variant="outline" className="text-amber-600 border-amber-900 bg-amber-950/30 text-[9px]">Duplicate</Badge>
                          </div>
                          <Button 
                            size="sm" variant="ghost" className="w-full text-xs h-7 mt-1 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20"
                            onClick={() => handleReviewConflict(c.accounts[0], c.accounts[1])}
                          >
                            Review & Fix
                          </Button>
                       </div>
                    ))}
                 </div>
              </div>
            )}

            {/* 2. GHOST DETECTOR */}
            {nullProfiles.length > 0 && (
              <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-5 shadow-lg">
                 <div className="flex items-center gap-2 mb-4 text-slate-300 font-bold border-b border-slate-700/50 pb-2">
                    <FaGhost className="text-purple-400" />
                    <span>Incomplete Profiles (No Email)</span>
                 </div>
                 <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {nullProfiles.map((p) => (
                       <div key={p.id} className="bg-slate-950 border border-slate-800 p-3 rounded-lg flex items-center justify-between group hover:border-slate-600 transition-colors">
                          <div className="flex flex-col gap-0.5">
                             <div className="font-bold text-sm text-slate-200">{p.full_name}</div>
                             <div className="text-[10px] text-slate-500">Lvl {p.user_level}</div>
                          </div>
                          <Button 
                             size="sm" variant="destructive" className="h-7 text-xs opacity-70 group-hover:opacity-100"
                             onClick={() => handleFixNullProfile(p)}
                          >
                             Select to Delete
                          </Button>
                       </div>
                    ))}
                 </div>
              </div>
            )}
          </div>
        )}

        {/* --- WORKBENCH --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4 border-t border-slate-800">
          
          {/* LEFT: Search */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <h3 className="font-bold text-slate-400 text-sm uppercase tracking-wider">Manual Search</h3>
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 shadow-sm">
              <form onSubmit={handleSearch} className="flex gap-2">
                <Input placeholder="Search..." value={query} onChange={e => setQuery(e.target.value)} className="bg-slate-950 border-slate-700 h-9 text-sm" />
                <Button type="submit" size="sm" className="bg-slate-800 hover:bg-slate-700"><FaSearch /></Button>
              </form>
            </div>
            <div className="h-[400px] overflow-y-auto space-y-2 pr-2 custom-scrollbar border border-slate-800/50 rounded-lg p-2 bg-slate-900/20">
              {results.map((u) => {
                  const isSource = sourceUser?.id === u.id;
                  const isTarget = targetUser?.id === u.id;
                  const isSelected = isSource || isTarget;
                  return (
                    <div key={u.id} onClick={() => !isSelected && selectUser(u)}
                      className={`p-2 rounded border transition-all cursor-pointer group ${isSource ? 'bg-red-950/30 border-red-900/50' : isTarget ? 'bg-green-950/30 border-green-900/50' : 'bg-slate-900/50 border-slate-800 hover:bg-slate-800'}`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="overflow-hidden">
                          <div className={`font-bold text-sm truncate ${isSelected ? 'text-slate-400' : 'text-white'}`}>{u.full_name}</div>
                          <div className="text-[10px] text-slate-500 truncate">{u.email || 'No Email'}</div>
                        </div>
                        {isSource && <span className="text-[9px] font-bold bg-red-900 text-red-200 px-1.5 py-0.5 rounded ml-2">DEL</span>}
                        {isTarget && <span className="text-[9px] font-bold bg-green-900 text-green-200 px-1.5 py-0.5 rounded ml-2">KEEP</span>}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* RIGHT: Workbench */}
          <div className="lg:col-span-8 flex flex-col">
             <h3 className="font-bold text-slate-400 text-sm uppercase tracking-wider mb-4">Action Workbench</h3>
             <div className="flex flex-col md:flex-row items-start gap-4 mb-6">
                <div className="flex-1 w-full space-y-2">
                   <span className="text-xs font-bold text-red-500 uppercase ml-1">Source (Bad Account)</span>
                   <UserStatCard user={sourceUser} isTarget={false} onDeselect={() => setSourceUser(null)} />
                </div>
                <div className="flex flex-col justify-center items-center py-2 md:py-12">
                  <FaArrowRight className="hidden md:block text-xl text-slate-600" />
                </div>
                <div className="flex-1 w-full space-y-2">
                   <span className="text-xs font-bold text-green-500 uppercase ml-1">Target (Good Account)</span>
                   <UserStatCard user={targetUser} isTarget={true} onDeselect={() => setTargetUser(null)} />
                </div>
             </div>

             <div className="bg-slate-900/30 p-5 rounded-xl border border-slate-800 flex flex-col items-center justify-center gap-4 mt-auto">
               
               {/* --- DYNAMIC ACTION BUTTONS --- */}
               {sourceUser && targetUser ? (
                 // MODE: MERGE
                 <>
                   <div className="flex items-center gap-2 text-[10px] text-amber-500/80 bg-amber-950/20 px-3 py-1 rounded-full border border-amber-900/20">
                     <FaExclamationTriangle />
                     <span>Merging will move history to Target and delete Source.</span>
                   </div>
                   <Button 
                     size="lg"
                     className="w-full max-w-sm bg-blue-600 hover:bg-blue-500 text-white font-bold tracking-wide shadow-lg shadow-blue-900/20"
                     disabled={isProcessing}
                     onClick={handleMerge}
                   >
                     {isProcessing ? 'Processing...' : 'MERGE & DELETE SOURCE'}
                   </Button>
                 </>
               ) : sourceUser && !targetUser ? (
                 // MODE: DELETE ONLY
                 <>
                    <div className="flex items-center gap-2 text-[10px] text-red-500/80 bg-red-950/20 px-3 py-1 rounded-full border border-red-900/20">
                     <FaSkull />
                     <span>Warning: This will destroy the user and all their data history.</span>
                   </div>
                   <Button 
                     size="lg"
                     className="w-full max-w-sm bg-red-600 hover:bg-red-500 text-white font-bold tracking-wide shadow-lg shadow-red-900/20"
                     disabled={isProcessing}
                     onClick={handleDeleteOnly}
                   >
                     {isProcessing ? 'Processing...' : `PERMANENTLY DELETE "${sourceUser.full_name}"`}
                   </Button>
                 </>
               ) : (
                 // MODE: EMPTY
                 <div className="text-slate-500 text-sm italic">Select a Source user to begin.</div>
               )}

             </div>
          </div>

        </div>
      </div>
    </div>
  );
}