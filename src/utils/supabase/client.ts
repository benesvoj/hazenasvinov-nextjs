import {createBrowserClient} from '@supabase/ssr';

/**
 *  Browser Supabase client
 *  for internal use in client components
 *  used by hooks
 */
export function supabaseBrowserClient() {
  // Use safe client creation to prevent runtime errors
  return createSafeClient();
}

// Safe client creation with error handling
export function createSafeClient() {
  try {
    // Check if environment variables are available
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.warn('Supabase environment variables not configured. Using mock client.');
      return createMockClient();
    }

    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
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
