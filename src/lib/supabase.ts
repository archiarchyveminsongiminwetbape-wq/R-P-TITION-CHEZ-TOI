import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey)

export type SupabaseClientType = ReturnType<typeof createClient<any, any>>

// For typing: always expose a client-like type to avoid TS "possibly null" errors across the app.
// At runtime, rely on hasSupabaseConfig in call sites that need to guard.
export const supabase = (
  hasSupabaseConfig
    ? createClient(supabaseUrl!, supabaseAnonKey!)
    : (null as unknown)
) as unknown as SupabaseClientType
