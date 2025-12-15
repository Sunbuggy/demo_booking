import { Suspense } from 'react';
import CasesTable from '../claim-table';
import { fetchCasesData } from '../actions';

export default async function CasesPage({
  params
}: {
  params: { id: string };
}) {
  const data = await fetchCasesData(params.id);

  if ('error' in data) {
    return <div>{data.error}</div>;
  }
  
  // Use type assertions to fix the compilation error
  return (
    <div>
      <Suspense fallback={<div>Loading...</div>}>
        <CasesTable
          initialSsts={data.ssts}
          userMap={data.userMap as Map<string, string | null>}  // Type assertion
          vehicleMap={data.vehicleMap as Map<string, string>}   // Type assertion
          userId={data.userId}
          userPhone={data.userPhone || ''}
        />
      </Suspense>
    </div>
  );
}