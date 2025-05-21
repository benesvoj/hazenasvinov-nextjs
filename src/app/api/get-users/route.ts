import { NextResponse } from 'next/server'
import supabaseAdmin from "@/utils/supabase/admin";

export async function GET() {
	const { data, error } = await supabaseAdmin.auth.admin.listUsers()

	if (error) {
		console.error('Error fetching users:', error)
		return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
	}

	return NextResponse.json(data.users)
}
