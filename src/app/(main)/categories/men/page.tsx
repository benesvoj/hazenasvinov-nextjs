'use client';

import {StandingsTable} from "@/components/StandingsTable";
import {translations} from "@/lib/translations";
import {URL_men, URL_men_matches} from "@/data/params";

export default function Page() {
	return(
		<>
			<StandingsTable  csvData={URL_men} tableTitle={translations.men.title} />
			<StandingsTable csvData={URL_men_matches} tableTitle={'zapasy'} />
		</>
	)
}