import { fetch_from_old_db } from '@/utils/old_db/actions';
import { ElegantTable } from './components/table';

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

const Page = async ({
  searchParams
}: {
  searchParams: { first_date: string; last_date: string };
}) => {
  const unsettled_response1 = await fetch(
    `${process.env.NEXT_PUBLIC_SITE_URL}/api/authorize-net/authorize-vegas`
  );
  const unsettled_response2 = await fetch(
    `${process.env.NEXT_PUBLIC_SITE_URL}/api/authorize-net/authorize-vsp`
  );
  const unsettled_data1 = await unsettled_response1.json();
  const unsettled_data2 = await unsettled_response2.json();
  const unsettled_superData = (unsettled_data1.transactions ?? []).concat(
    unsettled_data2?.transactions ?? []
  ) as Data[];
  const unsettled_invoiceNumbers = unsettled_superData.map(
    (data) => data.invoiceNumber
  );
  const unsettled_query = `SELECT * FROM vegas_randy_numbers WHERE Res_ID IN (${unsettled_invoiceNumbers.join(`,`)})`;
  const oldDbData = (await fetch_from_old_db(
    unsettled_query
  )) as VegasReservations[];

  const unsettled_combinedData = unsettled_superData.map((data) => {
    const res = oldDbData.find(
      (oldData) => oldData.Res_ID === Number(data.invoiceNumber)
    );
    return {
      ...data,
      ...res,
      Res_Date: res?.Res_Date ? new Date(res.Res_Date) : undefined,
      Res_Time: res?.Res_Time || undefined
    };
  }) as UnsettledCombinedData[];

  return (
    <div className="container mx-auto py-10">
      <ElegantTable data={unsettled_combinedData} />
    </div>
  );
};

export default Page;
