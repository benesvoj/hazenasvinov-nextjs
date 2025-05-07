'use client';

import {URL_youngerBoys} from "@/data/params";
import {StandingsTable} from "@/components/StandingsTable";
import {translations} from "@/lib/translations";

export default function Page() {
	return (
		<>
			<StandingsTable csvData={URL_youngerBoys} tableTitle={translations.youngerBoys.title} />
		</>
	);
}