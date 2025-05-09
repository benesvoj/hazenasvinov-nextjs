'use client';

import React, { useEffect, useState } from 'react';
import Papa from 'papaparse';

const rozpisZapasu = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ3HZp2KFkMI31UhoAvxUkAC7-F5NE9PGhbybmvTwcqqs-FKbMvh981hMyLRlOXqXN7Ua964tVB1YPl/pub?gid=1332357482&single=true&output=csv';

interface CSVRow {
	[key: string]: string;
}

const CSVTable = () => {
	const [data, setData] = useState<CSVRow[]>([]);


	useEffect(() => {
		const fetchCSV = async () => {
			const response = await fetch(rozpisZapasu)

			if (!response.body) {;
				console.error('Response body is null');
				return;
			}

			const reader = response.body.getReader();
			const result = await reader.read(); // raw array
			const decoder = new TextDecoder('utf-8');
			const csv = decoder.decode(result.value); // the csv text
			const results = Papa.parse(csv, { header: true }); // object with { data, errors, meta }
			setData(results.data as CSVRow[]);
		};

		fetchCSV();
	}, []);

	console.log(data);

	return (
		<div>
			<h1>CSV Data</h1>
			<table>
				<thead>
				<tr>
					{data.length > 0 &&
						Object.keys(data[0]).map((key) => (
							<th key={key}>{key}</th>
						))}
				</tr>
				</thead>
				<tbody>
				{data.map((row, idx) => (
					<tr key={idx}>
						{Object.values(row).map((val, i) => (
							<td key={i}>{val}</td>
						))}
					</tr>
				))}
				</tbody>
			</table>
		</div>
	);
};

export default CSVTable;
