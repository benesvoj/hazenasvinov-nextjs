import {cookies} from 'next/headers';

import {createServerClient} from '@supabase/ssr';

/**
 * Creates a Supabase server client for use in Server Components and API routes
 *
 * @deprecated For API routes, prefer using helper utilities from '@/utils/supabase/apiHelpers'
 * which provide built-in authentication and error handling.
 *
 * @example
 * // ❌ Old way (deprecated for API routes)
 * const supabase = await createClient();
 * const { data: { user } } = await supabase.auth.getUser();
 * if (!user) return NextResponse.json({error: 'Unauthorized'}, {status: 401});
 *
 * // ✅ New way (use apiHelpers for API routes)
 * import { withAuth } from '@/utils/supabase/apiHelpers';
 * export async function GET() {
 *   return withAuth(async (user, supabase) => {
 *     // user is already authenticated
 *     const { data } = await supabase.from('table').select();
 *     return NextResponse.json({ data });
 *   });
 * }
 *
 * @returns Supabase client with cookie-based authentication
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({name, value, options}) => cookieStore.set(name, value, options));
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}
