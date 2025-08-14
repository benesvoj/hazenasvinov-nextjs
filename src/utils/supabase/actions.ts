'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/utils/supabase/server'
import {publicRoutes, privateRoutes} from "@/routes/routes";

export async function login(formData: FormData) {
	const supabase = await createClient()
	// type-casting here for convenience
	// in practice, you should validate your inputs
	const data = {
		email: formData.get('email') as string,
		password: formData.get('password') as string,
	}

	const { error } = await supabase.auth.signInWithPassword(data)

	if (error) {
		redirect(publicRoutes.error)
	}
	revalidatePath(privateRoutes.admin, 'layout')
	redirect(privateRoutes.admin)
}

export async function signup(formData: FormData) {
	const supabase = await createClient()

	// type-casting here for convenience
	// in practice, you should validate your inputs
	const data = {
		email: formData.get('email') as string,
		password: formData.get('password') as string,
	}

	const { error } = await supabase.auth.signUp(data)

	if (error) {
		redirect(publicRoutes.error)
	}

	revalidatePath(privateRoutes.admin, 'layout')
	redirect(privateRoutes.admin)
}

export async function logout() {
	const supabase =await createClient()

	const { error } = await supabase.auth.signOut();

	if (error) {
		redirect('/error')
	}

	revalidatePath(publicRoutes.login, 'layout')
	redirect(publicRoutes.login)
}