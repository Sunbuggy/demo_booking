import Landing from '../components/landing';
import { getTimeSortedData } from '@/utils/old_db/helpers';
import { Reservation } from '../types';
import { getUserDetails } from '@/utils/supabase/queries';
import AdminPanel from '../components/panels/admin-panel';
import Link from 'next/link';
import TorchPanel from '../components/panels/torch-panel';
import PanelSelector from '../components/panels/panel-selector';
import { fetch_from_old_db } from '@/utils/old_db/actions';
import { Button } from '@/components/ui/button';
import { RiArrowLeftWideFill, RiArrowRightWideFill } from 'react-icons/ri';
import dayjs from 'dayjs';
import { createClient } from '@/utils/supabase/server';
import AddToHomeScreen from '@/components/add-to-home-screen/add-to-home-screen';

export const dynamic = 'force-dynamic';

const BizPage = async ({
  params,
  searchParams
}: {
  params: { date: string };
  searchParams: { dcos: boolean; torchc: boolean; admc: boolean };
}) => {
  const date = params.date;
  const dcos = searchParams.dcos;
  const supabase = createClient();
  const user = await getUserDetails(supabase);
  if (!user) return null;
  const role = user[0]?.user_level;
  const full_name = user[0]?.full_name;
  const yesterday = dayjs(date).subtract(1, 'day').format('YYYY-MM-DD');
  const tomorrow = dayjs(date).add(1, 'day').format('YYYY-MM-DD');
  // Regular expression to match the date format yyyy-dd-mm
  const dateFormatRegex = /^\d{4}-\d{2}-\d{2}$/;

  // Validate the date format
  if (!dateFormatRegex.test(date)) {
    console.error('Invalid date format. Expected format: yyyy-dd-mm');
    // Stop execution or throw an error
    throw new Error('Invalid date format');
  } else {
    const query = `SELECT * FROM reservations_modified WHERE sch_date = '${date}'`;
    // Proceed with your query execution
    const data = (await fetch_from_old_db(query)) as Reservation[];
    const loadedData = data && (await getTimeSortedData(data));
    return (
      <div className="min-h-screen flex flex-col gap-5">
        {role && role > 299 && (
          <div className="flex gap-2 justify-center items-center">
            <Link href={`/biz/${yesterday}`} passHref>
              <RiArrowLeftWideFill />
            </Link>
            <Link href="/biz/calendar" passHref>
              <Button>{date}</Button>
            </Link>
            <Link href={`/biz/${tomorrow}`} passHref>
              <RiArrowRightWideFill />
            </Link>
          </div>
        )}
        {role && role > 650 && (
          <PanelSelector
            role={role}
            admin={
              <AdminPanel display_cost={dcos} full_name={full_name || ''} />
            }
            torch={<TorchPanel full_name={full_name || ''} />}
          />
        )}

        {loadedData && role && role > 350 ? (
          <Landing
            data={loadedData}
            display_cost={dcos}
            role={role}
            date={date}
            full_name={full_name || ''}
          />
        ) : role && role < 350 ? (
          <div className="h-screen flex justify-center items-center">
            unauthorized
          </div>
        ) : !role ? (
          <div className="h-screen flex justify-center items-center gap-2">
            Please{' '}
            <Link
              href="/signin"
              className={`inline-flex items-center leading-6 font-medium transition ease-in-out duration-75 cursor-pointer dark:text-yellow-500 text-black rounded-md h-[36px] underline`}
            >
              Sign In
            </Link>
          </div>
        ) : (
          <div className="h-screen flex justify-center items-center">
            Loading ...
          </div>
        )}
        <AddToHomeScreen />
      </div>
    );
  }
};

export default BizPage;
