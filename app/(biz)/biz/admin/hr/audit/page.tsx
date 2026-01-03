import { createClient } from '@/utils/supabase/server';
import { getIncompleteStaffProfiles } from '@/utils/supabase/queries';
import UserStatusAvatar from '@/components/UserStatusAvatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, ArrowRight } from 'lucide-react';

export default async function HRAuditPage() {
  const supabase = await createClient();
  const incompleteProfiles = await getIncompleteStaffProfiles(supabase);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white">
        HR <span className="text-orange-500">Audit</span>
      </h1>

      {incompleteProfiles.length === 0 ? (
        <Card className="bg-green-500/10 border-green-500/50">
          <CardContent className="py-6 text-green-500 font-bold">
            All staff members have complete operational metadata.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          <div className="flex items-center gap-2 text-red-500 mb-2">
            <AlertCircle size={20} />
            <span className="font-bold uppercase text-sm">
              {incompleteProfiles.length} Profiles require immediate sync
            </span>
          </div>
          
          {incompleteProfiles.map((user) => (
            <Card key={user.id} className="bg-zinc-950 border-zinc-800 hover:border-orange-500/50 transition-colors">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  {/* Avatar provides the Pencil link to the unified /account page */}
                  <UserStatusAvatar user={user} currentUserLevel={900} size="md" />
                  <div>
                    <p className="font-bold text-white">{user.full_name}</p>
                    <p className="text-xs text-zinc-500 font-mono">{user.email}</p>
                  </div>
                </div>
                <div className="text-right">
                   <p className="text-[10px] font-black text-red-500 uppercase italic">Missing Metadata</p>
                   <p className="text-[10px] text-zinc-600">Click pencil to fix</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}