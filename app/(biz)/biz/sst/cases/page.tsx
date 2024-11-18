import { Suspense } from 'react';
import CasesTable from './cases-table';
import { fetchCasesData } from './actions';

export default async function CasesPage() {
  const data = await fetchCasesData();

  if ('error' in data) {
    return <div>{data.error}</div>;
  }
  return (
    <div>
      <Suspense fallback={<div>Loading...</div>}>
        <CasesTable
          initialSsts={data.ssts}
          userMap={data.userMap}
          vehicleMap={data.vehicleMap}
          userId={data.userId}
          userPhone={data.userPhone || ''}
        />
      </Suspense>
    </div>
  );
}
