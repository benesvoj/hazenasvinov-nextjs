'use client';

import {CustomTable} from "@/components/CustomTable";
import {URL_women} from "@/data/params";
import {translations} from "@/lib/translations";

export default function Page() {
	return(
		<>
			<CustomTable csvData={URL_women} tableTitle={translations.women.title} />
		</>
	)
}