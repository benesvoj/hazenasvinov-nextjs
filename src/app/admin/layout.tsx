import React from "react";
import {Sidebar} from "@/app/admin/components/Sidebar";

export default async function AdminLayout({children}: { children: React.ReactNode }) {

	return (
		<div className="flex min-h-screen">
			<Sidebar/>
			<main className="flex-1 p-6 bg-gray-100">{children}</main>
		</div>
	);
}
