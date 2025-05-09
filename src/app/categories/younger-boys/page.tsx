'use client';

import {URL_youngerBoys} from "@/data/params";
import {StandingsTable} from "@/components/StandingsTable";
import {translations} from "@/lib/translations";
import CSVTable from "@/components/CSVTable";

export default function Page() {
	return (
		<>
			<CSVTable />
			<StandingsTable csvData={URL_youngerBoys} tableTitle={translations.youngerBoys.title} />
		</>
	);
}