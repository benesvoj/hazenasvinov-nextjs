import {useCSVData} from "@/hooks/useCSVData";
import {Table, TableBody, TableCell, TableColumn, TableHeader, TableRow} from "@heroui/table";
import {Spinner} from "@heroui/spinner";

interface CustomTableProps {
	csvData: string;
	tableTitle: string;
	isStrippedAllowed?: boolean;
}

export const CustomTable = (props: CustomTableProps) => {
	const data = useCSVData(props.csvData);

	const [headers, ...rows] = data;

	return (
		<div className="p-4">
			<h1 className="text-xl font-bold mb-4">{props.tableTitle}</h1>
			{
				(!data || data.length === 0) ?
					<Spinner />
					: (
						<Table aria-label={props.tableTitle} isStriped={props.isStrippedAllowed}>
							<TableHeader>
								{headers.map((header, i) => (
									<TableColumn key={i}>
										{header}
									</TableColumn>
								))}
							</TableHeader>
							<TableBody>
								{rows.map((row, ri) => (
									<TableRow key={ri}>
										{row.map((cell, ci) => (
											<TableCell key={ci}>
												{cell}
											</TableCell>
										))}
									</TableRow>
								))}
							</TableBody>
						</Table>
					)
			}
		</div>
	);
}