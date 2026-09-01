import {createBrowserClient} from '@supabase/ssr';

/**
 * Browser Supabase client
 * for internal use in client components
 * used by hooks
 *
 * @description Shaped to match `getSupabaseBrowser` from `@services/sb-hs` in the
 * monorepo, so the move can swap this module for a re-export without touching
 * callers. Two differences remain deliberate and belong to the move itself:
 *   - cookie name/domain (`sb-hazenasvinov-auth-token`, `.hazenasvinov.test`) are
 *     not set here — applying them now would invalidate every current session and
 *     the domain does not match localhost;
 *   - the client is not typed with `Database` — see the migration notes.
 */

// Single instance per browser session, like `getSupabaseBrowser` in the monorepo.
// Repeated calls previously produced a new client (and a new auth listener) each time.
let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function supabaseBrowserClient() {
  if (!browserClient) {
    browserClient = createSafeClient();
  }

  return browserClient;
}

/** Alias under the monorepo's name, so call sites can migrate ahead of the move. */
export const getSupabaseBrowser = supabaseBrowserClient;

// Safe client creation with error handling
export function createSafeClient() {
  try {
    // The monorepo reads NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY; this repo has always
    // used NEXT_PUBLIC_SUPABASE_ANON_KEY. Reading both keeps one env file working
    // on either side of the move. Both are written out literally so Next can inline
    // them into the client bundle.
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Check if environment variables are available
    if (!url || !key) {
      console.warn('Supabase environment variables not configured. Using mock client.');
      return createMockClient();
    }

    return createBrowserClient(url, key);
  } catch (error) {
    console.error('Error creating Supabase client:', error);
    // Return a mock client that won't cause errors
    return createMockClient();
  }
}

// Create a mock client for fallback
function createMockClient() {
  return {
    auth: {
      getUser: async () => ({data: {user: null}, error: null}),
      onAuthStateChange: () => ({data: {subscription: {unsubscribe: () => {}}}}),
      signOut: async () => ({error: null}),
    },
    from: () => ({
      select: () => ({eq: () => ({limit: () => ({data: [], error: null})})}),
      insert: () => ({data: null, error: null}),
      update: () => ({eq: () => ({data: null, error: null})}),
      delete: () => ({eq: () => ({data: null, error: null})}),
    }),
  } as any;
}
