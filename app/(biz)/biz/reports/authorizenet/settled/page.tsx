import { fetch_from_old_db } from '@/utils/old_db/actions';

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
  const settled_data2 = await settledResponse2.json();

  const settled_superData = (settled_data1.transactions ?? []).concat(
    settled_data2?.transactions ?? []
  ) as Data[];

  const settled_invoiceNumbers = settled_superData.map(
    (data) => data.invoiceNumber
  );
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
  });
  console.log(settled_combinedData);
  return <div>page</div>;
};

export default Page;
