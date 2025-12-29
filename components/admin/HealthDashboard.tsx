/**
 * @file /components/admin/HealthDashboard.tsx
 * @description A real-time health monitor for SunBuggy's digital fleet.
 */
'use client'

import { useState, useEffect } from 'react';
import { Activity, ShieldCheck, RefreshCcw, AlertTriangle } from 'lucide-react'; // Icons for visual context
import { getInfrastructureStatus } from '@/app/actions/health-actions';

export default function HealthDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    setLoading(true);
    const result = await getInfrastructureStatus();
    setData(result);
    setLoading(false);
  };

  // Initial load
  useEffect(() => { fetchStatus(); }, []);

  return (
    <div className="p-6 bg-slate-900 text-white rounded-xl shadow-2xl border border-slate-800">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Activity className="text-sunbuggy-orange animate-pulse" /> 
          Fleet Infrastructure Health
        </h2>
        <button 
          onClick={fetchStatus}
          disabled={loading}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg transition-all"
        >
          <RefreshCcw className={loading ? "animate-spin" : ""} size={16} />
          {loading ? 'Refreshing...' : 'Run Manual Check'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* SPF Status Card */}
        <StatusCard 
          title="SPF Record (Consolidated)"
          isValid={data?.spf.valid}
          details={data?.spf.records[0]}
          error={data?.spf.error}
        />

        {/* DKIM Status Card */}
        <StatusCard 
          title="Resend DKIM Verification"
          isValid={data?.dkim.valid}
          details={data?.dkim.records[0]}
          error={data?.dkim.error}
        />
      </div>

      <p className="mt-6 text-xs text-slate-500 italic">
        Last automated audit: {data?.lastChecked || 'Never'}
      </p>
    </div>
  );
}

function StatusCard({ title, isValid, details, error }: any) {
  return (
    <div className={`p-5 rounded-lg border ${isValid ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-slate-300">{title}</h3>
        {isValid ? 
          <ShieldCheck className="text-green-500" /> : 
          <AlertTriangle className="text-red-500" />
        }
      </div>
      
      <div className="text-sm">
        <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${isValid ? 'bg-green-500 text-black' : 'bg-red-500 text-white'}`}>
          {isValid ? 'Healthy' : 'Action Required'}
        </span>
        {error && <p className="text-red-400 mt-2 text-xs">Error: {error}</p>}
        {details && (
          <code className="block mt-3 p-2 bg-black/40 rounded text-[10px] break-all text-slate-400">
            {details}
          </code>
        )}
      </div>
    </div>
  );
}