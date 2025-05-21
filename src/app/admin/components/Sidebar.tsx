import React from "react";
import {translations} from "@/lib/translations";
import {Spacer} from "@heroui/spacer";
import Link from "next/link";
import {privateRoutes} from "@/routes/routes";

export const Sidebar = () => {
	return(
		<aside className="w-64 bg-gray-900 text-white p-4">
			<h1>{translations.admin.title}</h1>
			<Spacer y={4}/>
			<Link href={privateRoutes.users}>Users</Link>
		</aside>
	)
}