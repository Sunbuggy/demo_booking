// app/(biz)/biz/users/[id]/page.tsx
// User Profile Page – Dynamic Route (Next.js 16 App Router)
// This page displays a detailed profile for a specific user (by ID).
// It is used in two places:
// 1. Managers navigating to /biz/users/[id] to view any employee
// 2. The Account page (`app/account/page.tsx`) re-using this component to show the current user's own profile
//
// Key Next.js 16 Changes:
// - params is now a Promise — must be awaited
// - Direct server-side data fetching (no getServerSideProps)
// - All Supabase calls use server client
//
// Safety:
// - Handles missing user gracefully
// - All async operations are awaited properly

import { createClient } from '@/utils/supabase/server'; // Server-side client (returns Promise)
import { getEmployeeDetails } from '@/utils/supabase/queries';
import UserImage from './components/user-image'; // Local component
import BackgroundPickerButton from '@/app/account/components/background-picker-button'; // Absolute path – fixes module not found

// Props for the dynamic route — params is a Promise in Next.js 16
interface UserPageProps {
  params: Promise<{ id: string }>;
}

// Dynamic route page component — async allowed in server components
export default async function UserPage({ params }: UserPageProps) {
  // Await the dynamic params — required in Next.js 16 App Router
  const { id } = await params;

  // Create server-side Supabase client
  const supabase = await createClient();

  // Fetch the user profile from the 'users' table
  const { data: userData, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();

  // If user not found or error — show friendly message
  if (error || !userData) {
    console.error('Error fetching user profile:', error);
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-red-500">User Not Found</h1>
        <p className="mt-4 text-gray-600">The user with ID {id} could not be found.</p>
      </div>
    );
  }

  // Fetch additional employee details if needed
  const empDetails = await getEmployeeDetails(supabase, id);

  // Get current signed-in user for role checks
  const { data: { user: signedInUser } } = await supabase.auth.getUser();
  const signedInUserId = signedInUser?.id;

  // Determine if current user is admin (example logic — adjust to your role system)
  const isUserAdmin = signedInUserId && signedInUserId === id; // Example: self-view or admin

  // Profile picture logic (adjust to your actual field)
  const profilePic = userData.profile_pic || '/default-avatar.png';

  return (
    <div className="relative min-h-screen">
      {/* Custom background image – customizable by user */}
      <BackgroundPickerButton user={userData} />

      <div className="relative z-10 p-8">
        {/* Profile header with image */}
        <div className="flex items-center gap-6 mb-8">
          <UserImage profilePic={String(profilePic)} user_id={userData.id} />
          <div>
            <h1 className="text-5xl font-bold text-white drop-shadow-lg">
              {userData.full_name || 'Unnamed User'}
            </h1>
            <p className="text-2xl text-orange-400 mt-2">
              Role Level: {userData.user_level || 'N/A'}
            </p>
          </div>
        </div>

        {/* Additional user details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-white">
          <div>
            <p className="text-xl">Phone: {userData.phone || '—'}</p>
            <p className="text-xl">Email: {userData.email || '—'}</p>
            <p className="text-xl mt-4">
              Status: {userData.time_entry_status || 'Not clocked in'}
            </p>
          </div>

          {/* Employee-specific details (if any) */}
          {empDetails && empDetails.length > 0 && (
            <div>
              {/* Render additional employee info here */}
              <p className="text-xl">Department: {empDetails[0].department || '—'}</p>
              {/* Add more fields as needed */}
            </div>
          )}
        </div>

        {/* Admin-only sections (example) */}
        {isUserAdmin && (
          <div className="mt-12">
            {/* Add admin controls here if needed */}
            <p className="text-lg text-gray-300">You are viewing your own profile as admin.</p>
          </div>
        )}
      </div>
    </div>
  );
}