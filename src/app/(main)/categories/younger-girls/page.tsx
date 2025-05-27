'use client';

import {URL_youngerGirls} from "@/data/params";
import {CustomTable} from "@/components/CustomTable";
import {translations} from "@/lib/translations";

export default function Page() {

	return (
		<>
			<CustomTable csvData={URL_youngerGirls} tableTitle={translations.youngerGirls.title} />
		</>
	);
}