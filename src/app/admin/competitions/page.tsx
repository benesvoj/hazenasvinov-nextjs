'use client';

import {translations} from "@/lib/translations";
import {Tabs, Tab} from "@heroui/tabs";
import {CategoriesTable} from "@/app/admin/competitions/components/CategoriesTable";
import {SeasonsTable} from "@/app/admin/competitions/components/SeasonsTable";


export default function Page() {

	return(
		<>
			<h1>{translations.competitions.title}</h1>
			<div className="flex w-full flex-col">
			<Tabs aria-label={translations.competitions.title}>
				<Tab key={translations.categories.title} title={translations.categories.title}>
					<CategoriesTable />
				</Tab>
				<Tab key={translations.season.title} title={translations.season.title}>
					<SeasonsTable />
				</Tab>
			</Tabs>
			</div>
		</>
	)
}