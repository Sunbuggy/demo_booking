import Landing from '../components/landing';
import { fetch_from_old_db, getTimeSortedData } from '@/utils/old_db/helpers';
import { Reservation } from '../types';
import { getUserDetails } from '@/utils/supabase/queries';
import AdminPanel from '../components/admin-panel';
import Link from 'next/link';
const BizPage = async ({
  params,
  searchParams
}: {
  params: { date: string };
  searchParams: { dcos: boolean };
}) => {
  const date = params.date;
  const dcos = searchParams.dcos;
  const user = await getUserDetails();
  const role = user?.user_level;
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
        {role && role > 899 && <AdminPanel display_cost={dcos} />}
        {loadedData && role && role > 350 ? (
          <Landing data={loadedData} display_cost={dcos} role={role} />
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
      </div>
    );
  }
};

export default BizPage;
