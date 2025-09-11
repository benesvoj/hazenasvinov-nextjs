import {translations} from '@/lib/translations';
import {Table, TableBody, TableCell, TableColumn, TableHeader, TableRow} from '@heroui/react';
import {useFetchSeasons} from '@/hooks/useFetchSeasons';
import {formatDateString} from '@/helpers/formatDate';
import {LoadingSpinner} from '@/components';

export const SeasonsTable = () => {
  const {data, loading, error} = useFetchSeasons();

  return (
    <>
      {loading && <LoadingSpinner />}
      {error && <TableCell>Error: {error.message}</TableCell>}
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
              <TableCell>{item.start_date ? formatDateString(item.start_date) : ''}</TableCell>
              <TableCell>{item.end_date ? formatDateString(item.end_date) : ''}</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </>
  );
};
