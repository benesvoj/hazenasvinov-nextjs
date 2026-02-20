/**
 * Supabase Utilities - Main Entry Point
 *
 * ⚠️ IMPORTANT: Do NOT import Supabase clients from this file!
 *
 * Due to Next.js client/server boundaries, each client type has its own entry point:
 *
 * ## Client Components, Hooks, Contexts ('use client')
 * ```typescript
 * import { createSupabaseBrowser } from '@/utils/supabase/browser';
 * ```
 *
 * ## Server Components, Server Actions
 * ```typescript
 * import { createClient } from '@/utils/supabase/server';
 * ```
 *
 * ## API Routes (Recommended)
 * ```typescript
 * import { withAuth, withAdminAuth } from '@/utils/supabase/apiHelpers';
 * ```
 *
 * ## API Routes (Admin operations only)
 * ```typescript
 * import supabaseAdmin from '@/utils/supabase/admin';
 * ```
 *
 * @see /src/utils/supabase/docs/SUPABASE_CLIENTS_GUIDE.md for complete documentation
 */

export * from './bettingAuth';

// NOTE: Supabase clients are NOT exported from here to avoid client/server conflicts.
// Import from the specific module based on your use case:
//
// Browser (Client Components):  @/utils/supabase/browser
// Server (Server Components):   @/utils/supabase/server
// API Routes (with auth):       @/utils/supabase/apiHelpers
// API Routes (admin):           @/utils/supabase/admin
