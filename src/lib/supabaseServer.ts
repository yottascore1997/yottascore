import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.warn('[Supabase] SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL env var not set.');
}

if (!serviceRoleKey && !anonKey) {
  console.warn('[Supabase] No service role or anon key found. Uploads will fail.');
}

export const supabaseServer =
  supabaseUrl && (serviceRoleKey || anonKey)
    ? createClient(supabaseUrl, serviceRoleKey || anonKey)
    : null;

export const supabaseBucket = process.env.SUPABASE_STORAGE_BUCKET || 'yottascore-assets';

