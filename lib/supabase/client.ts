import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.',
  );
}

// Anon-key client for the browser. RLS policies (see supabase/migrations) are what actually
// keep this safe to ship in the client bundle — the anon key itself grants no privileges.
// persistSession: owners need to stay logged in across reloads; harmless on the anonymous
// scan page since no session is ever created there.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: true, autoRefreshToken: true },
});
