'use client';

import {CustomTable} from "@/components/CustomTable";
import {translations} from "@/lib/translations";
import {URL_men, URL_men_matches_autumn, URL_men_matches_spring} from "@/data/params";
import {Tab, Tabs} from "@heroui/tabs";

export default function Page() {
	return (
		<>
			<div>
				<CustomTable csvData={URL_men} tableTitle={translations.men.title} isStrippedAllowed />
			</div>
			<div>
				<Tabs arial-labe={"Options"}>
					<Tab key="spring" title={"Jaro"}>
						<CustomTable csvData={URL_men_matches_spring} tableTitle={'zapasy'}/>
					</Tab>
					<Tab key="autumn" title={"Podzim"}>
						<CustomTable csvData={URL_men_matches_autumn} tableTitle={'zapasy'}/>
					</Tab>
				</Tabs>
			</div>
		</>
	)
}