import { fetch_from_old_db } from '@/utils/old_db/actions';
import TableUI from './table-ui';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BackwardFilled } from '@ant-design/icons';

export interface Data {
  transId: string;
  submitTimeUTC: string;
  submitTimeLocal: string;
  transactionStatus: string;
  invoiceNumber: string;
  firstName: string;
  lastName: string;
  accountType: string;
  accountNumber: string;
  settleAmount: number;
  marketType: string;
  product: string;
}

export interface VegasReservations {
  Res_ID: number;
  Book_Name: string;
  Location: string;
  Res_Date: string;
  Res_Time: string;
}

export type SettledCombinedData = Data & Partial<VegasReservations>;

const Page = async ({
  searchParams
}: {
  searchParams: { first_date: string; last_date: string };
}) => {
  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const two_days_ago = new Date();
  two_days_ago.setDate(two_days_ago.getDate() - 2);
  const today = new Date();
  today.setDate(today.getDate());

  const formattedTwoDaysAgo = formatDate(two_days_ago);
  const formattedToday = formatDate(today);

  const first_date = searchParams.first_date;
  const last_date = searchParams.last_date;

  const settledResponse1 = await fetch(
    `${process.env.NEXT_PUBLIC_SITE_URL}/api/authorize-net/authorize-vegas?isSettled=true&first_date=${first_date || formattedTwoDaysAgo}&last_date=${last_date || formattedToday}`
  );
  const settledResponse2 = await fetch(
    `${process.env.NEXT_PUBLIC_SITE_URL}/api/authorize-net/authorize-vsp?isSettled=true&first_date=${first_date || formattedTwoDaysAgo}&last_date=${last_date || formattedToday}`
  );

  const settled_data1 = await settledResponse1.json();
  const flatSettled1 = settled_data1.all_transactions
    ? settled_data1.all_transactions.flat()
    : [];
  const settled_data2 = await settledResponse2.json();
  const flatSettled2 = settled_data2.all_transactions
    ? settled_data2.all_transactions.flat()
    : [];
  const settled_superData = (flatSettled1 ?? []).concat(
    flatSettled2 ?? []
  ) as Data[];

  const settled_invoiceNumbers = settled_superData.map(
    (data) => data.invoiceNumber
  );
  if (settled_invoiceNumbers.length === 0) {
    return (
      <div>
        <Link href={'/biz/reports'}>
          <Button variant={'outline'}>
            <BackwardFilled /> Back To Reports Page
          </Button>
        </Link>

        <h1>No Transactions For This Day</h1>
      </div>
    );
  }
  const settled_query = `SELECT * FROM vegas_randy_numbers WHERE Res_ID IN (${settled_invoiceNumbers.join(`,`)})`;
  const oldDbData = (await fetch_from_old_db(
    settled_query
  )) as VegasReservations[];

  const settled_combinedData = settled_superData.map((data) => {
    const res = oldDbData.find(
      (oldData) => oldData.Res_ID === Number(data.invoiceNumber)
    );
    return {
      ...data,
      ...res
    };
  }) as SettledCombinedData[];
  return (
    <div>
      <TableUI data={settled_combinedData} isSettled={true} />
    </div>
  );
};

export default Page;
