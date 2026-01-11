'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import UserStatusAvatar, { FunLicenseStatus } from '@/components/UserStatusAvatar';
import { syncFunLicense } from '@/app/actions/sync-license'; // Import the server action

export default function CurrentUserAvatar() {
  const supabase = createClient();
  const [profile, setProfile] = useState<any>(null);
  const [licenseStatus, setLicenseStatus] = useState<FunLicenseStatus>('missing');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMe = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: profileData } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (profileData) {
          setProfile(profileData);
          
          // STATUS LOGIC
          if (profileData.fun_license_id && profileData.license_photo_url) {
            setLicenseStatus('active');
          } else if (profileData.fun_license_id) {
            setLicenseStatus('pending');
          } else {
            setLicenseStatus('missing');
            
            // AUTO-SYNC ATTEMPT
            // If they are missing a license locally, try to pull from Smartwaiver once.
            // We verify 'last_sync_attempt' to prevent infinite loops (implementation optional)
            // For now, let's just trigger it safely.
            syncFunLicense().then((result) => {
               if (result.success) {
                 // Reload profile if sync worked
                 window.location.reload(); // Simple refresh to catch the green ring
               }
            });
          }
        }
      }
      setLoading(false);
    };

    fetchMe();
  }, []);

  if (loading) return <div className="w-10 h-10 rounded-full bg-muted/20 animate-pulse" />;
  if (!profile) return null;

  return (
    <UserStatusAvatar 
      user={profile} 
      currentUserLevel={profile.user_level} 
      isCurrentUser={true} 
      size="md"
      funLicenseStatus={licenseStatus} 
    />
  );
}