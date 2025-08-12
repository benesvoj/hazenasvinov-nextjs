import { NextResponse } from 'next/server'
import supabaseAdmin from "@/utils/supabase/admin";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const includeLogs = searchParams.get('includeLogs') === 'true';

	try {
		// Fetch users
		const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers();

		if (usersError) {
			console.error('Error fetching users:', usersError);
			return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
		}

		// If logs are requested, also fetch login logs from the database
		if (includeLogs) {
			try {
				// Fetch login logs from the login_logs table
				const { data: loginLogs, error: logsError } = await supabaseAdmin
					.from('login_logs')
					.select('*')
					.order('login_time', { ascending: false })
					.limit(100); // Limit to last 100 entries for performance

				if (logsError) {
					console.error('Error fetching login logs:', logsError);
					// Return users even if logs fail
					return NextResponse.json({
						users: users.users,
						loginLogs: []
					});
				}

				return NextResponse.json({
					users: users.users,
					loginLogs: loginLogs || []
				});
			} catch (logsError) {
				console.error('Error fetching login logs:', logsError);
				// Return users even if logs fail
				return NextResponse.json({
					users: users.users,
					loginLogs: []
				});
			}
		}

		return NextResponse.json(users.users);
	} catch (error) {
		console.error('Unexpected error:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
