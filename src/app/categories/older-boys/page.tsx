'use client';

import {StandingsTable} from "@/components/StandingsTable";
import {URL_olderBoys} from "@/data/params";
import {translations} from "@/lib/translations";

export default function Page() {
	return(
		<>
			<StandingsTable  csvData={URL_olderBoys} tableTitle={translations.olderBoys.title} />
		</>
	)
}