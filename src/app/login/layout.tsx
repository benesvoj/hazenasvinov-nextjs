import React from "react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="flex min-h-screen min-w-screen">
			<main className="flex justify-center items-center flex-1 p-6 bg-gray-100">{children}</main>
		</div>
	);
}
