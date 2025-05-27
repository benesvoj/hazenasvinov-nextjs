'use client';

import {CustomTable} from "@/components/CustomTable";
import {URL_juniorGirls,} from "@/data/params";
import {translations} from "@/lib/translations";

export default function Page() {
	return(
		<>
			<CustomTable csvData={URL_juniorGirls} tableTitle={translations.juniorGirls.title} />
		</>
	)
}