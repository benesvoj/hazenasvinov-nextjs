import {type NextRequest, NextResponse} from 'next/server';

import {supabaseServerClient} from '@/utils/supabase/server';

import {privateRoutes, publicRoutes} from '@/routes/routes';

export async function proxy(request: NextRequest) {
  try {
    // Check auth for admin routes and coaches routes
    if (
      request.nextUrl.pathname.startsWith(privateRoutes.admin) ||
      request.nextUrl.pathname.startsWith('/coaches')
    ) {
      const supabase = await supabaseServerClient();
      const {
        data: {user},
      } = await supabase.auth.getUser();

      // If no user and trying to access protected routes
      if (!user) {
        // Redirect to login page
        const redirectUrl = new URL(publicRoutes.login, request.url);
        // Add the original URL as ?next= parameter
        redirectUrl.searchParams.set('next', request.nextUrl.pathname);
        return NextResponse.redirect(redirectUrl);
      }

      // Check if user is blocked
      if (user) {
        const isBlocked = user.user_metadata?.is_blocked;
        if (isBlocked) {
          // User is blocked, redirect to blocked page or show message
          const blockedUrl = new URL('/blocked', request.url);
          return NextResponse.redirect(blockedUrl);
        }

        // Check if user has a role assigned
        const {data: userProfile, error: profileError} = await supabase
          .from('user_profiles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        // If user has no profile, try to create one using the safe function
        if (profileError || !userProfile) {
          try {
            // Use the safe profile function to ensure profile exists
            const {data: safeProfile, error: safeProfileError} = await supabase.rpc(
              'get_user_profile_safe',
              {user_uuid: user.id}
            );

            if (safeProfileError || !safeProfile || safeProfile.length === 0) {
              // Still no profile, redirect to login
              const redirectUrl = new URL(publicRoutes.login, request.url);
              redirectUrl.searchParams.set('error', 'no_role');
              return NextResponse.redirect(redirectUrl);
            }
          } catch (err) {
            // Error in fallback, redirect to login
            const redirectUrl = new URL(publicRoutes.login, request.url);
            redirectUrl.searchParams.set('error', 'no_role');
            return NextResponse.redirect(redirectUrl);
          }
        }
      }
    }

    // For all other routes, allow access
    return NextResponse.next();
  } catch (error) {
    // If there's an error accessing protected routes, redirect to login
    if (
      request.nextUrl.pathname.startsWith(privateRoutes.admin) ||
      request.nextUrl.pathname.startsWith('/coaches')
    ) {
      return NextResponse.redirect(new URL(publicRoutes.login, request.url));
    }
    // For other routes, just proceed even with errors
    return NextResponse.next();
  }
}

export const config = {
  // only run middleware on the paths that are not static files
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    // Only protect the following paths
    '/admin/:path*',
    '/coaches/:path*',
    // Exclude all other routes - especially main routes
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
