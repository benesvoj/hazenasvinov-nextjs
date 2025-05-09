'use client';

import {StandingsTable} from "@/components/StandingsTable";
import {URL_juniorGirls,} from "@/data/params";
import {translations} from "@/lib/translations";

export default function Page() {
	return(
		<>
			<StandingsTable  csvData={URL_juniorGirls} tableTitle={translations.juniorGirls.title} />
		</>
	)
}