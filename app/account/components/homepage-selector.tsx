'use client';

import React, { useEffect, useState } from 'react';
import { getUserDetails, UserDetails } from '@/utils/supabase/queries';
import { createClient } from '@/utils/supabase/client';

function HomepageSelector() {
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedPage, setSelectedPage] = useState<string>('default');
  const supabase = createClient();

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const user = await getUserDetails(supabase);
        if (user && user.length > 0) {
          setUserDetails(user[0]);
        }
      } catch (error) {
        console.error('Error fetching user details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [supabase]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!userDetails) {
    return <div>Error: Unable to fetch user details.</div>;
  }

  const userLevel = userDetails.user_level ?? 0;

  if (userLevel >= 650) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Welcome to the Admin Dashboard!</h1>
        <p className="mb-4">Select your default homepage from the dropdown below:</p>
        <select
          value={selectedPage}
          onChange={(e) => setSelectedPage(e.target.value)}
          className="border border-gray-300 rounded p-2 mb-4"
        >
          <option value="default">Default Page</option>
          <option value="above100">Level Above 100 Page</option>
          <option value="level300">Level 300 Page</option>
        </select>
        {renderSelectedPage(selectedPage)}
      </div>
    );
  }

  if (userLevel >= 300) {
    return <PageForLevel300 />;
  }

  if (userLevel > 100) {
    return <PageForLevelAbove100 />;
  }

  return <DefaultPage />;
}

function renderSelectedPage(selectedPage: string) {
  switch (selectedPage) {
    case 'above100':
      return <PageForLevelAbove100 />;
    case 'level300':
      return <PageForLevel300 />;
    default:
      return <DefaultPage />;
  }
}

function PageForLevel300() {
  return (
    <div className="text-center">
      <h1 className="text-2xl font-bold">Welcome to Level 300 Page!</h1>
      <p>You have special access to advanced features.</p>
    </div>
  );
}

function PageForLevelAbove100() {
  return (
    <div className="text-center">
      <h1 className="text-2xl font-bold">Welcome to Level Above 100 Page!</h1>
      <p>You have access to intermediate features.</p>
    </div>
  );
}

function DefaultPage() {
  return (
    <div className="text-center">
      <h1 className="text-2xl font-bold">Welcome to the Default Page!</h1>
      <p>Explore and enjoy the basic features of the app.</p>
    </div>
  );
}

export default HomepageSelector;
