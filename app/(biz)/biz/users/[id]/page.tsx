import {
  checkIfUserHasLevel,
  getEmployeeDetails,
  getQrHistoryByUser,
  getUserById
} from '@/utils/supabase/queries';
import { createClient } from '@/utils/supabase/server';
import React from 'react';
import UserForm from './user-form';
import UserImage from './components/user-image';
import { fetchObjects } from '@/utils/biz/pics/get';
const bucket = 'users';
const UserPage = async ({ params }: { params: { id: string } }) => {
  const supabase = createClient();
  const user = await getUserById(supabase, params.id);
  const empDetails = await getEmployeeDetails(supabase, params.id);
  const scans = await getQrHistoryByUser(supabase, params.id);
  const signedInUserId = await supabase.auth
    .getUser()
    ?.then((user) => user.data.user?.id);
  const isUserAdmin = await checkIfUserHasLevel(
    supabase,
    signedInUserId || '',
    900
  );
  const profilePic = await fetchObjects(
    bucket,
    true,
    `profile_pic/${params.id}`
  ).then((res) => res?.url);

  function convertScanLinks(scans: any[]) {
    // variable to hold only the links
    const links = [];
    // loop through the scans
    for (const scan of scans) {
      // if the scan has a link
      if (scan.link) {
        // push the link to the links array
        links.push(scan.link);
      }
    }
  }

  if (isUserAdmin)
    return (
      <>
        <UserImage profilePic={String(profilePic)} user_id={user[0].id} />
        <UserForm user={user[0]} empDetails={empDetails} />
      </>
    );
};

export default UserPage;
