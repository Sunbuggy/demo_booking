/**
 * User Profile Page (Server Component)
 * Path: app/(biz)/biz/users/[id]/page.tsx
 * * This page uses Next.js 16 conventions. In this version, dynamic route parameters 
 * (params) are handled as Promises to allow for better streaming and performance.
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server'; 

// These names were verified via terminal grep. 
// We import them from our central queries file.
import { 
  getUserById, 
  getEmployeeDetails, 
  getQrHistoryByUser,
  checkIfUserHasLevel 
} from '@/utils/supabase/queries'; 

// Components
import UserImage from './components/user-image'; 

/**
 * FIX: Absolute Imports (@/)
 * We use @/ to point to the root of the project. 
 * Because this file is inside a "Route Group" (the (biz) folder), 
 * relative paths like "../../" often break. This path ensures Vercel 
 * finds the BackgroundPickerButton regardless of folder nesting.
 */
import BackgroundPickerButton from '@/app/account/components/background-picker-button'; 

/**
 * TypeScript Interface
 * In Next.js 16, params must be typed as a Promise.
 */
interface UserPageProps {
  params: Promise<{ id: string }>;
}

export default async function UserPage({ params }: UserPageProps) {
  /**
   * 1. UNWRAPPING PARAMS
   * In Next.js 16, we MUST await params before accessing the 'id'.
   * This is a breaking change from older versions of Next.js.
   */
  const { id } = await params;

  /**
   * 2. SUPABASE AUTH & CLIENT
   * We create a server-side client to interact with the database.
   * We also fetch the logged-in user to check if they have permission to be here.
   */
  const supabase = await createClient();
  const { data: { user: signedInUser } } = await supabase.auth.getUser();

  /**
   * 3. DATA FETCHING
   * We use the ID from the URL to fetch the specific user's data.
   * getUserById returns an array, so we check if it has at least one entry.
   */
  const userArray = await getUserById(supabase, id);
  const userData = userArray && userArray.length > 0 ? userArray[0] : null;

  // SAFETY: If the user doesn't exist in the DB, stop and show an error.
  // This prevents the app from crashing when trying to read 'userData.full_name'.
  if (!userData) {
    return (
      <div className="p-8 text-center bg-gray-900 min-h-screen">
        <h1 className="text-2xl font-bold text-red-500">User Not Found</h1>
        <p className="mt-4 text-gray-400">No user exists with the ID: {id}</p>
      </div>
    );
  }

  /**
   * 4. CONDITIONAL DATA
   * Fetch secondary data like employee-specific rows or scan history.
   * These queries use the verified names from our queries.ts file.
   */
  const empDetails = await getEmployeeDetails(supabase, id);
  const scanHistory = await getQrHistoryByUser(supabase, id);

  /**
   * 5. PERMISSION CHECK
   * We check if the person viewing this page is a Manager (Level 650+).
   * This ensures sensitive data isn't leaked to lower-level employees.
   */
  const isUserAdmin = await checkIfUserHasLevel(supabase, signedInUser?.id || '', 650);

  // Fallback for profile picture if one isn't set in the database
  const profilePic = userData.profile_pic || '/default-avatar.png';

  return (
    <div className="relative min-h-screen bg-gray-900 text-white">
      {/** * RENDER: Background Customization
       * This button allows the user to change their profile background.
       * We pass the 'userData' object as a prop.
       */}
      <BackgroundPickerButton user={userData} />

      {/** * MAIN CONTENT
       * z-10 ensures this content sits on top of the background image.
       */}
      <div className="relative z-10 max-w-6xl mx-auto p-8">
        
        {/* PROFILE HEADER */}
        <header className="flex flex-col md:flex-row items-center gap-8 mb-12 bg-black/30 p-8 rounded-3xl backdrop-blur-sm border border-white/10">
          <UserImage profilePic={String(profilePic)} user_id={userData.id} />
          <div className="text-center md:text-left">
            <h1 className="text-5xl font-extrabold tracking-tight">
              {userData.full_name || 'Unnamed User'}
            </h1>
            <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-4">
              <span className="px-4 py-1 bg-orange-600 rounded-full text-sm font-bold uppercase tracking-widest">
                Level {userData.user_level}
              </span>
              <span className="px-4 py-1 bg-gray-700 rounded-full text-sm font-medium">
                {userData.time_entry_status || 'Clocked Out'}
              </span>
            </div>
          </div>
        </header>

        {/* DETAILS GRID */}
        <main className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* USER INFO CARD */}
          <section className="bg-gray-800/80 p-6 rounded-2xl border border-gray-700 shadow-xl">
            <h2 className="text-xl font-bold mb-4 text-orange-400 uppercase tracking-wider">Contact Information</h2>
            <ul className="space-y-4">
              <li className="flex justify-between border-b border-gray-700 pb-2">
                <span className="text-gray-400">Email</span>
                <span className="font-mono">{userData.email || 'N/A'}</span>
              </li>
              <li className="flex justify-between border-b border-gray-700 pb-2">
                <span className="text-gray-400">Phone</span>
                <span className="font-mono">{userData.phone || 'N/A'}</span>
              </li>
            </ul>
          </section>

          {/* EMPLOYEE DATA CARD */}
          <section className="bg-gray-800/80 p-6 rounded-2xl border border-gray-700 shadow-xl">
            <h2 className="text-xl font-bold mb-4 text-orange-400 uppercase tracking-wider">Internal Records</h2>
            {empDetails ? (
              <div className="space-y-4">
                <p className="text-gray-300">
                  <span className="block text-xs text-gray-500 uppercase">Department</span>
                  {empDetails.department || 'Operations'}
                </p>
                <p className="text-gray-300">
                  <span className="block text-xs text-gray-500 uppercase">Total Scans</span>
                  {scanHistory?.length || 0} vehicle interactions recorded
                </p>
              </div>
            ) : (
              <p className="text-gray-500 italic">No additional employee details found.</p>
            )}
          </section>

        </main>

        {/* ADMIN VIEW INDICATOR */}
        {isUserAdmin && (
          <div className="mt-12 text-center">
            <div className="inline-block px-6 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <p className="text-yellow-500 text-sm font-medium">
                🛡️ Manager View Enabled
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}