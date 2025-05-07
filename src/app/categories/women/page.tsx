'use client';

import {StandingsTable} from "@/components/StandingsTable";
import {URL_women} from "@/data/params";
import {translations} from "@/lib/translations";

export default function Page() {
	return(
		<>
			<StandingsTable  csvData={URL_women} tableTitle={translations.women.title} />
		</>
	)
}