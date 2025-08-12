'use client';

import {translations} from "@/lib/translations";

export default function Page() {
	return(
		<div className="p-4">
			<h1 className="text-xl font-bold mb-4">{translations.juniorBoys.title}</h1>
			<p className="text-gray-600">Data will be loaded dynamically.</p>
		</div>
	)
}