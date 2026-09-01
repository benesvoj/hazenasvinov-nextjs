import {createClient} from '@supabase/supabase-js';

// The monorepo reads SUPABASE_SECRET_KEY; this repo has always used
// SUPABASE_SERVICE_ROLE_KEY. Reading both keeps one env file working either side
// of the move.
const secretKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, secretKey!, {
  db: {
    schema: 'public',
  },
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export default supabaseAdmin;
