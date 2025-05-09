'use client';

import {URL_youngerGirls} from "@/data/params";
import {StandingsTable} from "@/components/StandingsTable";
import {translations} from "@/lib/translations";

export default function Page() {

	return (
		<>
			<StandingsTable csvData={URL_youngerGirls} tableTitle={translations.youngerGirls.title} />
		</>
	);
}