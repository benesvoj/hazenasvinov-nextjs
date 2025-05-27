import React from "react";
import {translations} from "@/lib/translations";
import {Spacer} from "@heroui/spacer";
import Link from "next/link";
import routes, {privateRoutes} from "@/routes/routes";
import {Listbox, ListboxItem} from "@heroui/listbox";

export const Sidebar = () => {

	const items = routes.filter((item) => item.isPrivate === true)

	return (
		<aside className="w-64 bg-gray-900 text-white p-4">
			<h1>{translations.admin.title}</h1>

			<Spacer y={4}/>

			<div>
				<Listbox aria-label="Admin Sidebar" className="flex flex-col gap-2" items={items}>
					{(item) => (
							<ListboxItem key={item.route}>
								<Link href={item.route || privateRoutes.dashboard}>{item.title}</Link>
							</ListboxItem>
						)}
				</Listbox>
			</div>

		</aside>
	)
}