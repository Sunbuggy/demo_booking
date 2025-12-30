'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import UserStatusAvatar from '@/components/UserStatusAvatar';
import { Loader2 } from 'lucide-react';

export default function CurrentUserAvatar() {
  const supabase = createClient();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMe = async () => {
      // 1. Get Auth ID
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // 2. Get Full Profile (Job Title, Phone, Level, etc.)
        const { data: profileData } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (profileData) {
          setProfile(profileData);
        }
      }
      setLoading(false);
    };

    fetchMe();
  }, []);

  if (loading) return <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />;
  if (!profile) return null;

  return (
    <UserStatusAvatar 
      user={profile} 
      currentUserLevel={profile.user_level} 
      isCurrentUser={true} // Enables Timeclock / Theme / Sign Out
      size="md"
    />
  );
}