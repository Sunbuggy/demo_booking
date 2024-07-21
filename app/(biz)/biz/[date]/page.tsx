import Landing from '../components/landing';
import { fetch_from_old_db, getTimeSortedData } from '@/utils/old_db/helpers';
import { Reservation } from '../types';
const BizPage = async ({ params }: { params: { date: string } }) => {
  const date = params.date;
  const query = `SELECT * FROM reservations_modified WHERE sch_date = '${date}'`;
  const data = (await fetch_from_old_db(query)) as Reservation[];
  const loadedData = data && (await getTimeSortedData(data));

  return <div>{loadedData && <Landing data={loadedData} />}</div>;
};

export default BizPage;
