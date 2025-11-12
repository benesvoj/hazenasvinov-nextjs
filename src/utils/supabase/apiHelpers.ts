/**
 * @fileoverview API Helper Utilities - SERVER ONLY
 *
 * ⚠️ IMPORTANT: This file should ONLY be imported in API routes (src/app/api/**)
 * Do NOT import in client components or pages as it uses server-only modules.
 *
 * Correct import: import { withAuth } from '@/utils/supabase/apiHelpers';
 * Wrong import: import { withAuth } from '@/utils'; // ❌ Will cause client/server errors
 */

import {NextResponse} from 'next/server';

import type {SupabaseClient, User} from '@supabase/supabase-js';

import supabaseAdmin from './admin';
import {createClient} from './server';

/**
 * API Helper Utilities for Next.js API Routes
 *
 * These helpers provide consistent authentication, authorization, and error handling
 * across all API routes, following the DRY principle.
 *
 * @example
 * // Simple authenticated route
 * export async function GET(request: NextRequest) {
 *   return withAuth(async (user, supabase) => {
 *     const { data } = await supabase.from('posts').select('*');
 *     return NextResponse.json({ data });
 *   });
 * }
 *
 * @example
 * // Admin-only route
 * export async function DELETE(request: NextRequest) {
 *   return withAdminAuth(async (user, supabase) => {
 *     // Only admins can execute this
 *     await supabase.from('users').delete().eq('id', userId);
 *     return NextResponse.json({ success: true });
 *   });
 * }
 */

/**
 * Handler function type that receives authenticated user and supabase client
 */
type AuthHandler = (user: User, supabase: SupabaseClient) => Promise<NextResponse>;

/**
 * Handler function type that receives authenticated user, regular supabase client, and admin client
 */
type AdminAuthHandler = (
  user: User,
  supabase: SupabaseClient,
  admin: SupabaseClient
) => Promise<NextResponse>;

/**
 * Wraps an API route with authentication checks and error handling
 *
 * @param handler - Function that handles the authenticated request
 * @returns NextResponse with appropriate status codes
 *
 * @example
 * export async function GET(request: NextRequest, {params}: {params: {id: string}}) {
 *   return withAuth(async (user, supabase) => {
 *     const {data, error} = await supabase
 *       .from('members')
 *       .select('*')
 *       .eq('id', params.id)
 *       .single();
 *
 *     if (error) throw error;
 *     if (!data) {
 *       return NextResponse.json({error: 'Not found'}, {status: 404});
 *     }
 *
 *     return NextResponse.json({data, error: null});
 *   });
 * }
 */
export async function withAuth(handler: AuthHandler): Promise<NextResponse> {
  try {
    const supabase = await createClient();

    // Check if user is authenticated
    const {
      data: {user},
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({error: 'Unauthorized'}, {status: 401});
    }

    // Execute the handler with authenticated user and supabase client
    return await handler(user, supabase);
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({error: error.message || 'Internal server error'}, {status: 500});
  }
}

/**
 * Wraps an API route with admin authentication checks
 *
 * First checks if user is authenticated, then verifies admin role from user_profiles table.
 * Provides both regular supabase client (respects RLS) and admin client (bypasses RLS).
 *
 * **When to use which client:**
 * - Use `supabase` for operations that should respect RLS policies (most GET operations)
 * - Use `admin` for operations that need to bypass RLS (bulk updates, system operations)
 *
 * @param handler - Function that handles the authenticated admin request
 * @returns NextResponse with appropriate status codes (401 if not authenticated, 403 if not admin)
 *
 * @example
 * // Using regular supabase (respects RLS)
 * export async function GET(request: NextRequest) {
 *   return withAdminAuth(async (user, supabase, admin) => {
 *     // Use supabase for queries that should respect RLS
 *     const {data} = await supabase.from('categories').select('*');
 *     return successResponse(data);
 *   });
 * }
 *
 * @example
 * // Using admin client (bypasses RLS)
 * export async function PATCH(request: NextRequest, {params}: {params: {id: string}}) {
 *   return withAdminAuth(async (user, supabase, admin) => {
 *     const body = await request.json();
 *     const updateData = prepareUpdateData(body);
 *
 *     // Use admin for operations that need to bypass RLS
 *     const {data, error} = await admin
 *       .from('categories')
 *       .update(updateData)
 *       .eq('id', params.id)
 *       .select()
 *       .single();
 *
 *     if (error) throw error;
 *     return successResponse(data);
 *   });
 * }
 */
export async function withAdminAuth(handler: AdminAuthHandler): Promise<NextResponse> {
  return withAuth(async (user, supabase) => {
    // Check if user has admin role
    const {data: profile} = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({error: 'Forbidden'}, {status: 403});
    }

    // Execute the handler with admin user, regular supabase client, and admin client
    return await handler(user, supabase, supabaseAdmin);
  });
}

/**
 * Wraps an API route with optional authentication
 *
 * Unlike withAuth, this does NOT return 401 if user is not authenticated.
 * Instead, it passes null user to the handler, allowing public access with
 * optional user-specific features.
 *
 * @param handler - Function that handles the request with optional user
 * @returns NextResponse
 *
 * @example
 * export async function GET(request: NextRequest) {
 *   return withOptionalAuth(async (user, supabase) => {
 *     // user can be null for public access
 *     const query = supabase.from('posts').select('*');
 *
 *     if (user) {
 *       // Show private posts only if authenticated
 *       query.or('is_public.eq.true,author_id.eq.' + user.id);
 *     } else {
 *       // Public-only posts
 *       query.eq('is_public', true);
 *     }
 *
 *     const {data} = await query;
 *     return NextResponse.json({data});
 *   });
 * }
 */
export async function withOptionalAuth(
  handler: (user: User | null, supabase: SupabaseClient) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const supabase = await createClient();

    const {
      data: {user},
    } = await supabase.auth.getUser();

    // Execute handler even if user is null
    return await handler(user, supabase);
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({error: error.message || 'Internal server error'}, {status: 500});
  }
}

/**
 * Validates request body against required fields
 *
 * @param body - Request body object
 * @param requiredFields - Array of required field names
 * @returns Object with validation result and missing fields
 *
 * @example
 * export async function POST(request: NextRequest) {
 *   return withAuth(async (user, supabase) => {
 *     const body = await request.json();
 *     const validation = validateBody(body, ['name', 'email']);
 *
 *     if (!validation.valid) {
 *       return NextResponse.json(
 *         { error: `Missing required fields: ${validation.missing.join(', ')}` },
 *         { status: 400 }
 *       );
 *     }
 *
 *     // Proceed with valid body...
 *   });
 * }
 */
export function validateBody(
  body: Record<string, any>,
  requiredFields: string[]
): {valid: boolean; missing: string[]} {
  const missing = requiredFields.filter((field) => body[field] === undefined);
  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Type-safe error response builder
 *
 * @param message - Error message
 * @param status - HTTP status code (default: 400)
 * @returns NextResponse with error
 *
 * @example
 * if (!categoryId) {
 *   return errorResponse('Category ID is required', 400);
 * }
 */
export function errorResponse(message: string, status: number = 400): NextResponse {
  return NextResponse.json({error: message}, {status});
}

/**
 * Type-safe success response builder
 *
 * @param data - Response data
 * @param status - HTTP status code (default: 200)
 * @returns NextResponse with data
 *
 * @example
 * return successResponse({ user, profile }, 200);
 */
export function successResponse<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json({data, error: null}, {status});
}

/**
 * Prepares body data for database updates by filtering out undefined values
 * and adding updated_at timestamp
 *
 * @param body - Request body from JSON
 * @param excludeFields - Fields to exclude from update (default: ['id'])
 * @param includeTimestamp - Whether to add updated_at (default: true)
 * @returns Sanitized update data object
 *
 * @example
 * export async function PATCH(request: NextRequest) {
 *   return withAdminAuth(async (user, supabase) => {
 *     const body = await request.json();
 *     const updateData = prepareUpdateData(body);
 *
 *     const {data} = await supabase
 *       .from('categories')
 *       .update(updateData)
 *       .eq('id', params.id)
 *       .select()
 *       .single();
 *
 *     return successResponse(data);
 *   });
 * }
 *
 * @example
 * // Exclude multiple fields and skip timestamp
 * const updateData = prepareUpdateData(body, ['id', 'created_at', 'created_by'], false);
 */
export function prepareUpdateData(
  body: Record<string, any>,
  excludeFields: string[] = ['id'],
  includeTimestamp: boolean = true
): Record<string, any> {
  const updateData: Record<string, any> = {};

  // Add timestamp if requested
  if (includeTimestamp) {
    updateData.updated_at = new Date().toISOString();
  }

  // Only include fields that are not undefined and not in exclude list
  Object.keys(body).forEach((key) => {
    const value = body[key];
    if (value !== undefined && !excludeFields.includes(key)) {
      updateData[key] = value;
    }
  });

  return updateData;
}
