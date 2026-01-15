// utils/supabase/adminClient.ts  (new file)
import { createBrowserClient } from '@supabase/ssr'

export const createAdminClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!  // This bypasses RLS
  )