'use client'

import {Header} from "@/components/Header";

import {useEffect, useState} from 'react';
import {URL_youngBoys} from '../data/params';

const CSV_URL = URL_youngBoys;

export default function Home() {

	// TODO: move to utilits to be able to re-use it
	const [data, setData] = useState<string[][]>([]);

	useEffect(() => {
		fetch(CSV_URL)
			.then((res) => res.text())
			.then((text) => {
				const rows = text
					.split('\n')
					.map((row) => row.split(',').map((cell) => cell.trim()));
				setData(rows);
			});
	}, []);

	if (data.length === 0) return <p>Loading...</p>;

	const headers = data[0];
	const rows = data.slice(1);

	return (
		<div className="p-4">
			<h1 className="text-xl font-bold mb-4">Mladší žáci</h1>
			<table className="table-auto border-collapse border border-gray-400">
				<thead>
				<tr>
					{headers.map((header, i) => (
						<th key={i} className="border px-2 py-1 bg-gray-100">
							{header}
						</th>
					))}
				</tr>
				</thead>
				<tbody>
				{rows.map((row, ri) => (
					<tr key={ri}>
						{row.map((cell, ci) => (
							<td key={ci} className="border px-2 py-1">
								{cell}
							</td>
						))}
					</tr>
				))}
				</tbody>
			</table>
		</div>
	);
}
