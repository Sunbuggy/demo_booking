import { createClient } from '@/utils/supabase/server';
import {
  getUser,
  getUserDetails
} from '@/utils/supabase/queries';
import { UserType } from '@/app/(biz)/biz/users/types';

export async function getServerSideProps() {
  const supabase = createClient();
  const user = await getUserDetails(supabase);

  return {
    props: { user }
  };
}

export default async function CheckUserLevel() {
  const supabase = createClient();
  const userDetails = await getUserDetails(supabase);
  const user = await getUser(supabase);

  return (
    <div className=" ">

    </div>
  );
}
