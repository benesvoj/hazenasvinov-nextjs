'use client';

import {URL_youngerBoys} from "@/data/params";
import {CustomTable} from "@/components/CustomTable";
import {translations} from "@/lib/translations";
import CSVTable from "@/components/CSVTable";

export default function Page() {
	return (
		<>
			<CSVTable />
			<CustomTable csvData={URL_youngerBoys} tableTitle={translations.youngerBoys.title} />
		</>
	);
}