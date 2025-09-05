import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest } from 'next/server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import {publicRoutes} from "@/routes/routes";

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url)
	const token_hash = searchParams.get('token_hash')
	const code = searchParams.get('code')
	const token = searchParams.get('token')
	const type = searchParams.get('type') as EmailOtpType | null
	const next = searchParams.get('next') ?? publicRoutes.home

	console.log('Auth confirm route called with:', {
		token_hash: token_hash ? 'present' : 'missing',
		code: code ? 'present' : 'missing', 
		token: token ? 'present' : 'missing',
		type,
		next,
		fullUrl: request.url
	})



	// Handle token_hash, code, and token parameters
	if ((token_hash || code || token) && type) {
		try {
			const supabase = await createClient()

			let error;
			let result;
			
			if (token_hash) {
				// Handle token_hash (older format)
				console.log('Verifying OTP with token_hash')
				result = await supabase.auth.verifyOtp({
					type,
					token_hash,
				})
				error = result.error;
				console.log('Token_hash verification result:', { 
					error: error?.message,
					user: result.data?.user?.id,
					session: !!result.data?.session
				})
			} else if (code) {
				// Handle code parameter (newer format)
				console.log('Exchanging code for session')
				result = await supabase.auth.exchangeCodeForSession(code)
				error = result.error;
				console.log('Code exchange result:', { 
					error: error?.message,
					user: result.data?.user?.id,
					session: !!result.data?.session
				})
			} else if (token) {
				// Handle token parameter (email template format)
				console.log('Verifying OTP with token')
				// For password reset, we need to use the token as a token_hash
				result = await supabase.auth.verifyOtp({
					type,
					token_hash: token,
				})
				error = result.error;
				console.log('Token verification result:', { 
					error: error?.message,
					user: result.data?.user?.id,
					session: !!result.data?.session
				})
			}

			if (!error) {
				console.log('Auth verification successful, redirecting based on type:', type)
				// Handle different types of email confirmations
				try {
					if (type === 'recovery') {
						// Password reset - redirect to reset-password page
						console.log('Redirecting to reset-password page')
						redirect('/reset-password')
					} else if (type === 'signup' || type === 'invite') {
						// User invitation - redirect to set-password page
						console.log('Redirecting to set-password page')
						redirect('/set-password')
					} else {
						// Other types - use the next parameter or default to home
						console.log('Redirecting to next:', next)
						redirect(next)
					}
				} catch (redirectError) {
					// Check if this is a Next.js redirect (which throws NEXT_REDIRECT error)
					if (redirectError instanceof Error && redirectError.message === 'NEXT_REDIRECT') {
						// This is a redirect, not an actual error - re-throw it
						throw redirectError
					}
					// If it's a real error, handle it
					throw redirectError
				}
			} else {
				console.error('Auth verification failed:', {
					error: error.message,
					code: error.status,
					type,
					hasToken: !!(token_hash || code || token)
				})
				// Redirect to error page with proper error parameters
				const errorParams = new URLSearchParams({
					error: error.message,
					error_code: error.status?.toString() || 'unknown',
					error_description: error.message
				})
				redirect(`/reset-password?${errorParams.toString()}`)
			}
		} catch (error) {
			// Check if this is a Next.js redirect (which throws NEXT_REDIRECT error)
			if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
				// This is a redirect, not an actual error - re-throw it
				throw error
			}
			
			console.error('Error in auth confirm route:', {
				error: error instanceof Error ? error.message : 'Unknown error',
				stack: error instanceof Error ? error.stack : undefined,
				type,
				hasToken: !!(token_hash || code || token)
			})
			// Redirect to error page with proper error parameters
			const errorParams = new URLSearchParams({
				error: error instanceof Error ? error.message : 'Unknown error',
				error_code: 'server_error',
				error_description: error instanceof Error ? error.message : 'Unknown error'
			})
			redirect(`/reset-password?${errorParams.toString()}`)
		}
	} else {
		console.log('Missing required parameters:', {
			hasToken: !!(token_hash || code || token),
			hasType: !!type,
			tokenLength: token?.length,
			codeLength: code?.length,
			tokenHashLength: token_hash?.length
		})
	}

	// redirect the user to an error page with some instructions
	console.log('Redirecting to error page')
	redirect(publicRoutes.error)
}