'use client';

import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Loader2 } from 'lucide-react';

interface HomepageSelectProps {
  userId: string;
  currentHomepage: string | null;
  userLevel: number;
}

export default function HomepageSelect({ userId, currentHomepage, userLevel }: HomepageSelectProps) {
  const router = useRouter();
  // Default to 'BizPage' (Dashboard) if null, matching your desired default behavior
  const [selected, setSelected] = useState(currentHomepage || 'BizPage');
  const [isPending, startTransition] = useTransition();

  const handleUpdate = async (newValue: string) => {
    setSelected(newValue);
    const supabase = createClient();

    startTransition(async () => {
      const { error } = await supabase
        .from('users')
        .update({ homepage: newValue })
        .eq('id', userId);

      if (error) {
        console.error('Error updating homepage:', error);
        // Revert on error if needed, or show toast
      } else {
        router.refresh();
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative w-full">
        <select
          value={selected}
          onChange={(e) => handleUpdate(e.target.value)}
          disabled={isPending}
          className="w-full appearance-none bg-black/40 border border-white/20 rounded px-3 py-1.5 text-sm text-white focus:ring-2 focus:ring-primary outline-none disabled:opacity-50"
        >
          {/* Options mapped to auth-routing.ts keys */}
          <option value="BizPage">Location Dashboard (Default)</option>
          <option value="VehiclesManagementPage">Fleet Management</option>
          {userLevel >= 800 && <option value="UnsettledPage">Accounting: Unsettled</option>}
          {/* Admin Tools Option */}
          {userLevel >= 900 && <option value="AdminRoot">System Admin</option>}
        </select>
        
        {/* Loading Indicator or Down Arrow */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
           {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <span className="text-xs">▼</span>}
        </div>
      </div>
    </div>
  );
}