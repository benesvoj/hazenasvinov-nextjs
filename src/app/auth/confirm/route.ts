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
			if (token_hash) {
				// Handle token_hash (older format)
				console.log('Verifying OTP with token_hash')
				const result = await supabase.auth.verifyOtp({
					type,
					token_hash,
				})
				error = result.error;
				console.log('Token_hash verification result:', { error: error?.message })
			} else if (code) {
				// Handle code parameter (newer format)
				console.log('Exchanging code for session')
				const result = await supabase.auth.exchangeCodeForSession(code)
				error = result.error;
				console.log('Code exchange result:', { error: error?.message })
			} else if (token) {
				// Handle token parameter (email template format)
				console.log('Verifying OTP with token')
				const result = await supabase.auth.verifyOtp({
					type,
					token_hash: token,
				})
				error = result.error;
				console.log('Token verification result:', { error: error?.message })
			}

			if (!error) {
				console.log('Auth verification successful, redirecting based on type:', type)
				// Handle different types of email confirmations
				if (type === 'recovery') {
					// Password reset - redirect to reset-password page
					redirect('/reset-password')
				} else if (type === 'signup' || type === 'invite') {
					// User invitation - redirect to set-password page
					redirect('/set-password')
				} else {
					// Other types - use the next parameter or default to home
					redirect(next)
				}
			} else {
				console.error('Auth verification failed:', error)
			}
		} catch (error) {
			console.error('Error in auth confirm route:', error)
		}
	} else {
		console.log('Missing required parameters:', {
			hasToken: !!(token_hash || code || token),
			hasType: !!type
		})
	}

	// redirect the user to an error page with some instructions
	console.log('Redirecting to error page')
	redirect(publicRoutes.error)
}