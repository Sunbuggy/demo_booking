import { createBrowserClient } from '@supabase/ssr'

// Use a generic type instead of Database to avoid type issues
export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )