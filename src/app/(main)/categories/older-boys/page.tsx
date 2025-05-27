'use client';

import {CustomTable} from "@/components/CustomTable";
import {URL_olderBoys} from "@/data/params";
import {translations} from "@/lib/translations";

export default function Page() {
	return(
		<>
			<CustomTable csvData={URL_olderBoys} tableTitle={translations.olderBoys.title} />
		</>
	)
}