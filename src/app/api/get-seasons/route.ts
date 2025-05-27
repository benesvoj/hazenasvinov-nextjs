import { NextResponse } from 'next/server'
import supabaseAdmin from "@/utils/supabase/admin";

export async function GET() {
	const { data, error } = await supabaseAdmin.from('seasons').select('*')

	if (error) {
		console.error('Error fetching data:', error)
		return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
	}

	return NextResponse.json(data)
}
