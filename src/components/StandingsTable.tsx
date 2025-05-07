import {useCSVData} from "@/hooks/useCSVData";

interface StandingsTableProps {
	csvData: string;
	tableTitle: string;
}

export const StandingsTable = (props: StandingsTableProps) => {
	const data = useCSVData(props.csvData);

	if (!data.length) return <p>Načitání dat ...</p>;

	const [headers, ...rows] = data;

	return (
		<div className="p-4">
			<h1 className="text-xl font-bold mb-4">{props.tableTitle}</h1>
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