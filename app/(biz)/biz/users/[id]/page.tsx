import {
  checkIfUserHasLevel,
  getEmployeeDetails,
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
  const signedInUserId = await supabase.auth
    .getUser()
    ?.then((user) => user.data.user?.id);
  const isUserAdmin = await checkIfUserHasLevel(
    supabase,
    signedInUserId || '',
    900
  );
  const profilePicResponse = await fetchObjects(
    bucket,
    true,
    `profile_pic/${params.id}`
  );
  const profilePic = String(profilePicResponse?.url);
  if (isUserAdmin)
    return (
      <>
        <UserImage profilePic={profilePic} user_id={user[0].id} />
        <UserForm user={user[0]} empDetails={empDetails} />
      </>
    );
};

export default UserPage;
