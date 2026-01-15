// app/(biz)/biz/pismo/page.tsx
// This is a convenience shortcut page for Pismo Beach operations.
// Visiting /biz/pismo automatically redirects to today's Pismo board (/biz/pismo/YYYY-MM-DD).
//
// Why literal folder instead of dynamic [location]?
// - Avoids Next.js conflict with existing [date] dynamic route (different param names)
// - Clear, explicit, no ambiguity — staff can bookmark /biz/pismo directly
// - No impact on legacy /biz/[date] Vegas board (old DB, completely safe)
//
// Behavior:
// - Always uses server current date (accurate to server timezone)
// - Instant redirect — fast for dispatchers

import { redirect } from 'next/navigation';
import dayjs from 'dayjs';

// Force dynamic rendering so we always get the real current date on each request
export const dynamic = 'force-dynamic';

export default function PismoShortcutPage() {
  // Calculate today's date in YYYY-MM-DD format
  const today = dayjs().format('YYYY-MM-DD');

  // Redirect to the detailed Pismo board for today
  // This uses the new Supabase-backed route (/biz/[...locdate])
  redirect(`/biz/pismo/${today}`);
}