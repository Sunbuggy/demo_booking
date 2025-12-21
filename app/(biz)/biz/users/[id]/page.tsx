/**
 * User Profile Page (Server Component)
 * Path: app/(biz)/biz/users/[id]/page.tsx
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server'; 
import { 
  getUserById, 
  getEmployeeDetails, 
  getQrHistoryByUser,
  checkIfUserHasLevel 
} from '@/utils/supabase/queries'; 

import UserImage from './components/user-image'; 
import BackgroundPickerButton from '@/app/account/components/background-picker-button'; 

interface UserPageProps {
  params: Promise<{ id: string }>;
}

export default async function UserPage({ params }: UserPageProps) {
  // 1. Await params (Next.js 16)
  const { id } = await params;

  // 2. Setup Supabase
  const supabase = await createClient();
  const { data: { user: signedInUser } } = await supabase.auth.getUser();

  // 3. Fetch User Data
  const userArray = await getUserById(supabase, id);
  const userData = userArray && userArray.length > 0 ? userArray[0] : null;

  if (!userData) {
    return (
      <div className="p-8 text-center bg-gray-900 min-h-screen text-white">
        <h1 className="text-2xl font-bold text-red-500">User Not Found</h1>
        <p className="mt-4 text-gray-400">No user exists with the ID: {id}</p>
      </div>
    );
  }

  // 4. Fetch Secondary Data
  const empDetailsArray = await getEmployeeDetails(supabase, id);
  // FIX: Extract the first item from the array safely
  const employeeRecord = empDetailsArray && empDetailsArray.length > 0 ? empDetailsArray[0] : null;

  const scanHistory = await getQrHistoryByUser(supabase, id);

  // 5. Permissions
  const isUserAdmin = await checkIfUserHasLevel(supabase, signedInUser?.id || '', 650);

  const profilePic = userData.profile_pic || '/default-avatar.png';

  return (
    <div className="relative min-h-screen bg-gray-900 text-white">
      <BackgroundPickerButton user={userData} />

      <div className="relative z-10 max-w-6xl mx-auto p-8">
        
        {/* HEADER */}
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

        {/* MAIN GRID */}
        <main className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* CONTACT INFO */}
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

          {/* EMPLOYEE RECORDS */}
          <section className="bg-gray-800/80 p-6 rounded-2xl border border-gray-700 shadow-xl">
            <h2 className="text-xl font-bold mb-4 text-orange-400 uppercase tracking-wider">Internal Records</h2>
            {employeeRecord ? (
              <div className="space-y-4">
                <p className="text-gray-300">
                  <span className="block text-xs text-gray-500 uppercase">Primary Position</span>
                  {/* FIX: Used 'primary_position' because 'department' does not exist in the database query */}
                  {employeeRecord.primary_position || 'Staff'}
                </p>
                <p className="text-gray-300">
                  <span className="block text-xs text-gray-500 uppercase">Work Location</span>
                  {employeeRecord.primary_work_location || 'Main Office'}
                </p>
                <p className="text-gray-300">
                  <span className="block text-xs text-gray-500 uppercase">Total Scans</span>
                  {scanHistory?.length || 0} vehicle interactions
                </p>
              </div>
            ) : (
              <p className="text-gray-500 italic">No additional employee details found.</p>
            )}
          </section>

        </main>

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