'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { FaSearch, FaArrowRight, FaTrash, FaUserCheck, FaExclamationTriangle, FaCopy } from 'react-icons/fa';
import { toast } from 'sonner';
import { searchEmployees, getEmployeeStats, mergeAndRemoveUser } from '@/app/actions/admin-cleanup';

/**
 * SUB-COMPONENT: USER STAT CARD
 */
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
    }
  }, [user]);

  if (!user) {
    return (
      <div className="h-full min-h-[200px] border-2 border-dashed border-slate-700/50 rounded-xl flex items-center justify-center text-slate-500 bg-slate-900/20">
        <span className="text-sm">Select a user from the list</span>
      </div>
    );
  }

  return (
    <Card className={`relative border-2 shadow-lg transition-all ${
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
          <span className="text-md font-bold text-white tracking-tight truncate">{user.full_name}</span>
          <span className="text-[10px] text-slate-400 font-mono truncate">{user.email}</span>
          {user.stage_name && (
            <span className="text-[10px] text-yellow-500 font-bold uppercase mt-1 tracking-wider">
              AKA: {user.stage_name}
            </span>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3 px-4 pb-4">
        {/* SCORECARD GRID */}
        <div className="grid grid-cols-3 gap-1 text-center">
          <div className="p-1.5 bg-slate-900/80 rounded border border-slate-800">
            <div className="text-[9px] text-slate-500 uppercase font-bold">Punches</div>
            <div className="text-lg font-bold text-white">{loading ? '-' : stats?.punches}</div>
          </div>
          <div className="p-1.5 bg-slate-900/80 rounded border border-slate-800">
            <div className="text-[9px] text-slate-500 uppercase font-bold">Shifts</div>
            <div className="text-lg font-bold text-white">{loading ? '-' : stats?.shifts}</div>
          </div>
          <div className="p-1.5 bg-slate-900/80 rounded border border-slate-800">
            <div className="text-[9px] text-slate-500 uppercase font-bold">Fleet</div>
            <div className="text-lg font-bold text-white">{loading ? '-' : stats?.fleet}</div>
          </div>
        </div>

        {/* METADATA */}
        <div className="flex flex-col gap-0.5 text-[10px] text-slate-500 text-center pt-2 border-t border-slate-800/50">
          <div className="flex items-center justify-center gap-2 group cursor-pointer" onClick={() => { navigator.clipboard.writeText(user.id); toast.success('ID Copied'); }}>
             <span className="font-mono group-hover:text-slate-300 transition-colors">
               ID: {user.id.slice(0, 18)}...
             </span>
             <FaCopy className="opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        <div className={`text-center py-1 rounded text-[10px] font-bold uppercase tracking-widest mt-1 ${
          isTarget ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {isTarget ? 'KEEP (MASTER)' : 'DELETE (DUPLICATE)'}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * MAIN PAGE COMPONENT
 */
export default function UserCleanupPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [sourceUser, setSourceUser] = useState<any>(null);
  const [targetUser, setTargetUser] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

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

  const handleMerge = async () => {
    if (!sourceUser || !targetUser) return;
    const confirmMsg = `WARNING: IRREVERSIBLE ACTION\n\n1. All history from "${sourceUser.full_name}" will move to "${targetUser.full_name}".\n2. The profile for "${sourceUser.full_name}" (${sourceUser.email}) will be DELETED.\n\nAre you sure?`;
    if (!confirm(confirmMsg)) return;

    setIsProcessing(true);
    try {
      await mergeAndRemoveUser(sourceUser.id, targetUser.id);
      toast.success('Merge Complete! Duplicate user deleted.');
      setSourceUser(null);
      setTargetUser(null);
      handleSearch(); 
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Merge failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // REMOVED 'min-h-screen' to fix scrolling issue
  return (
    <div className="w-full bg-slate-950 p-4 text-slate-200">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col gap-1 border-b border-slate-800 pb-4">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
             <FaUserCheck className="text-yellow-500" />
             Duplicate Account Fixer
          </h1>
          <p className="text-sm text-slate-400">
            Safely merge duplicate accounts. Select the "Source" (Bad) and "Target" (Good).
          </p>
        </div>

        {/* --- WORKBENCH AREA --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT: Search & List */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 shadow-sm">
              <form onSubmit={handleSearch} className="flex gap-2">
                <Input 
                  placeholder="Search employees..." 
                  className="bg-slate-950 border-slate-700 text-white placeholder:text-slate-500 focus:ring-yellow-500 h-9 text-sm"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                />
                <Button type="submit" size="sm" className="bg-slate-800 hover:bg-slate-700 text-white border border-slate-700">
                  <FaSearch />
                </Button>
              </form>
            </div>

            {/* Scrollable list with fixed height to prevent page overflow */}
            <div className="h-[400px] overflow-y-auto space-y-2 pr-2 custom-scrollbar border border-slate-800/50 rounded-lg p-2 bg-slate-900/20">
              {results.length > 0 ? (
                results.map((u) => {
                  const isSource = sourceUser?.id === u.id;
                  const isTarget = targetUser?.id === u.id;
                  const isSelected = isSource || isTarget;

                  return (
                    <div 
                      key={u.id} 
                      onClick={() => !isSelected && selectUser(u)}
                      className={`p-2 rounded border transition-all cursor-pointer group
                        ${isSource ? 'bg-red-950/30 border-red-900/50 opacity-80' : 
                          isTarget ? 'bg-green-950/30 border-green-900/50 opacity-80' : 
                          'bg-slate-900/50 border-slate-800 hover:bg-slate-800 hover:border-slate-600'}
                      `}
                    >
                      <div className="flex justify-between items-center">
                        <div className="overflow-hidden">
                          <div className={`font-bold text-sm truncate ${isSelected ? 'text-slate-400' : 'text-white group-hover:text-yellow-500'}`}>
                            {u.full_name}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate">{u.email}</div>
                        </div>
                        {isSource && <span className="text-[9px] font-bold bg-red-900 text-red-200 px-1.5 py-0.5 rounded ml-2">DEL</span>}
                        {isTarget && <span className="text-[9px] font-bold bg-green-900 text-green-200 px-1.5 py-0.5 rounded ml-2">KEEP</span>}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center text-slate-600 py-12 flex flex-col items-center gap-2">
                   <FaSearch className="text-xl opacity-20" />
                   <span className="text-xs">Search to find users</span>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Comparison */}
          <div className="lg:col-span-8 flex flex-col">
             <div className="flex flex-col md:flex-row items-start gap-4 mb-6">
                <div className="flex-1 w-full">
                   <UserStatCard 
                     user={sourceUser} 
                     isTarget={false} 
                     onDeselect={() => setSourceUser(null)} 
                   />
                </div>

                <div className="flex flex-col justify-center items-center py-2 md:py-12">
                  <FaArrowRight className="hidden md:block text-xl text-slate-600" />
                  <div className="md:hidden text-xl text-slate-600">⬇️</div>
                </div>

                <div className="flex-1 w-full">
                   <UserStatCard 
                     user={targetUser} 
                     isTarget={true} 
                     onDeselect={() => setTargetUser(null)} 
                   />
                </div>
             </div>

             <div className="bg-slate-900/30 p-4 rounded-xl border border-slate-800 flex flex-col items-center justify-center gap-3 mt-auto">
               <div className="flex items-center gap-2 text-[10px] text-amber-500/80 bg-amber-950/20 px-3 py-1 rounded-full border border-amber-900/20">
                 <FaExclamationTriangle />
                 <span>Safety Check: Confirm punch counts before merging.</span>
               </div>

               <Button 
                 size="lg"
                 className="w-full max-w-sm bg-red-600 hover:bg-red-500 text-white font-bold tracking-wide shadow-lg shadow-red-900/20"
                 disabled={!sourceUser || !targetUser || isProcessing}
                 onClick={handleMerge}
               >
                 {isProcessing ? 'Processing...' : 'MERGE RECORDS & DELETE DUPLICATE'}
               </Button>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}