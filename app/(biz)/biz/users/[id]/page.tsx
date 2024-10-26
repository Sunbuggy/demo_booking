import { getUserById, getUserDetailsById } from '@/utils/supabase/queries';
import { createClient } from '@/utils/supabase/server';
import React from 'react';
import UserForm from './user-form';

const UserPage = async ({ params }: { params: { id: string } }) => {
  const supabase = createClient();
  const user = await getUserById(supabase, params.id);
  if (user) console.log(user[0]);

  return <UserForm user={user[0]} />;
};

export default UserPage;
