import { NextResponse } from 'next/server'
import supabaseAdmin from "@/utils/supabase/admin";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const includeLogs = searchParams.get('includeLogs') === 'true';
	
	// Pagination parameters
	const page = parseInt(searchParams.get('page') || '1');
	const limit = parseInt(searchParams.get('limit') || '20');
	const offset = (page - 1) * limit;
	
	// Filtering parameters
	const userEmail = searchParams.get('userEmail') || '';

	try {
		// Fetch users
		const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers();

		if (usersError) {
			return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
		}

		// If logs are requested, also fetch login logs from the database
		if (includeLogs) {
			try {
				// Build query with filters
				let query = supabaseAdmin
					.from('login_logs')
					.select('*', { count: 'exact' });

				// Apply user filter
				if (userEmail) {
					query = query.eq('email', userEmail);
				}

				// Get total count for pagination
				const { count } = await query;

				// Apply pagination and ordering
				const { data: loginLogs, error: logsError } = await query
					.order('login_time', { ascending: false })
					.range(offset, offset + limit - 1);

				if (logsError) {
					// Return users even if logs fail
					return NextResponse.json({
						users: users.users,
						loginLogs: [],
						pagination: {
							page: 1,
							limit: 20,
							total: 0,
							totalPages: 0
						}
					});
				}

				const totalPages = Math.ceil((count || 0) / limit);

				return NextResponse.json({
					users: users.users,
					loginLogs: loginLogs || [],
					pagination: {
						page,
						limit,
						total: count || 0,
						totalPages
					}
				});
			} catch (logsError) {
				// Return users even if logs fail
				return NextResponse.json({
					users: users.users,
					loginLogs: [],
					pagination: {
						page: 1,
						limit: 20,
						total: 0,
						totalPages: 0
					}
				});
			}
		}

		return NextResponse.json(users.users);
	} catch (error) {
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
