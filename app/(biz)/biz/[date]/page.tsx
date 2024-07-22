import Landing from '../components/landing';
import { fetch_from_old_db, getTimeSortedData } from '@/utils/old_db/helpers';
import { Reservation } from '../types';
const BizPage = async ({ params }: { params: { date: string } }) => {
  const date = params.date;
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
    return <div>{loadedData && <Landing data={loadedData} />}</div>;
  }
};

export default BizPage;
