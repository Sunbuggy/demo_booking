/**
 * @file /app/biz/admin/health/page.tsx
 * @description Operational entry point for SunBuggy Infrastructure Monitoring.
 * This file MUST be a default export to satisfy Next.js routing requirements.
 */
import HealthDashboard from '@/components/admin/HealthDashboard';

/**
 * HealthPage component.
 * This serves as the 'Leaf' for the /biz/admin/health route.
 */
export default function HealthPage() {
  return (
    <div className="flex flex-col min-h-screen bg-zinc-950">
      <main className="flex-1 p-6 md:p-12">
        <div className="max-w-6xl mx-auto">
          {/* Dashboard Header */}
          <div className="mb-10 border-b border-zinc-800 pb-8">
            <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase">
              Ops <span className="text-orange-500">Health</span>
            </h1>
            <p className="text-zinc-500 font-mono text-xs mt-2 uppercase tracking-widest">
              Digital Fleet & Communication Audit // root: sunbuggy.com
            </p>
          </div>

          {/* Impact Analysis: This component performs the DNS SPF/DKIM validation.
            Ensure 'HealthDashboard.tsx' uses a 'default export' as well.
          */}
          <HealthDashboard />
        </div>
      </main>
    </div>
  );
}