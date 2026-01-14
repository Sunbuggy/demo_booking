/**
 * @file app/(biz)/biz/admin/developer/docs/page.tsx
 * @description LIVING DOCUMENTATION for the SunBuggy Digital Ecosystem.
 * * CHANGE LOG:
 * - Jan 11, 2026: Added 'Fun License' Architecture (Smartwaiver + Selfie).
 * - Jan 11, 2026: Added S3 Architecture, Fleet Geofencing UI, and Icon Management.
 * - Jan 12, 2026: Integrated Live Markdown Rendering for THEMING.md
 * - Jan 14, 2026: Added Timezone Architecture (Multi-location support).
 * * ACCESS CONTROL:
 * - Level 950+ (Developers) Only.
 */

import React from 'react';
import fs from 'fs';
import path from 'path';
import Markdown from 'react-markdown';
import { 
  ShieldAlert, 
  Server, 
  FileCode,
  AlertTriangle,
  CheckCircle2, 
  CircleDashed,
  CalendarClock,
  KeyRound,
  FileSpreadsheet,
  Ticket,
  ArrowRight,
  RefreshCcw,
  Car,           // Fleet
  Map,           // Fleet
  Radio,         // Fleet
  Briefcase,     // HR
  Network,       // HR
  Layers,        // HR
  HardDrive,     // Storage
  Cloud,         // Storage
  Image as ImageIcon, // Storage
  Move,          // Storage
  ShieldCheck,   // Fun License
  FileSignature, // Fun License
  Camera,        // Fun License
  Palette,       // Theming
  Globe          // Timezones (NEW)
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

// --- HELPER: Fetch Markdown Content ---
// This runs on the server at build/request time to fetch the file content.
const getDocContent = (filename: string) => {
  try {
    const filePath = path.join(process.cwd(), 'docs', filename);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    return fileContent;
  } catch (error) {
    return `**Error:** Could not load documentation file: ${filename}. Ensure it exists in the /docs folder.`;
  }
};

export default function DeveloperDocsPage() {
  
  // === SHARED STYLING CONSTANTS ===
  const glassCardStyles = "bg-white/60 dark:bg-zinc-950/80 backdrop-blur-md border-white/40 dark:border-zinc-800 shadow-xl transition-all hover:shadow-2xl hover:bg-white/70 dark:hover:bg-zinc-950/90";
  const glassHeaderStyles = "text-zinc-800 dark:text-zinc-100";
  const glassTextStyles = "text-zinc-600 dark:text-zinc-400";

  // === LOAD DYNAMIC DOCS ===
  const themingDoc = getDocContent('THEMING.md');
  const timezonesDoc = getDocContent('TIMEZONES.md'); // <--- NEW LOAD
  
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 pb-20">
      
      {/* === PAGE HEADER === */}
      <div className="space-y-2 mb-10">
        <h1 className="text-4xl font-black uppercase tracking-tighter text-yellow-500 drop-shadow-sm">
          System Architecture <span className="text-zinc-900 dark:text-white">& Standards</span>
        </h1>
        <p className="text-zinc-700 dark:text-zinc-400 max-w-3xl font-medium bg-white/40 dark:bg-transparent p-2 rounded-lg backdrop-blur-sm inline-block">
          This document explains "where things go and why." Use this as a reference for maintaining
          the SunBuggy digital ecosystem. If you change a core pattern, update this page.
        </p>
      </div>

      {/* === MAIN GRID LAYOUT === */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN (Spans 2/3) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* --- SECTION 1: SECURITY --- */}
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

          {/* --- SECTION: THEMING & STANDARDS --- */}
          <Card className={`${glassCardStyles} overflow-hidden`}>
            <CardHeader className="bg-gradient-to-r from-purple-500/10 to-transparent border-b border-purple-100 dark:border-purple-900/50">
              <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                <Palette size={24} />
                <CardTitle className="uppercase tracking-widest">Theming & UI Standards</CardTitle>
              </div>
              <CardDescription className={glassTextStyles}>
                Live documentation from <code>docs/THEMING.md</code>.
              </CardDescription>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none p-6 bg-zinc-50/50 dark:bg-black/20">
              <Markdown
                components={{
                  h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-foreground mb-4 border-b pb-2" {...props} />,
                  h2: ({node, ...props}) => <h2 className="text-lg font-bold text-foreground mt-6 mb-3" {...props} />,
                  h3: ({node, ...props}) => <h3 className="text-md font-semibold text-foreground mt-4 mb-2" {...props} />,
                  ul: ({node, ...props}) => <ul className="list-disc list-inside space-y-1 my-2" {...props} />,
                  li: ({node, ...props}) => <li className="text-muted-foreground" {...props} />,
                  p: ({node, ...props}) => <p className="text-muted-foreground leading-relaxed mb-3" {...props} />,
                  code: ({node, ...props}) => <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-primary" {...props} />,
                  pre: ({node, ...props}) => (
                    <pre className="bg-zinc-950 text-zinc-100 p-4 rounded-lg overflow-x-auto my-4 text-xs font-mono border border-zinc-800" {...props} />
                  ),
                }}
              >
                {themingDoc}
              </Markdown>
            </CardContent>
          </Card>

          {/* --- SECTION: TIMEZONE ARCHITECTURE (NEW) --- */}
          <Card className={`${glassCardStyles} overflow-hidden`}>
            <CardHeader className="bg-gradient-to-r from-blue-500/10 to-transparent border-b border-blue-100 dark:border-blue-900/50">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <Globe size={24} />
                <CardTitle className="uppercase tracking-widest">Timezone Architecture</CardTitle>
              </div>
              <CardDescription className={glassTextStyles}>
                Standards for Multi-Location Time Handling. Source: <code>docs/TIMEZONES.md</code>.
              </CardDescription>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none p-6 bg-zinc-50/50 dark:bg-black/20">
              <Markdown
                components={{
                  h1: ({node, ...props}) => <h1 className="text-2xl font-bold text-foreground mb-4 border-b pb-2" {...props} />,
                  h2: ({node, ...props}) => <h2 className="text-lg font-bold text-foreground mt-6 mb-3" {...props} />,
                  h3: ({node, ...props}) => <h3 className="text-md font-semibold text-foreground mt-4 mb-2" {...props} />,
                  ul: ({node, ...props}) => <ul className="list-disc list-inside space-y-1 my-2" {...props} />,
                  li: ({node, ...props}) => <li className="text-muted-foreground" {...props} />,
                  p: ({node, ...props}) => <p className="text-muted-foreground leading-relaxed mb-3" {...props} />,
                  code: ({node, ...props}) => <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-primary" {...props} />,
                  pre: ({node, ...props}) => (
                    <pre className="bg-zinc-950 text-zinc-100 p-4 rounded-lg overflow-x-auto my-4 text-xs font-mono border border-zinc-800" {...props} />
                  ),
                }}
              >
                {timezonesDoc}
              </Markdown>
            </CardContent>
          </Card>

          {/* --- SECTION 2: THE FUN LICENSE --- */}
          <Card className={glassCardStyles}>
            <CardHeader className="border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-500">
                <ShieldCheck size={24} />
                <CardTitle className="uppercase tracking-widest">Fun License Integration (v1.0)</CardTitle>
              </div>
              <CardDescription className={glassTextStyles}>
                The "Gamified Compliance" Engine. Combines Smartwaiver API v4 with a custom Selfie Station.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              
              {/* Traffic Light Visual */}
              <div className="bg-green-50/30 dark:bg-green-900/10 p-4 rounded-lg border border-green-100 dark:border-green-800">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-2">The "Traffic Light" Pattern</h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed mb-3">
                  We decouple the visual status (Ring) from the database state to ensure instant UI feedback via <code>UserStatusAvatar</code>.
                </p>
                <div className="grid grid-cols-3 gap-2 text-xs text-center font-mono font-bold">
                    <div className="bg-red-100 dark:bg-red-900/30 text-red-600 p-2 rounded border border-red-200 dark:border-red-800">
                       MISSING (Red)<br/><span className="font-normal opacity-70">No Waiver</span>
                    </div>
                    <div className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 p-2 rounded border border-yellow-200 dark:border-yellow-800">
                       PENDING (Yellow)<br/><span className="font-normal opacity-70">Waiver Yes / No Photo</span>
                    </div>
                    <div className="bg-green-100 dark:bg-green-900/30 text-green-600 p-2 rounded border border-green-200 dark:border-green-800">
                       ACTIVE (Green)<br/><span className="font-normal opacity-70">Ready to Ride</span>
                    </div>
                </div>
              </div>

              {/* Technical Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="border border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-900/10 p-3 rounded-lg">
                    <h4 className="text-xs font-bold text-green-700 dark:text-green-400 flex items-center gap-2 mb-2">
                       <FileSignature size={14} /> Smartwaiver Sync
                    </h4>
                    <p className="text-[10px] text-zinc-600 dark:text-zinc-400 leading-normal">
                       <strong>Library:</strong> <code>lib/smartwaiver.ts</code><br/>
                       <strong>Flow:</strong> Search by Email &rarr; Get GUID &rarr; Fetch Results.<br/>
                       <strong>Handling:</strong> Catches HTTP 402 as "Zero Results".<br/>
                       <strong>Auto-Sync:</strong> Runs on avatar mount if ID missing.
                    </p>
                 </div>
                 <div className="border border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-900/10 p-3 rounded-lg">
                    <h4 className="text-xs font-bold text-green-700 dark:text-green-400 flex items-center gap-2 mb-2">
                       <Camera size={14} /> Selfie Engine
                    </h4>
                    <p className="text-[10px] text-zinc-600 dark:text-zinc-400 leading-normal">
                       <strong>Component:</strong> <code>LicenseSelfie.tsx</code> wraps <code>TimeclockCamera</code>.<br/>
                       <strong>Crop:</strong> Forces 1:1 Aspect Ratio via CSS masking.<br/>
                       <strong>Mobile:</strong> Uses <code>onPlaying</code> event to ensure stream dimensions before enabling snap.
                    </p>
                 </div>
              </div>
            </CardContent>
          </Card>

          {/* --- SECTION 3: FILE & MEDIA STORAGE --- */}
          <Card className={glassCardStyles}>
            <CardHeader className="border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <div className="flex items-center gap-2 text-pink-600 dark:text-pink-500">
                <HardDrive size={24} />
                <CardTitle className="uppercase tracking-widest">File Storage & Media</CardTitle>
              </div>
              <CardDescription className={glassTextStyles}>
                Contabo S3 via AWS SDK v3. Endpoints: <code>/api/s3/*</code>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              
              {/* Architecture Explanation */}
              <div className="bg-pink-50/30 dark:bg-pink-900/10 p-4 rounded-lg border border-pink-100 dark:border-pink-800">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-2">The Proxy Pattern</h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Direct client-to-S3 communication is <strong>blocked</strong>. All file operations must pass through our Next.js middleware to enforce:
                  <br/>1. <strong>Naming Conventions:</strong> Files are auto-renamed (e.g., <code>2026-01-05(1).pdf</code>).
                  <br/>2. <strong>Security:</strong> Credentials exist only on the server.
                  <br/>3. <strong>Compatibility:</strong> Client is initialized with <code>forcePathStyle: true</code>.
                </p>
              </div>

              {/* Endpoints */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="bg-zinc-50 dark:bg-white/5 p-3 rounded border border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center gap-2 mb-1 text-zinc-800 dark:text-zinc-200">
                      <ImageIcon size={14} /> <span className="font-bold text-xs">Upload & Fetch</span>
                    </div>
                    <p className="text-[10px] text-zinc-500">
                       <code>POST /api/s3/upload</code>: Handles form data. 50MB limit.<br/>
                       <code>GET /api/s3/upload</code>: Returns <strong>Presigned URLs</strong>.
                    </p>
                 </div>
                 <div className="bg-zinc-50 dark:bg-white/5 p-3 rounded border border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center gap-2 mb-1 text-zinc-800 dark:text-zinc-200">
                      <Move size={14} /> <span className="font-bold text-xs">Move & Rename</span>
                    </div>
                    <p className="text-[10px] text-zinc-500">
                       S3 cannot "rename". We simulate it via <strong>Copy + Delete</strong> transactions.
                    </p>
                 </div>
              </div>
            </CardContent>
          </Card>

          {/* --- SECTION 4: FLEET COMMAND --- */}
          <Card className={glassCardStyles}>
            <CardHeader className="border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-500">
                <Car size={24} />
                <CardTitle className="uppercase tracking-widest">Fleet Command (v2.0)</CardTitle>
              </div>
              <CardDescription className={glassTextStyles}>
                Identity-based tracking, Geofencing, and Iconography. Location: <code>/biz/vehicles/admin</code>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              
              {/* Geofencing Logic */}
              <div className="bg-yellow-50/30 dark:bg-yellow-900/10 p-4 rounded-lg border border-yellow-100 dark:border-yellow-800">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-2">Architecture: Server-Side Geofencing</h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  <strong>Goal:</strong> Prevent client-side lag when processing 100+ GPS points.
                  <br/>
                  1. <strong>Fetch:</strong> <code>actions/fleet.ts</code> gets raw GPS from Supabase.
                  <br/>
                  2. <strong>Calculate:</strong> Calls <code>lib/fleet/geofencing.ts</code> which uses <strong>Ray Casting</strong>.
                  <br/>
                  3. <strong>Sanitize:</strong> Strips non-serializable prototypes before passing to Client.
                </p>
              </div>

              {/* Sub-Features */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="border border-yellow-200 dark:border-yellow-900 bg-yellow-50/50 dark:bg-yellow-900/10 p-3 rounded-lg">
                    <h4 className="text-xs font-bold text-yellow-700 dark:text-yellow-400 flex items-center gap-2 mb-2">
                       <Map size={14} /> Geofence UI Management
                    </h4>
                    <p className="text-[10px] text-zinc-600 dark:text-zinc-400 leading-normal">
                       Managers (Lvl 500+) can now draw zones visually via Mapbox/Leaflet at <code>/biz/admin/fleet/geofencing</code>.
                    </p>
                 </div>
                 <div className="border border-yellow-200 dark:border-yellow-900 bg-yellow-50/50 dark:bg-yellow-900/10 p-3 rounded-lg">
                    <h4 className="text-xs font-bold text-yellow-700 dark:text-yellow-400 flex items-center gap-2 mb-2">
                       <Radio size={14} /> Icon Management
                    </h4>
                    <p className="text-[10px] text-zinc-600 dark:text-zinc-400 leading-normal">
                       Custom SVGs for Buggies vs UTVs can be uploaded at <code>/biz/admin/fleet/icons</code>.
                    </p>
                 </div>
              </div>

              {/* Leaflet Fix */}
              <div className="bg-red-50/50 dark:bg-red-900/10 p-3 rounded-lg border border-red-100 dark:border-red-900">
                  <h4 className="text-xs font-bold text-red-600 dark:text-red-400 mb-1">Critical Map Fix</h4>
                  <p className="text-[10px] text-zinc-600 dark:text-zinc-400">
                      React 18 & Leaflet conflict causes crashes. 
                      <strong> Solution:</strong> <code>MapInner.tsx</code> manually strips the <code>_leaflet_id</code> from the DOM node.
                  </p>
              </div>
            </CardContent>
          </Card>

          {/* --- SECTION 5: SCHEDULE ROSTER --- */}
          <Card className={glassCardStyles}>
            <CardHeader className="border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <div className="flex items-center gap-2 text-orange-600 dark:text-orange-500">
                <CalendarClock size={24} />
                <CardTitle className="uppercase tracking-widest">Schedule Roster (v14.5)</CardTitle>
              </div>
              <CardDescription className={glassTextStyles}>
                Central command. Updated with Conflict Detection & Ghost Shift Prevention.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-zinc-50 dark:bg-white/5 p-3 rounded border border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center gap-2 mb-1">
                      <RefreshCcw size={14} className="text-blue-500"/>
                      <span className="font-bold text-xs text-zinc-800 dark:text-zinc-200">Smart Copy (Idempotency)</span>
                    </div>
                    <p className="text-xs text-zinc-500">
                      The "Copy Week" function pre-flights the target week. If <strong>any</strong> shifts exist, it aborts. Prevents duplicate data layers.
                    </p>
                  </div>
                  <div className="bg-zinc-50 dark:bg-white/5 p-3 rounded border border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle size={14} className="text-purple-500"/>
                      <span className="font-bold text-xs text-zinc-800 dark:text-zinc-200">Visual Conflict Detector</span>
                    </div>
                    <p className="text-xs text-zinc-500">
                      Grid cells scan for {'>'}1 shift/day. If found, a pulsing <strong>Purple Badge (x2)</strong> appears.
                    </p>
                  </div>
              </div>
            </CardContent>
          </Card>

          {/* --- SECTION 6: HR COMMAND --- */}
          <Card className={glassCardStyles}>
            <CardHeader className="border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                <Briefcase size={24} />
                <CardTitle className="uppercase tracking-widest">HR Command: Structure</CardTitle>
              </div>
              <CardDescription className={glassTextStyles}>
                The "LOCDEPJOB" Dynamic Hierarchy System. Location: <code>/biz/admin/hr/structure</code>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="bg-indigo-50/30 dark:bg-indigo-900/10 p-4 rounded-lg border border-indigo-100 dark:border-indigo-800">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-2">Dynamic Hierarchy Pattern</h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Roles are no longer hardcoded. Configuration fetches from three relational tables:
                  <br/>1. <strong className="text-indigo-600">Locations:</strong> Sort Order determines tab position.
                  <br/>2. <strong className="text-indigo-600">Departments:</strong> Defined <em>per location</em>. Controls row grouping.
                  <br/>3. <strong className="text-indigo-600">Positions:</strong> Job titles selectable in user profiles.
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

          {/* --- SECTION 7: PISMO & PAYROLL --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <Card className={glassCardStyles}>
                <CardHeader>
                  <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400">
                    <Ticket size={24} />
                    <CardTitle className="uppercase tracking-widest text-sm">Pismo Booking</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                   <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                      <strong>Critical:</strong> We use a <strong>"Hidden Button" Strategy</strong> to bypass NMI <code>Collect.js</code> bugs. 
                      <code>document.getElementById('nmi-hidden-btn').click()</code> is load-bearing logic.
                   </p>
                </CardContent>
             </Card>

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

           {/* --- SECTION 8: AUTH & ROUTING --- */}
           <Card className={glassCardStyles}>
            <CardHeader>
              <div className="flex items-center gap-2 text-purple-600 dark:text-purple-500">
                <KeyRound size={24} />
                <CardTitle className="uppercase tracking-widest">Auth & Smart Routing</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="bg-purple-50/50 dark:bg-purple-900/10 p-3 rounded-lg border border-purple-100 dark:border-purple-800">
                <p className="font-bold text-purple-700 dark:text-purple-400 mb-2">The Decision Hierarchy</p>
                <ol className="list-decimal list-inside space-y-1 text-zinc-700 dark:text-zinc-300">
                  <li><strong>User Preference:</strong> Checks <code>users.homepage</code>.</li>
                  <li><strong>Role Check:</strong> If Level &ge; 300, target <strong>Location Dashboard</strong>.</li>
                  <li><strong>Location Resolve:</strong> Maps <code>primary_work_location</code> to URL slug.</li>
                  <li><strong>Fallback:</strong> Customers default to <strong>Root</strong> (<code>/</code>).</li>
                </ol>
              </div>
            </CardContent>
          </Card>
          
        </div>

        {/* RIGHT COLUMN (Spans 1/3) */}
        <div className="space-y-8">
          
          {/* --- SECTION 9: TECH STACK --- */}
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
                <Badge variant="outline" className="border-pink-500/50 text-pink-600 dark:text-pink-400 bg-pink-50/50 dark:bg-pink-900/20">AWS SDK v3</Badge>
              </div>
              <Separator className="bg-zinc-200 dark:bg-zinc-800" />
              <div className={`space-y-2 text-sm ${glassTextStyles}`}>
                <p><strong className="text-zinc-900 dark:text-white">State Management:</strong> Use URL Search Params (Nuqs) for filters. Use React Context only for global UI.</p>
                <p><strong className="text-zinc-900 dark:text-white">Data Fetching:</strong> Prefer Server Components fetching data directly via Supabase helpers.</p>
              </div>
            </CardContent>
          </Card>

          {/* --- SECTION 10: TECH DEBT & TODOS --- */}
          <Card className={`${glassCardStyles} border-dashed`}>
            <CardHeader>
              <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-500">
                <FileCode size={24} />
                <CardTitle className="uppercase tracking-widest">Tech Debt & Todos</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                
                {/* NEW TODO: FUN LICENSE STORAGE */}
                <li className="flex items-start gap-2 text-sm text-purple-700 dark:text-purple-400 bg-purple-50/50 dark:bg-purple-950/20 p-2 rounded-lg">
                  <HardDrive className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-1 w-full">
                     <span className="font-bold">Fun License Storage</span>
                     <span className="text-[10px] opacity-90">
                       Selfies are currently stored as Base64 strings in the DB (Phase 1). 
                       <strong>TODO:</strong> Migrate to S3 bucket `license-photos` to reduce DB bloat.
                     </span>
                  </div>
                </li>

                {/* S3 TIMEZONE BUG */}
                <li className="flex items-start gap-2 text-sm text-red-700 dark:text-red-400 bg-red-50/50 dark:bg-red-950/20 p-2 rounded-lg">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-1 w-full">
                     <span className="font-bold">S3 Timezone Bug</span>
                     <span className="text-[10px] opacity-90">
                       Server upload logic uses UTC (<code>toISOString</code>). Late night Vegas uploads are dated tomorrow. 
                       <strong>Fix:</strong> Use <code>Intl</code> API with <code>en-CA</code> locale.
                     </span>
                  </div>
                </li>

                {/* S3 REFACTOR */}
                 <li className="flex items-start gap-2 text-sm text-yellow-700 dark:text-yellow-400 bg-yellow-50/50 dark:bg-yellow-950/20 p-2 rounded-lg">
                  <CircleDashed className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-1 w-full">
                     <span className="font-bold">Refactor S3 Logic</span>
                     <span className="text-[10px] opacity-90">
                       <code>PUT</code>/<code>POST</code> logic in <code>upload/route.ts</code> is redundant. Extract to shared utility.
                     </span>
                  </div>
                </li>

                {/* MOMENT JS REMOVAL */}
                <li className="flex items-start gap-2 text-sm text-blue-700 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20 p-2 rounded-lg">
                  <RefreshCcw className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-1 w-full">
                    <div className="flex justify-between items-center w-full">
                      <span className="font-bold">Moment.js Removal</span>
                      <Badge className="bg-blue-600 text-[10px] h-5">50%</Badge>
                    </div>
                    <span className="text-xs opacity-90">
                      Roster Module converted to <code>date-fns</code>. Admin/Booking pending.
                    </span>
                  </div>
                </li>

                {/* DONE ITEMS */}
                <li className="flex items-start gap-2 text-sm text-green-700 dark:text-green-400 bg-green-50/50 dark:bg-green-950/20 p-2 rounded-lg">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="w-full">
                    <span className="line-through opacity-80 font-bold">
                      Smartwaiver Sync
                    </span>
                    <div className="text-[10px] opacity-70 mt-1">
                      Integration Complete (v1.0).
                    </div>
                  </div>
                  <Badge className="ml-auto bg-green-600 text-[10px] h-5">DONE</Badge>
                </li>

              </ul>
            </CardContent>
          </Card>

           {/* --- SECTION 11: QUICK LINKS --- */}
           <Card className={glassCardStyles}>
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
                <a href="/biz/admin/health" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">System Health</a>
                <a href="/biz/users/admin" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">User Admin</a>
                <a href="/biz/vehicles/admin" className="text-xs text-yellow-600 dark:text-yellow-400 hover:underline">Fleet Command</a>
                <a href="/biz/admin/fleet/geofencing" className="text-xs text-yellow-600 dark:text-yellow-400 hover:underline">Geofencing</a>
                <a href="/biz/admin/hr/structure" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">HR Structure</a>
                <a href="/fun-license" className="text-xs text-green-600 dark:text-green-400 hover:underline font-bold">Fun License Test</a>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}