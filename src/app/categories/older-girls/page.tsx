'use client';

import {StandingsTable} from "@/components/StandingsTable";
import {URL_olderGirls} from "@/data/params";
import {translations} from "@/lib/translations";

export default function Page() {
	return(
		<>
			<StandingsTable  csvData={URL_olderGirls} tableTitle={translations.olderBoys.title} />
		</>
	)
}