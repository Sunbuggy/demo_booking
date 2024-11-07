import {
  checkIfUserHasLevel,
  fetchVehicles,
  getEmployeeDetails,
  getQrHistoryByUser,
  getUserById
} from '@/utils/supabase/queries';
import { createClient } from '@/utils/supabase/server';
import React from 'react';
import UserForm from './user-form';
import UserImage from './components/user-image';
import { fetchObjects } from '@/utils/biz/pics/get';
import { Database } from '@/types_db';
import ScanHistory from './components/scan-history';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import ScannerPage from '@/components/ui/QrScanner/QrFunction';

const bucket = 'users';
const UserPage = async ({ params }: { params: { id: string } }) => {
  const supabase = createClient();
  const user = await getUserById(supabase, params.id);
  const empDetails = await getEmployeeDetails(supabase, params.id);
  const scans = (await getQrHistoryByUser(
    supabase,
    params.id
  )) as Database['public']['Tables']['qr_history']['Row'][];
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

  // using await fetchVehicles(supabase) fetch all vehicles and from the scans get the vehicle_id column and filter the vehicles by the vehicle_id column

  const vehicleData =
    (await fetchVehicles(supabase).then((res) =>
      res.filter((vehicle) =>
        scans.some((scan) => scan.vehicle_id === vehicle.id)
      )
    )) || [];

  if (isUserAdmin)
    return (
      <>
        <UserImage profilePic={String(profilePic)} user_id={user[0].id} />
        <Accordion type="single" collapsible>
          <AccordionItem value="user-form">
            <AccordionTrigger>Update User Details</AccordionTrigger>
            <AccordionContent>
              <UserForm user={user[0]} empDetails={empDetails} />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="scan-history">
            <AccordionTrigger>User Scan History</AccordionTrigger>
            <AccordionContent>
              <ScanHistory scans={vehicleData} />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="search-history">
            <AccordionTrigger>Search Scan History</AccordionTrigger>
            <AccordionContent>
            <ScannerPage user={user ? user[0] : null} />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </>
    );
};

export default UserPage;
