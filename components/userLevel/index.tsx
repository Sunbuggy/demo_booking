import { createClient } from '@/utils/supabase/server';
import { getUser, getUserDetails, checkIfUserHasLevel } from '@/utils/supabase/queries';
import { type ReactNode, useEffect, useState } from 'react';

interface CheckUserLevelProps {
  children: ReactNode;
  setLevel?: number;
}

export default async function CheckUserLevel({ children, setLevel = 1 }: CheckUserLevelProps) {
  const supabase =  await createClient();
  const [userLevel, setUserLevel] = useState<number | null>(null);

  // Fetch the user and user details
  const user = await getUser(supabase);
  const userDetails = await getUserDetails(supabase);

  // If no user session is found, display the guest message or redirect to login
  if (!user || !userDetails) {
    return (
      <div className="flex h-screen w-screen items-center justify-center text-3xl ">
        You must be logged in to view this content.
      </div>
    );
  }

  // Set user level from userDetails
  setUserLevel(userDetails[0]?.user_level || null);

  // Check if the user meets the required level to view the content
  const hasSetLevel = await checkIfUserHasLevel(supabase, user.id, setLevel);

  if (!hasSetLevel) {
    return (
      <div className="flex h-screen w-screen items-center justify-center text-3xl ">
        You are not authorized to view this page.
      </div>
    );
  }

  // If all checks pass, render children and user level
  return <>{children}</>;
}
