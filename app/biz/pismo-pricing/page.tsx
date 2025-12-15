// app/biz/pismo-pricing/page.tsx - Read-only view of legacy pismo_pricing table

'use client';

import { useState, useEffect } from 'react';

interface Vehicle {
  id: number;
  buggyName: string;
  seats: number;
  '1hr': number | null;
  '1.5hr': number | null;
  '2hr': number | null;
  '2.5hr': number | null;
  '3hr': number | null;
  '3.5hr': number | null;
  '4hr': number | null;
  onlineOrdering: number;
  phoneOrdering: number;
  typeVehicle: string;
  searchTerm: string;
  antiSearchTerm: string;
  chartOrder: number | null;
  belt: number | null;
  damageWaiver: number | null;
  deposit: number | null;
}

export default function PismoPricingAdmin() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchPricing();
  }, []);

  const fetchPricing = async () => {
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/pismo/legacy-pricing');
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.details || 'Network error');
      }
      const data = await res.json();
      setVehicles(data);
    } catch (err: any) {
      setMessage('Failed to load pricing from legacy database: ' + err.message);
    }
    setLoading(false);
  };

  if (loading) {
    return <div className="p-8 text-center text-3xl">Loading legacy pricing...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-full mx-auto">
        <h1 className="text-5xl font-bold text-center mb-8 text-orange-500">
          Pismo Vehicle Pricing Admin (Legacy Read-Only)
        </h1>

        <p className="text-center text-green-400 mb-8 text-lg">
          Live read-only view of old MySQL table: <strong>pismo_pricing</strong><br />
          Your PHP admin page remains the source of truth for edits.
        </p>

        {message && (
          <p className={`text-center text-2xl mb-8 ${message.includes('Failed') ? 'text-red-400' : 'text-green-400'}`}>
            {message}
          </p>
        )}

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-800">
                <th className="p-3 text-left">Buggy Name</th>
                <th className="p-3">Seats</th>
                <th className="p-3">1hr</th>
                <th className="p-3">1.5hr</th>
                <th className="p-3">2hr</th>
                <th className="p-3">2.5hr</th>
                <th className="p-3">3hr</th>
                <th className="p-3">3.5hr</th>
                <th className="p-3">4hr</th>
                <th className="p-3">Online</th>
                <th className="p-3">Phone</th>
                <th className="p-3">Type Vehicle</th>
                <th className="p-3">Search Term</th>
                <th className="p-3">Anti-Search</th>
                <th className="p-3">Chart Order</th>
                <th className="p-3">Belt</th>
                <th className="p-3">Damage Waiver</th>
                <th className="p-3">Deposit</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map(v => (
                <tr key={v.id} className="border-t border-gray-700 hover:bg-gray-800">
                  <td className="p-3">{v.buggyName}</td>
                  <td className="p-3 text-center">{v.seats}</td>
                  <td className="p-3 text-right">{v['1hr'] ?? ''}</td>
                  <td className="p-3 text-right">{v['1.5hr'] ?? ''}</td>
                  <td className="p-3 text-right">{v['2hr'] ?? ''}</td>
                  <td className="p-3 text-right">{v['2.5hr'] ?? ''}</td>
                  <td className="p-3 text-right">{v['3hr'] ?? ''}</td>
                  <td className="p-3 text-right">{v['3.5hr'] ?? ''}</td>
                  <td className="p-3 text-right">{v['4hr'] ?? ''}</td>
                  <td className="p-3 text-center">{v.onlineOrdering ? 'YES' : 'NO'}</td>
                  <td className="p-3 text-center">{v.phoneOrdering ? 'YES' : 'NO'}</td>
                  <td className="p-3">{v.typeVehicle}</td>
                  <td className="p-3">{v.searchTerm}</td>
                  <td className="p-3">{v.antiSearchTerm}</td>
                  <td className="p-3 text-center">{v.chartOrder ?? ''}</td>
                  <td className="p-3 text-right">{v.belt ?? ''}</td>
                  <td className="p-3 text-right">{v.damageWaiver ?? ''}</td>
                  <td className="p-3 text-right">{v.deposit ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="text-center mt-12">
          <button
            onClick={fetchPricing}
            className="bg-orange-600 hover:bg-orange-700 px-12 py-6 rounded text-3xl font-bold"
          >
            Refresh from Legacy DB
          </button>
        </div>

        <p className="text-center text-gray-400 mt-8">
          This page is read-only. Use your existing PHP admin to make changes.
        </p>
      </div>
    </div>
  );
}