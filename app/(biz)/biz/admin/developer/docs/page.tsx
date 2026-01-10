/**
 * @file app/(biz)/biz/admin/developer/docs/page.tsx
 * @description LIVING DOCUMENTATION.
 * Updated: Roster v14.5 (Conflict Resolution), HR Command (LOCDEPJOB), Fleet v2.0.
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
  KeyRound,
  FileSpreadsheet,
  Clock,
  Printer,
  MousePointerClick,
  Palmtree,
  Database,
  LayoutTemplate,
  Ticket,
  ArrowRight,
  RefreshCcw,
  Lock,
  Car,   // Fleet
  Map,   // Fleet
  Radio, // Fleet
  Briefcase, // HR
  Network,   // HR
  Layers     // HR
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function DeveloperDocsPage() {
  
  // SHARED STYLES
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
        
        {/* LEFT COLUMN: CORE STRUCTURE (Span 2) */}
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

          {/* 2. FLEET COMMAND V2.0 */}
          <Card className={glassCardStyles}>
            <CardHeader className="border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-500">
                <Car size={24} />
                <CardTitle className="uppercase tracking-widest">Fleet Command (v2.0)</CardTitle>
              </div>
              <CardDescription className={glassTextStyles}>
                The "Identity" based fleet management system. Location: <code>/biz/vehicles/admin</code>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              
              {/* ARCHITECTURE */}
              <div className="bg-yellow-50/30 dark:bg-yellow-900/10 p-4 rounded-lg border border-yellow-100 dark:border-yellow-800">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-2">Architecture: Server-Side Geofencing</h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  <strong>Goal:</strong> Prevent client-side lag when processing 100+ GPS points.
                  <br/><br/>
                  1. <strong>Fetch:</strong> <code>actions/fleet.ts</code> gets raw GPS (Lat/Lng) from Supabase.
                  <br/>
                  2. <strong>Calculate:</strong> Calls <code>lib/fleet/geofencing.ts</code> which uses <strong>Haversine Math</strong> and <strong>Ray Casting</strong> (Point-in-Polygon) to map coordinates to named zones (e.g., "Vegas Shop", "Pismo Dunes").
                  <br/>
                  3. <strong>Sanitize:</strong> Uses <code>JSON.parse(JSON.stringify(data))</code> to strip non-serializable prototypes before passing to Client Components.
                </p>
              </div>

              {/* CRITICAL FIXES */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="border border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-900/10 p-3 rounded-lg">
                    <h4 className="text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-2 mb-2">
                       <Map size={14} /> The "Nuclear" Map Fix
                    </h4>
                    <p className="text-[10px] text-zinc-600 dark:text-zinc-400 leading-normal">
                       React 18 & Leaflet conflict causes "Map already initialized" crashes. 
                       <br/><strong>Solution:</strong> <code>MapInner.tsx</code> manually strips the <code>_leaflet_id</code> from the DOM node before render. 
                    </p>
                 </div>
                 <div className="border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-900/10 p-3 rounded-lg">
                    <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2 mb-2">
                       <Radio size={14} /> VehicleStatusAvatar
                    </h4>
                    <p className="text-[10px] text-zinc-600 dark:text-zinc-400 leading-normal">
                       Uses <code>VehicleStatusAvatar.tsx</code> to standardize the look (Green/Red dots) across the entire app.
                    </p>
                 </div>
              </div>
            </CardContent>
          </Card>

          {/* 3. SCHEDULE ROSTER V14.5 (UPDATED) */}
          <Card className={glassCardStyles}>
            <CardHeader className="border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <div className="flex items-center gap-2 text-orange-600 dark:text-orange-500">
                <CalendarClock size={24} />
                <CardTitle className="uppercase tracking-widest">Schedule Roster System (v14.5)</CardTitle>
              </div>
              <CardDescription className={glassTextStyles}>
                Central command. Updated with Conflict Detection & Ghost Shift Prevention.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              
              {/* NEW FEATURES GRID */}
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-3">Core Features & Safety Rails</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Smart Copy */}
                  <div className="bg-zinc-50 dark:bg-white/5 p-3 rounded border border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center gap-2 mb-1">
                      <RefreshCcw size={14} className="text-blue-500"/>
                      <span className="font-bold text-xs text-zinc-800 dark:text-zinc-200">Smart Copy (Idempotency)</span>
                    </div>
                    <p className="text-xs text-zinc-500">
                      The "Copy Week" function now pre-flights the target week. If <strong>any</strong> shifts exist, it aborts. Prevents duplicate data layers caused by double-clicks.
                    </p>
                  </div>
                  {/* Conflict Detector */}
                  <div className="bg-zinc-50 dark:bg-white/5 p-3 rounded border border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle size={14} className="text-purple-500"/>
                      <span className="font-bold text-xs text-zinc-800 dark:text-zinc-200">Visual Conflict Detector</span>
                    </div>
                    <p className="text-xs text-zinc-500">
                      Grid cells scan for {'>'}1 shift/day. If found, a pulsing <strong>Purple Badge (x2)</strong> appears. Clicking opens the <strong>Resolver Modal</strong> to delete specific ghost shifts.
                    </p>
                  </div>
                  {/* Viewport */}
                  <div className="bg-zinc-50 dark:bg-white/5 p-3 rounded border border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center gap-2 mb-1">
                      <LayoutTemplate size={14} className="text-green-500"/>
                      <span className="font-bold text-xs text-zinc-800 dark:text-zinc-200">Locked Viewport</span>
                    </div>
                    <p className="text-xs text-zinc-500">
                      Body fixed to <code>h-[calc(100vh-65px)]</code>. Header pins to top. Managers never lose tools while scrolling long lists.
                    </p>
                  </div>
                  {/* Ghost Data Handling */}
                  <div className="bg-zinc-50 dark:bg-white/5 p-3 rounded border border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center gap-2 mb-1">
                      <ShieldAlert size={14} className="text-red-500"/>
                      <span className="font-bold text-xs text-zinc-800 dark:text-zinc-200">Safe Deletion Logic</span>
                    </div>
                    <p className="text-xs text-zinc-500">
                      SQL Cleanups use <code>PARTITION BY user_id</code> and <code>WHERE level &ge; 300</code>. This protects archived <strong>Level 100</strong> accounts from accidental deletion.
                    </p>
                  </div>
                </div>
              </div>

            </CardContent>
          </Card>

          {/* 4. HR COMMAND (NEW: LOCDEPJOB) */}
          <Card className={glassCardStyles}>
            <CardHeader className="border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                <Briefcase size={24} />
                <CardTitle className="uppercase tracking-widest">HR Command: Structure & Roles</CardTitle>
              </div>
              <CardDescription className={glassTextStyles}>
                The "LOCDEPJOB" Dynamic Hierarchy System. Location: <code>/biz/admin/hr/structure</code>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              
              {/* ARCHITECTURE */}
              <div className="bg-indigo-50/30 dark:bg-indigo-900/10 p-4 rounded-lg border border-indigo-100 dark:border-indigo-800">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-2">Dynamic Hierarchy Pattern</h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  We have moved away from hardcoded roles. The Roster and User profiles now fetch configuration from three relational tables:
                  <br/><br/>
                  1. <strong className="text-indigo-600">Locations:</strong> (e.g., Las Vegas, Pismo). Sort Order determines tab position.
                  <br/>
                  2. <strong className="text-indigo-600">Departments:</strong> (e.g., Guides, Front Desk). Defined <em>per location</em>. Controls row grouping color/style.
                  <br/>
                  3. <strong className="text-indigo-600">Positions:</strong> (e.g., Lead Guide, Junior Guide). The specific job titles selectable in user profiles.
                </p>
              </div>

              <div className="flex items-center justify-between gap-4 text-xs text-zinc-500">
                 <div className="flex items-center gap-2 border p-2 rounded w-full justify-center">
                    <Network size={16} /> <span>Dynamic <code>hrConfig</code> Injection</span>
                 </div>
                 <ArrowRight size={16} />
                 <div className="flex items-center gap-2 border p-2 rounded w-full justify-center">
                    <Layers size={16} /> <span>Roster Grouping Logic</span>
                 </div>
              </div>

            </CardContent>
          </Card>

          {/* 5. PISMO BOOKING & PAYROLL */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {/* PISMO */}
             <Card className={glassCardStyles}>
                <CardHeader>
                  <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400">
                    <Ticket size={24} />
                    <CardTitle className="uppercase tracking-widest text-sm">Pismo Booking</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                   <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                      The "Golden Path" flow. 
                      <br/><strong>Critical:</strong> We use a <strong>"Hidden Button" Strategy</strong> to bypass a specific NMI <code>Collect.js</code> initialization bug. 
                      <br/><code>document.getElementById('nmi-hidden-btn').click()</code> is load-bearing logic.
                   </p>
                </CardContent>
             </Card>

             {/* PAYROLL */}
             <Card className={glassCardStyles}>
                <CardHeader>
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-500">
                    <FileSpreadsheet size={24} />
                    <CardTitle className="uppercase tracking-widest text-sm">Timeclock Engine</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                   <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                      <strong>Locking Mechanism:</strong> If a row exists in <code>payroll_reports</code> for a Week Start/End, the system <strong>BLOCKS</strong> all edits/adds/deletes for that range.
                   </p>
                </CardContent>
             </Card>
          </div>

           {/* 6. AUTH & ROUTING ARCHITECTURE */}
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
                  <li><strong>User Preference:</strong> Checks <code>users.homepage</code> (Managed in <code>/account</code>).</li>
                  <li><strong>Role Check:</strong> If Level &ge; 300 (Staff), target <strong>Location Dashboard</strong>.</li>
                  <li><strong>Location Resolve:</strong> Maps <code>primary_work_location</code> (e.g., "Las Vegas") to URL slug (<code>/biz/vegas</code>).</li>
                  <li><strong>Fallback:</strong> Customers & Guests default to <strong>Root</strong> (<code>/</code>).</li>
                </ol>
              </div>
            </CardContent>
          </Card>
          
        </div>

        {/* RIGHT COLUMN: TECH STACK & DEBT (Span 1) */}
        <div className="space-y-8">
          
          {/* 7. TECH STACK */}
          <Card className={glassCardStyles}>
            <CardHeader>
              <div className="flex items-center gap-2 text-green-600 dark:text-green-500">
                <Server size={24} />
                <CardTitle className="uppercase tracking-widest">Tech Stack</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="border-zinc-400 dark:border-white/20 text-zinc-800 dark:text-zinc-200 bg-white/50 dark:bg-white/5">Next.js 16.1</Badge>
                <Badge variant="outline" className="border-blue-500/50 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20">TypeScript</Badge>
                <Badge variant="outline" className="border-green-500/50 text-green-600 dark:text-green-400 bg-green-50/50 dark:bg-green-900/20">Supabase</Badge>
                <Badge variant="outline" className="border-cyan-500/50 text-cyan-600 dark:text-cyan-400 bg-cyan-50/50 dark:bg-cyan-900/20">Tailwind</Badge>
                <Badge variant="outline" className="border-purple-500/50 text-purple-600 dark:text-purple-400 bg-purple-50/50 dark:bg-purple-900/20">Date-FNS</Badge>
              </div>
              <Separator className="bg-zinc-200 dark:bg-zinc-800" />
              <div className={`space-y-2 text-sm ${glassTextStyles}`}>
                <p><strong className="text-zinc-900 dark:text-white">State Management:</strong> Use URL Search Params (Nuqs) for filters. Use React Context only for global UI.</p>
                <p><strong className="text-zinc-900 dark:text-white">Data Fetching:</strong> Prefer Server Components fetching data directly via Supabase helpers.</p>
              </div>
            </CardContent>
          </Card>

          {/* 8. CURRENT DEBT / TODO */}
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
                  <div className="w-full">
                    <span className="line-through opacity-80">
                      <strong>Roster Integrity:</strong> Prevent duplicates.
                    </span>
                    <div className="text-[10px] opacity-70 mt-1">
                      Fixed v14.5 (Conflict Detector & Safe Deletion).
                    </div>
                  </div>
                  <Badge className="ml-auto bg-green-600 text-[10px] h-5">DONE</Badge>
                </li>

                {/* IN PROGRESS */}
                <li className="flex items-start gap-2 text-sm text-blue-700 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20 p-2 rounded-lg">
                  <RefreshCcw className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-1 w-full">
                    <div className="flex justify-between items-center w-full">
                      <span className="font-bold">Moment.js Migration</span>
                      <Badge className="bg-blue-600 text-[10px] h-5">50%</Badge>
                    </div>
                    <span className="text-xs opacity-90">
                      <strong>Status:</strong> Roster Module converted to <code>date-fns</code>. Need to finish Admin & Booking modules.
                    </span>
                  </div>
                </li>

                {/* FLEET TODO */}
                <li className="flex items-start gap-2 text-sm text-yellow-700 dark:text-yellow-400 bg-yellow-50/50 dark:bg-yellow-950/20 p-2 rounded-lg">
                  <CircleDashed className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-1 w-full">
                     <span className="font-bold">Unified Inspections</span>
                     <span className="text-xs opacity-90">
                       Required to populate live fuel levels and real "Broken" status updates.
                     </span>
                  </div>
                </li>

              </ul>
            </CardContent>
          </Card>

           {/* 9. QUICK LINKS */}
           <Card className={glassCardStyles}>
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
                <a href="/biz/admin/health" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">System Health</a>
                <a href="/biz/users/admin" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">User Admin</a>
                <a href="/biz/vehicles/admin" className="text-xs text-yellow-600 dark:text-yellow-400 hover:underline">Fleet Command</a>
                <a href="/biz/schedule" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">Live Roster</a>
                <a href="/biz/admin/hr/structure" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">HR Structure</a>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}