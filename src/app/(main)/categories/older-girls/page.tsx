'use client';

import {CustomTable} from "@/components/CustomTable";
import {URL_olderGirls} from "@/data/params";
import {translations} from "@/lib/translations";

export default function Page() {
	return(
		<>
			<CustomTable csvData={URL_olderGirls} tableTitle={translations.olderBoys.title} />
		</>
	)
}