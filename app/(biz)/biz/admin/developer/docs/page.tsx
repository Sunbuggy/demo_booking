/**
 * @file app/(biz)/biz/admin/developer/docs/page.tsx
 * @description LIVING DOCUMENTATION.
 * Updated: Added "Auth & Smart Routing" Architecture.
 * ACCESS: Level 950+ (Developers) Only.
 */
import React from 'react';
import { 
  ShieldAlert, 
  FolderTree, 
  Server, 
  FileCode,
  AlertTriangle,
  CheckCircle2, 
  CircleDashed,
  CalendarClock,
  KeyRound // Added for Auth Section
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function DeveloperDocsPage() {
  
  // SHARED STYLES
  // The "Frosted Glass" Effect: Semi-transparent white + Blur for Light Mode.
  // Dark Mode stays deep zinc but with a slight transparency for consistency.
  const glassCardStyles = "bg-white/60 dark:bg-zinc-950/80 backdrop-blur-md border-white/40 dark:border-zinc-800 shadow-xl transition-all hover:shadow-2xl hover:bg-white/70 dark:hover:bg-zinc-950/90";
  const glassHeaderStyles = "text-zinc-800 dark:text-zinc-100";
  const glassTextStyles = "text-zinc-600 dark:text-zinc-400";
  
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 pb-20">
      
      {/* HEADER */}
      <div className="space-y-2 mb-10">
        <h1 className="text-4xl font-black uppercase tracking-tighter text-yellow-500 drop-shadow-sm">
          System Architecture <span className="text-zinc-900 dark:text-white">& Standards</span>
        </h1>
        <p className="text-zinc-700 dark:text-zinc-400 max-w-3xl font-medium bg-white/40 dark:bg-transparent p-2 rounded-lg backdrop-blur-sm inline-block">
          This document explains "where things go and why." Use this as a reference for maintaining
          the SunBuggy digital ecosystem. If you change a core pattern, update this page.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: CORE STRUCTURE */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* 1. USER LEVELS & SECURITY */}
          <Card className={glassCardStyles}>
            <CardHeader>
              <div className="flex items-center gap-2 text-red-600 dark:text-red-500">
                <ShieldAlert size={24} />
                <CardTitle className="uppercase tracking-widest">Security & Permissions</CardTitle>
              </div>
              <CardDescription className={glassTextStyles}>The Single Source of Truth for Access Control (0-950).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 overflow-hidden backdrop-blur-sm">
                <table className="w-full text-sm text-left">
                  <thead className="bg-zinc-100/80 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 uppercase text-xs font-bold">
                    <tr>
                      <th className="p-3">Level</th>
                      <th className="p-3">Role</th>
                      <th className="p-3">Scope / Visibility</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-zinc-700 dark:text-zinc-300">
                    <tr>
                      <td className="p-3 font-mono text-blue-600 dark:text-blue-400 font-bold">0</td>
                      <td className="p-3 font-bold">GUEST</td>
                      <td className="p-3">Public Website. No DB Record. Virtual Level.</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono text-blue-600 dark:text-blue-400 font-bold">100</td>
                      <td className="p-3 font-bold">CUSTOMER</td>
                      <td className="p-3">Authenticated. Can see own bookings/waivers.</td>
                    </tr>
                    <tr className="bg-orange-50/50 dark:bg-orange-900/10">
                      <td className="p-3 font-mono text-orange-600 dark:text-orange-500 font-bold">300</td>
                      <td className="p-3 font-bold">STAFF</td>
                      <td className="p-3">
                        Roster Access. Can view Fleet/Schedules. <br/>
                        <span className="text-xs text-zinc-500 italic">Includes Drivers, Mechanics, Front Desk.</span>
                      </td>
                    </tr>
                    <tr className="bg-orange-50/50 dark:bg-orange-900/10">
                      <td className="p-3 font-mono text-orange-600 dark:text-orange-500 font-bold">500</td>
                      <td className="p-3 font-bold">MANAGER</td>
                      <td className="p-3">Operations. Can Edit Schedules, Assign Fleet.</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono text-red-600 dark:text-red-500 font-bold">900</td>
                      <td className="p-3 font-bold">ADMIN</td>
                      <td className="p-3">System Config. User Role Management.</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono text-red-600 dark:text-red-500 font-bold">925</td>
                      <td className="p-3 font-bold">HR</td>
                      <td className="p-3">Sensitive Data (Payroll, SSN, Audits).</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono text-green-600 dark:text-green-500 font-bold">950</td>
                      <td className="p-3 font-bold">DEV</td>
                      <td className="p-3">Root Access. System Health. Database Direct.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg backdrop-blur-sm">
                <h4 className="text-red-600 dark:text-red-400 font-bold text-xs uppercase mb-2 flex items-center gap-2">
                  <AlertTriangle size={14} /> Critical Security Pattern
                </h4>
                <p className="text-xs text-zinc-700 dark:text-zinc-400 leading-relaxed">
                  <strong>RLS (Row Level Security)</strong> is enabled on all tables. 
                  Regular <code>supabaseClient</code> queries will respect these rules. 
                  However, specific server actions use a <strong>Service Role (Admin) Client</strong> 
                  to perform necessary lookups (e.g., fetching names) that regular users are blocked from seeing.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 2. NEW: AUTH & ROUTING ARCHITECTURE */}
          <Card className={glassCardStyles}>
            <CardHeader>
              <div className="flex items-center gap-2 text-purple-600 dark:text-purple-500">
                <KeyRound size={24} />
                <CardTitle className="uppercase tracking-widest">Auth & Smart Routing</CardTitle>
              </div>
              <CardDescription className={glassTextStyles}>
                How we determine "Where to go" after sign-in.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              
              <div className="bg-purple-50/50 dark:bg-purple-900/10 p-3 rounded-lg border border-purple-100 dark:border-purple-800">
                <p className="font-bold text-purple-700 dark:text-purple-400 mb-2">The Decision Hierarchy</p>
                <ol className="list-decimal list-inside space-y-1 text-zinc-700 dark:text-zinc-300">
                  <li>
                    <strong>User Preference:</strong> Checks <code>users.homepage</code> (Managed in <code>/account</code>).
                  </li>
                  <li>
                    <strong>Role Check:</strong> If Level ≥ 300 (Staff), target <strong>Location Dashboard</strong>.
                  </li>
                  <li>
                    <strong>Location Resolve:</strong> Maps <code>primary_work_location</code> (e.g., "Las Vegas") to URL slug (<code>/biz/vegas</code>).
                  </li>
                  <li>
                    <strong>Fallback:</strong> Customers & Guests default to <strong>Root</strong> (<code>/</code>).
                  </li>
                </ol>
              </div>

              <div>
                <h4 className="font-bold text-zinc-800 dark:text-white mb-2">Key Files</h4>
                <ul className="space-y-2 pl-2">
                  <li className="flex gap-2">
                    <code className="text-xs bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded h-fit">src/lib/utils/auth-routing.ts</code>
                    <span className="text-xs text-zinc-500">
                      <strong>"The Brain"</strong>. [cite_start]Pure function that calculates destination paths[cite: 38].
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <code className="text-xs bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded h-fit">app/auth/callback/route.ts</code>
                    <span className="text-xs text-zinc-500">
                      Handles Magic Link/OAuth redirects. Queries profile <em>before</em> redirecting.
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <code className="text-xs bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded h-fit">app/page.tsx</code>
                    <span className="text-xs text-zinc-500">
                      <strong>"The Gatekeeper"</strong>. Redirects logged-in staff; renders Welcome UI for guests.
                    </span>
                  </li>
                </ul>
              </div>

            </CardContent>
          </Card>

          {/* 3. FILE STRUCTURE MAP */}
          <Card className={glassCardStyles}>
            <CardHeader>
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-500">
                <FolderTree size={24} />
                <CardTitle className="uppercase tracking-widest">Directory Map</CardTitle>
              </div>
              <CardDescription className={glassTextStyles}>Where we chose to place files and why.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              
              {/* SRC/LIB */}
              <div>
                <h3 className={`text-sm font-bold mb-2 flex items-center gap-2 ${glassHeaderStyles}`}>
                  <span className="text-blue-600 dark:text-blue-500">src/lib/</span> (The Brain)
                </h3>
                <ul className={`text-sm space-y-2 pl-4 border-l border-zinc-300 dark:border-zinc-800 ${glassTextStyles}`}>
                  <li>
                    <code className="text-zinc-900 dark:text-zinc-200 bg-black/5 dark:bg-white/10 px-1 rounded">constants/</code>: 
                    [cite_start]<strong> Single Sources of Truth.</strong> (e.g., <code>user-levels.ts</code>)[cite: 42].
                  </li>
                  <li>
                    <code className="text-zinc-900 dark:text-zinc-200 bg-black/5 dark:bg-white/10 px-1 rounded">utils/</code>: 
                    [cite_start]Pure helper functions (formatting dates, math, string manipulation)[cite: 43].
                  </li>
                </ul>
              </div>

              {/* APP ACTIONS */}
              <div>
                <h3 className={`text-sm font-bold mb-2 flex items-center gap-2 ${glassHeaderStyles}`}>
                  <span className="text-orange-600 dark:text-orange-500">app/actions/</span> (The Muscle)
                </h3>
                <ul className={`text-sm space-y-2 pl-4 border-l border-zinc-300 dark:border-zinc-800 ${glassTextStyles}`}>
                  <li>
                    [cite_start]All <strong>"Use Server"</strong> mutations live here[cite: 45].
                  </li>
                  <li>
                    [cite_start]<strong>Pattern:</strong> Validate Input (Zod) → Check Permissions (Auth) → Execute DB Query → Revalidate Path[cite: 46, 48].
                  </li>
                  <li>
                    <em>Example:</em> <code>approve-time-off.ts</code> handles Roster/Payroll logic consistently.
                  </li>
                </ul>
              </div>

              {/* BIZ ROUTING */}
              <div>
                <h3 className={`text-sm font-bold mb-2 flex items-center gap-2 ${glassHeaderStyles}`}>
                  <span className="text-yellow-600 dark:text-yellow-500">app/(biz)/</span> (The Protected Core)
                </h3>
                <ul className={`text-sm space-y-2 pl-4 border-l border-zinc-300 dark:border-zinc-800 ${glassTextStyles}`}>
                  <li>
                    [cite_start]Everything inside <code>(biz)</code> requires authentication[cite: 51].
                  </li>
                  <li>
                    [cite_start]<strong>Dashboard:</strong> <code>/biz/[location]/page.tsx</code>[cite: 52].
                  </li>
                  <li>
                    [cite_start]<strong>Admin Tools:</strong> <code>/biz/admin/...</code>[cite: 53].
                  </li>
                </ul>
              </div>

            </CardContent>
          </Card>

        </div>

        {/* RIGHT COLUMN: TECH STACK & DEBT */}
        <div className="space-y-8">
          
          {/* 4. TECH STACK */}
          <Card className={glassCardStyles}>
            <CardHeader>
              <div className="flex items-center gap-2 text-green-600 dark:text-green-500">
                <Server size={24} />
                <CardTitle className="uppercase tracking-widest">Tech Stack</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="border-zinc-400 dark:border-white/20 text-zinc-800 dark:text-zinc-200 bg-white/50">Next.js 16.1</Badge>
                <Badge variant="outline" className="border-blue-500/50 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20">TypeScript</Badge>
                <Badge variant="outline" className="border-green-500/50 text-green-600 dark:text-green-400 bg-green-50/50 dark:bg-green-900/20">Supabase</Badge>
                <Badge variant="outline" className="border-cyan-500/50 text-cyan-600 dark:text-cyan-400 bg-cyan-50/50 dark:bg-cyan-900/20">Tailwind</Badge>
                <Badge variant="outline" className="border-purple-500/50 text-purple-600 dark:text-purple-400 bg-purple-50/50 dark:bg-purple-900/20">Date-FNS</Badge>
              </div>
              <Separator className="bg-zinc-200 dark:bg-zinc-800" />
              <div className={`space-y-2 text-sm ${glassTextStyles}`}>
                <p><strong className="text-zinc-900 dark:text-white">State Management:</strong> Use URL Search Params (Nuqs) for filters. [cite_start]Use React Context only for global UI[cite: 57].</p>
                [cite_start]<p><strong className="text-zinc-900 dark:text-white">Data Fetching:</strong> Prefer Server Components fetching data directly via Supabase helpers[cite: 58].</p>
              </div>
            </CardContent>
          </Card>

          {/* 5. SCHEDULE LOGIC */}
          <Card className={glassCardStyles}>
            <CardHeader>
              <div className="flex items-center gap-2 text-orange-600 dark:text-orange-500">
                <CalendarClock size={24} />
                <CardTitle className="uppercase tracking-widest">Schedule Logic</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
              [cite_start]<p>The <strong>Roster Grid</strong> uses a strict hierarchy to determine what to display in a cell[cite: 60]:</p>
              <ol className="list-decimal list-inside space-y-1 ml-1">
                [cite_start]<li><strong className="text-green-600">Shift Card:</strong> (Top Priority) Shows if shift exists[cite: 61].</li>
                [cite_start]<li><strong className="text-yellow-600">Approved Off:</strong> Blocks cell (Yellow)[cite: 62].</li>
                [cite_start]<li><strong className="text-orange-600">Pending Request:</strong> Clickable Review Modal[cite: 63].</li>
                [cite_start]<li><strong className="text-blue-500">Preferred Off:</strong> Informational badge[cite: 64].</li>
              </ol>
              <Separator className="my-2"/>
              <p className="text-xs">
                <strong>CRITICAL:</strong> All date comparisons use <code>.substring(0,10)</code> to match "YYYY-MM-DD" strings strictly. This prevents UTC/Local timezone mismatch bugs.
              </p>
            </CardContent>
          </Card>

          {/* 6. CURRENT DEBT / TODO */}
          <Card className={`${glassCardStyles} border-dashed`}>
            <CardHeader>
              <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-500">
                <FileCode size={24} />
                <CardTitle className="uppercase tracking-widest">Tech Debt & Todos</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                
                {/* DONE */}
                <li className="flex items-start gap-2 text-sm text-green-700 dark:text-green-400 bg-green-50/50 dark:bg-green-950/20 p-2 rounded-lg">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="line-through opacity-80">
                    [cite_start]<strong>Mobile Roster UI:</strong> The Roster page needs polish for mobile users[cite: 71].
                  </span>
                  <Badge className="ml-auto bg-green-600 text-[10px] h-5">DONE (v9.7)</Badge>
                </li>

                {/* PARTIAL */}
                <li className="flex items-start gap-2 text-sm text-blue-700 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20 p-2 rounded-lg">
                  <CircleDashed className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-1 w-full">
                    <div className="flex justify-between items-center w-full">
                      <span className="font-bold">Moment.js Migration</span>
                      <Badge className="bg-blue-600 text-[10px] h-5">PARTIAL</Badge>
                    </div>
                    <span className="text-xs opacity-90">
                      Roster & Time Off modules now use <code>date-fns</code>. [cite_start]Legacy charts still use Moment[cite: 75].
                    </span>
                  </div>
                </li>

                {/* PENDING */}
                <li className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300 p-2 border border-orange-200 dark:border-orange-900 bg-orange-50/50 dark:bg-orange-950/20 rounded-lg">
                  <CircleDashed className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-orange-700 dark:text-orange-400">Dashboard URL Standardization</span>
                    <span className="text-xs">
                      [cite_start]Move Legacy Las Vegas Dashboard from root <code>/biz/[date]</code> to explicit <code>/biz/vegas/[date]</code>[cite: 77].
                    </span>
                  </div>
                </li>

              </ul>
            </CardContent>
          </Card>

           {/* 7. QUICK LINKS */}
           <Card className={glassCardStyles}>
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
                <a href="/biz/admin/health" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">System Health</a>
                <a href="/biz/users/admin" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">User Admin</a>
                <a href="/biz/schedule" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">Live Roster</a>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}