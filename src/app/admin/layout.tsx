import React from "react";
import {createServerComponentClient} from '@supabase/auth-helpers-nextjs';
import {cookies} from 'next/headers';
import {redirect} from 'next/navigation';

export default async function AdminLayout({children}: { children: React.ReactNode }) {

	const supabase = createServerComponentClient({cookies});

	const {
		data: {session},
	} = await supabase.auth.getSession();

	if (!session) {
		redirect('/login');
	}

	return (
		<div className="flex min-h-screen">
			<aside className="w-64 bg-gray-900 text-white">Admin Sidebar</aside>
			<main className="flex-1 p-6 bg-gray-100">{children}</main>
		</div>
	);
}
