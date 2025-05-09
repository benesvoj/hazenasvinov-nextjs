'use client';

import {StandingsTable} from "@/components/StandingsTable";
import {URL_juniorBoys} from "@/data/params";
import {translations} from "@/lib/translations";

export default function Page() {
	return(
		<>
			<StandingsTable csvData={URL_juniorBoys} tableTitle={translations.juniorBoys.title}/>
		</>
	)
}