import { fetch_from_old_db } from '@/utils/old_db/actions';
import TableUI from '../settled/table-ui';
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

export type UnsettledCombinedData = Data & Partial<VegasReservations>;

const Page = async () => {
  const unsettledResponse1 = await fetch(
    `${process.env.NEXT_PUBLIC_SITE_URL}/api/authorize-net/authorize-vegas`,
    {
      cache: 'no-store',
    }
  );
  const unsettledResponse2 = await fetch(
    `${process.env.NEXT_PUBLIC_SITE_URL}/api/authorize-net/authorize-vsp`,
    {
      cache: 'no-store',
    }
  );

  const unsettled_data1 = await unsettledResponse1.json();
  const unflatSettled1 = unsettled_data1.transactions
    ? unsettled_data1.transactions.flat()
    : [];
  const unsettled_data2 = await unsettledResponse2.json();
  const unflatSettled2 = unsettled_data2.transactions
    ? unsettled_data2.transactions.flat()
    : [];
  const unsettled_superData = (unflatSettled1 ?? []).concat(
    unflatSettled2 ?? []
  ) as Data[];

  const unsettled_invoiceNumbers = unsettled_superData.map(
    (data) => data.invoiceNumber
  );
  
  if (unsettled_invoiceNumbers.length === 0) {
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

  const unsettled_query = `SELECT Res_ID, Book_Name, Location, Res_Date, Res_Time FROM vegas_randy_numbers WHERE Res_ID IN (${unsettled_invoiceNumbers.join(`,`)})`;
  const oldDbData = (await fetch_from_old_db(
    unsettled_query
  )) as VegasReservations[];

  const unsettled_combinedData = unsettled_superData.map((data) => {
    const res = oldDbData.find(
      (oldData) => oldData.Res_ID === Number(data.invoiceNumber)
    );
    return {
      ...data,
      Book_Name: res?.Book_Name || '',
      Location: res?.Location || '',
      Res_Date: res?.Res_Date || '',
      Res_Time: res?.Res_Time || ''
    };
  }) as UnsettledCombinedData[];

  return (
    <div>
      <TableUI data={unsettled_combinedData} />
    </div>
  );
};

export default Page;