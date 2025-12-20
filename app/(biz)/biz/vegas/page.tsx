// app/(biz)/biz/vegas/page.tsx
// This is a convenience shortcut page for Las Vegas operations.
// Visiting /biz/vegas automatically redirects to today's legacy Las Vegas board (/biz/YYYY-MM-DD).
//
// Why literal folder?
// - Avoids routing conflict with existing [date] dynamic route
// - Explicit and bookmark-friendly for TORCH/dispatchers
// - Zero changes or risk to legacy board functionality (continues using old DB)
//
// Behavior:
// - Always redirects to current day's legacy board
// - Safe, fast, no data fetching needed here

import { redirect } from 'next/navigation';
import dayjs from 'dayjs';

// Force dynamic so redirect always uses the actual current date
export const dynamic = 'force-dynamic';

export default function VegasShortcutPage() {
  const today = dayjs().format('YYYY-MM-DD');

  // Redirect to the existing legacy Las Vegas board for today
  // This route remains 100% unchanged — old DB query, full TORCH/shuttle features
  redirect(`/biz/${today}`);
}