// app/(biz)/biz/reports/authorizenet/settled/page.tsx
// Authorize.Net Settled Transactions Report Page
// - Restores the date range picker (first_date / last_date)
// - Uses absolute URLs via NEXT_PUBLIC_SITE_URL (your existing env var)
// - Server-side rendering with dynamic fetching
// - Simple, clean table (no extra client component needed)

import { format } from 'date-fns';

// Helper to format date as YYYY-MM-DD (Authorize.Net expected format)
const formatDate = (date: Date): string => format(date, 'yyyy-MM-dd');

// Use your existing env var for absolute API URLs
const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export default async function SettledPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  // Await the searchParams promise (required in Next.js App Router)
  const params = await searchParams;

  // Get date range from URL query params, fallback to today
  const first_date = params.first_date || formatDate(new Date());
  const last_date = params.last_date || formatDate(new Date());

  // Build absolute URLs for the two Authorize.Net API routes
  const vegasUrl = `${baseUrl}/api/authorize-net/authorize-vegas?isSettled=true&first_date=${first_date}&last_date=${last_date}`;
  const vspUrl = `${baseUrl}/api/authorize-net/authorize-vsp?isSettled=true&first_date=${first_date}&last_date=${last_date}`;

  // Fetch both accounts in parallel
  const [vegasRes, vspRes] = await Promise.all([
    fetch(vegasUrl, { cache: 'no-store' }),
    fetch(vspUrl, { cache: 'no-store' }),
  ]);

  let vegasBatches: any[] = [];
  let vspBatches: any[] = [];
  let error: string | null = null;

  if (vegasRes.ok) {
    const data = await vegasRes.json();
    vegasBatches = data.batches || [];
  } else {
    error = 'Failed to load Vegas settled transactions';
  }

  if (vspRes.ok) {
    const data = await vspRes.json();
    vspBatches = data.batches || [];
  } else {
    if (!error) error = 'Failed to load Pismo settled transactions';
  }

  // Combine and sort by settlement date (newest first)
  const allBatches = [...vegasBatches, ...vspBatches]
    .filter((batch: any) => batch.settlementTimeUTC)
    .sort((a: any, b: any) => new Date(b.settlementTimeUTC).getTime() - new Date(a.settlementTimeUTC).getTime());

  return (
    <div className="py-8 px-4 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Authorize.Net Settled Transactions (Historical)</h1>
      <p className="text-gray-600 mb-8">
        Showing settled batches from before ~Dec 12, 2025 (Authorize.Net era).<br />
        For current charges, use the new NMI reports in the main Reports page.
      </p>

      {/* Date Range Picker Form */}
      <form className="mb-8 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Start Date
          </label>
          <input
            type="date"
            name="first_date"
            defaultValue={first_date}
            className="px-4 py-2 border border-gray-600 rounded bg-gray-800 text-white"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            End Date
          </label>
          <input
            type="date"
            name="last_date"
            defaultValue={last_date}
            className="px-4 py-2 border border-gray-600 rounded bg-gray-800 text-white"
            required
          />
        </div>
        <button
          type="submit"
          className="px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
        >
          Load Report
        </button>
      </form>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <strong>Error:</strong> {error}
        </div>
      )}

      {allBatches.length === 0 ? (
        <p className="text-gray-500 text-lg">No settled batches found for the selected date range.</p>
      ) : (
        <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Settlement Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Batch ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Account
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transactions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {allBatches.map((batch: any) => (
                <tr key={batch.batchId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(batch.settlementTimeUTC).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {batch.batchId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {batch.accountType || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                    ${parseFloat(batch.statistics?.statistic?.[0]?.chargeAmount || '0').toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {batch.statistics?.statistic?.[0]?.chargeCount || 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Force dynamic rendering so date range changes are reflected immediately
export const dynamic = 'force-dynamic';