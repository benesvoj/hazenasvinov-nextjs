import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
	return createBrowserClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
	)
}

// Safe client creation with error handling
export function createSafeClient() {
	try {
		return createBrowserClient(
			process.env.NEXT_PUBLIC_SUPABASE_URL!,
			process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
		)
	} catch (error) {
		console.error('Error creating Supabase client:', error)
		// Return a mock client that won't cause errors
		return {
			auth: {
				getSession: async () => ({ data: { session: null }, error: null }),
				getUser: async () => ({ data: { user: null }, error: null }),
				onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
				signOut: async () => ({ error: null })
			},
			from: () => ({
				select: () => ({ eq: () => ({ limit: () => ({ data: [], error: null }) }) }),
				insert: () => ({ data: null, error: null }),
				update: () => ({ eq: () => ({ data: null, error: null }) }),
				delete: () => ({ eq: () => ({ data: null, error: null }) })
			})
		} as any
	}
}