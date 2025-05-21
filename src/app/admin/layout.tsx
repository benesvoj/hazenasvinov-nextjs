import React from "react";

export default async function AdminLayout({children}: { children: React.ReactNode }) {

	return (
		<div className="flex min-h-screen">
			<aside className="w-64 bg-gray-900 text-white">Admin Sidebar</aside>
			<main className="flex-1 p-6 bg-gray-100">{children}</main>
		</div>
	);
}
