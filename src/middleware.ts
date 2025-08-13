import {type NextRequest, NextResponse} from 'next/server'
import {privateRoutes, publicRoutes} from "@/routes/routes";
import {createClient} from "@/utils/supabase/server";

export async function middleware(request: NextRequest) {
	try {
		// Only check auth for admin routes
		if (request.nextUrl.pathname.startsWith(privateRoutes.dashboard)) {
			const supabase = await createClient()
			const {data: {session}} = await supabase.auth.getSession()

			// If no session and trying to access admin routes
			if (!session) {
				// Redirect to login page
				const redirectUrl = new URL(publicRoutes.login, request.url)
				// Add the original URL as ?next= parameter
				redirectUrl.searchParams.set('next', request.nextUrl.pathname)
				return NextResponse.redirect(redirectUrl)
			}

			// Check if user is blocked
			if (session.user) {
				const isBlocked = session.user.user_metadata?.is_blocked;
				if (isBlocked) {
					// User is blocked, redirect to blocked page or show message
					const blockedUrl = new URL('/blocked', request.url)
					return NextResponse.redirect(blockedUrl)
				}
			}
		}

		// For all other routes, allow access
		return NextResponse.next()
	} catch (error) {
		// If there's an error accessing admin routes, redirect to login
		if (request.nextUrl.pathname.startsWith(privateRoutes.dashboard)) {
			return NextResponse.redirect(new URL(publicRoutes.login, request.url))
		}
		// For other routes, just proceed even with errors
		return NextResponse.next()
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
		// '/admin/:path*',
		// Exclude all other routes - especially main routes
		'/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
	],
}