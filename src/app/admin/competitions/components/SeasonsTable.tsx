import {translations} from "@/lib/translations";
import {Table, TableBody, TableCell, TableColumn, TableHeader, TableRow} from "@heroui/table";
import {useFetchSeasons} from "@/hooks/useFetchSeasons";

export const SeasonsTable = () => {

	const {data, loading, error} = useFetchSeasons()

	return(
		<Table aria-label={translations.season.title}>
			<TableHeader>
				<TableColumn>Id</TableColumn>
				<TableColumn>Name</TableColumn>
				<TableColumn>Start Date</TableColumn>
				<TableColumn>End Date</TableColumn>
			</TableHeader>
			<TableBody items={data}>
				{(item) => (
					<TableRow key={item.id}>
						<TableCell>{item.id}</TableCell>
						<TableCell>{item.name}</TableCell>
						<TableCell>{new Date(item.valid_from).toLocaleDateString()}</TableCell>
						<TableCell>{new Date(item.valid_to).toLocaleDateString()}</TableCell>
					</TableRow>
				)}
			</TableBody>
		</Table>
	)
}