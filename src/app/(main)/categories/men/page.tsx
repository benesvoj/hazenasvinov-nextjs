'use client';

import {StandingsTable} from "@/components/StandingsTable";
import {translations} from "@/lib/translations";
import {URL_men, URL_men_matches_spring, URL_men_matches_autumn} from "@/data/params";
import {Tabs, Tab} from "@heroui/tabs";

export default function Page() {
	return(
		<>
			<StandingsTable  csvData={URL_men} tableTitle={translations.men.title} />
			<Tabs arial-labe={"Options"}>
				<Tab key="spring" title={"Jaro"}>
					<StandingsTable csvData={URL_men_matches_spring} tableTitle={'zapasy'} />
				</Tab>
				<Tab key="autumn" title={"Podzim"}>
					<StandingsTable csvData={URL_men_matches_autumn} tableTitle={'zapasy'} />
				</Tab>
			</Tabs>
		</>
	)
}